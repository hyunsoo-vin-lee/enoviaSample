<%@include file = "../common/emxNavigatorInclude.inc"%>

<SCRIPT language="javascript" src="../common/scripts/emxUICore.js"></SCRIPT>
<script language="javascript" src="../common/scripts/emxUIConstants.js"></script>

<%
try{
	String sProjectId = emxGetParameter(request, "parentOID");
	String emxTableRowId = emxGetParameter(request, "emxTableRowId");
	StringList slRowId = FrameworkUtil.splitString(emxTableRowId, "|");
	String sSelectedTaskId = (String) slRowId.get(1);
	String sRowId = (String) slRowId.get(3);
	String sParentRowId = sRowId.substring(0, sRowId.lastIndexOf(","));
	String sParentId = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sSelectedTaskId, "to[Subtask].from.id");
	String sAssignee = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3", sSelectedTaskId, "to[Assigned Tasks].from.id", "|");
	String sCalendar = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3", sSelectedTaskId, "from[Calendar].to.id", "|");
	String sReferenceDoc = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3", sSelectedTaskId, "from[Reference Document].to.id", "|");
	StringList slCalendarId = FrameworkUtil.splitString(sCalendar, "|");
	String sCalendarId = "";
	if ( slCalendarId != null && slCalendarId.size() > 0 )
	{
		sCalendarId = (String) slCalendarId.get(0);
	}
	
	StringList slSelect = new StringList();
	slSelect.add(DomainConstants.SELECT_NAME);
	slSelect.add(DomainConstants.SELECT_OWNER);
	slSelect.add(DomainConstants.SELECT_DESCRIPTION);
	slSelect.add(DomainObject.getAttributeSelect("Task Requirement"));
	slSelect.add(DomainObject.getAttributeSelect("Task Constraint Date"));
	slSelect.add(DomainObject.getAttributeSelect("Task Constraint Type"));
	slSelect.add(DomainObject.getAttributeSelect("Estimated Duration Keyword"));
	slSelect.add(DomainObject.getAttributeSelect("Task Estimated Duration"));
	slSelect.add(DomainObject.getAttributeSelect("Needs Review"));
	
	DomainObject doSelectedTask = DomainObject.newInstance(context, sSelectedTaskId);
	Map mInfo = doSelectedTask.getInfo(context, slSelect);
	
	String sOwner = (String) mInfo.get(DomainConstants.SELECT_OWNER);
	String sOwnerId = MqlUtil.mqlCommand(context, "print bus $1 $2 $3 select $4 dump", "Person", sOwner, "-", DomainConstants.SELECT_ID);
	String sDurationExpr = (String) mInfo.get(DomainObject.getAttributeSelect("Task Estimated Duration"));
	StringList slDurationExpr = FrameworkUtil.splitString(sDurationExpr, " ");
	String sDuration = "1";
	String sUnitDuration = "d";
	if ( slDurationExpr != null && slDurationExpr.size() >= 2 )
	{
		sDuration = (String) slDurationExpr.get(0);
		sUnitDuration = (String) slDurationExpr.get(1);
	}
	else
	{
		sDuration = sDurationExpr;
	}
	
	Map programMap = new HashMap();
	programMap.put("objectId", sParentId);
	programMap.put("parentId", sProjectId);
	programMap.put("addTask", "addTaskBelow");
	programMap.put("InsertAboveBelow", "addTaskBelow");
//programMap.put("autoNameCheck", null);
	programMap.put("Name", (String) mInfo.get(DomainConstants.SELECT_NAME));
	programMap.put("TypeActual", "Task");
	programMap.put("Policy", "Project Task");
	programMap.put("OwnerOID", sOwnerId);
	programMap.put("Description", (String) mInfo.get(DomainConstants.SELECT_DESCRIPTION));
	programMap.put("AssigneeOID", sAssignee);
	programMap.put("TaskRequirement", (String) mInfo.get(DomainObject.getAttributeSelect("Task Requirement")));
//programMap.put("ProjectRole", null);
	programMap.put("Calendar", sCalendarId);
	programMap.put("TaskConstraintDate", (String) mInfo.get(DomainObject.getAttributeSelect("Task Constraint Date")));
	programMap.put("Task Constraint Type", (String) mInfo.get(DomainObject.getAttributeSelect("Task Constraint Type")));
	programMap.put("DurationKeywords", (String) mInfo.get(DomainObject.getAttributeSelect("Estimated Duration Keyword")));
	programMap.put("Duration", sDuration);
	programMap.put("units_Duration", sUnitDuration);
//programMap.put("DeliverableOID", null);
	programMap.put("NumberOf", "1");
	programMap.put("NeedsReview", (String) mInfo.get(DomainObject.getAttributeSelect("Needs Review")));
	
	Map mResult = JPO.invoke(context, "emxTask", null, "createNewTask", JPO.packArgs(programMap), Map.class);
	
	String toId = (String) mResult.get("id");
	
	StringList slReferenceDocId = FrameworkUtil.splitString(sReferenceDoc, "|");
	String sReferenceDocId = null;
	for (int k = 0; k < slReferenceDocId.size(); k++)
	{
		sReferenceDocId = (String) slReferenceDocId.get(k);
		MqlUtil.mqlCommand(context, "connect bus $1 relationship $2 to $3", toId, "Reference Document", sReferenceDocId);
	}
	
	StringList slNewTaskSelect = new StringList();
	slNewTaskSelect.add("to[Subtask].from.id");
	slNewTaskSelect.add("to[Subtask].id");
	
	DomainObject doNewTask = DomainObject.newInstance(context, toId);
	Map mNewTaskInfo = doNewTask.getInfo(context, slNewTaskSelect);
	String fromId = (String) mNewTaskInfo.get("to[Subtask].from.id");
	String relId = (String) mNewTaskInfo.get("to[Subtask].id");
%>
	<script>
		//parent.location.reload();
	</script>
<%
	StringBuilder sBuff = new StringBuilder();
	String xmlMessage = DomainConstants.EMPTY_STRING;
	sBuff.append("<mxRoot>");
	sBuff.append("<action><![CDATA[add]]></action>");
	
	sBuff.append("<data status=\"committed\" pasteBelowOrAbove=\"true\" >");
	sBuff.append("<item oid=\"" + toId + "\" relId=\"" + relId + "\" pid=\"" + fromId
			+ "\" pasteBelowToRow=\"" + sRowId + "\" direction=\"" + "from" + "\" />");
	sBuff.append("</data>");
	sBuff.append("</mxRoot>");
	
	System.out.println(sBuff.toString());
	
	%>
  	  <script language="javascript">
  	  var frame = "PMCWBS";
	  var schedule = "Auto";
	  var topFrame = findFrame(getTopWindow(), frame);
	  
  	  var myId = "<%=sRowId %>";
  	  var parentId = "<%=sParentRowId %>";
  	  
//   	  topFrame.document.getElementById("rmbrow-" + myId).checked = false;
//   	  topFrame.document.getElementById("rmbrow-" + myId).click();
//   	  topFrame.document.getElementById("rmbrow-" + parentId).checked = true;
//   	  topFrame.document.getElementById("rmbrow-" + parentId).click();
  	  
debugger;

topFrame.emxEditableTable.addToSelected('<%=sBuff.toString()%>');

  	
  	  //Added by DI7
//   var topFrame = findFrame(getTopWindow(),"detailsDisplay");
<%--   topFrame.emxEditableTable.addToSelected('<%=XSSUtil.encodeForJavaScript(context,sBuff.toString())%>'); --%>
  topFrame.refreshStructureWithOutSort();
       </script>
<%
} catch(Exception e) {
	e.printStackTrace();
	throw e;
}
%>