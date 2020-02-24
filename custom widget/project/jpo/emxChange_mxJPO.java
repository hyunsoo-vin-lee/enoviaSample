/*
 *  emxChange.java
 *
 * Copyright (c) 1992-2018 Dassault Systemes.
 *
 * All Rights Reserved.
 * This program contains proprietary and trade secret information of
 * MatrixOne, Inc.  Copyright notice is precautionary only and does
 * not evidence any actual or intended publication of such program.
 *
 */

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

import java.util.Map;

import com.matrixone.apps.domain.DomainConstants;
import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.i18nNow;

/**
 * The <code>emxChange</code> JPO class is Wrapper JPO for emxChangeBase JPO which holds methods
 * for executing JPO operations related to objects of the type Change.
 * @author  Cambridge
 * @version Engineering Central - X3  - Copyright (c) 2007, MatrixOne, Inc.
 */
public class emxChange_mxJPO extends emxChangeBase_mxJPO {
    /**
     * Create a new Change object from a given id
     *
     * @param context context for this request
     * @param args    holds no arguments
     * @throws        Exception when unable to find object id in the AEF
     * @since         EngineeringCentral X3
     */

    public emxChange_mxJPO (Context context, String[] args)
        throws Exception {
      super(context, args);
    }


    /**
     * Main entry point
     *
     * @param context context for this request
     * @param args    holds no arguments
     * @return        an integer status code (0 = success)
     * @throws        Exception when problems occurred in the AEF
     * @since         EngineeringCentral X3
     */
    public int mxMain(Context context, String[] args)
        throws Exception {
        if (!context.isConnected()) {
            i18nNow i18nnow    = new i18nNow();
            String strLanguage = context.getSession().getLanguage();

            String strContentLabel = EnoviaResourceBundle.getProperty(context, "emxComponentsStringResource", context.getLocale(), "emxComponents.Error.UnsupportedClient");
            
            throw new Exception(strContentLabel);
       }
       return 0;
    }
    
    public MapList getRouteTasksAssignedPending(Context context, String[] args) throws Exception{
    	try {
    		Map programMap          = (Map) JPO.unpackArgs(args);
            String sFilter = (String) programMap.get("filter");
            StringList slSelect            = (StringList) programMap.get("slSelect");
            
            String sCurrentWhereExpr = getCurrentWhereExpr(context, sFilter);
    		sCurrentWhereExpr = sCurrentWhereExpr != null ? " && from." + sCurrentWhereExpr : "";
    		
            StringBuilder sbWhere   = new StringBuilder();
            /*
            switch (sFilter) {
			case "ALL":
				sbWhere.append("(current != '')");
				break;
			case "WORKING":
				sbWhere.append("(current != 'Complete')");
	            sbWhere.append(" && (from[" +  DomainConstants.RELATIONSHIP_ROUTE_TASK  + "].to.attribute[Route Status] != \"Stopped\") ");
				break;
			case "COMPLETE":
				sbWhere.append("(current == 'Complete')");
	            sbWhere.append(" && (from[" +  DomainConstants.RELATIONSHIP_ROUTE_TASK  + "].to.attribute[Route Status] == \"Stopped\") ");
				break;
			default:
				sbWhere.append("(current != '')");
				break;
			}
            sbWhere.append(" && from[Route Task].to[Route].to[Object Route|from.type matchlist 'Change Order,Change Request,Change Action' ','" + sCurrentWhereExpr + "].from.id != ''");
            */
            sbWhere.append("from[Route Task].to[Route].to[Object Route|from.type matchlist 'Change Order,Change Request,Change Action' ','" + sCurrentWhereExpr + "].from.id != ''");
            
            com.matrixone.apps.common.Person pUser = com.matrixone.apps.common.Person.getPerson( context );
            return pUser.getRelatedObjects(context, DomainConstants.RELATIONSHIP_PROJECT_TASK , DomainConstants.TYPE_INBOX_TASK, slSelect, null, true, false, (short)1, sbWhere.toString(), "", 0);
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
    }
    
    public String getCurrentWhereExpr(Context context, String sFilter) throws Exception{
		try {
			String sWhereExpr = null;
			
			switch (sFilter.toUpperCase())
			{
				case "ALL" :
					// do nothing...
					break;
				case "WORKING" : case "COMPLETE" :
					StringList slState = getStateList(context, sFilter);
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
	
	public StringList getStateList(Context context, String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			enoECMChangeRequest_mxJPO reqJPO = new enoECMChangeRequest_mxJPO(context, null);
			enoECMChangeOrder_mxJPO orderJPO = new enoECMChangeOrder_mxJPO(context, null);
			slState.addAll(reqJPO.getChangeRequestStateList(sFilter));
			slState.addAll(orderJPO.getChangeOrderStateList(sFilter));
			slState.addAll(orderJPO.getChangeActionStateList(sFilter));
			return slState;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
}
