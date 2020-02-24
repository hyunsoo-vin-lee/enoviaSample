/* emxTask.java

   Copyright (c) 1992-2018 Dassault Systemes.
   All Rights Reserved.
   This program contains proprietary and trade secret information of MatrixOne,
   Inc.  Copyright notice is precautionary only
   and does not evidence any actual or intended publication of such program

   static const char RCSID[] = $Id: emxTask.java.rca 1.6 Wed Oct 22 16:21:23 2008 przemek Experimental przemek $
*/

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import com.dassault_systemes.requirements.ReqConstants;
import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.DebugUtil;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;
import com.matrixone.apps.program.ProgramCentralConstants;
import com.matrixone.apps.program.ProgramCentralUtil;
import com.matrixone.apps.program.ProjectSpace;
import com.matrixone.apps.program.ProjectTemplate;
import com.matrixone.apps.program.Task;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

/**
 * The <code>emxTask</code> class represents the Task JPO
 * functionality for the AEF type.
 *
 * @version AEF 10.0.SP4 - Copyright (c) 2002, MatrixOne, Inc.
 */
public class emxTask_mxJPO extends emxTaskBase_mxJPO
{
    private static final String SELECT_IS_DELETED_SUBTASK = "to[" + DomainConstants.RELATIONSHIP_DELETED_SUBTASK + "]";
    private static final String SELECT_IS_PARENT_TASK_DELETED = "to["+DomainConstants.RELATIONSHIP_SUBTASK+"].from.to[" + DomainConstants.RELATIONSHIP_DELETED_SUBTASK + "]";

    /**
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds no arguments
     * @throws Exception if the operation fails
     * @since AEF 10.0.SP4
     * @grade 0
     */
    public emxTask_mxJPO (Context context, String[] args)
        throws Exception
    {
      super(context, args);
    }

    /**
     * It checks if the logged-in user is owner/co-owner of the Template.
     *
     * @param context
     * @param args
     * @return
     * @throws Exception
     */
    public boolean isHoldTask(Context context, String[] args) throws Exception {
        System.out.println("emxTask_mxJPO.isHoldTask()");
        Map programMap = (Map) JPO.unpackArgs(args);
        String sId = (String) programMap.get("objectId");

        // 상태 Hold가 아니고, 프로젝트 PM .

        boolean returnValue = false;

        DomainObject obj = DomainObject.newInstance(context, sId);
        String sCurrent = obj.getInfo(context, "current");
        if(StringUtils.equals(sCurrent, "Assign") || StringUtils.equals(sCurrent, "Active") || StringUtils.equals(sCurrent, "Review")) {
            String sPM = obj.getInfo(context, "to[Project Access Key].from.from[Project Access List].to.owner");
            if(StringUtils.equals(sPM, context.getUser())) {
                returnValue = true;
            }
        }
        return returnValue;
    }

    /**
     * It checks if the logged-in user is owner/co-owner of the Template.
     *
     * @param context
     * @param args
     * @return
     * @throws Exception
     */
    public boolean isResumeTask(Context context, String[] args) throws Exception {
        System.out.println("emxTask_mxJPO.iResumeTask()");
        Map programMap = (Map) JPO.unpackArgs(args);
        String sId = (String) programMap.get("objectId");

        // 상태 Hold가 이고, 프로젝트 PM .

        boolean returnValue = false;

        DomainObject obj = DomainObject.newInstance(context, sId);
        String sCurrent = obj.getInfo(context, "current");
        if(StringUtils.equals(sCurrent, "Hold")) {
            String sPM = obj.getInfo(context, "to[Project Access Key].from.from[Project Access List].to.owner");
            if(StringUtils.equals(sPM, context.getUser())) {
                returnValue = true;
            }
        }
        return returnValue;
    }

    /****************************************************************************************************
     *       Methods for Config Table Conversion Task
     ****************************************************************************************************/
    /**
     * gets the list of Assigned WBS Task Objects to context User
     * Used for PMCAssignedWBSTaskSummary table
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds the following input arguments:
     * @returns Object
     * @throws Exception if the operation fails
     * @since PMC 11.0.0.0
     */
    @com.matrixone.apps.framework.ui.ProgramCallable
    public Object getRelatedTasks(Context context, String[] args)
            throws Exception
    {
        HashMap programMap        = (HashMap) JPO.unpackArgs(args);
        String  sId          = (String) programMap.get("objectId");

        StringList typeSelects = new StringList();
        typeSelects.add(SELECT_ID);
        StringList relSelects = new StringList();

        DomainObject obj = DomainObject.newInstance(context, sId);
        MapList deliverablesList = obj.getRelatedObjects(context,
               "lsRequirementToTask",
                DomainConstants.TYPE_TASK,
                typeSelects,
                relSelects,
                false,
                true,
                (short)1,
                null,
                null,
                0);
        return deliverablesList;
    }


    /**
     * gets the list of deliverables for a task
     * Used for APPDocumentSummary table from command command_PMCDeliverable
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds the following input arguments:
     *        0 - objectId - task OID
     * @returns Object
     * @throws Exception if the operation fails
     * @since Program Central 10.7.SP1
     * @grade 0
     */
    @com.matrixone.apps.framework.ui.ProgramCallable
    public Object getDependencyDeliverables(Context context, String[] args) throws Exception {
        MapList deliverablesList = new MapList();
        try {
            HashMap programMap        = (HashMap) JPO.unpackArgs(args);
            String  parentId          = (String) programMap.get("objectId");
            String sDiv               = (String) programMap.get("lgTask");

            Task task = (Task)DomainObject.newInstance(context,TYPE_TASK,PROGRAM);
            task.setId(parentId);

            StringList busSelect = new StringList();
            busSelect.addElement(SELECT_ID);
            StringList relSelect = new StringList();
            relSelect.addElement(SELECT_RELATIONSHIP_ID);
            MapList lmDependencyTask = new MapList();
            if(StringUtils.equals("input", sDiv)) {
                lmDependencyTask = task.getPredecessors(context, busSelect, relSelect, null);
            } else if(StringUtils.equals("output", sDiv)) {
                lmDependencyTask = task.getSuccessors(context, busSelect, relSelect, null);
            }

            int ilmDependencyTask = lmDependencyTask.size();


            if(ilmDependencyTask > 0) {
                // Since the old command href called emxCommonDocumentUI:getDocuments, call
                // that method first (requires a new instance of the emxCommonDocumentUI JPO)
                //
                emxCommonDocumentUI_mxJPO emxCommonDocumentUI = new emxCommonDocumentUI_mxJPO(context, null);
                for(int i = 0; i < ilmDependencyTask; i++) {
                    Map m = (Map) lmDependencyTask.get(i);
                    String sId = (String) m.get(SELECT_ID);
                    programMap.put("objectId", sId);

                    MapList lmDeliverablesList = (MapList)emxCommonDocumentUI.getDocuments(context, JPO.packArgs(programMap));
                    if (lmDeliverablesList != null && !lmDeliverablesList.isEmpty()) {
                        deliverablesList.addAll(lmDeliverablesList);
                    }
                }

                // Call to get deliverables for VPLM Tasks
                for(int i = 0; i < ilmDependencyTask; i++) {
                    Map m = (Map) lmDependencyTask.get(i);

                    String sId = (String) m.get(SELECT_ID);
                    String[] oids = new String[1];
                    oids[0] = sId;
                    emxVPLMTask_mxJPO emxVPLMTask = new emxVPLMTask_mxJPO(context, oids);
                    MapList vplmDeliverablesList = emxVPLMTask.getDeliverables(context, args);

                    if (vplmDeliverablesList != null && !vplmDeliverablesList.isEmpty()) {
                        deliverablesList.addAll(vplmDeliverablesList);
                    }
                }

                //Exclude the URL deliverables
                Iterator<Map> deliverablesListIterator = deliverablesList.iterator();
                while(deliverablesListIterator.hasNext()) {
                    Map deliverableInfo = deliverablesListIterator.next();
                    String deliverableType = (String)deliverableInfo.get(ProgramCentralConstants.SELECT_TYPE);

                    if(ProgramCentralConstants.TYPE_URL.equalsIgnoreCase(deliverableType)){
                        deliverablesListIterator.remove();
                    }
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            throw ex;
        }
        return deliverablesList;
    }

    /**
     * Where : PMCProjectTaskPropertiesEdit & PMCProjectTemplateTaskPropertiesEdit(both from Task RMB and Task Popup)
     *
     * @param context
     * @param args
     * @return
     * @throws Exception
     */
    public boolean canEditTaskProperties(Context context, String[] args) throws Exception     {
        boolean hasAccess = Boolean.TRUE;
        Map programMap = (Map) JPO.unpackArgs(args);
        String objectId = (String) programMap.get("objectId");

        StringList busSelects = new StringList();
        busSelects.add(DomainConstants.SELECT_CURRENT);
        busSelects.add(SELECT_IS_DELETED_SUBTASK);
        busSelects.add(DomainConstants.SELECT_HAS_MODIFY_ACCESS);
        busSelects.add(ProgramCentralConstants.SELECT_PROJECT_TYPE);
        busSelects.add(ProgramCentralConstants.SELECT_PROJECT_ID);
        busSelects.add(SELECT_IS_PARENT_TASK_DELETED);

        DomainObject domObj = DomainObject.newInstance(context, objectId);
        Map infoMap = domObj.getInfo(context, busSelects);

        String currState = (String) infoMap.get(DomainConstants.SELECT_CURRENT);
        String isDeleted = (String) infoMap.get(SELECT_IS_DELETED_SUBTASK);
        String isParentDeleted = (String) infoMap.get(SELECT_IS_PARENT_TASK_DELETED);
        String hasModifyAcc = (String) infoMap.get(DomainConstants.SELECT_HAS_MODIFY_ACCESS);
        String objType = (String) infoMap.get(DomainConstants.SELECT_TYPE);
        String rootObjType = (String) infoMap.get(ProgramCentralConstants.SELECT_PROJECT_TYPE);
        String rootObjId = (String) infoMap.get(ProgramCentralConstants.SELECT_PROJECT_ID);

        boolean isAnDInstalled = FrameworkUtil.isSuiteRegistered(context,"appVersionAerospaceProgramManagementAccelerator",false,null,null);
        boolean isLocked = false;
        if(DomainConstants.TYPE_PROJECT_TEMPLATE.equalsIgnoreCase(objType) || DomainConstants.TYPE_PROJECT_TEMPLATE.equalsIgnoreCase(rootObjType)) {//From task popup in Template side.
            ProjectTemplate projectTemplate = (ProjectTemplate)DomainObject.newInstance(context, DomainConstants.TYPE_PROJECT_TEMPLATE, DomainObject.PROGRAM);
            String projectTemplateId = objectId;

            if(DomainConstants.TYPE_PROJECT_TEMPLATE.equalsIgnoreCase(rootObjType)) {
                projectTemplateId = rootObjId;
            }

            hasAccess =  projectTemplate.isOwnerOrCoOwner(context, projectTemplateId);
        } else if("TRUE".equalsIgnoreCase(isDeleted) || "TRUE".equalsIgnoreCase(isParentDeleted)) {
            hasAccess = Boolean.FALSE;
        } else {
            if(isAnDInstalled) {
                isLocked  = Task.isParentProjectLocked(context, objectId);
            }
        }
        hasAccess = (hasAccess && Boolean.valueOf(hasModifyAcc)
                && !(DomainConstants.STATE_PROJECT_SPACE_COMPLETE.equalsIgnoreCase(currState))
                && !("Hold".equalsIgnoreCase(currState))
                && !isLocked);
        return hasAccess;
    }

    /**
     * Where : In the Structure Browser, TableMenu - > WBS Tasks
     * How : Get the objectId from argument map and extract the objects
     *          with "Subtask" relationship through getWBSTasks
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds the following input arguments:
     *        0 - String containing the "paramMap"
     *        paramMap holds the following input arguments:
     *          0 - String containing "objectId"
     * @returns MapList
     * @throws Exception if operation fails
     * @since PMC V6R2008-1
     */
    @com.matrixone.apps.framework.ui.ProgramCallable
    public MapList getWBSSubtasks(Context context, String[] args) throws Exception {
        HashMap arguMap 		= (HashMap)JPO.unpackArgs(args);
        String strObjectId 		= (String) arguMap.get("objectId");
        String strExpandLevel 	= (String) arguMap.get("expandLevel");
        String selectedProgram 	= (String) arguMap.get("selectedProgram");
        String selectedTable 	= (String) arguMap.get("selectedTable");
        String effortFilter 	= (String) arguMap.get("PMCWBSEffortFilter");

        MapList mapList = new MapList();

        short nExpandLevel =  ProgramCentralUtil.getExpandLevel(strExpandLevel);
        if("PMCProjectTaskEffort".equalsIgnoreCase(selectedTable)) {
            String[] arrJPOArguments = new String[3];
            HashMap programMap = new HashMap();
            programMap.put("objectId", strObjectId);
            programMap.put("ExpandLevel", strExpandLevel);

            if(!"null".equals(effortFilter) && null!= effortFilter && !"".equals(effortFilter)) {
                programMap.put("effortFilter", effortFilter);
            }
            arrJPOArguments = JPO.packArgs(programMap);
            mapList = (MapList)JPO.invoke(context,
                    "emxEffortManagementBase", null, "getProjectTaskList",
                    arrJPOArguments, MapList.class);
        } else {
            mapList = (MapList) getWBSTasks(context, strObjectId, DomainConstants.RELATIONSHIP_SUBTASK, nExpandLevel);
        }

        HashMap hmTemp = new HashMap();
        hmTemp.put("expandMultiLevelsJPO","true");
        mapList.add(hmTemp);

        //Need to ask f1m -- is it really required in DPM code base?
        boolean isAnDInstalled = FrameworkUtil.isSuiteRegistered(context,"appVersionAerospaceProgramManagementAccelerator",false,null,null);
        if(isAnDInstalled){
            boolean isLocked = Task.isParentProjectLocked(context, strObjectId);
            if(isLocked) {
                for(Object tempMap : mapList) {
                    ((Map)tempMap).put("disableSelection", "true");
                    ((Map)tempMap).put("RowEditable", "readonly");
                }
            }
        }
        return mapList;
    }

    /**
     * This Method will return MapList of expanded WBS of Project with seleced Expansion Level.
     * Added by OEF for IR-017626V6R2011 02/12/2009.
     * @param context Matrix Context object
     * @param objectId ProjectId
     * @param relPattern Relationship for Expansion
     * @param nExpandLevel Expansion Level of WBS
     * @return MapList of WBS with Level of Expansion
     * @throws Exception
     */
    protected MapList getWBSTasks(Context context, String objectId, String relPattern,short nExpandLevel) throws Exception {
        long start = System.currentTimeMillis();
        MapList objectList 	= new MapList();

        try {
            ProjectSpace rootNodeObj = new ProjectSpace(objectId);

            // Object and Relationship selects
            StringList objectSelects = new StringList(10);
            objectSelects.addElement(DomainConstants.SELECT_ID);
            objectSelects.addElement(DomainConstants.SELECT_NAME);
            objectSelects.addElement(DomainConstants.SELECT_TYPE);
            objectSelects.addElement(DomainConstants.SELECT_CURRENT);
            objectSelects.addElement("from[" + DomainConstants.RELATIONSHIP_MEMBER  + "].to.name");
            objectSelects.addElement("from[" + DomainConstants.RELATIONSHIP_MEMBER  + "].attribute[" + DomainConstants.ATTRIBUTE_PROJECT_ACCESS + "]");
            objectSelects.addElement(SELECT_IS_PARENT_TASK_DELETED);
            objectSelects.addElement(DomainConstants.SELECT_POLICY);
            objectSelects.addElement(ProgramCentralConstants.SELECT_IS_SUMMARY_TASK);
            objectSelects.addElement(SELECT_IS_DELETED_SUBTASK);

            StringList relationshipSelects = new StringList(5);
            relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_ID);
            relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_TYPE);
            relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_NAME);
            relationshipSelects.addElement(DomainConstants.SELECT_LEVEL);

            //Query parameters
            String typePattern 		= ProgramCentralConstants.TYPE_PROJECT_MANAGEMENT;
            boolean getTo 			= false;
            boolean getFrom 		= true;
            String direction 		= "from";
            String busWhereClause 	= "current != Hold";
            String relWhereClause 	= null;
            String rowEditable 		= "show";

            objectList = rootNodeObj.getProjectRelatedObjects(context,
                    relPattern,
                    typePattern,
                    objectSelects,
                    relationshipSelects,
                    getTo,
                    getFrom,
                    nExpandLevel,
                    busWhereClause,
                    relWhereClause);

            for(int i=0,size=objectList.size();i<size;i++) {
                Map objectMap 		= (Map)objectList.get(i);
                String isSummary 	= (String)objectMap.get(ProgramCentralConstants.SELECT_IS_SUMMARY_TASK);
                objectMap.put("hasChildren",isSummary);
                objectMap.put("RowEditable",rowEditable);

                if("readonly".equalsIgnoreCase(rowEditable)) {
                    objectMap.put("selection","none");
                }
                objectMap.put("direction",direction);
            }

        } catch(Exception e) {
            e.printStackTrace();
            throw e;
        } finally {
            DebugUtil.debug("Total time taken by expand program(getWBSTasks)::"+(System.currentTimeMillis()-start)+"ms");
            return objectList;
        }
    }

    /**
     * Where : In the Structure Browser, TableMenu - > WBS Deleted Tasks
     * How : Get the objectId from argument map and extract the objects
     *          with "Deleted Subtask" relationship through getDeletedTasks
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds the following input arguments:
     *        0 - String containing the "paramMap"
     *        paramMap holds the following input arguments:
     *          0 - String containing "objectId"
     * @returns MapList
     * @throws Exception if operation fails
     * @since PMC V6R2008-1
     */

    @com.matrixone.apps.framework.ui.ProgramCallable
    public MapList getWBSHoldSubtasks(Context context, String[] args) throws Exception {

        com.matrixone.apps.program.Task task = (com.matrixone.apps.program.Task) DomainObject.newInstance(context, DomainConstants.TYPE_TASK, "PROGRAM");
        MapList resultList = new MapList();

        HashMap arguMap = (HashMap)JPO.unpackArgs(args);
        String selectedTable = (String) arguMap.get("selectedTable");
        String strDirection = "from";
        String strObjectId = (String) arguMap.get("objectId");
        task.setId(strObjectId);
        String strExpandLevel = (String) arguMap.get("expandLevel");

        StringList objectSelects = new StringList(2);
        StringList relationshipSelects = new StringList(4);

        objectSelects.addElement(DomainConstants.SELECT_ID);
        objectSelects.addElement(DomainConstants.SELECT_NAME);
        objectSelects.addElement(DomainConstants.SELECT_CURRENT);
        objectSelects.addElement(SELECT_IS_DELETED_SUBTASK);
        relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_ID);
        relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_TYPE);
        relationshipSelects.addElement(DomainConstants.SELECT_RELATIONSHIP_NAME);
        relationshipSelects.addElement(DomainConstants.KEY_LEVEL);

        MapList wbsHoldTasks = new MapList();

        short recursionLevel = ProgramCentralUtil.getExpandLevel(strExpandLevel);

        String relPattern = DomainConstants.RELATIONSHIP_DELETED_SUBTASK;
        String typePattern= DomainConstants.TYPE_TASK_MANAGEMENT;

        if(task.isKindOf(context, DomainConstants.TYPE_PROJECT_SPACE)||task.isKindOf(context, DomainConstants.TYPE_PROJECT_CONCEPT)) {
            MapList lmSubTasks = task.getTasks(context, 0, objectSelects, relationshipSelects, false);
            Iterator var7 = lmSubTasks.iterator();

            while(var7.hasNext()) {
                Map var8 = (Map)var7.next();
                if (((String)var8.get(SELECT_CURRENT)).equals("Hold")) {
                    wbsHoldTasks.add(var8);
                }
            }
        }

        Iterator iterator = wbsHoldTasks.iterator();
        while(iterator.hasNext()) {
            Hashtable htable = (Hashtable) iterator.next();
            htable.put("RowEditable","readonly");
            htable.put("hasChildren","false");
            htable.put("selection","none");
            htable.remove("level");//IR-203180V6R2014 and IR-203181V6R2014
            htable.put("direction",strDirection);
        }

        boolean isAnDInstalled = FrameworkUtil.isSuiteRegistered(context,"appVersionAerospaceProgramManagementAccelerator",false,null,null);
        if(isAnDInstalled) {
            boolean isLocked = Task.isParentProjectLocked(context, strObjectId);
            if(isLocked) {
                for(Object tempMap : wbsHoldTasks) {
                    ((Map)tempMap).put("disableSelection", "true");
                    ((Map)tempMap).put("RowEditable", "readonly");
                }
            }
        }
        return  wbsHoldTasks;
    }

    /**
     * isMemberView - This will evaluate if the Task Constraint Type,Date columns should be shown in planning view or not
     * It will also check if the project is of type concept
     * @param context
     * @param args
     * @return
     * @since R209
     * @throws Exception
     */
    public boolean isMemberView(Context context,String args[]) throws Exception {
        System.out.println("emxTask_mxJPO.isMemberView()");
        try {
            HashMap inputMap = (HashMap)JPO.unpackArgs(args);
            String strObjectId = (String) inputMap.get("projectID");
            if(strObjectId==null) {
                strObjectId = (String) inputMap.get("objectId");
            }
            String selectedProgram = (String)inputMap.get("selectedProgram");

            if((ProgramCentralUtil.isNotNullString(selectedProgram) && selectedProgram.contains("emxTask:getMemberTasks"))) {
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Get skill column values.
     * @param context - The ENOVIA <code>Context</code> object
     * @param args - Contains information related objects.
     * @return - List of column values.
     * @throws Exception If operation fails.
     */
    public StringList getSkillName(Context context,String[] args)throws Exception {
        System.out.println("emxTask_mxJPO.getSkillName()");
        Map programMap 		= (HashMap) JPO.unpackArgs(args);
        MapList objectList 	= (MapList) programMap.get("objectList");
        int size = objectList.size();

        StringList valueList 	= new StringList(size);
        DomainObject obj = DomainObject.newInstance(context);
        for(int i = 0; i < size; i++) {
            Map mapObject = (Map) objectList.get(i);
            String taskId = (String) mapObject.get(DomainObject.SELECT_ID);
            obj.setId(taskId);

            String sSkill = "";
            if(obj.isKindOf(context, TYPE_PERSON)) {
                StringList lsSkill = obj.getInfoList(context, "from[hasBusinessSkill].to.name");
                sSkill = FrameworkUtil.join(lsSkill, ",");
            } else {
                StringList lsSkill = obj.getInfoList(context, "from[lgTaskSkill].to.name");
                sSkill = FrameworkUtil.join(lsSkill, ",");
            }
            valueList.addElement(sSkill);
        }
        return valueList;
    }

    public MapList getMyProjectTasks(Context context, String[] args) throws Exception{
    	try {
    		Map programMap = (Map) JPO.unpackArgs(args);
    		String objectId = (String) programMap.get("objectId");
    		StringList slSelect = (StringList) programMap.get("slSelect");
    		StringList slRelSelect = (StringList) programMap.get("slRelSelect");

    		String sProjectAccessListId = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", objectId, "to[Project Access List].from.id");
    		DomainObject doProjectAccessList = DomainObject.newInstance(context, sProjectAccessListId);
    		MapList mlTask = doProjectAccessList.getRelatedObjects(context
    				, "Project Access Key"
    				, "Task"
    				, slSelect
    				, slRelSelect
    				, false
    				, true
    				, (short) 1
    				, null
    				, null
    				, 0);
    		
    		return mlTask;
    		
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public MapList getRelatedRequirementList(Context context, String[] args) throws Exception{
    	try {
			Map programMap = (Map) JPO.unpackArgs(args);
			String objectId = (String) programMap.get("objectId");
			DomainObject doObj = DomainObject.newInstance(context, objectId);
			
			StringList objectSelects = new StringList(DomainConstants.SELECT_ID);
	        objectSelects.add(ReqConstants.SELECT_READ_ACCESS);
	        
			MapList mlReturn = doObj.getRelatedObjects(context, "lsRequirementToTask", "Requirement", objectSelects, null, true, false, (short)1, null, null, 0);
			return mlReturn;
    	} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }

	@Override
	public MapList getWBSProjectTemplateSubtasks(Context context, String[] args) throws Exception {
		HashMap arguMap = (HashMap)JPO.unpackArgs(args);
		String strObjectId = (String) arguMap.get("objectId");
		
		//CUSTOM START
		String sType = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", strObjectId, DomainConstants.SELECT_TYPE);
		if ( "Project Concept".equals(sType) )
		{
			String sTemplateId = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", strObjectId, "from[lgProjectConceptTemplate].to.id");
			if ( StringUtils.isEmpty(sTemplateId) )
			{
				return new MapList();
			}
			else
			{
				strObjectId = sTemplateId;
			}
		}
		//CUSTOM END

		//
		String strExpandLevel = (String) arguMap.get("expandLevel");

		short nExpandLevel = ProgramCentralUtil.getExpandLevel(strExpandLevel);
		StringList ObjSelects=new StringList();
		MapList newList=new MapList();
		try
		{
			MapList mapList = (MapList) getWBSTasks(context,strObjectId,DomainConstants.RELATIONSHIP_SUBTASK,nExpandLevel);
			Iterator itr=  mapList.iterator();
			while (itr.hasNext())
			{
				Map map=(Map)itr.next();
				map.put("RowEditable","show");
				map.put("direction","from");
				newList.add(map);
			}
			//inform SB that the structure includes multi-level structure.
			HashMap hmTemp = new HashMap();
			hmTemp.put("expandMultiLevelsJPO", "true");
			newList.add(hmTemp);
		}
		catch (Exception e)
		{
			e.printStackTrace();
			throw e;
		}
		return newList;
	}
    
}
