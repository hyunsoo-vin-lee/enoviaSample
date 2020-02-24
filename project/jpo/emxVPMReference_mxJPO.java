import java.util.Map;

import com.matrixone.apps.domain.DomainObject;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;

import matrix.db.Context;
import matrix.db.JPO;
import matrix.util.StringList;

public class emxVPMReference_mxJPO {

	public MapList getOwnedVPMReferenceList(Context context, String[] args) throws Exception{
		try {
			Map programMap = (Map) JPO.unpackArgs(args);
			
			String sFilter = (String) programMap.get("filter");
			StringList slSelect = (StringList) programMap.get("slSelect");
			
			String sCurrentWhereExpr = getCurrentWhereExpr(sFilter);
			
			MapList mlReturn = DomainObject.findObjects(context, "VPMReference", "*", "*", context.getUser(), "vplm", sCurrentWhereExpr, false, slSelect);
			
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
					StringList slState = getVPMReferenceStateList(sFilter);
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
	
	public StringList getVPMReferenceStateList(String sFilter) throws Exception{
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
