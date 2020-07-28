import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Vector;

import org.apache.commons.lang3.StringUtils;

import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.ContextUtil;
import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;
import com.matrixone.apps.domain.util.PersonUtil;
import com.matrixone.apps.program.ProgramCentralUtil;
import com.matrixone.apps.program.Task;
import com.sb.apps.util.sbDateUtil;
import com.sb.apps.util.sbMailUtil;
import com.sb.mail.sbSendmail;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

public class sbTaskMailSend_mxJPO {

	private Map<String, String> _descriptionMap = new HashMap<String, String>();
	public static final String START = "START";
	public static final String DELAY = "DELAY";
	public static final String STARTDELAY = "STARTDELAY";
	public static final String FINISHDELAY = "FINISHDELAY";
	public static final String MAIL_DESCRIPTION = "mailDescription";
	public static final String PROGRAMCENTRAL = "emxProgramCentralStringResource";
	private StringBuffer _message = null;
	private Context _context = null;
	private Locale _locale = null;
	private StringBuffer _ifContent = null;
	private String _targetId = null;
	
	public void doProcess(Context context, String[] args) throws Exception{
		_message = new StringBuffer();
		_ifContent = new StringBuffer();
		_context = context;
		_locale = context.getLocale();
		
		Map<String, Map<String, MapList>> summary = null;
		try {
			try {
				MapList masterData = getMasterData();
				Map<String, List<Integer>> categorizeMasterData = categorizeMasterData(masterData);
				MapList data = getData();
				summary = applyMasterData2Data(categorizeMasterData, data);
				doMail(summary);
			} catch (Exception e) {
				e.printStackTrace();
				_message.append(e.getMessage());
			}
			generateLogObject();
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public MapList getMasterData() throws Exception{
		StringList slSelect = new StringList();
		slSelect.add(DomainConstants.SELECT_ID);
		slSelect.add(DomainObject.getAttributeSelect("sbDevision"));
		slSelect.add(DomainObject.getAttributeSelect("sbDescription"));
		slSelect.add(DomainObject.getAttributeSelect("sbRemain"));
		
		MapList mlMaster = DomainObject.findObjects(_context, "sbTaskMailSend", "*", "*", "*", "eService Production", "attribute[sbRemain] != ''", false, slSelect);
		
		return mlMaster;
	}
	
	public Map<String, List<Integer>> categorizeMasterData(MapList masterData) throws Exception{
		Map<String, List<Integer>> categorizedMasterData = new HashMap<String, List<Integer>>();
		
		List<Integer> startDurationList = new ArrayList<Integer>();
		List<Integer> startDelayDurationList = new ArrayList<Integer>();
		List<Integer> finishDelayDurationList = new ArrayList<Integer>();
		
		categorizedMasterData.put(START, startDurationList);
		categorizedMasterData.put(STARTDELAY, startDelayDurationList);
		categorizedMasterData.put(FINISHDELAY, finishDelayDurationList);
		
		Map<String, String> masterInfo = null;
		String sDivision = null;
		String sDescription = null;
		String sRemain = null;
		int iDuration = 0;
		
		for (int k = 0; k < masterData.size(); k++)
		{
			masterInfo = (Map<String, String>) masterData.get(k);
			_targetId = (String) masterInfo.get(DomainConstants.SELECT_ID);
			sDivision = (String) masterInfo.get(DomainObject.getAttributeSelect("sbDevision"));
			sDescription = (String) masterInfo.get(DomainObject.getAttributeSelect("sbDescription"));
			sRemain = (String) masterInfo.get(DomainObject.getAttributeSelect("sbRemain"));
			iDuration = convert2Day(sRemain);
			
			switch (sDivision.toUpperCase()) {
			case START:
				_descriptionMap.put(START + "_" + iDuration, sDescription);
				startDurationList.add(iDuration);
				break;
			case DELAY:
				_descriptionMap.put(STARTDELAY + "_" + iDuration, sDescription);
				_descriptionMap.put(FINISHDELAY + "_" + iDuration, sDescription);
				startDelayDurationList.add(iDuration);
				finishDelayDurationList.add(iDuration);
				break;

			default:
				break;
			}
		}
		
		return categorizedMasterData;
	}
	
	private int convert2Day(String duration) throws Exception{
		int iDay = 0;
		if ( duration.indexOf(" Week") > -1 )
		{
			duration = duration.replace(" Week", "");
			iDay = Integer.parseInt(duration) * 7;
		}
		else
		{
			duration = duration.replace(" Day", "");
			iDay = Integer.parseInt(duration);
		}
		return iDay;
	}
	
	public MapList getData() throws Exception{
		StringList slSelect = new StringList();
		slSelect.add(DomainConstants.SELECT_ID);
		slSelect.add(DomainConstants.SELECT_NAME);
		slSelect.add(DomainConstants.SELECT_CURRENT);
		slSelect.add(DomainObject.getAttributeSelect("Task Estimated Start Date"));
		slSelect.add(DomainObject.getAttributeSelect("Task Estimated Finish Date"));
		slSelect.add("to[Assigned Tasks].from.name");
		slSelect.add("to[Project Access Key].from.from[Project Access List].to.id");
		slSelect.add("to[Project Access Key].from.from[Project Access List].to.name");
		slSelect.add("to[Project Access Key].from.from[Project Access List].to.owner");
		
		MapList mlTask = DomainObject.findObjects(_context, "Task", "*", "*", "*", "eService Production", "current matchlist 'Assign,Active' ','", false, slSelect);
		
		return mlTask;
	}
	
	public Map<String, Map<String, MapList>> applyMasterData2Data( Map<String, List<Integer>> categorizedMasterData, MapList data) throws Exception{
		Map<String, Object> mTask = null;
		
		String sCurrent = null;
		String sStartDate = null;
		String sFinishDate = null;
		String sProjectCalendarId = null;
		String sTaskCalendarId = null;
		
		Date dStartDate = null;
		Date dFinishDate = null;
		
		Object oAssignee = null;
		StringList slAssignee = new StringList();
		Map<String, Map<String, MapList>> mReturn = new HashMap<String, Map<String, MapList>>();
		Map<String, MapList> mMode = null;
		MapList mlTask = null;
		
		Date today = new Date();
		long lDiff = 0;
		
		String sMode = null;
		String sAssignee = null;
		String sDesc = null;
		
		for (int k = 0; k < data.size(); k++)
		{
			mTask = (Map<String, Object>) data.get(k);
			
			_targetId = (String) mTask.get(DomainConstants.SELECT_ID);
			sCurrent = (String) mTask.get(DomainConstants.SELECT_CURRENT);
			sProjectCalendarId = (String) mTask.get("to[Project Access Key].from.from[Project Access List].to.id");
			sStartDate = (String) mTask.get(DomainObject.getAttributeSelect("Task Estimated Start Date"));
			sFinishDate = (String) mTask.get(DomainObject.getAttributeSelect("Task Estimated Finish Date"));
			sAssignee = (String) mTask.get("to[Assigned Tasks].from.name");
			slAssignee.clear();
			if ( sAssignee.indexOf("") > -1 )
			{
				slAssignee.addAll(FrameworkUtil.splitString(sAssignee, ""));
			}
			else
			{
				slAssignee.add(sAssignee);
			}
			
			switch (sCurrent) {
			case "Assign":
				dStartDate = sbDateUtil.convertStr2Date(_context, sStartDate);
				lDiff = sbDateUtil.getDiffDay(dStartDate, today);
				if ( lDiff <= 0 )
				{
					sMode = START;
				}
				else
				{
					sMode = STARTDELAY;
					sTaskCalendarId = (String) mTask.get("id");
					lDiff = sbDateUtil.getSlipDays(_context, dStartDate, today, sTaskCalendarId);
				}
				break;
			case "Active":
				dFinishDate = sbDateUtil.convertStr2Date(_context, sFinishDate);
				lDiff = sbDateUtil.getDiffDay(dFinishDate, today);
				if ( lDiff <= 0 )
				{
					continue; // go to next for element.
				}
				else
				{
					sMode = FINISHDELAY;
					sTaskCalendarId = (String) mTask.get("id");
					lDiff = sbDateUtil.getSlipDays(_context, dFinishDate, today, sTaskCalendarId);
				}
				break;

			default:
				break;
			}
			
			if ( _descriptionMap.containsKey(sMode + "_" + Math.abs(lDiff)) )
			{
				sDesc = _descriptionMap.get(sMode + "_" + Math.abs(lDiff));
				mTask.put(MAIL_DESCRIPTION, sDesc);
			}
			else
			{
				continue; // go to next for element.
			}
			
			for (int m = 0; m < slAssignee.size(); m++)
			{
				sAssignee = (String) slAssignee.get(m);
				
				// TASK ID | TASK NAME | 담당자 @
				_ifContent.append(mTask.get(DomainConstants.SELECT_ID));
				_ifContent.append("|");
				_ifContent.append(mTask.get(DomainConstants.SELECT_NAME));
				_ifContent.append("|");
				_ifContent.append(sAssignee);
				_ifContent.append("@");
				
				if ( mReturn.containsKey(sAssignee) )
				{
					mMode = mReturn.get(sAssignee);
					
					if ( mMode.containsKey(sMode) )
					{
						mlTask = mMode.get(sMode);
						mlTask.add(mTask);
					}
					else
					{
						mlTask = new MapList();
						mlTask.add(mTask);
						
						mMode.put(sMode, mlTask);
					}
				}
				else
				{
					mlTask = new MapList();
					mlTask.add(mTask);
					
					mMode = new HashMap<String, MapList>();
					mMode.put(sMode, mlTask);
					
					mReturn.put(sAssignee, mMode);
				}
			}
		}
		
		return mReturn;
	}
	
	public void doMail(Map<String, Map<String, MapList>> summary) throws Exception{
		Iterator<String> iterator = summary.keySet().iterator();
		String sSubject = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.sbTaskMailSend.doMail.Subject");
		String sErrorMessage = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Txt.SendMailFail");
		
		Map<String, MapList> data = null;
		
		String sFrom = "admin_platform";
		String sTo = null;
		emxNotificationUtil_mxJPO notiJPO = new emxNotificationUtil_mxJPO(_context, null); 
		
		while ( iterator.hasNext() )
		{
			sTo = iterator.next();
			
			data = summary.get(sTo);
			
//			generateContent(data);
//			generateContent2(sTo, data);
			
			try {
				notiJPO.sendJavaMail(_context, new StringList(sTo), null, null, sSubject, null, generateContent2(sTo, data), sFrom, null, null, "Email");
			} catch (Exception e) {
				_message.append(sErrorMessage + " - " + "User : " + sTo + "\n");
			}
		}
	}
	
	@Deprecated
	public String generateContent(Map<String, MapList> data) throws Exception{
		MapList startList = data.get(START);
		MapList startDelayList = data.get(STARTDELAY);
		MapList finishDelayList = data.get(FINISHDELAY);
		
		StringList slHeader = new StringList();
		StringList slKey = new StringList();
		Map<String, String> mColumnWidth = new HashMap<String, String>();
		
		String sProjectLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Project");
		String sOwnerLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Owner");
		String sNameLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Name");
		String sEstStartDateLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.EstimatedStartDate");
		String sEstFinDateLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.EstimatedFinishDate");
		String sDescLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Description");
		
		StringBuffer sbReturn = new StringBuffer();
		sbReturn.append(sbMailUtil.generateHeading(EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Txt.TaskMailHeading"), 3));
		if ( startList != null && startList.size() > 0 )
		{
			slHeader.add(sProjectLabel);
			slHeader.add(sOwnerLabel);
			slHeader.add(sNameLabel);
			slHeader.add(sEstStartDateLabel);
			slHeader.add(sDescLabel);
			
			slKey.add("to[Project Access Key].from.from[Project Access List].to.name|LINK|to[Project Access Key].from.from[Project Access List].to.id");
			slKey.add("to[Project Access Key].from.from[Project Access List].to.owner|USER|");
			slKey.add("name|LINK|id");
			slKey.add("attribute[Task Estimated Start Date]|DATE|");
			slKey.add(MAIL_DESCRIPTION);
			
			mColumnWidth.put(sProjectLabel, "20%");
			mColumnWidth.put(sOwnerLabel, "10%");
			mColumnWidth.put(sNameLabel, "20%");
			mColumnWidth.put(sEstStartDateLabel, "15%");
			mColumnWidth.put(sDescLabel, "35%");
			
			sbReturn.append(sbMailUtil.generateHeading(EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Txt.StartTaskNotice"), 4));
			sbReturn.append(sbMailUtil.generateTable(_context, startList, slHeader, slKey, mColumnWidth));
			sbReturn.append("<br />");
		}
		if ( startDelayList != null && startDelayList.size() > 0 )
		{
			slHeader.clear();
			slHeader.add(sProjectLabel);
			slHeader.add(sOwnerLabel);
			slHeader.add(sNameLabel);
			slHeader.add(sEstStartDateLabel);
			slHeader.add(sDescLabel);
			
			slKey.clear();
			slKey.add("to[Project Access Key].from.from[Project Access List].to.name|LINK|to[Project Access Key].from.from[Project Access List].to.id");
			slKey.add("to[Project Access Key].from.from[Project Access List].to.owner|USER|");
			slKey.add("name|LINK|id");
			slKey.add("attribute[Task Estimated Start Date]|DATE|");
			slKey.add(MAIL_DESCRIPTION);
			
			mColumnWidth.clear();
			mColumnWidth.put(sProjectLabel, "20%");
			mColumnWidth.put(sOwnerLabel, "10%");
			mColumnWidth.put(sNameLabel, "20%");
			mColumnWidth.put(sEstStartDateLabel, "15%");
			mColumnWidth.put(sDescLabel, "35%");
			
			sbReturn.append(sbMailUtil.generateHeading(EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Txt.StartDelayTaskNotice"), 4));
			sbReturn.append(sbMailUtil.generateTable(_context, startDelayList, slHeader, slKey, mColumnWidth));
			sbReturn.append("<br />");
		}
		if ( finishDelayList != null && finishDelayList.size() > 0 )
		{
			slHeader.clear();
			slHeader.add(sProjectLabel);
			slHeader.add(sOwnerLabel);
			slHeader.add(sNameLabel);
			slHeader.add(sEstFinDateLabel);
			slHeader.add(sDescLabel);
			
			slKey.clear();
			slKey.add("to[Project Access Key].from.from[Project Access List].to.name|LINK|to[Project Access Key].from.from[Project Access List].to.id");
			slKey.add("to[Project Access Key].from.from[Project Access List].to.owner|USER|");
			slKey.add("name|LINK|id");
			slKey.add("attribute[Task Estimated Finish Date]|DATE|");
			slKey.add(MAIL_DESCRIPTION);
			
			mColumnWidth.clear();
			mColumnWidth.put(sProjectLabel, "20%");
			mColumnWidth.put(sOwnerLabel, "10%");
			mColumnWidth.put(sNameLabel, "20%");
			mColumnWidth.put(sEstFinDateLabel, "15%");
			mColumnWidth.put(sDescLabel, "35%");
			
			sbReturn.append(sbMailUtil.generateHeading(EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Txt.FinishTaskNotice"), 4));
			sbReturn.append(sbMailUtil.generateTable(_context, finishDelayList, slHeader, slKey, mColumnWidth));
			sbReturn.append("<br />");
		}
		System.out.println(sbReturn.toString());
		return sbReturn.toString();
	}
	
	public String generateContent2(String sTo, Map<String, MapList> data) throws Exception{
		String sBody = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.sbTaskMailSend.doMail.Body");
		
		sBody = sBody.replace("$1", PersonUtil.getFullName(_context, sTo));
		sBody = sBody.replace("$2", sbMailUtil.getLink(_context, sbMailUtil.MYTASK));
		
		MapList startList = data.get(START);
		MapList startDelayList = data.get(STARTDELAY);
		MapList finishDelayList = data.get(FINISHDELAY);
		
		StringList slHeader = new StringList();
		StringList slKey = new StringList();
		Map<String, String> mColumnWidth = new HashMap<String, String>();
		
		String sProjectLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Project");
		String sOwnerLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Owner");
		String sNameLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Name");
		String sEstStartDateLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.EstimatedStartDate");
		String sEstFinDateLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.EstimatedFinishDate");
		String sDescLabel = EnoviaResourceBundle.getProperty(_context, PROGRAMCENTRAL, _locale, "emxProgramCentral.Common.Description");
		
		// Tast to start
		slHeader.add(sProjectLabel);
		slHeader.add(sOwnerLabel);
		slHeader.add(sNameLabel);
		slHeader.add(sEstStartDateLabel);
		slHeader.add(sDescLabel);
		
		slKey.add("to[Project Access Key].from.from[Project Access List].to.name|LINK|to[Project Access Key].from.from[Project Access List].to.id");
		slKey.add("to[Project Access Key].from.from[Project Access List].to.owner|USER|");
		slKey.add("name|LINK|id");
		slKey.add("attribute[Task Estimated Start Date]|DATE|");
		slKey.add(MAIL_DESCRIPTION);
		
		mColumnWidth.put(sProjectLabel, "20%");
		mColumnWidth.put(sOwnerLabel, "10%");
		mColumnWidth.put(sNameLabel, "20%");
		mColumnWidth.put(sEstStartDateLabel, "15%");
		mColumnWidth.put(sDescLabel, "35%");
		
		sBody = sBody.replace("$3", sbMailUtil.generateTable(_context, startList, slHeader, slKey, mColumnWidth));
		
		// Task delayed to start
		sBody = sBody.replace("$4", sbMailUtil.generateTable(_context, startDelayList, slHeader, slKey, mColumnWidth));
		
		// Task delayed to finish
		slHeader.clear();
		slHeader.add(sProjectLabel);
		slHeader.add(sOwnerLabel);
		slHeader.add(sNameLabel);
		slHeader.add(sEstFinDateLabel);
		slHeader.add(sDescLabel);
		
		slKey.clear();
		slKey.add("to[Project Access Key].from.from[Project Access List].to.name|LINK|to[Project Access Key].from.from[Project Access List].to.id");
		slKey.add("to[Project Access Key].from.from[Project Access List].to.owner|USER|");
		slKey.add("name|LINK|id");
		slKey.add("attribute[Task Estimated Finish Date]|DATE|");
		slKey.add(MAIL_DESCRIPTION);
		
		sBody = sBody.replace("$5", sbMailUtil.generateTable(_context, finishDelayList, slHeader, slKey, mColumnWidth));
	
		return sbMailUtil.wrapBody(sBody);
	}
	
	public void generateLogObject() throws Exception{
		try {
			ContextUtil.startTransaction(_context, true);
			
			// 1. create if object
			DomainObject doIF = DomainObject.newInstance(_context, "sbIFObject");
			doIF.createObject(_context, "sbIFObject", "TASK_MAIL", String.valueOf(System.nanoTime()), "sbPolicyIFObject", "eService Production");
			
			// 2. update attribute
			Map mAttr = new HashMap();
			mAttr.put("sbIFID", "TASK_MAIL_DAILY_SEND");
			mAttr.put("sbIFAttr1", _ifContent.toString());
			mAttr.put("sbIFAttr3", _message.toString());
			
			doIF.setAttributeValues(_context, mAttr);
			
			// 3. promote
			String sTargetState = null;
			if ( _message.length() > 0 )
			{
				sTargetState = "Fail";
				
				sbIFObject_mxJPO.sendErrorMail2Admin(_context, "TASK_MAIL", _targetId, _message.toString());
			}
			else
			{
				sTargetState = "Complete";
			}
			doIF.setState(_context, sTargetState);
			
			ContextUtil.commitTransaction(_context);
		} catch (Exception e) {
			ContextUtil.abortTransaction(_context);
			e.printStackTrace();
			throw e;
		}
	}
	
	public Vector getDivisionColumn(Context context, String[] args) throws Exception{
		try {
			Map programMap = (Map) JPO.unpackArgs(args);
			MapList mlObject = (MapList) programMap.get("objectList");
			
			Map mObject = null;
			String sId = null;
			String sDivision = null;
			String sDisplay = null;
			Vector vReturn = new Vector();
			
			for (int k = 0; k < mlObject.size(); k++)
			{
				mObject = (Map) mlObject.get(k);
				sId = (String) mObject.get(DomainConstants.SELECT_ID);
				
				sDivision = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sId, DomainObject.getAttributeSelect("sbDevision"));
				sDisplay = EnoviaResourceBundle.getProperty(context, PROGRAMCENTRAL, context.getLocale(), "emxProgramCentral.Form.select." + sDivision);
				sDisplay = sDisplay.indexOf("emxProgramCentral.Form.select.") == 0 ? "" : sDisplay;
				
				vReturn.add(sDisplay);
			}
			
			return vReturn;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public Vector getRemainColumn(Context context, String[] args) throws Exception{
		try {
			Map programMap = (Map) JPO.unpackArgs(args);
			MapList mlObject = (MapList) programMap.get("objectList");
			
			Map mObject = null;
			String sId = null;
			String sRemain = null;
			String sNumber = null;
			String sPeriod = null;
			String[] sRemainArr = null;
			String sDisplay = null;
			Vector vReturn = new Vector();
			
			for (int k = 0; k < mlObject.size(); k++)
			{
				mObject = (Map) mlObject.get(k);
				sId = (String) mObject.get(DomainConstants.SELECT_ID);
				
				sRemain = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sId, DomainObject.getAttributeSelect("sbRemain"));
				sRemainArr = sRemain.split(" ");
				if ( sRemainArr != null && sRemainArr.length >= 2 )
				{
					sNumber = sRemainArr[0];
					sPeriod = sRemainArr[1];
				}
				sPeriod = EnoviaResourceBundle.getProperty(context, PROGRAMCENTRAL, context.getLocale(), "emxProgramCentral.Form.select." + sPeriod);
				sDisplay = sNumber + " " + (sPeriod.indexOf("emxProgramCentral.Form.select.") == 0 ? "" : sPeriod);
				
				vReturn.add(sDisplay);
			}
			
			return vReturn;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
}
