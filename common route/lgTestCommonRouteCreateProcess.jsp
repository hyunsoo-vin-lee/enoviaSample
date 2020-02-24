<%@page import="org.apache.commons.lang3.StringUtils"%>
<%@page import="com.matrixone.apps.common.Document"%>
<%@page import="com.matrixone.apps.common.InboxTask"%>
<%@page import="com.matrixone.apps.common.Route"%>
<%@include file = "../common/emxNavigatorInclude.inc"%>

<%
try {
	String sLang = request.getHeader("Accept-Language");
	String sCommonApproveDesc = i18nNow.getI18nString("emxFramework.Msg.CommonApproveDesc", "emxFrameworkStringResource", sLang);
	String sCommonNotifyDesc = i18nNow.getI18nString("emxFramework.Msg.CommonNotifyDesc", "emxFrameworkStringResource", sLang);
	String sErrorMsg = null;
	
	String objectId = emxGetParameter(request, "objectId");
	String selscopeId = objectId;
	String sMode = emxGetParameter(request, "mode");
	
	DomainObject doObj = DomainObject.newInstance(context, objectId);
	
	StringList slSelect = new StringList();
	slSelect.add("name");
	
	Map mInfo = doObj.getInfo(context, slSelect);
	
	Map paramMap = new HashMap();
	
	Hashtable routeDetails = new Hashtable();
	routeDetails.put("objectId", objectId);
	routeDetails.put("routeAutoName", "");
	routeDetails.put("visblToParent", "");
	routeDetails.put("uploadedDocIDs", new StringList());
	routeDetails.put("selscopeName", (String) mInfo.get("name"));
	routeDetails.put("selscope", "ScopeName");
	routeDetails.put("templateName", "");
	routeDetails.put("routeStart", "start");
	routeDetails.put("selscopeId", objectId);
	routeDetails.put("projectId", "");
	routeDetails.put("checkPreserveOwner", "False");
	routeDetails.put("routeBasePurpose", "Standard");
	routeDetails.put("documentID", "~" + objectId + "~");
	routeDetails.put("prevSelectedScope", "ScopeName");
	routeDetails.put("scopeId", objectId);
	routeDetails.put("prevRouteTemplateId", "");
	routeDetails.put("prevSelectedScopeId", objectId);
	
	String sRouteCompleteAction = null;
	String sRouteDescription = null;
	String sRouteName = null;
	String sRouteInstructions = null;
	
	MapList taskDetails = new MapList();
	MapList routeMemberList = new MapList();
	
	HashMap parallelNodeMap = new HashMap();
	
	if ( "PLAN_REQUEST".equals(sMode) )
	{
// 		sRouteCompleteAction = "Promote Connected Object";
		sRouteCompleteAction = "Notify Route Owner";
		sRouteDescription = sCommonApproveDesc;
		sRouteInstructions = sCommonApproveDesc;
		sRouteName = i18nNow.getI18nString("emxFramework.Text.SubmitForRequirement", "emxFrameworkStringResource", sLang);
		
		routeDetails.put("routeDescription", sRouteDescription);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		routeDetails.put(objectId, "Create");
		
		String sReviewer = doObj.getInfo(context, "attribute[lgWriteDirector]");
		
		if (StringUtils.isEmpty(sReviewer)) 
		{
			sErrorMsg = i18nNow.getI18nString("emxFramework.Alert.InputWriteDirector", "emxFrameworkStringResource", sLang);
%>
			<script type="text/javascript">
				alert("<%=sErrorMsg %>");
				top.close();
			</script>
<%			
			return;
		}
		
		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");
		
		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", sRouteName);
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sRouteInstructions);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
	}
	else if ( "REQUEST_TEST".equals(sMode) )
	{
		sRouteCompleteAction = "Promote Connected Object";
// 		sRouteCompleteAction = "Notify Route Owner";
		sRouteDescription = sCommonApproveDesc;
		sRouteInstructions = sCommonApproveDesc;
		sRouteName = i18nNow.getI18nString("emxFramework.Text.RequestForTest", "emxFrameworkStringResource", sLang);
		
		routeDetails.put("routeDescription", sRouteDescription);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		routeDetails.put(objectId, "Create");
		
		String sReviewer = doObj.getInfo(context, "attribute[lgTestDirector]");; // PL
		String sReviewer2 = doObj.getInfo(context, "attribute[lgJudgeDirector]");
		String sReviewer3 = doObj.getInfo(context, "attribute[lgConstructDirector]");
		
		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");
		String sReviewer2Id = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer2, "-", "id");
		String sReviewer3Id = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer3, "-", "id");
		
		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", i18nNow.getI18nString("emxFramework.Text.RequestForTestApproval", "emxFrameworkStringResource", sLang)); // PL 결재
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer2);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "2");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "1");
		mTaskInfo.put("Title", i18nNow.getI18nString("emxFramework.Text.AcceptTestRequest", "emxFrameworkStringResource", sLang)); // 시험의뢰 접수
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewer2Id);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer2);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer2);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "3");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "2");
		mTaskInfo.put("Title", i18nNow.getI18nString("emxFramework.Text.RequestForTestNotify", "emxFrameworkStringResource", sLang));
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewer3Id);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonNotifyDesc);
		mTaskInfo.put("name", sReviewer3);
		mTaskInfo.put("Route Action", "Notify Only");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
		
		mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewer2Id, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewer2Id, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer2);
		mRouteMember.put("id", sReviewer2Id);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
		
		mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewer3Id, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewer3Id, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer3);
		mRouteMember.put("id", sReviewer3Id);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
	}
	else if ( "COMPREHENSIVE_RESULT".equals(sMode) )
	{
		sRouteCompleteAction = "Promote Connected Object";
// 		sRouteCompleteAction = "Notify Route Owner";
		sRouteName = i18nNow.getI18nString("emxFramework.Text.ComprehensiveResultApproval", "emxFrameworkStringResource", sLang);
		
		String sScheduleId = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", objectId, "from[Subtask].to.id");
		
		routeDetails.put("documentID", "~" + objectId + "~" + sScheduleId + "~");
		routeDetails.put(sScheduleId, "Review");
		
		routeDetails.put("routeDescription", sCommonApproveDesc);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		routeDetails.put(objectId, "Review");
		
		String sReviewer = doObj.getInfo(context, "attribute[lgTestDirector]");
		
		if (StringUtils.isEmpty(sReviewer)) 
		{
			sErrorMsg = i18nNow.getI18nString("emxFramework.Alert.InputWriteDirector", "emxFrameworkStringResource", sLang);
%>
			<script type="text/javascript">
				alert("<%=sErrorMsg %>");
				top.close();
			</script>
<%			
			return;
		}
		
		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");
		
		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", sRouteName);
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
	}
	else if ( "SUBMIT_TEST".equals(sMode) ) // 제품인정시험 : 시험 의뢰
	{
		sRouteCompleteAction = "Promote Connected Object";
// 		sRouteCompleteAction = "Notify Route Owner";
		sRouteName = i18nNow.getI18nString("emxFramework.Text.SubmitForTest", "emxFrameworkStringResource", sLang);
		
		routeDetails.put("documentID", "~" + objectId + "~");
		routeDetails.put(objectId, "Create");
		
		routeDetails.put("routeDescription", sCommonApproveDesc);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		
		String sReviewer = doObj.getInfo(context, "attribute[lgTestDirector]");
		
		if (StringUtils.isEmpty(sReviewer)) 
		{
			sErrorMsg = i18nNow.getI18nString("emxFramework.Alert.InputTestDirector", "emxFrameworkStringResource", sLang);
%>
			<script type="text/javascript">
				alert("<%=sErrorMsg %>");
				top.close();
			</script>
<%			
			return;
		}
		
		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");
		
		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", sRouteName);
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
	}
	else if ( "TEST_PLAN_APPROVAL".equals(sMode) ) // 제품인정시험 : 시험계획 결재
	{
		sRouteCompleteAction = "Promote Connected Object";
// 		sRouteCompleteAction = "Notify Route Owner";
		sRouteName = i18nNow.getI18nString("TestProject.ProcessSteps.TestPlanApproval", "emxProgramCentralStringResource", sLang);
		
		routeDetails.put("documentID", "~" + objectId + "~");
		routeDetails.put(objectId, "Assign");
		
		routeDetails.put("routeDescription", sCommonApproveDesc);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		
		String sReviewer = doObj.getInfo(context, "attribute[lgTestDirector]");
		
		if (StringUtils.isEmpty(sReviewer)) 
		{
			sErrorMsg = i18nNow.getI18nString("emxFramework.Alert.InputTestDirector", "emxFrameworkStringResource", sLang);
%>
			<script type="text/javascript">
				alert("<%=sErrorMsg %>");
				top.close();
			</script>
<%			
			return;
		}
		
		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");
		
		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", sRouteName);
// 		mTaskInfo.put("templateFlag", "Title");
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "1/29/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");
		
		taskDetails.add(mTaskInfo);
		
		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");
		
		routeMemberList.add(mRouteMember);
	}
	else if ("CHANGEPROJECT_REQUEST".equals(sMode))
	{
		sRouteCompleteAction = "Promote Connected Object";
		sRouteName = i18nNow.getI18nString("emxProgramCentral.ChangeProject.RequestApproval", "emxProgramCentralStringResource", sLang);

		routeDetails.put("documentID", "~" + objectId + "~");

		routeDetails.put("routeDescription", sCommonApproveDesc);
		routeDetails.put("routeName", sRouteName);
		routeDetails.put("routeCompletionAction", sRouteCompleteAction);
		routeDetails.put("routeBasePurpose", "Approval");  // 결재 여부.
		routeDetails.put(objectId, "Request"); // routeBaseState

		String sReviewer = doObj.getInfo(context, "attribute[Approver]");

		if (StringUtils.isEmpty(sReviewer))
		{
			sErrorMsg = i18nNow.getI18nString("emxFramework.Alert.SelectApprover", "emxFrameworkStringResource", sLang);
%>
<script type="text/javascript">
	alert("<%=sErrorMsg %>");
	top.close();
</script>
<%
			return;
		}

		String sReviewerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sReviewer, "-", "id");

		Map mTaskInfo = new HashMap();
		mTaskInfo.put("PersonName", sReviewer);
		mTaskInfo.put("Due Date Offset", "");
		mTaskInfo.put("Route Sequence", "1");
		mTaskInfo.put("Assignee Set Due Date", "No");
		mTaskInfo.put("Route Node", "0");
		mTaskInfo.put("Title", sRouteName);
		mTaskInfo.put("recepient", "");
		mTaskInfo.put("PersonId", sReviewerId);
		mTaskInfo.put("Allow Delegation", "FALSE");
		mTaskInfo.put("Route Instructions", sCommonApproveDesc);
		mTaskInfo.put("name", sReviewer);
		mTaskInfo.put("Route Action", "Approve");
		mTaskInfo.put("Scheduled Completion Date", "3/31/2020 05:00:00 PM");
		mTaskInfo.put("Review Task", "No");

		taskDetails.add(mTaskInfo);

		Map mRouteMember = new HashMap();
		mRouteMember.put("OrganizationName", "Company Name");
		mRouteMember.put("projectLead", "");
		mRouteMember.put("LastFirstName", MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[Last Name]") + ", " + MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sReviewerId, "attribute[First Name]"));
		mRouteMember.put("access", "Add Remove");
		mRouteMember.put("createRoute", "Create Route");
		mRouteMember.put("name", sReviewer);
		mRouteMember.put("id", sReviewerId);
		mRouteMember.put("type", "Person");

		routeMemberList.add(mRouteMember);
	}
	else
	{
		
	}
	
	ContextUtil.startTransaction(context, true);
	
	Map map1 = Route.createRouteWithScope(context , objectId , sRouteName , sRouteDescription , false, routeDetails);
	String routeId = (String)map1.get("routeId");
	Route route = (Route)DomainObject.newInstance(context,routeId);
	route.open(context);
	sRouteName = route.getInfo(context, "name");
	MqlUtil.mqlCommand(context, "mod bus $1 $2 $3 $4 $5", routeId, "name", sRouteName + "_abc", "revision", System.currentTimeMillis() + "");
	MqlUtil.mqlCommand(context, "mod bus $1 $2 $3", routeId, "name", sRouteName);
		 
	String sAttrRouteCompletionAction      = PropertyUtil.getSchemaProperty(context, "attribute_RouteCompletionAction" );
    String relProjectRoute                 = PropertyUtil.getSchemaProperty(context, "relationship_ProjectRoute");
    String sAttrAutoStopOnRejection        = PropertyUtil.getSchemaProperty(context, "attribute_AutoStopOnRejection" );
    String sAttrPreserveTaskOwner          = PropertyUtil.getSchemaProperty(context, "attribute_PreserveTaskOwner" );
	
	AttributeList routeAttrList = new AttributeList();
	routeAttrList.addElement(new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ORIGINATOR), context.getUser()));
	routeAttrList.addElement(new Attribute(new AttributeType(sAttrRouteCompletionAction), sRouteCompleteAction));
	routeAttrList.addElement(new Attribute(new AttributeType(DomainObject.ATTRIBUTE_ROUTE_BASE_PURPOSE),"Approval"));
	routeAttrList.addElement(new Attribute(new AttributeType(sAttrAutoStopOnRejection),"Immediate"));
	routeAttrList.addElement(new Attribute(new AttributeType(sAttrPreserveTaskOwner),"False"));
		 
	if( (selscopeId != null) && (!selscopeId.equals("")) ){
	    	 if(FrameworkUtil.isObjectId(context, selscopeId)){
	    	 	DomainObject boscope = new DomainObject(selscopeId);
	         	selscopeId  =  boscope.getInfo(context, "physicalid");
	  	   }
	        routeAttrList.addElement(new Attribute(new AttributeType(DomainObject.ATTRIBUTE_RESTRICT_MEMBERS),selscopeId));
	     }
		 
	route.setAttributes(context,routeAttrList);
    route.setDescription(sRouteDescription);
    route.update(context);
		 
	if(taskDetails != null && taskDetails.size() > 0){
		route.addRouteMembers(context, taskDetails,parallelNodeMap);
    }
			
	if(routeMemberList != null && routeMemberList.size() > 0){
		route.addRouteMemberAccess(context, routeMemberList);
	        }
	
		ContextUtil.commitTransaction(context);
	
	ContextUtil.startTransaction(context, true);
	
    String attrDueDateOffset      = PropertyUtil.getSchemaProperty( context,"attribute_DueDateOffset");
    String attrDueDateOffsetFrom  = PropertyUtil.getSchemaProperty( context,"attribute_DateOffsetFrom");
    String OFFSET_FROM_ROUTE_START_DATE  = "Route Start Date";
    String OFFSET_FROM_TASK_CREATE_DATE  = "Task Create Date";
	
	String selDueDateOffset       = "attribute["+attrDueDateOffset+"]";
    String selDueDateOffsetFrom   = "attribute["+attrDueDateOffsetFrom+"]";
    String selRouteNodeRelId      = DomainObject.SELECT_RELATIONSHIP_ID;
    String selSequence            = "attribute["+DomainObject.ATTRIBUTE_ROUTE_SEQUENCE+"]";
    String sWhereExp              = "";
    String taskScheduledDateStr   = "";
    String rNodeId                = "";
    String duedateOffset          = "";
    StringList relSelects             = new StringList();
    relSelects.addElement(selDueDateOffset);
    relSelects.addElement(selDueDateOffsetFrom);
    relSelects.addElement(selRouteNodeRelId);
    relSelects.addElement(selSequence);
    
    sWhereExp = "";
    sWhereExp += "("+selDueDateOffset+ " !~~ \"\")";
    //sWhereExp += " && (" +selDueDateOffsetFrom + " ~~ \""+OFFSET_FROM_TASK_CREATE_DATE+"\")";
    //sWhereExp += " && ("+selDueDateOffset+ " !~~ \"\")";
    sWhereExp += " && (" +selDueDateOffsetFrom + " ~~ \""+OFFSET_FROM_ROUTE_START_DATE+"\")";
    sWhereExp += " || (" +selSequence + " == \"1\")";

    MapList routeFirstOrderOffsetList = Route.getFirstOrderOffsetTasks(context, route, relSelects, sWhereExp);
    // set Scheduled Due Date attribute for all delta offset ORDER 1 Route Nodes offset From Task create which is same as Route start
    Route.setDueDatesFromOffset(context, session, routeFirstOrderOffsetList);
    //Added for Bug 300225 -Start
	DomainObject domainObject=DomainObject.newInstance(context,routeId);
	 		
	Pattern typePattern = new Pattern(DomainObject.TYPE_PERSON);
	typePattern.addPattern(DomainObject.TYPE_ROUTE_TASK_USER);
	String selTaskName = "attribute["+DomainObject.ATTRIBUTE_TITLE+"]";
	StringList routeRelSelects = new StringList();
	routeRelSelects.addElement(selTaskName);
	boolean routeTitleFlag=true;
	MapList routeNodeList = domainObject.getRelatedObjects(context,
	                                                    DomainObject.RELATIONSHIP_ROUTE_NODE, //relationshipPattern
	                                                    typePattern.getPattern(), //typePattern
	                                                    null, //objectSelects
	                                                    routeRelSelects, //relationshipSelects
	                                                    false, //getTo
	                                                    true, //getFrom
	                                                    (short)1, //recurseToLevel
	                                                    null, //objectWhere
	                                                    null, //relationshipWhere
	                                                    null,
	                                                    null,
	                                                    null);
      
	Iterator routeNodeItr=routeNodeList.iterator();
	while(routeNodeItr.hasNext()) {
		Map routeNodeMap=(Map)routeNodeItr.next();
		String routeNodeTitle=(String)routeNodeMap.get(selTaskName);
		if(routeNodeTitle.equals("")){
			routeTitleFlag=false;
			break;
		}
	}
	if(routeTitleFlag==true){
		try{
			System.out.println("route before : " + route.getInfo(context, "current"));
			route.promote(context);
			System.out.println("route after : " + route.getInfo(context, "current"));
		}catch(Exception ex){
			throw ex;
		}
      		
	}else{
%>
      <script language="Javascript" >
       alert("<emxUtil:i18nScript localize="i18nId">emxComponents.RouteDetails.UnTitleTask</emxUtil:i18nScript>");
	</script>
   	<%
	} 
		  //Bug 300225-End
	route.close(context);
    ContextUtil.commitTransaction(context);

    try
    {
       ContextUtil.pushContext(context);
       InboxTask.setTaskTitle(context, routeId);
       ContextUtil.popContext(context);
    }catch(Exception ex){
       session.putValue("error.message",ex.getMessage());
    }
	
	StringList listContentIds = route.getInfoList(context,"to["+route.RELATIONSHIP_OBJECT_ROUTE+"].from.id");
	
	if(listContentIds == null){
		listContentIds = new StringList();
	}
	Iterator contentItr = listContentIds.iterator();

	Document document             = (Document)DomainObject.newInstance(context , DomainConstants.TYPE_DOCUMENT);
	
	while(contentItr.hasNext()){
		String sDocId = (String)contentItr.next();
		document.setId(sDocId);
	}
   
	ContextUtil.commitTransaction(context);
	
} catch(Exception e) {
	ContextUtil.abortTransaction(context);
	e.printStackTrace();
	throw e;
}
%>

<script type="text/javascript">
debugger;
top.findFrame(top, "detailsDisplay").location.href=top.findFrame(top, "detailsDisplay").location.href;
// top.findFrame(top, "detailsDisplay").refreshWholeTree(event,"65413.64767.45013.56909","","","","","","","null","null");
</script>