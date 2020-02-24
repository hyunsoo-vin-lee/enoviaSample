/*
 ** ${CLASS:enoECMChangeRequest}
 **
 ** Copyright (c) 1993-2018 Dassault Systemes. All Rights Reserved.
 */

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;

import com.dassault_systemes.enovia.enterprisechangemgt.common.ChangeConstants;
import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;
import com.matrixone.apps.domain.util.PersonUtil;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

/**
 * The <code>enoECMChangeOrder</code> class contains code for the "Change Order" business type.
 *
 * @version ECM R215  - # Copyright (c) 1992-2018 Dassault Systemes.
 */
  public class enoECMChangeRequest_mxJPO extends enoECMChangeRequestBase_mxJPO
  {
      /**
       * Constructor.
       *
       * @param context the eMatrix <code>Context</code> object.
       * @param args holds no arguments.
       * @throws Exception if the operation fails.
       * @since ECM R215.
       */

      public enoECMChangeRequest_mxJPO (Context context, String[] args) throws Exception {
          super(context, args);
      }

	@Override
	public MapList getMyChangeRequests(Context context, String[] args) throws Exception {
		try{
			Map programMap = (Map) JPO.unpackArgs(args);
			
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			
			String objectId 			= PersonUtil.getPersonObjectID(context);

			MapList strCROwned 		= getOwnedCR(context, slSelect, sFilter);
			MapList sRouteCR 		= getRouteTaskAssignedCRs(context, objectId, slSelect, sFilter);
			MapList sRouteTemplateCR = getRouteTemplateAssignedCRs(context, objectId, slSelect, sFilter);

	        Set hs = new HashSet();
	        hs.addAll(strCROwned);
	        hs.addAll(sRouteCR);
	        hs.addAll(sRouteTemplateCR);

	        Iterator itr = hs.iterator();
	        MapList mlReturn = new MapList();
	        Map mReturn = null;
	        while(itr.hasNext()){
	        	mReturn = (Map)itr.next();
	            mlReturn.add(mReturn);
	        }
	        return mlReturn;
	    }catch (Exception e) {

	        throw e;
	    }
	}
      
	public MapList getOwnedCR(Context context, StringList slSelect, String sFilter) throws Exception{
		try{
			StringList objectSelects = new StringList(6);
			objectSelects.add(SELECT_ID);
			objectSelects.addAll(slSelect);
			
			String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			sCurrentWhereExpr = sCurrentWhereExpr != null ? " && " + sCurrentWhereExpr : "";
			
			String objectWhere = "(from[Change Coordinator].to.name == \""+context.getUser()+"\" || owner == \""+ context.getUser() +"\" || attribute[Originator]==\""+context.getUser()+"\")" + sCurrentWhereExpr;
			MapList ownedCO = DomainObject.findObjects(context,
					ChangeConstants.TYPE_CHANGE_REQUEST,                                 // type filter
					QUERY_WILDCARD,         // vault filter
					objectWhere,                            // where clause
					objectSelects);                         // object selects
			//return new ChangeUtil().getStringListFromMapList(ownedCO, "id");
			return ownedCO;
		}catch (Exception e) {

			throw e;
		}
	}
	
	public MapList getRouteTaskAssignedCRs(Context context, String personObjId, StringList slSelect, String sFilter) throws Exception {
		String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
		sCurrentWhereExpr = sCurrentWhereExpr != null ? " && from." + sCurrentWhereExpr : "";
		
		String objSelect   = "to["+RELATIONSHIP_PROJECT_TASK+"].from."+
    			"from["+RELATIONSHIP_ROUTE_TASK+"].to."+
    			"to["+RELATIONSHIP_OBJECT_ROUTE+"|from.type=='"+ChangeConstants.TYPE_CHANGE_REQUEST+"'" + sCurrentWhereExpr + "].from.id";

        String sCR = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3",personObjId,objSelect,"|");
        MapList mlReturn = new MapList();
        if ( StringUtils.isNotEmpty(sCR) )
        {
        	String[] sCRArray = sCR.split("|");
        	mlReturn = DomainObject.getInfo(context, sCRArray, slSelect);
        }
        return mlReturn;
//        return FrameworkUtil.split(sCR, ChangeConstants.COMMA_SEPERATOR);
	}
	
	public MapList getRouteTemplateAssignedCRs(Context context,String personObjId, StringList slSelect, String sFilter) throws Exception {
		String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
		sCurrentWhereExpr = sCurrentWhereExpr != null ? " && from." + sCurrentWhereExpr : "";
		
		String objSelect   = "to["+RELATIONSHIP_ROUTE_NODE+"|from.type=='"+TYPE_ROUTE_TEMPLATE+"']."+
				"from.to["+RELATIONSHIP_INITIATING_ROUTE_TEMPLATE+"].from."+
				"to["+RELATIONSHIP_OBJECT_ROUTE+"|from.type=='"+ChangeConstants.TYPE_CHANGE_REQUEST+"'" + sCurrentWhereExpr + "].from.id";

		String sCR = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3",personObjId,objSelect,"|");
		MapList mlReturn = new MapList();
        if ( StringUtils.isNotEmpty(sCR) )
        {
        	String[] sCRArray = sCR.split("|");
        	mlReturn = DomainObject.getInfo(context, sCRArray, slSelect);
        }
        return mlReturn;
//		return FrameworkUtil.split(sCR, ChangeConstants.COMMA_SEPERATOR);
	}
	
	public String getCurrentWhereExpr(String sFilter) throws Exception{
		try {
			String sWhereExpr = null;
			
			if ( sFilter != null )
			{
				switch (sFilter.toUpperCase())
				{
				case "ALL" :
					// do nothing...
					break;
				case "WORKING" : case "COMPLETE" :
					StringList slState = getChangeRequestStateList(sFilter);
					String sStateExpr = FrameworkUtil.join(slState, ",");
					sWhereExpr = "current matchlist '" + sStateExpr + "' ','";
					break;
				default :
					break;
				}
				
			}
			
			return sWhereExpr;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public StringList getChangeRequestStateList(String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			switch (sFilter.toUpperCase())
			{
				case "ALL" :
					slState.add("Create");
					slState.add("Evaluate");
					slState.add("In Review");
					slState.add("In Process CO");
					slState.add("Complete");
					slState.add("Cancelled");
					break;
				case "WORKING" :
					slState.add("Create");
					slState.add("Evaluate");
					slState.add("In Review");
					slState.add("In Process CO");
					break;
				case "COMPLETE" :
					slState.add("Complete");
					slState.add("Cancelled");
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
}
