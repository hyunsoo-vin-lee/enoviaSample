/*
 ** ${CLASS:enoECMChangeOrder}
 **
 ** Copyright (c) 1993-2018 Dassault Systemes. All Rights Reserved.
 */

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;

import com.dassault_systemes.enovia.changeaction.factory.ChangeActionFactory;
import com.dassault_systemes.enovia.changeaction.interfaces.IChangeActionServices;
import com.dassault_systemes.enovia.enterprisechangemgt.common.ChangeConstants;
import com.matrixone.apps.domain.DomainConstants;
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
  public class enoECMChangeOrder_mxJPO extends enoECMChangeOrderBase_mxJPO
  {
      /**
       * Constructor.
       *
       * @param context the eMatrix <code>Context</code> object.
       * @param args holds no arguments.
       * @throws Exception if the operation fails.
       * @since ECM R215.
       */

      public enoECMChangeOrder_mxJPO (Context context, String[] args) throws Exception {
          super(context, args);
      }

	@Override
	public MapList getMyChangeOrders(Context context, String[] args) throws Exception {
		try{
			String objectId 			= PersonUtil.getPersonObjectID(context);
			
			Map programMap = (Map) JPO.unpackArgs(args);
			
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			slSelect = slSelect == null ? new StringList(DomainConstants.SELECT_ID) : slSelect;

			MapList strCOOwned 		= getOwnedCO(context, slSelect, sFilter);
            MapList sRouteCO 		= getRouteTaskAssignedCOs(context, objectId, slSelect, sFilter);
            MapList sRouteTemplateCO = getRouteTemplateAssignedCOs(context, objectId, slSelect, sFilter);

            Set hs = new HashSet();
            hs.addAll(strCOOwned);
            hs.addAll(sRouteCO);
            hs.addAll(sRouteTemplateCO);

            Iterator itr = hs.iterator();
	        MapList mlReturn = new MapList();
	        Map mReturn = null;
	        while(itr.hasNext()){
	        	mReturn = (Map)itr.next();
	            mlReturn.add(mReturn);
	        }
	        return mlReturn;
        }catch (Exception e) {
        	e.printStackTrace();
            throw e;
        }
    }
	
    public MapList getOwnedCO(Context context,StringList slSelect, String sFilter) throws Exception{
        try{
            StringList objectSelects = new StringList(6);
            objectSelects.add(SELECT_ID);
            objectSelects.addAll(slSelect);
            
            String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			sCurrentWhereExpr = sCurrentWhereExpr != null ? " && " + sCurrentWhereExpr : "";
			
            String objectWhere = "(from[Change Coordinator].to.name == \""+context.getUser()+"\" || owner == \""+ context.getUser() +"\" || attribute[Originator]==\""+context.getUser()+"\")" + sCurrentWhereExpr;
            MapList ownedCO = DomainObject.findObjects(context,
            		ChangeConstants.TYPE_CHANGE_ORDER,                                 // type filter
                    QUERY_WILDCARD,         // vault filter
                    objectWhere,                            // where clause
                    objectSelects);                         // object selects
//            return new ChangeUtil().getStringListFromMapList(ownedCO, "id");
            return ownedCO;
        }catch (Exception e) {

            throw e;
        }

    }
    
    public MapList getRouteTaskAssignedCOs(Context context, String personObjId, StringList slSelect, String sFilter) throws Exception {
    	String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
		sCurrentWhereExpr = sCurrentWhereExpr != null ? " && from." + sCurrentWhereExpr : "";
		
    	String objSelect   = "to["+RELATIONSHIP_PROJECT_TASK+"].from."+
    			"from["+RELATIONSHIP_ROUTE_TASK+"].to."+
    			"to["+RELATIONSHIP_OBJECT_ROUTE+"|from.type.kindof["+ChangeConstants.TYPE_CHANGE_ORDER+"] " + sCurrentWhereExpr + "].from.id";

        String sCO = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3",personObjId,objSelect,"|");
        MapList mlReturn = new MapList();
        if ( StringUtils.isNotEmpty(sCO) )
        {
        	String[] sCOArray = sCO.split("[|]");
        	mlReturn = DomainObject.getInfo(context, sCOArray, slSelect);
        }
        return mlReturn;
//        return FrameworkUtil.split(sCO, ChangeConstants.COMMA_SEPERATOR);
    }
    
    public MapList getRouteTemplateAssignedCOs(Context context,String personObjId, StringList slSelect, String sFilter) throws Exception {
    	String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
		sCurrentWhereExpr = sCurrentWhereExpr != null ? " && from." + sCurrentWhereExpr : "";
		
    	String objSelect   = "to["+RELATIONSHIP_ROUTE_NODE+"|from.type=='"+TYPE_ROUTE_TEMPLATE+"']."+
   			 "from.to["+RELATIONSHIP_INITIATING_ROUTE_TEMPLATE+"].from."+
   			 "to["+RELATIONSHIP_OBJECT_ROUTE+"|from.type=='"+ChangeConstants.TYPE_CHANGE_ORDER+"'" + sCurrentWhereExpr + "].from.id";

      	String sCO = MqlUtil.mqlCommand(context, "print bus $1 select $2 dump $3",personObjId,objSelect,"|");
      	MapList mlReturn = new MapList();
        if ( StringUtils.isNotEmpty(sCO) )
        {
        	String[] sCOArray = sCO.split("|");
        	mlReturn = DomainObject.getInfo(context, sCOArray, slSelect);
        }
        return mlReturn;
//    	return FrameworkUtil.split(sCO, ChangeConstants.COMMA_SEPERATOR);
    }

	@Override
	public MapList getAllChangeActions(Context context, String[] args) throws Exception {
        try{
        	Map programMap = (Map) JPO.unpackArgs(args);
        	
        	String sFilter = (String) programMap.get("filter");
        	sFilter = StringUtils.isEmpty(sFilter) ? "ALL" : sFilter;
        	StringList slSelect = (StringList) programMap.get("slSelect");
        	slSelect = slSelect == null ? new StringList(DomainConstants.SELECT_ID) : slSelect;
        	slSelect.add(DomainConstants.SELECT_CURRENT);

            IChangeActionServices iCaServices = ChangeActionFactory.CreateChangeActionFactory();
            Map<String,List<String>> userCAMap = iCaServices.getChangesForUser(context, context.getUser()); 
            
            Iterator<String> itrOut = userCAMap.keySet().iterator();
            
            String key,id;
            Set physicalIdSet = new HashSet<String>(); 
            
            while (itrOut.hasNext()) {
                key = itrOut.next();
                List listPerRole = userCAMap.get(key);

                Iterator<String> itrIn = listPerRole.iterator();

                while (itrIn.hasNext()) {
                    id = itrIn.next();
                    
                    if(!physicalIdSet.contains(id)){
                    	
                    	physicalIdSet.add(id);
                    	
//		                Map map = new HashMap();
//		                map.put("id", id);
//		                listCA.add(map);
		            }
                }
            }
            
            String[] physicalIdArray = new String[physicalIdSet.size()];
            physicalIdArray = (String[]) physicalIdSet.toArray(physicalIdArray);
	        
            MapList mlTemp = DomainObject.getInfo(context, physicalIdArray, slSelect);
        	slSelect.remove(DomainConstants.SELECT_CURRENT);
            Map mTemp = null;
            String sCurrent = null;
            MapList mlReturn = new MapList();
            StringList slValidState = getChangeActionStateList(sFilter);            
            for (int k = 0; k < mlTemp.size(); k++)
            {
            	mTemp = (Map) mlTemp.get(k);
            	sCurrent = (String) mTemp.get(DomainConstants.SELECT_CURRENT);
            	
            	if ( slValidState.contains(sCurrent) )
            	{
            		mlReturn.add(mTemp);
            	}
            }
            return mlReturn;
        }catch (Exception e) {
            throw e;
        }
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
					StringList slState = getChangeOrderStateList(sFilter);
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
	
	public StringList getChangeOrderStateList(String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			if ( sFilter != null )
			{
				switch (sFilter.toUpperCase())
				{
				case "ALL" :
					slState.add("Prepare");
					slState.add("In Work");
					slState.add("In Approval");
					slState.add("Approved");
					slState.add("Propose");
					slState.add("In Review");
					slState.add("Complete");
					slState.add("Implemented");
					slState.add("Cancelled");
					break;
				case "WORKING" :
					slState.add("Prepare");
					slState.add("In Work");
					slState.add("In Approval");
					slState.add("Approved");
					slState.add("Propose");
					slState.add("In Review");
					break;
				case "COMPLETE" :
					slState.add("Complete");
					slState.add("Implemented");
					slState.add("Cancelled");
					break;
				default :
					break;
				}
				
			}
			return slState;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public StringList getChangeActionStateList(String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			if ( sFilter != null )
			{
				switch (sFilter.toUpperCase())
				{
				case "ALL" :
					slState.add("Prepare");
					slState.add("In Work");
					slState.add("In Approval");
					slState.add("Approved");
					slState.add("Complete");
					slState.add("Cancelled");
					break;
				case "WORKING" :
					slState.add("Prepare");
					slState.add("In Work");
					slState.add("In Approval");
					slState.add("Approved");
					break;
				case "COMPLETE" :
					slState.add("Complete");
					slState.add("Cancelled");
					break;
				default :
					break;
				}
				
			}
			return slState;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
}
