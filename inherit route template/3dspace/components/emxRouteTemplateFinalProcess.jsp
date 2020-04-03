  <%--  Creates a Route object through CreateRoute Wizard.
  Copyright (c) 1992-2018 Dassault Systemes.
  All Rights Reserved.
 --%>
<%@page import="com.matrixone.apps.domain.DomainConstants"%>
<%@include file = "../emxUICommonAppInclude.inc"%>
<%@include file = "emxRouteInclude.inc" %>
<%@include file = "../common/enoviaCSRFTokenValidation.inc"%>
<script language="javascript" src="../components/emxComponentsJSFunctions.js"></script>
<script language="JavaScript" src="../common/scripts/emxUIConstants.js" type="text/javascript"></script>
<script language="JavaScript" src="../common/scripts/emxUICore.js" type="text/javascript"></script>

<jsp:useBean id="formBean" scope="session" class="com.matrixone.apps.common.util.FormBean"/>
<%! static final String ROUTE_ACCESS_GRANTOR = "Route Access Grantor"; %>
<%
String strFromPage = (String)formBean.getElementValue("sourcePage");
String strObjectId = emxGetParameter(request,"objectId");
String isRouteTemplateRevised = emxGetParameter(request,"isRouteTemplateRevised");

if ("EditAllTasks".equals(strFromPage)) {
    formBean.removeElement("sourcePage");
    if("true".equalsIgnoreCase(isRouteTemplateRevised)) {
    String strTreeURL = UINavigatorUtil.getCommonDirectory(context) + "/emxTree.jsp?objectId=" + XSSUtil.encodeForURL(context, strObjectId) + "&emxSuiteDirectory="+appDirectory;
	%>
      	<script language="javascript">
      		//XSSOK
			getTopWindow().getWindowOpener().location.href="<%=strTreeURL %>";
			getTopWindow().closeWindow();
       	</script>
	<%
    } else {
	%>
	<script language="javascript">
	parent.window.getWindowOpener().location.href=changeURLParam(parent.window.getWindowOpener().location.href, "objectId", "<%=XSSUtil.encodeForURL(context, strObjectId)%>");
	getTopWindow().closeWindow();
	</script>
	<%
    }
return;
}


String keyValue=emxGetParameter(request,"keyValue");

if(keyValue == null){
        keyValue = formBean.newFormKey(session);
}
formBean.processForm(session,request,"keyValue");

   String templateId                     = emxGetParameter(request, "templateId");

   String sAttParallelNodeProcessionRule  = PropertyUtil.getSchemaProperty(context, "attribute_ParallelNodeProcessionRule");
   String sAttrRestrictMembers = PropertyUtil.getSchemaProperty(context, "attribute_RestrictMembers" );
   String sAttrRouteBasePurpose = PropertyUtil.getSchemaProperty(context, "attribute_RouteBasePurpose" );
   String attrOriginator             = PropertyUtil.getSchemaProperty(context, "attribute_Originator");
   String attrRouteTaskEdits             = PropertyUtil.getSchemaProperty(context, "attribute_TaskEditSetting");
   String sAttrRoutePreserveTaskOwner = PropertyUtil.getSchemaProperty(context, "attribute_PreserveTaskOwner" );

   BusinessObject memberObject      = null;
   BusinessObject routeTemplateObj  = null;
   DomainObject personToAdd         = null;

   String routeActionValueStr       = null;
   String routeSequenceValueStr     = null;
   String routeInstructionsValueStr = null;
   String routeTaskNameValueStr     = null;
   String parallelNodeProcessionStr = null;
   String routeTaskScheduledDateStr = null;
   String routeAllowDelegationStr   = null;
   String routeAssigneeDueDateOptStr= null;
   String routeDueDateOffsetStr     = null;
   String routeDueDateOffsetFromStr = null;
   String RouteTaskEdits=null;
   boolean objectType = false;
   String sProjectId                = "";
   String objectId                  = null;
   String documentID                = null;
   String sTemplateId               = null;
   String routeType                 = null; // CUSTOM
   String routeName                 = null;
   String routeDescription          = null;
   String routeAutoName             = null;
   String strTaskNeedsReview        = null;
   String strTemplateTaskVal        = null;
   String routeCompletionAction     = null;
   String routeBasePurpose          = null;
   String routeTemplateBasePurpose  = null;
   String routeTemplateId           = null;
   String availability				= null;
   String connectedObjectId         = null;
   String strAutoStopOnRejection    = null;
   String routePreserveTaskOwner    = null;

    String restrictMembers           = null;
    String restrictTemplateMembers   = null;
	String routeTemplateScope        = null;
    String organizationId            = null;

    final String ATTRIBUTE_AUTO_STOP_ON_REJECTION = PropertyUtil.getSchemaProperty(context, "attribute_AutoStopOnRejection" );

    Attribute routeTitle                        = null;
    Attribute routeActionAttribute              = null;
    Attribute routeTaskUserAttribute            = null;
    Attribute routeOrderAttribute               = null;
    Attribute routeInstructionsAttribute        = null;
    Attribute parallelNodeProcessionAttribute   = null;
    Attribute routeTaskScheduledDateAttribute   = null;
    Attribute routeAllowDelegationAttribute     = null;
    Attribute routeAssigneeDueDateOptAttribute  = null;
    Attribute routeDueDateOffsetAttribute       = null;
    Attribute routeDueDateOffsetFromAttribute   = null;
    Attribute taskNeedsReviewAttribute          = null;
    Attribute templateTaskAttribute             = null;

    AttributeList attrList                      = null;
    boolean boolSubRoute                        = false;

    String routeId         = "";

Hashtable routeDetails = (Hashtable)formBean.getElementValue("hashRouteWizFirst");

MapList taskDetails    = (MapList)formBean.getElementValue("taskMapList");
HashMap parallelNodeMap= (HashMap)formBean.getElementValue("parallelNodeMap");
MapList routeMemberList= (MapList)formBean.getElementValue("routeMemberMapList");
restrictTemplateMembers  =(String)formBean.getElementValue("scopeId");
availability  =       (String)formBean.getElementValue("availability");

//for bug # 280646 related to BU - start
String organizationType = null;
DomainObject domainObj  = null;
organizationId  =       (String)formBean.getElementValue("organizationId");
//for bug # 280646 related to BU - end

HashMap map1           = new HashMap();
String sUser           = context.getUser();

RouteTemplate routeTemplate = (RouteTemplate)DomainObject.newInstance(context,DomainConstants.TYPE_ROUTE_TEMPLATE);
try {

    if (routeDetails != null)
    {
    	routeType     = (String)routeDetails.get("routeType"); // CUSTOM
        sTemplateId     = (String)routeDetails.get("templateId");
        routeName       = (String)routeDetails.get("routeName");
        routeDescription= (String)routeDetails.get("routeDescription");
        routeAutoName   = (String)routeDetails.get("routeAutoName");
        routeTemplateBasePurpose=(String)routeDetails.get("routeTemplateBasePurpose");
        routeTemplateScope     = (String)routeDetails.get("scopeId");
        objectId               = (String)routeDetails.get("objectId");
        connectedObjectId      = (String)routeDetails.get("WorkspaceId");
        RouteTaskEdits         =(String)routeDetails.get("RouteTaskEdits");
        strAutoStopOnRejection = (String)routeDetails.get("autoStopOnRejection");
        routePreserveTaskOwner = (String)routeDetails.get("routePreserveTaskOwner");
    }

      // Start the update transaction

ContextUtil.startTransaction(context, true);
   if(organizationId == null || "null".equals(organizationId))
   {
        organizationId = "";
   }
   if(organizationId.trim().length() > 0)
   {
        String keyVal = "newId=";
        int i = organizationId.indexOf(keyVal);
        if(i > -1) {
                organizationId = organizationId.substring(i+keyVal.length(),organizationId.length());
        }
    domainObj = new DomainObject(organizationId);
    organizationType = domainObj.getInfo(context,DomainObject.SELECT_TYPE);
  }

   if(objectId != null && !objectId.equals("") && !objectId.equals("null")) {

        DomainObject objectGeneral    = DomainObject.newInstance(context);
        objectGeneral.setId(objectId);
         String  sPassedType= objectGeneral.getType(context);
         routeId    = (String)map1.get("routeId");
         sProjectId = (String)map1.get("workspaceId");
     }else {
           if(routeName == null || "null".equals(routeName) || "".equals(routeName)){
// CUSTOM START
//                 String routeTemplateTypeAdminAlias =FrameworkUtil.getAliasForAdmin(context,DomainObject.SELECT_TYPE,
//                         DomainObject.TYPE_ROUTE_TEMPLATE,true);
                String routeTemplateTypeAdminAlias =FrameworkUtil.getAliasForAdmin(context,DomainObject.SELECT_TYPE,
                        routeType,true);
// CUSTOM END

                String routeTemplatePolicyAdminAlias = FrameworkUtil.getAliasForAdmin(context,DomainObject.SELECT_POLICY,DomainObject.POLICY_ROUTE_TEMPLATE,true);
                templateId = FrameworkUtil.autoName(context,routeTemplateTypeAdminAlias,"1",routeTemplatePolicyAdminAlias);
                routeTemplate.setId(templateId);
           }else{
                //Creating Route Teplate with the specified Name
                routeTemplate.createObject(context,routeTemplate.TYPE_ROUTE_TEMPLATE,routeName,null,routeTemplate.POLICY_ROUTE_TEMPLATE,null);
           }
                HashMap attrMap = new HashMap();
                attrMap.put(sAttrRouteBasePurpose,routeTemplateBasePurpose);
                attrMap.put(sAttrRestrictMembers,restrictTemplateMembers);
                attrMap.put(attrRouteTaskEdits,RouteTaskEdits);
                attrMap.put(sAttrRoutePreserveTaskOwner,routePreserveTaskOwner);

                // Save value of Auto Stop On Rejection on route template object
                if (strAutoStopOnRejection != null) {
                    attrMap.put(ATTRIBUTE_AUTO_STOP_ON_REJECTION, strAutoStopOnRejection);
                }

                routeTemplate.setAttributeValues(context,attrMap);
                routeTemplate.setDescription(context,routeDescription);
                routeTemplateId=routeTemplate.getObjectId();


                //check availability
                if( (availability != null) && (availability.equals("User")) )
                {
                        DomainObject personObject  = DomainObject.newInstance(context);
                        personObject.setId(PersonUtil.getPersonObjectID(context));
                        routeTemplate.connectFrom(context,routeTemplate.RELATIONSHIP_ROUTE_TEMPLATES,personObject);
                }else if( (availability != null) && (availability.equals("Enterprise")) )
                {
                        com.matrixone.apps.common.Person personObject = com.matrixone.apps.common.Person.getPerson(context);
                        Company objCompany = personObject.getCompany(context);
                        routeTemplate.connectFrom(context,routeTemplate.RELATIONSHIP_ROUTE_TEMPLATES,objCompany);

						// Connect the Route Template with Owning Organization Relationship.
						routeTemplate.connectFrom(context,routeTemplate.RELATIONSHIP_OWNING_ORGANIZATION,domainObj);

                }else if( (availability != null) && (availability.equals("Workspace")) )
                {
                        if(connectedObjectId != null)
                        {
                                DomainObject connectedObject = DomainObject.newInstance(context);
                                connectedObject.setId(connectedObjectId);
                                routeTemplate.connectFrom(context,routeTemplate.RELATIONSHIP_ROUTE_TEMPLATES,connectedObject);
                        }
                }
        }

        DomainObject domObj = DomainObject.newInstance(context);
        AccessUtil accessUtil = new AccessUtil();

            //Connecting all the Tasks To the Route
            Iterator taskListItr = taskDetails.iterator();
            Relationship relationShipRouteNode = null;

            boolean route_task_user_exists = false;
            BusinessObject RTUObject       = null;
            DomainObject   domainRTUObject = null;

            while(taskListItr.hasNext()){
              objectType    = false;
              Map taskMap     = (Map)taskListItr.next();
              String personId = (String)taskMap.get("PersonId");
              String uniqueId = ((String)taskMap.get(DomainObject.RELATIONSHIP_ROUTE_NODE));
              attrList = new AttributeList();

              if (uniqueId != null){
                  uniqueId = uniqueId.trim();
              }
              if (personId != null && !"".equals(personId)){

                 if( "Role".equals(personId)) {

                          personId = (String)taskMap.get("PersonName");
                          String symbolicRoleName = FrameworkUtil.getAliasForAdmin(context, "role", personId, true);
                          StringList roleList = new StringList();
                          roleList.addElement(symbolicRoleName);
                          boolean isResponsibleRoleEnabled=com.matrixone.apps.common.InboxTask.checkIfResponsibleRoleEnabled(context);
  						String strSelectedPerson=(String)taskMap.get("recepient");
  						if(isResponsibleRoleEnabled&&UIUtil.isNotNullAndNotEmpty(strSelectedPerson)&&!strSelectedPerson.equals("Any")){
  							 DomainObject dPersonObj=PersonUtil.getPersonObject(context, strSelectedPerson);
  							relationShipRouteNode = DomainRelationship.connect(context,
									routeTemplate,
									DomainObject.RELATIONSHIP_ROUTE_NODE,
									dPersonObj);
  						}else{
					  try {
						if(!route_task_user_exists)	{

						  //create and connect
						  route_task_user_exists = true;
						  relationShipRouteNode = domObj.createAndConnect(context, domObj.TYPE_ROUTE_TASK_USER, DomainObject.RELATIONSHIP_ROUTE_NODE, routeTemplate, true);
						  RTUObject = relationShipRouteNode.getTo();
						  domainRTUObject = new DomainObject(RTUObject);
 					    }
						else	{
						  //connect to the existing Route Task User. only one "Route Task User" exists per route
                         relationShipRouteNode = DomainRelationship.connect(context,
														routeTemplate,
														DomainObject.RELATIONSHIP_ROUTE_NODE,
														domainRTUObject);

						}

					  } catch(Exception ex) {
						  throw new FrameworkException(ex.getMessage());
					  }
                 }

                  routeTaskUserAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_TASK_USER),symbolicRoleName);
		  attrList.addElement(routeTaskUserAttribute);
                  }else if("Group".equals(personId)){

					  personId = (String)taskMap.get("PersonName");
//mofidied for 311950
					//String symbolicGroupName = FrameworkUtil.getAliasForAdmin(context, "group", personId, true);
					  String symbolicGroupName = FrameworkUtil.getAliasForAdmin(context, "group", personId, false);
//till here



					  StringList groupList = new StringList();
					  groupList.addElement(symbolicGroupName);

					  try {
						if(!route_task_user_exists)
						{

						  //create and connect
						  route_task_user_exists = true;
						  relationShipRouteNode = domObj.createAndConnect(context, domObj.TYPE_ROUTE_TASK_USER, DomainObject.RELATIONSHIP_ROUTE_NODE, routeTemplate, true);

						  RTUObject = relationShipRouteNode.getTo();
						  domainRTUObject = new DomainObject(RTUObject);
						}
						else
						{
						  //connect to the existing Route Task User. only one "Route Task User" exists per route
						  relationShipRouteNode = DomainRelationship.connect(context,
														routeTemplate,
														DomainObject.RELATIONSHIP_ROUTE_NODE,
														domainRTUObject);
						}

						routeTaskUserAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_TASK_USER),symbolicGroupName);
						attrList.addElement(routeTaskUserAttribute);

					  } catch(Exception ex) {
						  throw new FrameworkException(ex.getMessage());
					  }

                  }else if("none".equals(personId)){
						 try
						  {
							if(!route_task_user_exists)
							{

							  //create and connect
							  route_task_user_exists = true;
							  relationShipRouteNode = domObj.createAndConnect(context, domObj.TYPE_ROUTE_TASK_USER, DomainObject.RELATIONSHIP_ROUTE_NODE, routeTemplate, true);


							  RTUObject = relationShipRouteNode.getTo();
							  domainRTUObject = new DomainObject(RTUObject);
							}
							else
							{
							  //connect to the existing Route Task User. only one "Route Task User" exists per route
							  relationShipRouteNode = DomainRelationship.connect(context,
															routeTemplate,
															DomainObject.RELATIONSHIP_ROUTE_NODE,
															domainRTUObject);
							 }

						  } catch(Exception ex) {
						  throw new FrameworkException(ex.getMessage());
						  }
					}
					else
					{

					  domObj.setId(personId.trim());
					  domObj.open(context);
					String proxyGoupType = PropertyUtil.getSchemaProperty(context,"type_GroupProxy");
					objectType = domObj.isKindOf(context, proxyGoupType);
					if(!objectType) {
						domObj.open(context);
					}
					  try{


					  relationShipRouteNode = routeTemplate.connect(context, new RelationshipType(DomainObject.RELATIONSHIP_ROUTE_NODE),true,domObj);


					  }catch(Exception ex){
						  throw new FrameworkException(ex.getMessage());
					  }
					  if(!objectType) {
					  domObj.close(context);
					}
					}

                routeSequenceValueStr        = (String) taskMap.get(DomainObject.ATTRIBUTE_ROUTE_SEQUENCE);
                routeActionValueStr          = (String) taskMap.get(DomainObject.ATTRIBUTE_ROUTE_ACTION);
                routeInstructionsValueStr    = (String) taskMap.get(DomainObject.ATTRIBUTE_ROUTE_INSTRUCTIONS);
                routeTaskNameValueStr        = (String) taskMap.get(DomainObject.ATTRIBUTE_TITLE);
                routeTaskScheduledDateStr    = (String) taskMap.get(DomainObject.ATTRIBUTE_SCHEDULED_COMPLETION_DATE);
                routeAllowDelegationStr      = (String) taskMap.get(DomainObject.ATTRIBUTE_ALLOW_DELEGATION);
                routeAssigneeDueDateOptStr   = (String) taskMap.get(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE);
                routeDueDateOffsetStr        = (String) taskMap.get(DomainObject.ATTRIBUTE_DUEDATE_OFFSET);
                routeDueDateOffsetFromStr    = (String) taskMap.get(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM);
                strTaskNeedsReview           = (String) taskMap.get(DomainObject.ATTRIBUTE_REVIEW_TASK);
                strTemplateTaskVal           = (String) taskMap.get("templateFlag");

                if (parallelNodeMap != null){
                  parallelNodeProcessionStr  = (String)parallelNodeMap.get(uniqueId);
                }

                relationShipRouteNode.open(context);

                // set title
                if (routeTaskNameValueStr != null){
                    routeTitle  = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_TITLE),routeTaskNameValueStr);
                    attrList.addElement(routeTitle);
                }

                // set route action
                if ( routeActionValueStr != null ) {
                routeActionAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_ACTION),routeActionValueStr);
                attrList.addElement(routeActionAttribute);
                }
                
                // set route order
                if (routeSequenceValueStr != null){
                    routeOrderAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_SEQUENCE),routeSequenceValueStr);
                    attrList.addElement(routeOrderAttribute);
                }

                // set route instructions
                if ( routeInstructionsValueStr != null ) {
                    routeInstructionsAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_INSTRUCTIONS),routeInstructionsValueStr);
                    attrList.addElement(routeInstructionsAttribute);
                }

                //set parallelRouteNodeProcession Attribute
                if (parallelNodeProcessionStr !=null){
                    parallelNodeProcessionAttribute = new Attribute(new AttributeType(sAttParallelNodeProcessionRule),parallelNodeProcessionStr);
                    attrList.addElement(parallelNodeProcessionAttribute);
                }

                //set Completion Date Attribute
/*                if (routeTaskScheduledDateStr != null && !"null".equals(routeTaskScheduledDateStr) & !"".equals(routeTaskScheduledDateStr)){
                    //double clientTZOffset = (new Double((String)session.getValue("timeZone"))).doubleValue();
                    //routeTaskScheduledDateStr       = eMatrixDateFormat.getFormattedInputDate(context,routeTaskScheduledDateStr,clientTZOffset,request.getLocale());
                    routeTaskScheduledDateAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_SCHEDULED_COMPLETION_DATE) ,routeTaskScheduledDateStr.trim());
                    attrList.addElement(routeTaskScheduledDateAttribute);
                }*/

                //set AllowDelegation Attribute
                if (routeAllowDelegationStr != null){
                  routeAllowDelegationAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ALLOW_DELEGATION), routeAllowDelegationStr);
                  attrList.addElement(routeAllowDelegationAttribute);
                }
                if(strTaskNeedsReview==null || "".equals(strTaskNeedsReview) || "null".equals(strTaskNeedsReview)){
                  strTaskNeedsReview="No";
                }

                //set Needs Review Attribute
                if (strTaskNeedsReview != null){
                  taskNeedsReviewAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_REVIEW_TASK), strTaskNeedsReview);
                  attrList.addElement(taskNeedsReviewAttribute);
                }

                // set AssigneeDueDate Attribute
                if(routeAssigneeDueDateOptStr != null && !"null".equals(routeAssigneeDueDateOptStr) & !"".equals(routeAssigneeDueDateOptStr)){
                  routeAssigneeDueDateOptAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE), routeAssigneeDueDateOptStr);
                  attrList.addElement(routeAssigneeDueDateOptAttribute);
                }

                // set Due Date Offset Attribute
                if(routeDueDateOffsetStr != null && !"null".equals(routeDueDateOffsetStr) & !"".equals(routeDueDateOffsetStr)){
                  routeDueDateOffsetAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_DUEDATE_OFFSET), routeDueDateOffsetStr);
                  attrList.addElement(routeDueDateOffsetAttribute);
                }

                // set Date Offset From Attribute
                if(routeDueDateOffsetFromStr != null && !"null".equals(routeDueDateOffsetFromStr) & !"".equals(routeDueDateOffsetFromStr)){
                  routeDueDateOffsetFromAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM), routeDueDateOffsetFromStr);
                  attrList.addElement(routeDueDateOffsetFromAttribute);
                }

                // set Template Task From Attribute
                if(strTemplateTaskVal != null && !"null".equals(strTemplateTaskVal) & !"".equals(strTemplateTaskVal)){
                  templateTaskAttribute = new Attribute(new AttributeType(DomainObject.ATTRIBUTE_TEMPLATE_TASK), strTemplateTaskVal);
                  attrList.addElement(templateTaskAttribute);
                }

                //Set the attributes in the Route Node relationship
                relationShipRouteNode.setAttributes(context,attrList);
                relationShipRouteNode.close(context);
              }

           }

         //COMMENTED FOR TESTING PURPOSE

        if(routeMemberList != null && routeMemberList.size() > 0){
                Iterator routeMemberListItr = routeMemberList.iterator();

                while(routeMemberListItr.hasNext())
                {
                        Map routeMemberMap = (Map)routeMemberListItr.next();
                        String personId    = (String)routeMemberMap.get(DomainObject.SELECT_ID);
                        if (personId != null && !"".equals(personId)  && !"none".equals(personId))
                        {
                                String sPersonName = "";
                                String sAccess     = "";
                                if(!"Role".equals(personId) && !"Group".equals(personId))
                                {
                                        personToAdd = DomainObject.newInstance(context ,personId);
                                        sAccess     = ((String) routeMemberMap.get("access")).trim();
                                        String strKindOfProxyGroup = "type.kindof["+ PropertyUtil.getSchemaProperty(context, "type_GroupProxy") +"]";
                                        StringList selects = new StringList(2);
                                        selects.add(DomainConstants.SELECT_NAME);
                                        selects.add(strKindOfProxyGroup);
                                        
                                        Map personDetails = personToAdd.getInfo(context,selects);
                                        sPersonName =(String) personDetails.get(DomainConstants.SELECT_NAME);
                                        String isKindOfProxyGroup = (String) personDetails.get(strKindOfProxyGroup);
										try {
              							   ContextUtil.pushContext(context); 
              							   if(!"true".equalsIgnoreCase(isKindOfProxyGroup)){
              							   String project = (DomainObject.newInstance(context, personId)).getInfo(context, DomainObject.SELECT_NAME) + "_PRJ";
              							   DomainAccess.createObjectOwnership(context, routeTemplateId, null, project, sAccess, DomainAccess.COMMENT_MULTIPLE_OWNERSHIP, true);
              							   }else {
              									 DomainAccess.createObjectOwnershipForUserGroups(context,routeTemplateId, sPersonName, sAccess, DomainAccess.COMMENT_MULTIPLE_OWNERSHIP);
              							   }
              						    } catch(Exception ex) {
              							   throw new FrameworkException(ex);
              						    } finally {
              							    ContextUtil.popContext(context);
              						    }
                                }else{
                                        sAccess     = ((String) routeMemberMap.get("access")).trim();
                                        sPersonName = (String)routeMemberMap.get("LastFirstName");
                                 accessUtil.setAccess(sPersonName,ROUTE_ACCESS_GRANTOR,accessUtil.getReadAccess());
                              }
                }
            }
          }//if for routememberlist
          
        if(accessUtil.getAccessList().size() > 0){
            String[] args = new String[]{(new BusinessObject(routeTemplateId)).getObjectId()};
            JPO.invoke(context, "emxWorkspaceConstants", args, "grantAccess", JPO.packArgs(accessUtil.getAccessList()));
    }


       // }// If objectId exists commented for testing purpose

        // Commit the transaction
        ContextUtil.commitTransaction(context);

        formBean.removeElement("hashRouteWizFirst");
        formBean.removeElement("taskMapList");
        formBean.removeElement("parallelNodeMap");
        formBean.removeElement("routeMemberMapList");
        formBean.removeElement("routeRoleMapList");

    }catch (Exception ex )    {
        System.out.println("EXCEPTION emxRouteTemplateFinalProcess.jsp :: "+ex);
        ContextUtil.abortTransaction(context);
        throw new FrameworkException(ex.getMessage());
    }


    String treePage = UINavigatorUtil.getCommonDirectory(context) + "/emxTree.jsp?objectId="+XSSUtil.encodeForURL(context, routeTemplateId)+"&mode=insert";
%>

    <script language="javascript" src="../common/scripts/emxUIConstants.js"></script>
     <script language="javascript" src="../common/scripts/emxUICore.js"></script>
    <script language="javascript">
    	var frame = openerFindFrame(getTopWindow(), "content");
    	if(frame){
    		//XSSOK
    		frame.location.href ="<%=treePage%>";
    		}
    	   else{
    		//XSSOK
    		getTopWindow().window.getWindowOpener().location.href="<%=treePage%>";
    	}
		
	    getTopWindow().closeWindow();
	</script>

