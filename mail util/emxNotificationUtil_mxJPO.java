/**
 *   Copyright (c) 1992-2018 Dassault Systemes.
 *   All Rights Reserved.
 *
 */

import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkException;
import com.matrixone.apps.framework.ui.UINavigatorUtil;
import com.matrixone.util.MxMessage;
import com.sb.apps.util.sbMailUtil;

import matrix.db.BusinessObject;
import matrix.db.BusinessObjectList;
import matrix.db.Context;
import matrix.db.IconMail;
import matrix.util.StringList;

/**
 * The <code>emxNotificationUtil</code> class contains static methods for sending email.
 *
 * @version AEF 10.0.0.0
 */

public class emxNotificationUtil_mxJPO extends emxNotificationUtilBase_mxJPO {
    /**
     * @param context the eMatrix <code>Context</code> object
     * @param args holds no arguments
     * @throws Exception if the operation fails
     * @since EC 10.0.0.0
     */

    public emxNotificationUtil_mxJPO (Context context, String[] args) throws Exception {
        super(context, args);
    }
    
 public static String getObjectPortalLinkHTML(Context context, String text, String objectId) throws Exception {
		
		String link = getObjectLink(context, objectId);
		if (link != null && link.length() > 0) {
			String baseURL = emxMailUtil_mxJPO.getBaseURL(context, null);
//			sb.append( "<a href=\"javascript:emxTableColumnLinkClick( " );
//			sb.append( "'../common/emxPortal.jsp?portal=AEFLifecyclePowerView&amp;suiteKey=Framework&amp;" );
//			sb.append( "StringResourceFileId=emxFrameworkStringResource&amp;SuiteDirectory=Framework&amp;" );
//			sb.append( "objectId=" + taskId + "&amp;isFromRMB=true&amp;isFromRMB=true','800','600','false','popup','')\">" );
			
//			link = "<a href='http://172.16.1.46:8080/enovia/common/emxPortal.jsp?portal=AEFLifecyclePowerView&objectId="+ objectId +"' target=_blank>"+ text +"</a>";
			link = "if== ture " + text;
		}
		else {
			link = text;
		}
		
		return (link);
	}

	 public static String makeMailContent(Context context, String title, LinkedHashMap contentMap, Map linkMap) throws Exception {
		StringBuffer sbContentHTML = new StringBuffer();
		
		try {
			sbContentHTML.append("<html>");
			sbContentHTML.append("<style>");
			sbContentHTML.append(" body {background:#fff;}");
			sbContentHTML.append(" table {border:1px solid #d8d8d8;}");
			sbContentHTML.append(" table.form {border-collapse:collapse;}");
			sbContentHTML.append(" table.form tr td {padding:5px; line-height:14px;}");
			//sbContentHTML.append(" td.label {width:100px; padding:5px; border-bottom:1px solid #d8d8d8; background-color: #f8f8f8; color:#2a2a2a; font: 15px/18px Arial,Helvetica,sans-serif; margin-bottom: 0; text-align: left; line-height: 18px; display: table-cell; vertical-align: middle; white-space: normal;}");
			sbContentHTML.append(" td.label {width:100px; padding:5px; border-bottom:1px solid #d8d8d8; background-color: #d3ebf7; color:#2a2a2a; margin-bottom: 0; text-align: left; line-height: 18px; display: table-cell; vertical-align: middle; white-space: normal;}");
			//sbContentHTML.append(" td.field {width:300px; padding:5px; color:#2a2a2a; border-bottom:1px solid #d8d8d8; word-break:break-all;}");
			sbContentHTML.append(" td.field {width:300px; padding:5px; color:#2a2a2a; border-bottom:1px solid #d8d8d8; word-break:break-all; text-align: middle;}");
			sbContentHTML.append(" td.field a {text-decoration:underline;}");
			sbContentHTML.append("</style>");
			sbContentHTML.append("<head>");
			sbContentHTML.append(" <meta charset=\"UTF-8\">");
			sbContentHTML.append("</head>");
			sbContentHTML.append("<body>");
			sbContentHTML.append(title);
			sbContentHTML.append("<br/>");
			sbContentHTML.append("<br/>");
			sbContentHTML.append(" <table class=\"form\">");
			Iterator it = contentMap.keySet().iterator();
			while (it.hasNext()) {
				String sKey = (String) it.next();
				String sValue = (String) contentMap.get(sKey);
				sbContentHTML.append("  <tr>");
				sbContentHTML.append("   <td class=\"label\">" + sKey + "</td>");
				if (linkMap.containsKey(sKey)) {
					//modified by shlee, multi objects link - [S]
					//sbContentHTML.append("   <td class=\"field\">" + getObjectLinkHTML(context, sValue, (String) linkMap.get(sKey)) + "</td>");
					String pipe_Separator = "\\|";
					String comma_Separator = ",";
					if(((String) linkMap.get(sKey)).indexOf(pipe_Separator) > 0) {
						String[] sLinkList = ((String) linkMap.get(sKey)).split(pipe_Separator);
						String[] sValueList = sValue.split(pipe_Separator);
						sbContentHTML.append("   <td class=\"field\">");
						int len = (sLinkList.length > sValueList.length) ? sValueList.length : sLinkList.length;
						for(int i=0;i<len;i++) {
							if(i!=0) {
								sbContentHTML.append(",");
							}
							sbContentHTML.append(getObjectLinkHTML(context, sValueList[i], sLinkList[i]));
						}
						sbContentHTML.append("</td>");
					} else {
						sbContentHTML.append("   <td class=\"field\">" + getObjectLinkHTML(context, sValue, (String) linkMap.get(sKey)) + "</td>");
					}
					//modified by shlee, multi objects link - [E]
				} else {
					sbContentHTML.append("   <td class=\"field\">" + sValue + "</td>");
				}
				sbContentHTML.append("  </tr>");
			}
			sbContentHTML.append(" </table>");
			sbContentHTML.append("</body>");
			sbContentHTML.append("</html>");
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return sbContentHTML.toString();
	}

	 /**
		 * Override emxNotificationUtilBase_mxJPO : sendJavaMail
		 * This method sends mail using the Java Mail API.
		 *
		 * @param context the eMatrix <code>Context</code> object
		 * @param toList StringList that contains the list of users to notify
		 * @param ccList StringList that contains the list of users to cc
		 * @param bccList StringList that contains the list of users to bcc
		 * @param subject String that contains the subject
		 * @param messageText String that contains the message in plain text
		 * @param messageHTML String that contains the message in HTML format
		 * @param fromAgent a String holding the from user appearing in the mail
		 * @param replyTo a StringList holding the replyTo user and personal info appearing in the mail
		 * @param notifyType Notification Type selected by user (email, iconmail, or both)
		 * @throws Exception if the operation fails
		 * @since x+2
		 */
	public static void sendJavaMail(Context context, StringList toList, StringList ccList, StringList bccList, String subject, String messageText, String messageHTML, String fromAgent, StringList replyTo, StringList objectIdList, String notifyType) throws Exception {
		// IR-058366V6R2011x Modification -Starts
		boolean isContextPushed = false;
		emxContextUtil_mxJPO utilityClass = new emxContextUtil_mxJPO(context, null);
		// IR-058366V6R2011x Modification -Ends
		try {
			// Added by hslee on 2020.07.28 Start
			if ( StringUtils.isNotEmpty(messageHTML) )
			{
				sbMailUtil.createMailFile(subject, toList, messageHTML);
			}
			// Added by hslee on 2020.07.28 End
			
			MxMessage msg = new MxMessage();
			//msg.setDebug(true);

			if (replyTo != null && replyTo.size() > 1) {
				msg.setReplyTo((String)replyTo.elementAt(0));
				msg.setReplyToText((String)replyTo.elementAt(1));
			}

			msg.setSubject(subject);

			if (messageText != null) {
				msg.setMessage(messageText);
			}

			if (messageHTML != null) {
				msg.setHtmlMessage(messageHTML);
			}
			if (toList != null) {
				ArrayList to = new ArrayList();
				to.addAll(toList);
				msg.setToList(to);
			}

			if (ccList != null) {
				ArrayList cc = new ArrayList();
				cc.addAll(ccList);
				msg.setCcList(cc);
			}

			if (bccList != null) {
				ArrayList bcc = new ArrayList();
				bcc.addAll(bccList);
				msg.setBccList(bcc);
			}
			// IR-058366V6R2011x Commented here and declared at the begining before try block -starts
			// boolean isContextPushed = false;
			// ${CLASS:emxContextUtil} utilityClass = new ${CLASS:emxContextUtil}(context, null);
			// IR-058366V6R2011x Commented here and declared at the begining before try block -Ends
			// Test if spoofing should be performed on the "from" field.
			String agentName = fromAgent;
			
			// Cloud configuration is having problem not able to be send mail/notification from all domains.
			// So it needs to be restricted to a specific agent configured by the property only.
			// That means any notification object has specific user as agent that will be overwritten by this logic. 
			if( UINavigatorUtil.isCloud(context) ) {
				String propertyAgentName = EnoviaResourceBundle.getProperty(context, "emxFramework.NotificationAgent");
				if(propertyAgentName != null && !"".equals(propertyAgentName)) {
					agentName = propertyAgentName;
				}
			}
			// End of Cloud mail domain problem fix.
			
			if (agentName == null || "".equals(agentName)) {
				agentName = emxMailUtil_mxJPO.getAgentName(context, null);
			}
			if (agentName != null && !"".equals(agentName)) {
				try {
					// Push Notification Agent
					String[] pushArgs = { agentName };
					utilityClass.pushContext(context, pushArgs);
					isContextPushed = true;
				} catch (Exception ex) {
				}
			}

			//Send mail only using IconMail
			if(iconMail.equalsIgnoreCase(notifyType) || both.equalsIgnoreCase(notifyType)) {
				IconMail iconMail = new IconMail();
				iconMail.create(context);
				iconMail.setMessage(messageText);
				if (toList != null && toList.size() > 0) {
					iconMail.setToList(toList);
				}
				if (ccList != null && ccList.size() > 0) {
					iconMail.setCcList(ccList);
				}
				if (bccList != null && bccList.size() > 0) {
					iconMail.setBccList(bccList);
				}
				if(objectIdList != null && objectIdList.size() != 0) {
					BusinessObjectList bol = new BusinessObjectList(objectIdList.size());

					Iterator i = objectIdList.iterator();
					while (i.hasNext()) {
						String id = (String) i.next();
						BusinessObject bo = new BusinessObject(id);
						// Added the condition to check if the mail is sending for relationship then not attaching the
						// connection id
						if(messageText.indexOf("relationshipID=") == -1) {
							bo.open(context);
							bol.addElement(bo);
						}

						bo.open(context);
						bol.addElement(bo);
					}
					iconMail.setObjects(bol);
				}
				iconMail.send(context, subject, false);
			}
			
			//msg.sendJavaMail(context, false); false for not sending icon mail
			//status can be 0 or 1. Zero represents external mails have been sent successfully and 1
			// implies external mail was not configured on subscribed persons.
			try {
				//Send mail only using email
				if(email.equalsIgnoreCase(notifyType) || both.equalsIgnoreCase(notifyType)) {
					int emailStatus = msg.sendJavaMail(context, false);
				}
			} catch(Exception ex) {
				System.out.println("Message: Please check SMTP settings for sending an Email");
				throw new FrameworkException(ex);
			}
		} catch(Exception e) {
			e.printStackTrace();
		} finally { // IR-058366V6R2011x Added finally block - Starts
			if (isContextPushed == true) {
				// Pop Notification Agent
				utilityClass.popContext(context, null);
			}
		} // IR-058366V6R2011x Added finally block - Ends
	}
	
	
}