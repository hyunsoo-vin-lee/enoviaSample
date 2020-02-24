/*
 * emxRequirement
 *
 * Copyright (c) 1992-2018 Dassault Systemes.
 *
 * All Rights Reserved.
 * This program contains proprietary and trade secret information of
 * MatrixOne, Inc.  Copyright notice is precautionary only and does
 * not evidence any actual or intended publication of such program.
 *
 * static const char RCSID[] = $Id: /ENORequirementsManagementBase/CNext/Modules/ENORequirementsManagementBase/JPOsrc/custom/${CLASSNAME}.java 1.3.2.1.1.1 Wed Oct 29 22:20:01 2008 GMT przemek Experimental$
 *
 * formatted with JxBeauty (c) johann.langhofer@nextra.at
 */

import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import com.dassault_systemes.requirements.ReqConstants;
import com.dassault_systemes.requirements.ReqSchemaUtil;
import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;


/**
 * This JPO class has some method pertaining to Requirement type
 * @version ProductCentral 10.0.0.0 - Copyright (c) 2003, MatrixOne, Inc.
 */
public class emxRequirement_mxJPO extends emxRequirementBase_mxJPO {

    /**
     * Create a new emxRequirement object from a given id
     *
     * @param context context for this request
     * @param arg[0] the objectid
     * @return a emxRequirement
     * @exception Exception when unable to find object in the ProductCentral
     * @since ProductCentral 10.0.0.0
     * @grade 0
     */
    public emxRequirement_mxJPO (Context context, String[] args) throws Exception
    {
        super(context, args);
    }

    /**
     * Main entry point
     *
     * @param context context for this request
     * @param args holds no arguments
     * @return an integer status code (0 = success)
     * @exception Exception when problems occurred in the ProductCentral
     * @since ProductCentral 10.0.0.0
     * @grade 0
     */
    public int mxMain (Context context, String[] args) throws Exception {
        if (!context.isConnected()) {
            String language = context.getSession().getLanguage();
            String strContentLabel = EnoviaResourceBundle.getProperty(context, "emxRequirementsStringResource", context.getLocale(), "emxRequirements.Alert.FeaturesCheckFailed");
            throw  new Exception(strContentLabel);
        }
        return  0;
    }
    
    public void connect2Project(Context context, String[] args) throws Exception{
    	try {
			Map programMap = (Map) JPO.unpackArgs(args);
			//System.out.println(programMap);
			
			Map requestMap = (Map) programMap.get("requestMap");
			Map paramMap = (Map) programMap.get("paramMap");
			
			String sParentOID = (String) requestMap.get("parentOID");
			String objectId = (String) paramMap.get("newObjectId");
			if ( StringUtils.isNotEmpty(sParentOID) )
			{
				String sType = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump", sParentOID, DomainConstants.SELECT_TYPE);
				if ( "Project Space".contentEquals(sType) || "Project Concept".contentEquals(sType) )
				{
					MqlUtil.mqlCommand(context, "connect bus $1 relationship $2 to $3", sParentOID, "lgProject2Other", objectId);
				}
			}
			
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public MapList getRelatedRiskList(Context context, String[] args) throws Exception{
    	try {
			//Map programMap = (Map) JPO.unpackArgs(args);
			//String objectId = (String) programMap.get("objectId");
			
			emxRisk_mxJPO riskJPO = new emxRisk_mxJPO(context, null);
			return (MapList) riskJPO.getRisks(context, args, null);
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public MapList getRequirementList(Context context, String[] args) throws Exception{
    	try {
			Map programMap = (Map) JPO.unpackArgs(args);
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			
			String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			sCurrentWhereExpr = sCurrentWhereExpr != null ? " && " + sCurrentWhereExpr : "";
			
			String strWhereCondition = "policy != '" + ReqSchemaUtil.getRequirementVersionPolicy(context) + "'" + sCurrentWhereExpr;
			
			return getDesktopRequirements(context, strWhereCondition, context.getUser(), slSelect);
			
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public String getCurrentWhereExpr(String sFilter) throws Exception{
		try {
			String sWhereExpr = null;
			
			switch (sFilter.toUpperCase())
			{
				case "ALL" :
					// do nothing...
					break;
				case "WORKING" : case "COMPLETE" :
					StringList slState = getRequirementStateList(sFilter);
					String sStateExpr = FrameworkUtil.join(slState, ",");
					sWhereExpr = "current matchlist '" + sStateExpr + "' ','";
					break;
				default :
					break;
			}
			
			return sWhereExpr;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public StringList getRequirementStateList(String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			switch (sFilter.toUpperCase())
			{
				case "ALL" :
					slState.add("Private");
					slState.add("InWork");
					slState.add("Frozen");
					slState.add("Release");
					slState.add("Obsolete");
					slState.add("Exists");
					break;
				case "WORKING" :
					slState.add("Private");
					slState.add("InWork");
					slState.add("Frozen");
					break;
				case "COMPLETE" :
					slState.add("Release");
					slState.add("Obsolete");
					slState.add("Exists");
					break;
				default :
					break;
			}
			return slState;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}

	protected MapList getDesktopRequirements(Context context, String strWhereCondition, String strOwnerCondition, StringList slSelect)
			throws Exception {
        //String list initialized to retrieve data for the Requirements
        StringList objectSelects = new StringList(DomainConstants.SELECT_ID);
        objectSelects.add(ReqConstants.SELECT_READ_ACCESS);
        objectSelects.addAll(slSelect);
        String strType = ReqSchemaUtil.getRequirementType(context);

        // KIE1 added for IR-510602-3DEXPERIENCER2018x
        int searchLimit = 0;
  		try {
  			String property = EnoviaResourceBundle.getProperty(context,"emxRequirements.RequirementsObject.SearchLimit");
  			if (property != null && property.trim().length() > 0) {
  				searchLimit = Integer.valueOf(property.trim());
  			}
  		} catch (Exception ex) {
  		}
  		
        //The findobjects method is invoked to get the list of products
        MapList mapBusIds = findObjects(context, strType, null,null,strOwnerCondition,null,strWhereCondition,null,true, objectSelects, (short)searchLimit);
        return(mapBusIds);
    }
}



