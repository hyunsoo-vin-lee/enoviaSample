//
// $Id: emxProjectSpace.java.rca 1.6 Wed Oct 22 16:21:26 2008 przemek Experimental przemek $ 
//
// emxProjectSpace.java
//
// Copyright (c) 2002-2018 Dassault Systemes.
// All Rights Reserved
// This program contains proprietary and trade secret information of
// MatrixOne, Inc.  Copyright notice is precautionary only and does
// not evidence any actual or intended publication of such program.
//
import java.util.HashMap;
import java.util.Map;
import java.util.Vector;

import org.apache.commons.lang3.StringUtils;

import com.dassault_systemes.requirements.ReqConstants;
import com.dassault_systemes.requirements.ReqSchemaUtil;
import com.matrixone.apps.common.MemberRelationship;
import com.matrixone.apps.common.util.ComponentsUtil;
import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.ContextUtil;
import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkException;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.PersonUtil;
import com.matrixone.apps.domain.util.PropertyUtil;
import com.matrixone.apps.program.ProgramCentralConstants;
import com.matrixone.apps.program.ProgramCentralUtil;
import com.matrixone.apps.program.ProjectSpace;
import com.matrixone.apps.program.Task;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.MatrixException;
import matrix.util.StringList;

/**
 * The <code>emxProjectSpace</code> class represents the Project Space JPO
 * functionality for the AEF type.
 *
 * @version AEF 10.0.SP4 - Copyright (c) 2002, MatrixOne, Inc.
 */
public class emxProjectSpace_mxJPO extends emxProjectSpaceBase_mxJPO
{

    /**
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds no arguments
     * @throws Exception if the operation fails
     * @since AEF 10.0.SP4
     * @grade 0
     */
    public emxProjectSpace_mxJPO (Context context, String[] args)
        throws Exception
    {
      super(context, args);
    }

    /**
     * Constructs a new emxProjectSpace JPO object.
     *
     * @param context the eMatrix <code>Context</code> object
     * @param String the business object id
     * @throws Exception if the operation fails
     * @since AEF 10.0.SP4
     */
    public emxProjectSpace_mxJPO (String id)
        throws Exception
    {
        // Call the super constructor
        super(id);
    }
    
    public MapList getRelatedRequirementList(Context context, String[] args) throws Exception{
    	try {
			Map programMap = (Map) JPO.unpackArgs(args);
			String objectId = (String) programMap.get("objectId");
			
			//getting specifications
	        String strType = ReqSchemaUtil.getRequirementSpecificationType(context);
	        StringList objectSelects = new StringList(SELECT_ID);
	        objectSelects.addElement(ReqConstants.SELECT_READ_ACCESS);

	        // KIE1 added for IR-510602-3DEXPERIENCER2018x
	        int searchLimit = 0;
			try {
				String property = EnoviaResourceBundle.getProperty(context,"emxRequirements.RequirementsObject.SearchLimit");
				if (property != null && property.trim().length() > 0) {
					searchLimit = Integer.valueOf(property.trim());
				}
			} catch (Exception ex) {
			}
			
			DomainObject doProjectSpace = DomainObject.newInstance(context, objectId);
			MapList mlReq = doProjectSpace.getRelatedObjects(context
					, "lgProject2Other"
					, "Requirement"
					, objectSelects
					, null
					, false
					, true
					, (short) 1
					, null
					, null
					, 0);
			
			emxRequirementSpecification_mxJPO reqJPO = new emxRequirementSpecification_mxJPO(context, null);
			return reqJPO.getSpecificationsAndGroups(context, context.getUser(), mlReq);
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public MapList getRelatedRequirementSpecList(Context context, String[] args) throws Exception{
        try {
        	Map programMap = (Map) JPO.unpackArgs(args);
        	String objectId = (String) programMap.get("objectId");
        	
			String strType = ReqSchemaUtil.getRequirementSpecificationType(context);
			StringList objectSelects = new StringList(SELECT_ID);
			objectSelects.addElement(ReqConstants.SELECT_READ_ACCESS);

			// KIE1 added for IR-510602-3DEXPERIENCER2018x
			int searchLimit = 0;
				try {
					String property = EnoviaResourceBundle.getProperty(context,"emxRequirements.RequirementsObject.SearchLimit");
					if (property != null && property.trim().length() > 0) {
						searchLimit = Integer.valueOf(property.trim());
					}
				} catch (Exception ex) {
				}
				
//        MapList mapBusIds = findObjects(context, strType, null,null,strOwnerCondition,null,null,null,true, objectSelects, (short)searchLimit);
			DomainObject doProjectSpace = DomainObject.newInstance(context, objectId);
			MapList mlReq = doProjectSpace.getRelatedObjects(context
					, "lgProject2Other"
					, "Requirement Specification"
					, objectSelects
					, null
					, false
					, true
					, (short) 1
					, null
					, null
					, 0);
			
			String[] objectIds = new String[mlReq.size()];
			for(int i = 0; i < mlReq.size(); i++){
			    objectIds[i] = (String)((Map<?, ?>)mlReq.get(i)).get(SELECT_ID);
			}

			MapList specList;
			objectSelects.addElement(SELECT_POLICY);

			ContextUtil.pushContext(context);
			try{
			    specList = DomainObject.getInfo(context, objectIds, objectSelects);
			}finally{
			    ContextUtil.popContext(context);
			}
			String sPolicy = ReqSchemaUtil.getVersionPolicy(context);
			
			for(int i = specList.size() - 1; i >= 0; i--){
			    @SuppressWarnings("unchecked")
			    Map<String, String> m = (Map<String, String>)specList.get(i);
			    Map<?, ?> accessMap = (Map<?, ?>)mlReq.get(i);
			    
			    if(sPolicy.equals(m.get(SELECT_POLICY))){
			        specList.remove(i);
			    }else{
			        m.put(ReqConstants.SELECT_READ_ACCESS, (String)accessMap.get(ReqConstants.SELECT_READ_ACCESS));
			        
			    }
			    // KIE1 Added for IR-537609-3DEXPERIENCER2018x
			    String access = (String)m.get(ReqConstants.SELECT_READ_ACCESS);
			    if(access == null || ReqConstants.DENIED.equals(access)){
			    	m.put("objReadAccess", "FALSE"); 
			    }else{
			    	m.put("objReadAccess", "TRUE");	
			    }
			}
			return specList;
		} catch (FrameworkException e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public MapList getRelatedModelList(Context context, String[] args) throws Exception{
    	emxModel_mxJPO modelJPO = new emxModel_mxJPO(context, null);
    	return modelJPO.getRelatedModelList(context, args);
    }
    
    public MapList getRelatedProjectList(Context context, String objectId, String relationship, String type, boolean getFrom, boolean getTo, String where, String relWhere) throws Exception{
    	try {
    		StringList busSelects = new StringList(2);
        	busSelects.add(ProjectSpace.SELECT_ID);
        	busSelects.add(ProjectSpace.SELECT_NAME);
        	busSelects.add(SELECT_ATTRIBUTE_TASK_ESTIMATED_END_DATE);
        	busSelects.add(ProjectSpace.SELECT_VAULT);
    		
			DomainObject doObj = DomainObject.newInstance(context, objectId);
			MapList mlReturn = doObj.getRelatedObjects(context
					, relationship
					, type
					, busSelects
					, null
					, getFrom
					, getTo
					, (short)1
					, where
					, relWhere
					, 0);
			
			return mlReturn;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }

	@Override
	protected MapList getProjectList(Context context, String[] args, String Mode) throws MatrixException {
    	// Check license while listing Project Concepts, Project Space, if license check fails here
    	// the projects will not be listed. This is mainly done to avoid Project Concepts from being listed
    	// but as this is the common method, the project space objects will also not be listed.
    	//
    	ComponentsUtil.checkLicenseReserved(context,ProgramCentralConstants.PGE_LICENSE_ARRAY);

    	Map programMap = null;
    	String sNamePattern = null;
		try {
			programMap = (Map) JPO.unpackArgs(args);
			sNamePattern = (String) programMap.get("namePattern");
			sNamePattern = StringUtils.isEmpty(sNamePattern) ? "*" : sNamePattern;
		} catch (Exception e) {
			e.printStackTrace();
		}

    	MapList projectList = new MapList();
    	StringList busSelects = new StringList(2);
    	busSelects.add(ProjectSpace.SELECT_ID);
    	busSelects.add(ProjectSpace.SELECT_NAME);
    	busSelects.add(SELECT_ATTRIBUTE_TASK_ESTIMATED_END_DATE);
    	busSelects.add(ProjectSpace.SELECT_VAULT);

    	String busWhere = "";
    	try{
    		if("AssignedActive".equalsIgnoreCase(Mode)){
    			projectList = getActiveProjects(context, args);
    		}else{
    			if (ProgramCentralUtil.isNullString(busWhere)) {
                	busWhere +=" type!=" + ProgramCentralConstants.TYPE_EXPERIMENT+ " && type!='" + ProgramCentralConstants.TYPE_PROJECT_BASELINE+"'"; 
                } else {
                	busWhere +=" && type!=" + ProgramCentralConstants.TYPE_EXPERIMENT+ " && type!='" + ProgramCentralConstants.TYPE_PROJECT_BASELINE+"'";
                }
				if("CredentialedActive".equalsIgnoreCase(Mode)){
	    				String notProjectMemberBusWhere = "!from[Member].to.name smatchlist '"+context.getUser()+"' ','";
					busWhere += ProgramCentralUtil.isNullString(busWhere) ? EMPTY_STRING : " && ";
					busWhere += "current!=" + STATE_PROJECT_COMPLETE + " && current!=" + STATE_PROJECT_ARCHIVE +
							" && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD + 
							" && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL ;
	    				busWhere += "&& "+notProjectMemberBusWhere;
	    				
				}else if("Inactive".equalsIgnoreCase(Mode)){
					busWhere += ProgramCentralUtil.isNullString(busWhere) ? EMPTY_STRING : " && ";
					busWhere += "current==" + STATE_PROJECT_COMPLETE + " || current==" + STATE_PROJECT_ARCHIVE+" || current==" + STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL+" || current==" + STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD;    		   
				}
	    			
	    			
				String typePattern = TYPE_PROJECT_SPACE + "," + TYPE_PROJECT_CONCEPT;
//    			projectList = DomainObject.findObjects(context, typePattern, "*", "*", "*",DomainConstants.QUERY_WILDCARD, busWhere, true, busSelects);
    			projectList = DomainObject.findObjects(context, typePattern, sNamePattern, "*", "*",DomainConstants.QUERY_WILDCARD, busWhere, true, busSelects);
			} 

		return projectList;		

    	}
    	catch (Exception ex) {
    		throw new MatrixException(ex);
    	}
    }

	@Override
	public MapList getProjectSummary(Context context, String[] args, String selectState) throws Exception {
        // Check license while listing Project Concepts, Project Space, if license check fails here
        // the projects will not be listed. This is mainly done to avoid Project Concepts from being listed
        // but as this is the common method, the project space objects will also not be listed.
        //
        ComponentsUtil.checkLicenseReserved(context,ProgramCentralConstants.PGE_LICENSE_ARRAY);


        MapList projectList = null;
        com.matrixone.apps.program.Program program =
            (com.matrixone.apps.program.Program) DomainObject.newInstance(context,
                DomainConstants.TYPE_PROGRAM, DomainConstants.PROGRAM);
        com.matrixone.apps.common.Person person =
            com.matrixone.apps.common.Person.getPerson(context);
        com.matrixone.apps.program.ProjectSpace project =
            (com.matrixone.apps.program.ProjectSpace) DomainObject.newInstance(context,
                DomainConstants.TYPE_PROJECT_SPACE, DomainConstants.PROGRAM);
        try
        {
            HashMap programMap = (HashMap) JPO.unpackArgs(args);
            String objectId = (String) programMap.get("objectId");
			String sNamePattern = (String) programMap.get("namePattern");

            // Retrieve the person's project's info
            String busWhere = ProgramCentralConstants.EMPTY_STRING;
            String busId = ProgramCentralConstants.EMPTY_STRING;
            String relWhere = ProgramCentralConstants.EMPTY_STRING;

            String vaultPattern = "";

            String vaultOption = PersonUtil.getSearchDefaultSelection(context);

            vaultPattern = PersonUtil.getSearchVaults(context, false ,vaultOption);

            //use the matchlist keyword to filter by vaults, need this if option is not "All Vaults"
            if (!vaultOption.equals(PersonUtil.SEARCH_ALL_VAULTS) && vaultPattern.length() > 0)
            {
            busWhere = "vault matchlist '" + vaultPattern + "' ','";
            }

            if ((STATE_PROJECT_COMPLETE).equals(selectState))
            {
                if ((busWhere == null) || "".equals(busWhere))
                {
                    busWhere = "current=='" + STATE_PROJECT_COMPLETE + "'";
                }
                else
                {
                    busWhere += (" && current=='" + STATE_PROJECT_COMPLETE + "'");
                }
            }
            else if ((STATE_PROJECT_ARCHIVE).equals(selectState))
            {
                // Active Projects - not in the complete state or in the archive state
                if ((busWhere == null) || "".equals(busWhere))
                {
                    busWhere =
                        "current!=" + STATE_PROJECT_COMPLETE + " && current!=" + STATE_PROJECT_ARCHIVE +
                        " && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD + " && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL;
                }
                else
                {
                    busWhere += (" && current!=" + STATE_PROJECT_COMPLETE + " && current!=" + STATE_PROJECT_ARCHIVE
                             + " && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD + " && current!=" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL);
                }
            }
          //Added:nr2:11-05-2010:PRG:R210:For Project Hold Cancel Highlight
            else if((ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD).equals(selectState)){
                busWhere =
                    "current==" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD;
            }
            else if((ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL).equals(selectState)){
                busWhere =
                    "current==" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL;
                relWhere = MemberRelationship.SELECT_PROJECT_ACCESS+" == '"+ProgramCentralConstants.PROJECT_ROLE_PROJECT_OWNER+"'";
                relWhere += " ||"+MemberRelationship.SELECT_PROJECT_ACCESS+" == '"+ProgramCentralConstants.PROJECT_ACCESS_PROJECT_LEAD+"'";
              }
          //End:nr2:11-05-2010:PRG:R210:For Project Hold Cancel Highlight
            else
            {
                //do nothing
                //Added:nr2:PRG:R210:29-05-2010:For Project Hold and Cancel Highlight
                if ((busWhere == null) || "".equals(busWhere))
                {
                    //busWhere = "current!='" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL + "'";
                    //busWhere += " && current !='" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD + "'";
                }
                else
                {
                    busWhere += " current!='" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_CANCEL + "'";
                    busWhere += " && current !='" + ProgramCentralConstants.STATE_PROJECT_SPACE_HOLD_CANCEL_HOLD + "'";
                }
                //End:nr2:PRG:R210:29-05-2010:For Project Hold and Cancel Highlight

            }
            if (ProgramCentralUtil.isNullString(busWhere)) {
            	busWhere +=" type!=" + ProgramCentralConstants.TYPE_EXPERIMENT; 
            } else {
            busWhere +=" && type!=" + ProgramCentralConstants.TYPE_EXPERIMENT;
            }
            
            //CUSTOM START
            if ( StringUtils.isNotEmpty(sNamePattern) && !"*".contains(sNamePattern.trim()) )
            {
            	if (StringUtils.isNotEmpty(busWhere)) {
                	busWhere +=" && "; 
                }
            	busWhere +="name ~= '" + sNamePattern.trim() + "'";
            }
            //CUSTOM END

            StringList busSelects = new StringList(2);
            busSelects.add(project.SELECT_ID);
            busSelects.add(SELECT_ATTRIBUTE_TASK_ESTIMATED_END_DATE);
            busSelects.add(project.SELECT_VAULT);
            busSelects.add(SELECT_NAME);
            if ((objectId != null) && !"".equals(objectId))
            {
                // if busId is passed then page is called from program page
                program.setId(objectId);
                projectList =
                    program.getProjects(context, busSelects, busWhere);
            }
            //ends if
            else
            {
                //busSelects.add(project.SELECT_PROGRAM_NAME);
                projectList =
                    project.getUserProjects(context, person, busSelects, null,
                        busWhere, relWhere);
            }
            //ends else
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            return projectList;
        }
    }
	
	public void connectProjectConcept(Context context, String[] parentProjects, String parentProjectId, String requiredTaskId, String addType, String[] templateIds) throws Exception{
		try {
			String subtaskRelationship = PropertyUtil.getSchemaProperty(context, DomainObject.SYMBOLIC_relationship_Subtask);
			StringList alreadyExistingProjectNames=new StringList();
			
			boolean bAdded = false;
			
	        Task subProjectTask = new Task();
	        for(int i=0;i<parentProjects.length;i++)
	        {
	        	StringList busSelects = new StringList(1);
	        	busSelects.add(DomainObject.SELECT_ID);
	        	busSelects.add(DomainObject.SELECT_NAME);
	        	StringList relSelects = new StringList(1);
	        	//to store the object ids which are already connected
	        	Map alreadySubtaskProjects = new HashMap();

	        	MapList mapSkills = new DomainObject(parentProjects[i]).getRelatedObjects(context, subtaskRelationship, ProgramCentralConstants.TYPE_PROJECT_MANAGEMENT, busSelects, relSelects, false, true, (short)0, "", "");

	        	if ( mapSkills!=null && mapSkills.size() > 0 )
	        	{
	        		alreadySubtaskProjects = new HashMap(mapSkills.size());
	        		for ( int j = 0; j<mapSkills.size();j++ )
	        		{
	        			alreadySubtaskProjects.put((String)(((Map)mapSkills.get(j)).get("id")),(String)(((Map)mapSkills.get(j)).get("name")));
	        		}
	        	}
	        	if(!alreadySubtaskProjects.containsKey(parentProjectId))
	        	{
	        		DomainObject parentObjectId = DomainObject.newInstance(context,parentProjectId);
	        		String parentProjectName=parentObjectId.getName(context);
	        		alreadySubtaskProjects.put(parentProjectId,parentProjectName);
	        	}
	        	String childId = requiredTaskId.substring(0,requiredTaskId.indexOf("|"));
	        	String siblingId = requiredTaskId.substring(requiredTaskId.indexOf("|")+1);
	        	String atTaskId = "";
	        	if ("Child".equals(addType)) {
	        		atTaskId = requiredTaskId.substring(0,requiredTaskId.indexOf("|"));
	        	}
	        	else {
	        		atTaskId = requiredTaskId.substring(requiredTaskId.indexOf("|")+1);
	        	}
	        	Vector vecChildIds = new Vector(templateIds.length);

	        	for (int j=0;j<templateIds.length;j++) {
	        		if(!alreadySubtaskProjects.containsKey(templateIds[j])) {
	        			vecChildIds.add((String)templateIds[j]);
	        		}
	        		else
	        		{
	        			alreadyExistingProjectNames.add((String)alreadySubtaskProjects.get(templateIds[j]));
	                        
	        		}
	        	}
                String []childIds = new String[vecChildIds.size()];
                for(int c=0;c<childIds.length;c++) {
                    childIds [c] = (String) vecChildIds.get(c);
                }
                //com.matrixone.apps.common.Task task1 = new com.matrixone.apps.common.Task();

                if ("Child".equals(addType)) {
                    atTaskId = requiredTaskId.substring(0,requiredTaskId.indexOf("|"));
                    subProjectTask.setId(atTaskId); //Di7 below
                }
                else {
                    atTaskId = requiredTaskId.substring(requiredTaskId.indexOf("|")+1);
                    subProjectTask.setId(atTaskId); //di7 above
                    //Modified for Bug # 341152 on 9/13/2007 - Begin
                    atTaskId = requiredTaskId.substring(0,requiredTaskId.indexOf("|"));
                    //Modified for Bug # 341152 on 9/13/2007 - End
                }
	                    
                //Added code for whatIf Add existing project below or above functionality
                String strProjectType = DomainObject.EMPTY_STRING;
                DomainObject taskObject = DomainObject.newInstance(context,atTaskId);
                if(!taskObject.getType(context).equalsIgnoreCase(ProgramCentralConstants.TYPE_EXPERIMENT)){
                	strProjectType = taskObject.getInfo(context,ProgramCentralConstants.SELECT_PROJECT_TYPE);
                }
                if((strProjectType != null && ProgramCentralConstants.TYPE_EXPERIMENT.equalsIgnoreCase(strProjectType)) || 
                		taskObject.getType(context).equalsIgnoreCase(ProgramCentralConstants.TYPE_EXPERIMENT)){
                	String strAddProject = subProjectTask.getObjectId(context);
                	com.matrixone.apps.program.Experiment experiment =  new com.matrixone.apps.program.Experiment(strAddProject);
                	experiment.addExistingProjectBelowOrAbove(context, childIds, atTaskId);
                }else{
                    
                    java.util.List<String> subProjectIds = java.util.Arrays.asList(childIds);
                    
                    if("Child".equals(addType)) {
                    	subProjectTask.addExistingProject(context, subProjectIds, null, true); 
                    }
                    else{
                    	subProjectTask.addExistingProject(context, subProjectIds, atTaskId, true);
                    }
                  
                }//End
                
                boolean bFlag = false;
                do {
                	bFlag = Task.moveTasks(context, parentProjects[i], templateIds[0], Task.MOVE_UP);
                } while ( bFlag );
                
	        }
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
}
