/*
 ** ${CLASS:MarketingFeature}
 **
 ** Copyright (c) 1993-2018 Dassault Systemes. All Rights Reserved.
 ** This program contains proprietary and trade secret information of
 ** Dassault Systemes.
 ** Copyright notice is precautionary only and does not evidence any actual
 ** or intended publication of such program
 */

import java.util.Map;

import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

/**
 * The <code>emxPart</code> class contains code for the "Part" business type.
 *
 * @version EC 9.5.JCI.0 - Copyright (c) 2002, MatrixOne, Inc.
 */
  public class emxPart_mxJPO extends emxPartBase_mxJPO
  {
      /**
       * Constructor.
       *
       * @param context the eMatrix <code>Context</code> object.
       * @param args holds no arguments.
       * @throws Exception if the operation fails.
       * @since EC 9.5.JCI.0.
       */

      public emxPart_mxJPO (Context context, String[] args)
          throws Exception
      {
          super(context, args);
      }
      
      public MapList getOwnedPartList(Context context, String[] args) throws Exception{
    	  try {
			Map programMap = (Map) JPO.unpackArgs(args);
			
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			
			String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			
			MapList mlReturn = DomainObject.findObjects(context, "Part", "*", "*", context.getUser(), "eService Production", sCurrentWhereExpr, false, slSelect);
			return mlReturn;
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
  					StringList slState = getPartStateList(sFilter);
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
  	
  	public StringList getPartStateList(String sFilter) throws Exception{
  		try {
  			StringList slState = new StringList();
  			switch (sFilter.toUpperCase())
  			{
  				case "ALL" :
  					slState.add("Preliminary");
  					slState.add("Review");
  					slState.add("Approved");
  					slState.add("Create");
  					slState.add("Peer Review");
  					slState.add("Release");
  					slState.add("Obsolete");
  					slState.add("Complete");
  					slState.add("Pending Obsolete");
  					break;
  				case "WORKING" :
  					slState.add("Preliminary");
  					slState.add("Review");
  					slState.add("Approved");
  					slState.add("Create");
  					slState.add("Peer Review");
  					break;
  				case "COMPLETE" :
  					slState.add("Release");
  					slState.add("Obsolete");
  					slState.add("Complete");
  					slState.add("Pending Obsolete");
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
