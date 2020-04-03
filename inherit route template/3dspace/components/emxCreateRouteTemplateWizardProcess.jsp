<%--  emxCreateRouteTemplateWizardProcess.jsp  --  Editing Route object

  Copyright (c) 1992-2018 Dassault Systemes. All Rights Reserved.
  This program contains proprietary and trade secret information of MatrixOne,Inc.
  Copyright notice is precautionary only and does not evidence any actual or intended publication of such program

  static const char RCSID[] = $Id: emxCreateRouteTemplateWizardProcess.jsp.rca 1.12 Wed Oct 22 16:18:24 2008 przemek Experimental przemek $
 --%>

<%@ include file = "../emxUICommonAppInclude.inc" %>
<%@ include file = "emxRouteInclude.inc" %>
<%@include file = "../common/enoviaCSRFTokenValidation.inc"%>
<jsp:useBean id="formBean" scope="session" class="com.matrixone.apps.common.util.FormBean"/>

<%
     String keyValue=emxGetParameter(request,"keyValue");

   if(keyValue == null){
     keyValue = formBean.newFormKey(session);
     }
     formBean.processForm(session,request,"keyValue");
     com.matrixone.apps.common.Person person = (com.matrixone.apps.common.Person)DomainObject.newInstance(context,DomainConstants.TYPE_PERSON);

        String relatedObjectId  =  (String) formBean.getElementValue("objectId");
        String parentId         =  (String) formBean.getElementValue("parentId");
        String scopeId          =  (String) formBean.getElementValue("scopeId");

        String organizationId    = emxGetParameter(request, "organizationId");

        String routePreserveTaskOwner    = emxGetParameter(request, "checkPreserveOwner");
        
		// CUSTOM START
        String routeType       =  (String) formBean.getElementValue("routeType");
		// CUSTOM END

        String templateId       =  (String) formBean.getElementValue("templateId");
        String templateName     =  (String) formBean.getElementValue("template");

        String routeId          =  (String) formBean.getElementValue("routeId");
        String routeAutoName    =  (String) formBean.getElementValue("routeAutoName");
        String routeName        =  (String) formBean.getElementValue("routeName");
        String routeDescription =  (String) formBean.getElementValue("description");

        String selectedAction    =  (String) formBean.getElementValue("selectedAction");
        String portalMode        =  (String) formBean.getElementValue("portalMode");
        String routeBasePurpose  =  (String) formBean.getElementValue("routeBasePurpose");
        String routeTemplateBasePurpose  =  (String) formBean.getElementValue("routeTemplateBasePurpose");

        String selscope          =  (String) formBean.getElementValue("selscope");
        String routeCompletionAction    =  (String) formBean.getElementValue("routeCompletionAction");

        String supplierOrgId     =  (String) formBean.getElementValue("supplierOrgId");
        String suiteKey      =  (String) formBean.getElementValue("suiteKey");

        String documentID    =  (String) formBean.getElementValue("documentID");
        String sContentId    =  (String) formBean.getElementValue("contentId");
        String chkRouteMembers  =  (String) formBean.getElementValue("chkRouteMembers");
        String restrictMembers  =(String)formBean.getElementValue("scopeId");
        String availability  =       (String)formBean.getElementValue("availability");
        String WorkspaceId  =       (String)formBean.getElementValue("WorkspaceId");
        String WorkspaceName= (String)formBean.getElementValue("WorkspaceAvailable");
        String RouteTaskEdits= (String)formBean.getElementValue("RouteTaskEdits");

        String strAutoStopOnRejection = (String)formBean.getElementValue("autoStopOnRejection");

        String sAttrRestartUponTaskRejection = PropertyUtil.getSchemaProperty(context, "attribute_RestartUponTaskRejection" );
        String sAttrRestrictMembers       = PropertyUtil.getSchemaProperty(context, "attribute_RestrictMembers" );
        String sAttrRouteBasePurpose      = PropertyUtil.getSchemaProperty(context, "attribute_RouteBasePurpose" );
        String sAttrRouteCompletionAction = PropertyUtil.getSchemaProperty(context, "attribute_RouteCompletionAction" );
        
        String attrOriginator             = PropertyUtil.getSchemaProperty(context, "attribute_Originator");
        String typeRoute                  = PropertyUtil.getSchemaProperty(context, "type_Route");
        String policyRoute                = PropertyUtil.getSchemaProperty(context, "policy_Route");
        String personStr                  = PropertyUtil.getSchemaProperty(context, "type_Person");
        String relRouteNode               = PropertyUtil.getSchemaProperty(context, "relationship_RouteNode");
        String relProjectRoute            = PropertyUtil.getSchemaProperty(context, "relationship_ProjectRoute");
        String relObjectRoute             = PropertyUtil.getSchemaProperty(context, "relationship_ObjectRoute");
        String relRouteScope              = PropertyUtil.getSchemaProperty(context, "relationship_RouteScope");

      boolean bExecute  =  false;
      String routeStart = emxGetParameter(request,"routeStart");
      String workspaceFolderId = emxGetParameter(request,"workspaceFolderId");
      String workspaceFolder = emxGetParameter(request,"workspaceFolder");
      routeAutoName = emxGetParameter(request,"routeAutoName");


      Hashtable hashRouteWizFirst  =  new Hashtable();//formBean.getElementValue("hashRouteWizFirst");
      if(routePreserveTaskOwner == null){
    	  routePreserveTaskOwner = "False";
      }
      hashRouteWizFirst.put("routePreserveTaskOwner", routePreserveTaskOwner);
	  if (strAutoStopOnRejection != null && !"".equals(strAutoStopOnRejection) && !"null".equals(strAutoStopOnRejection)) {
	      hashRouteWizFirst.put("autoStopOnRejection", strAutoStopOnRejection);
	  }

	// CUSTOM START
	hashRouteWizFirst.put("routeType",routeType);
	// CUSTOM END
	  
      if (routeName!= null && !routeName.equals("null") && !"".equals(routeName )) {
      hashRouteWizFirst.put("routeName",routeName);
      hashRouteWizFirst.put("routeAutoName","");
    }

   if(routeAutoName!= null && !routeAutoName.equals("null") && !"".equals(routeAutoName )){
      hashRouteWizFirst.put("routeAutoName",routeAutoName);
      hashRouteWizFirst.put("routeName","");
    }


      if(templateId!= null && !templateId.equals("null") && !"".equals(templateId )){
         hashRouteWizFirst.put("templateId",templateId);
      }

      if(templateName!= null && !templateName.equals("null") && !"".equals(templateName )){
         hashRouteWizFirst.put("templateName",templateName);
      }

      if(routeBasePurpose!= null && !routeBasePurpose.equals("null") && !"".equals(routeBasePurpose)){
       hashRouteWizFirst.put("routeBasePurpose",routeBasePurpose);
      }
     if(routeTemplateBasePurpose!= null && !routeTemplateBasePurpose.equals("null") && !"".equals(routeTemplateBasePurpose)){
       hashRouteWizFirst.put("routeTemplateBasePurpose",routeTemplateBasePurpose);
      }

      if(routeCompletionAction!= null && !routeCompletionAction.equals("null") && !"".equals(routeCompletionAction)){
         hashRouteWizFirst.put("routeCompletionAction",routeCompletionAction);
      }

      if(selscope!= null && !selscope.equals("null")){
       hashRouteWizFirst.put("selscope",selscope);
       if(selscope.equals("ScopeName")){
       hashRouteWizFirst.put("selscopeId",workspaceFolderId);
       hashRouteWizFirst.put("selscopeName",workspaceFolder);
     }
      }
        if(organizationId!= null && !organizationId.equals("null") ){
         hashRouteWizFirst.put("organizationId",organizationId);
      }


    if(parentId!= null && !parentId.equals("null")){
         hashRouteWizFirst.put("objectId",parentId);
      }

    if(routeStart == null || routeStart.equals("null")){
        routeStart = "";
    }
          if (availability!= null && !availability.equals("null") && !"".equals(availability )) {
                  hashRouteWizFirst.put("availability",availability);
          }
          if (WorkspaceId!= null && !WorkspaceId.equals("null") && !"".equals(WorkspaceId )) {
                  hashRouteWizFirst.put("WorkspaceId",WorkspaceId);
          }
           if (WorkspaceName!= null && !WorkspaceName.equals("null") && !"".equals(WorkspaceName )) {
                  hashRouteWizFirst.put("WorkspaceName",WorkspaceName);
          }
          if (RouteTaskEdits!= null && !RouteTaskEdits.equals("null") && !"".equals(RouteTaskEdits )) {
                  hashRouteWizFirst.put("RouteTaskEdits",RouteTaskEdits);
          }

      hashRouteWizFirst.put("scope",restrictMembers);

    hashRouteWizFirst.put("routeStart",routeStart);
    hashRouteWizFirst.put("routeDescription",routeDescription);




      String sPassedType  =  "";

      // the route summary page from workspace / workspace vault so the objectid is set for both the types.
      String sProjectId   =  relatedObjectId;

       //daks kept this condition to check whether route is created under workspace or folder

    String strProjectId = "";

        String Revision = null;
        boolean isExists = false;



        if(!"null".equals(sProjectId) && !"".equals(sProjectId) && sProjectId!=null){
       DomainObject po = DomainObject.newInstance(context,relatedObjectId);
         Revision = po.getInfo(context, DomainObject.SELECT_REVISION);

     }





    if (routeName != null && !"null".equals(routeName) && !"".equals(routeName) && (!"checked".equals(routeAutoName))){
          isExists = DomainObject.findObjects(context,"Route Template",routeName,null,null,null,null,false,null).size()>0 ? true:false;

      }

        if (isExists) {
           com.matrixone.apps.domain.util.i18nNow loc = new com.matrixone.apps.domain.util.i18nNow();
           String text = loc.GetString("emxComponentsStringResource", request.getHeader("Accept-Language"), "emxComponents.CreateFolder.AlreadyExists");
           session.putValue("error.message"," " + text);
           bExecute = true;

           hashRouteWizFirst = (Hashtable)formBean.getElementValue("hashRouteWizFirst");
           if(hashRouteWizFirst!=null){
           		hashRouteWizFirst.put("routeName","");
           		hashRouteWizFirst.put("routePreserveTaskOwner",routePreserveTaskOwner);
         		formBean.setElementValue("hashRouteWizFirst",hashRouteWizFirst);
           }
           formBean.setElementValue("routeName","");
           formBean.setElementValue("routePreserveTaskOwner",routePreserveTaskOwner);
		   formBean.setFormValues(session);
        }

  //TILL HERE


  if(bExecute == false){ //If route object doesn't exists

   if(!"null".equals(sProjectId) && !"".equals(sProjectId) && sProjectId!=null){ //NEED TO BE CHECKED.....

      //This is assigned by daks only, need to be checked
      parentId = relatedObjectId;

    // set the domain object with the passed id , id can be of Workspcae/WorkspcaVault/Document.
        DomainObject objectGeneral = DomainObject.newInstance(context,parentId);

      // get the object type name
        sPassedType = objectGeneral.getType(context);

    // get the revision and Vailu of the object passed to create route

        if(sPassedType.equals(objectGeneral.TYPE_PROJECT_VAULT)) {

        sProjectId = UserTask.getProjectId(context,relatedObjectId);

      } else if(sPassedType.equals(objectGeneral.TYPE_DOCUMENT) || sPassedType.equals(objectGeneral.TYPE_PACKAGE) || sPassedType.equals(objectGeneral.TYPE_RTS_QUOTATION) || sPassedType.equals(objectGeneral.TYPE_REQUEST_TO_SUPPLIER)) {

        // get the project id of the paased document.
        //sProjectId = objectGeneral.getInfo(context, "to[" +  objectGeneral.RELATIONSHIP_VAULTED_DOCUMENTS + "].from.to[" + objectGeneral.RELATIONSHIP_PROJECT_VAULTS + "].from.id");
        String sFolderId =  objectGeneral.getInfo(context,"to["+objectGeneral.RELATIONSHIP_VAULTED_DOCUMENTS+"].from.id");
        String meetingId =  objectGeneral.getInfo(context, "to[" + objectGeneral.RELATIONSHIP_MEETING_ATTACHMENTS + "].from.id");
        String messageId =  objectGeneral.getInfo(context, "to[" + objectGeneral.RELATIONSHIP_MESSAGE_ATTACHMENTS + "].from.id");
        DomainObject domObj = DomainObject.newInstance(context);
        if(sFolderId !=null && !"".equals(sFolderId)){
          sProjectId  = UserTask.getProjectId(context, sFolderId );
        }else if(messageId != null && !"".equals(messageId)){
           Document doc = (Document)DomainObject.newInstance(context,objectGeneral,DomainConstants.TEAM);
           sProjectId = doc.getWorkspaceId(context);
        }else if(meetingId != null && !"".equals(meetingId)){
           domObj.setId(meetingId);
           sProjectId = domObj.getInfo(context,"to[" + objectGeneral.RELATIONSHIP_MEETING_CONTEXT + "].from.to[" + objectGeneral.RELATIONSHIP_PROJECT_MEMBERS + "].from.id");
        }

           //hashRouteWizFirst.put("documentID",parentId+"~");

       }

         //session.putValue("hashRouteWizFirst",hashRouteWizFirst);

       //  it is taken from project condition kept above.

          strProjectId  = sProjectId;

          hashRouteWizFirst.put("projectId",strProjectId);

      if(objectGeneral.getType(context).equals(objectGeneral.TYPE_WORKSPACE_VAULT)) {
          strProjectId  = UserTask.getProjectId(context,sProjectId);
          objectGeneral.setId(strProjectId);
           }

     }//if objectid is not null

      // To Add route template members to route via Route Node..
      //the below condition is duplicate check added just to overcome null pointer exception
     //extra


      if((!bExecute) && (templateId != null && !"null".equals(templateId)) && (!templateId.equals(""))) {

         MapList memberMapList = new MapList();
        // formBean.setElementValue("routeMemberMapList",memberMapList);
        // formBean.setFormValues(session);

        // memberMapList = (MapList)formBean.getElementValue("routeMemberMapList");


         DomainObject routeTemplateObj   = DomainObject.newInstance(context,templateId);


        if(memberMapList == null || ( memberMapList != null && memberMapList.size()== 0)) {

          memberMapList = new MapList();
          String selOrg = "to["+routeTemplateObj.RELATIONSHIP_EMPLOYEE+"].from.name";
          StringList selectPersonStmts    = new StringList();
          selectPersonStmts.add(routeTemplateObj.SELECT_ID);
          selectPersonStmts.add(routeTemplateObj.SELECT_TYPE);
          selectPersonStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_FIRST_NAME+"]");
          selectPersonStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_LAST_NAME+"]");
          selectPersonStmts.add(selOrg);

          //relationShip stringList
          StringList sRelationStmts    = new StringList();
          sRelationStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE+"]");
          sRelationStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION+"]");
          sRelationStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_ACTION+"]");
          sRelationStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS+"]");
          sRelationStmts.add("attribute["+routeTemplateObj.ATTRIBUTE_TITLE+"]");
          sRelationStmts.add("attribute["+DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE+"]");
          sRelationStmts.add("attribute["+DomainObject.ATTRIBUTE_DUEDATE_OFFSET+"]");
          sRelationStmts.add("attribute["+DomainObject.ATTRIBUTE_DATE_OFFSET_FROM+"]");
          sRelationStmts.add("attribute["+DomainObject.ATTRIBUTE_ROUTE_TASK_USER+"]");
          String proxyGoupType = PropertyUtil.getSchemaProperty(context,"type_GroupProxy");

          Pattern relPattern = new Pattern(DomainObject.RELATIONSHIP_ROUTE_NODE);
          Pattern typePattern = new Pattern(DomainObject.TYPE_PERSON);
          typePattern.addPattern(DomainObject.TYPE_ROUTE_TASK_USER);
          typePattern.addPattern(proxyGoupType);

          MapList taskMapList = new MapList();
          MapList mapList = routeTemplateObj.getRelatedObjects(context,
                                                        relPattern.getPattern(),  //String relPattern
                                                        typePattern.getPattern(), //String typePattern
                                                         selectPersonStmts,
                                                         sRelationStmts,
                                                         false,
                                                         true,
                                                         (short)1,
                                                         "",
                                                         "",
                                                         null,
                                                         null,
                                                         null);


          if(mapList != null && mapList.size()>0) {

            Iterator mapListItr = mapList.iterator();
            int routeNodeIds = 0;

            StringList personList = new StringList();
            StringList roleList = new StringList();
            StringList groupList = new StringList();

            DomainObject personObj = DomainObject.newInstance(context);
            BusinessObject memberObject = null;
            while(mapListItr.hasNext()) {
              Map tempMap = (Map)mapListItr.next();
              String sPersonId = (String)tempMap.get(routeTemplateObj.SELECT_ID);
              String sPersonType = (String)tempMap.get(routeTemplateObj.SELECT_TYPE);
              String sFirstName = "";
              String sLastName  = "";

              if(sPersonType.equals(DomainConstants.TYPE_PERSON))
              {
                personObj.setId(sPersonId);
                personObj.open(context);

                //This condition is added by daks

                if(!strProjectId.equals("null")&& !strProjectId.equals("")){

                   memberObject = JSPUtil.getProjectMember(context,  session , strProjectId, personObj);
                   if(memberObject != null) {
                      sFirstName = (String)tempMap.get("attribute["+DomainConstants.ATTRIBUTE_FIRST_NAME+"]");
                      sLastName  = (String)tempMap.get("attribute["+DomainConstants.ATTRIBUTE_LAST_NAME+"]");

                     if(!personList.contains(sPersonId)) {
                          String sProjectLead = JSPUtil.getAttribute(context, session,memberObject,DomainObject.ATTRIBUTE_PROJECT_ACCESS);
                          String sCreateRoute = JSPUtil.getAttribute(context, session,memberObject,PropertyUtil.getSchemaProperty(context, "attribute_CreateRoute"));
                          HashMap tempHashMap = new HashMap();

                          tempHashMap.put(DomainObject.SELECT_ID,sPersonId);
                          tempHashMap.put("LastFirstName",sLastName+", "+sFirstName);
                          tempHashMap.put(DomainConstants.SELECT_NAME,personObj.getName(context));
                          tempHashMap.put(DomainObject.SELECT_TYPE,sPersonType);
                          tempHashMap.put("projectLead",sProjectLead);
                          tempHashMap.put("createRoute",sCreateRoute);
                          tempHashMap.put("OrganizationName",(String)tempMap.get(selOrg));
                          tempHashMap.put("access","");
                           memberMapList.add((Map)tempHashMap);
                      }

                     //For the 4the Step
                      HashMap taskHashMap = new HashMap();

                      taskHashMap.put("PersonId",sPersonId);
                      taskHashMap.put("PersonName",sLastName+", "+sFirstName);
                      taskHashMap.put(DomainConstants.SELECT_NAME,personObj.getName(context));

                      taskHashMap.put("templateFlag","Yes");
                      taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE+"]"));
                      taskHashMap.put(routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION+"]"));
                     taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_ACTION ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_ACTION+"]"));
                      taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS+"]"));
                      taskHashMap.put(routeTemplateObj.ATTRIBUTE_TITLE ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_TITLE+"]"));
                      taskHashMap.put(routeTemplateObj.ATTRIBUTE_SCHEDULED_COMPLETION_DATE,"");
                      taskHashMap.put(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE+"]"));
                      taskHashMap.put(DomainObject.ATTRIBUTE_DUEDATE_OFFSET,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DUEDATE_OFFSET+"]"));
                      taskHashMap.put(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DATE_OFFSET_FROM+"]"));
                      taskHashMap.put(routeTemplateObj.RELATIONSHIP_ROUTE_NODE,String.valueOf(routeNodeIds));
                      taskMapList.add((Map)taskHashMap);
                      routeNodeIds++;
                      personList.add(sPersonId);


              }

                } else { //If no Project Id exists, Means Route is created independently


                    sFirstName = (String)tempMap.get("attribute["+DomainConstants.ATTRIBUTE_FIRST_NAME+"]");
            sLastName  = (String)tempMap.get("attribute["+DomainConstants.ATTRIBUTE_LAST_NAME+"]");

            if(!personList.contains(sPersonId)) {

                HashMap tempHashMap = new HashMap();
              tempHashMap.put(DomainObject.SELECT_ID,sPersonId);
            tempHashMap.put("LastFirstName",sLastName+", "+sFirstName);
            tempHashMap.put(DomainConstants.SELECT_NAME,personObj.getName(context));
            tempHashMap.put(DomainObject.SELECT_TYPE,sPersonType);
            tempHashMap.put("OrganizationName",(String)tempMap.get(selOrg));
            tempHashMap.put("access","");
              memberMapList.add((Map)tempHashMap);
            }

             //For the 4the Step
              HashMap taskHashMap = new HashMap();
              taskHashMap.put("PersonId",sPersonId);
                taskHashMap.put("PersonName",sLastName+", "+sFirstName);
              taskHashMap.put(DomainConstants.SELECT_NAME,personObj.getName(context));

                taskHashMap.put("templateFlag","Yes");
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_ACTION ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_ACTION+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_TITLE ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_TITLE+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_SCHEDULED_COMPLETION_DATE,"");
            taskHashMap.put(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE+"]"));
            taskHashMap.put(DomainObject.ATTRIBUTE_DUEDATE_OFFSET,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DUEDATE_OFFSET+"]"));
            taskHashMap.put(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DATE_OFFSET_FROM+"]"));
            taskHashMap.put(routeTemplateObj.RELATIONSHIP_ROUTE_NODE,String.valueOf(routeNodeIds));
            taskMapList.add((Map)taskHashMap);
            routeNodeIds++;
            personList.add(sPersonId);


         }//if no project

              }  else {


                  String rTaskUser  = (String)tempMap.get("attribute["+DomainConstants.ATTRIBUTE_ROUTE_TASK_USER+"]");
                  String isRoleGroup = rTaskUser.substring(0,rTaskUser.indexOf("_"));


         if(rTaskUser != null && !"".equals(rTaskUser)){

            String sRoleName = PropertyUtil.getSchemaProperty(context,rTaskUser);

                     if(isRoleGroup.equals("role")){

              if(!roleList.contains(sRoleName)){
              HashMap tempHashMap = new HashMap();
              tempHashMap.put(DomainObject.SELECT_ID,"Role");
              tempHashMap.put("LastFirstName",sRoleName);
              tempHashMap.put(DomainConstants.SELECT_NAME , sRoleName);
              tempHashMap.put(DomainObject.SELECT_TYPE,"Role");
              //tempHashMap.put("projectLead",);
              //tempHashMap.put("createRoute",sCreateRoute);
              tempHashMap.put("OrganizationName",(String)tempMap.get(selOrg));
              tempHashMap.put("access","Read");
              memberMapList.add((Map)tempHashMap);
              roleList.add(sRoleName);
              }
             }else if(isRoleGroup.equals("group")){

              if(!groupList.contains(sRoleName)){
              HashMap tempHashMap = new HashMap();
              tempHashMap.put(DomainObject.SELECT_ID,"Role");
              tempHashMap.put("LastFirstName",sRoleName);
              tempHashMap.put(DomainConstants.SELECT_NAME , sRoleName);
              tempHashMap.put(DomainObject.SELECT_TYPE,"Role");
              //tempHashMap.put("projectLead",);
              //tempHashMap.put("createRoute",sCreateRoute);
              tempHashMap.put("OrganizationName",(String)tempMap.get(selOrg));
              tempHashMap.put("access","Read");
              memberMapList.add((Map)tempHashMap);
              groupList.add(sRoleName);
                }
           }

            HashMap taskHashMap = new HashMap();
            taskHashMap.put("PersonId","Role");
            taskHashMap.put("PersonName",sRoleName);
            taskHashMap.put(DomainConstants.SELECT_NAME,sRoleName);
            taskHashMap.put("templateFlag","Yes");
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_ACTION ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_ACTION+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_TITLE ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_TITLE+"]"));
            taskHashMap.put(routeTemplateObj.ATTRIBUTE_SCHEDULED_COMPLETION_DATE,"");
            taskHashMap.put(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE+"]"));
            taskHashMap.put(DomainObject.ATTRIBUTE_DUEDATE_OFFSET,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DUEDATE_OFFSET+"]"));
            taskHashMap.put(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DATE_OFFSET_FROM+"]"));
            taskHashMap.put(routeTemplateObj.RELATIONSHIP_ROUTE_NODE,String.valueOf(routeNodeIds));
            taskMapList.add((Map)taskHashMap);
            routeNodeIds++;
            personList.add(sPersonId);

                }else{
                        HashMap taskHashMap = new HashMap();
                        taskHashMap.put("PersonId","none");
                        taskHashMap.put("PersonName","none");
                        taskHashMap.put(DomainConstants.SELECT_NAME,"");
                        taskHashMap.put("templateFlag","Yes");
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_SEQUENCE+"]"));
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ALLOW_DELEGATION+"]"));
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_ACTION ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_ACTION+"]"));
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_ROUTE_INSTRUCTIONS+"]"));
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_TITLE ,(String)tempMap.get("attribute["+routeTemplateObj.ATTRIBUTE_TITLE+"]"));
                        taskHashMap.put(routeTemplateObj.ATTRIBUTE_SCHEDULED_COMPLETION_DATE,"");
                        taskHashMap.put(DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_ASSIGNEE_SET_DUEDATE+"]"));
                        taskHashMap.put(DomainObject.ATTRIBUTE_DUEDATE_OFFSET,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DUEDATE_OFFSET+"]"));
                        taskHashMap.put(DomainObject.ATTRIBUTE_DATE_OFFSET_FROM,(String)tempMap.get("attribute["+DomainObject.ATTRIBUTE_DATE_OFFSET_FROM+"]"));
                        taskHashMap.put(routeTemplateObj.RELATIONSHIP_ROUTE_NODE,String.valueOf(routeNodeIds));
                        taskMapList.add((Map)taskHashMap);
                        routeNodeIds++;
                        personList.add(sPersonId);
                 }
              }

                   personObj.close(context);
            }
          }


        formBean.setElementValue("routeMemberMapList",memberMapList);
        formBean.setElementValue("taskMapList",taskMapList);

        }

    }

    formBean.setElementValue("hashRouteWizFirst",hashRouteWizFirst);
    formBean.setFormValues(session);



 }//ROUTE OBJECT doesn't EXISTS

%>

<html>
<body>
<form name="newForm" target="_parent">
  <input type="hidden" name="objectId"     value="<xss:encodeForHTMLAttribute><%=relatedObjectId%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="routeId"      value="<xss:encodeForHTMLAttribute><%=routeId%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="routePreserveTaskOwner"      value="<xss:encodeForHTMLAttribute><%=routePreserveTaskOwner%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="templateId"   value="<xss:encodeForHTMLAttribute><%=templateId%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="scopeId"      value="<xss:encodeForHTMLAttribute><%=scopeId%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="templateName" value="<xss:encodeForHTMLAttribute><%=templateName%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="selectedAction" value="<xss:encodeForHTMLAttribute><%=selectedAction%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="supplierOrgId"  value="<xss:encodeForHTMLAttribute><%=supplierOrgId%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="suiteKey" value="<xss:encodeForHTMLAttribute><%=suiteKey%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="portalMode" value="<xss:encodeForHTMLAttribute><%=portalMode%></xss:encodeForHTMLAttribute>" />
  <input type="hidden" name="keyValue" value="<xss:encodeForHTMLAttribute><%=keyValue%></xss:encodeForHTMLAttribute>" />

</form>
<script language="javascript">
<%
    if(!bExecute) {

%>
      document.newForm.action = "emxCreateRouteTemplateWizardMembersDialogFS.jsp?keyValue=<%=XSSUtil.encodeForURL(context, keyValue)%>";
<%
    }  else {

%>
       document.newForm.action = "emxCreateRouteTemplateWizardDialogFS.jsp?keyValue=<%=XSSUtil.encodeForURL(context, keyValue)%>";
<%
    }
%>
  document.newForm.submit();
</script>
</body>
</html>
