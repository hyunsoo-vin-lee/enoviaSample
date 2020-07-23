<%--

    파    일    명  : sbMyProgramFilterProcess.jsp
    내          용  : 프로그램 리스트 필터  
    작성자 / 작성일 : 신동진 / 2020.07.08

    ============================================================================
        번호 |   수  정  일    | 수 정 자     | 수 정 내 용
    ----------------------------------------------------------------------------
     #1 |            |         | 
    ============================================================================
--%>

<%@include file="../common/emxNavigatorInclude.inc"%>
<%@include file="../common/emxNavigatorTopErrorInclude.inc"%>
<%
    try {

    	String strPrgState          = emxGetParameter(request,"sbProgramProgressStatusFilterCmd");
    	String strPrgCategory          = emxGetParameter(request,"sbProgramCategoryFilterCmd");
        String strPrgOriginatedFrom = emxGetParameter(request,"sbProgramOriginatedFromDtFilterCmd");
        String strPrgOriginatedTo   = emxGetParameter(request,"sbProgramOriginatedToDtFilterCmd");
//         String strPrgOwner          = emxGetParameter(request,"sbProgramOwnerFilterCmd");
        String strPrgName   = emxGetParameter(request,"sbProgramSearchNameCmd");

        String sTableName           = emxGetParameter(request,"table");
%>
<html>
<head></head>
<body>
    
    <script language="JavaScript">
        parent.resetParameter("sbProgramProgressStatusFilterCmd",   "<xss:encodeForJavaScript><%=strPrgState%></xss:encodeForJavaScript>");
        parent.resetParameter("sbProgramCategoryFilterCmd",   "<xss:encodeForJavaScript><%=strPrgCategory%></xss:encodeForJavaScript>");
        parent.resetParameter("sbProgramOriginatedFromDtFilterCmd", "<xss:encodeForJavaScript><%=strPrgOriginatedFrom%></xss:encodeForJavaScript>");
        parent.resetParameter("sbProgramOriginatedToDtFilterCmd",   "<xss:encodeForJavaScript><%=strPrgOriginatedTo%></xss:encodeForJavaScript>");
<%--         parent.resetParameter("sbProgramOwnerFilterCmd",            "<xss:encodeForJavaScript><%=strPrgOwner%></xss:encodeForJavaScript>"); --%>
        parent.resetParameter("sbProgramSearchNameCmd",            "<xss:encodeForJavaScript><%=strPrgName%></xss:encodeForJavaScript>");

        parent.refreshSBTable("<xss:encodeForJavaScript><%=sTableName%></xss:encodeForJavaScript>","Originated","descending");
    </script>
<%
    } catch (Exception ex){
         if (ex.toString() != null && ex.toString().length() > 0){
            emxNavErrorObject.addMessage(ex.toString());
         }
         ex.printStackTrace();
    }
%>
</body>
</html>
<%@include file="../common/emxNavigatorBottomErrorInclude.inc"%>
