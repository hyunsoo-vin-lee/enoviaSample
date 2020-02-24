/*
**  emxDocument
**
**  Copyright (c) 1992-2018 Dassault Systemes.
**  All Rights Reserved.
**  This program contains proprietary and trade secret information of MatrixOne,
**  Inc. Copyright notice is precautionary only
**  and does not evidence any actual or intended publication of such program
**
*/

import java.util.Map;

import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

/**
 * The <code>emxDocument</code> class contains methods for document.
 *
 * @version AEF 10.0.1.0 - Copyright (c) 2003, MatrixOne, Inc.
 */

public class emxDocument_mxJPO extends emxDocumentBase_mxJPO
{
    /**
     * Constructor.
     *
     * @param context the eMatrix <code>Context</code> object
     * @param args holds the following input arguments:
     *     0 - String that holds the document object id.
     * @throws Exception if the operation fails
     * @since EC 10.0.0.0
     */

    public emxDocument_mxJPO (Context context, String[] args)
        throws Exception
    {
        super(context, args);
    }

    public MapList getOwnedDocumentList(Context context, String[] args) throws Exception{
    	try {
			Map programMap = (Map) JPO.unpackArgs(args);
			
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			
			String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			sCurrentWhereExpr = sCurrentWhereExpr != null ? " && " + sCurrentWhereExpr : "";
			
			String sWhere = "policy != 'Version'";
			sWhere += sCurrentWhereExpr;
			
			MapList mlReturn = DomainObject.findObjects(context, "Document", "*", "*", context.getUser(), "eService Production", sWhere, false, slSelect);
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
					StringList slState = getDocumentStateList(sFilter);
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
	
	public StringList getDocumentStateList(String sFilter) throws Exception{
		try {
			StringList slState = new StringList();
			switch (sFilter.toUpperCase())
			{
				case "ALL" :
					slState.add("PRIVATE");
					slState.add("IN_WORK");
					slState.add("FROZEN");
					slState.add("RELEASED");
					slState.add("OBSOLETE");
					break;
				case "WORKING" :
					slState.add("PRIVATE");
					slState.add("IN_WORK");
					slState.add("FROZEN");
					break;
				case "COMPLETE" :
					slState.add("RELEASED");
					slState.add("OBSOLETE");
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
