<%--  emxReloadCache.jsp

   Copyright (c) 1992-2013 Dassault Systemes.
   All Rights Reserved.
   This program contains proprietary and trade secret information of MatrixOne,Inc.
   Copyright notice is precautionary only
   and does not evidence any actual or intended publication of such program

   static const char RCSID[] = $Id: emxReloadCache.jsp.rca 1.23 Wed Oct 22 15:49:03 2008 przemek Experimental przemek $
--%>

<html>

<%@include file = "emxNavigatorInclude.inc"%>
<%@include file = "emxNavigatorTopErrorInclude.inc"%>

<head> 
</head>
<%


try
{                                                              
	

    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.FORMS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.MENUS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.RMB_MENUS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.COMMANDS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.INQUIRIES);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.FORMS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.TABLES);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.PORTALS);
    com.matrixone.apps.cache.CacheManager.getInstance().clearTenant(
            context,
            com.matrixone.apps.cache.CacheManager._entityNames.CHANNELS);
    
} catch (Exception ex) {
%>

<script>

alert("Error");
</script>
<%   
} 
 
%>

<script>

alert("UI Cache has been reloaded");
</script>
<body>
<%@include file = "emxNavigatorBottomErrorInclude.inc"%>
</body>
</html>

