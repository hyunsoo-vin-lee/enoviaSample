<%@page import="java.lang.reflect.Field"%>
<%@page import="java.util.*"%>
<%@page import="java.io.*"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Enovia</title>
</head>
<body>
<%
	try{
		Class klass = ResourceBundle.getBundle("emxSystem").getClass().getSuperclass();
		Field field = klass.getDeclaredField("cacheList");
		field.setAccessible(true);
		java.util.concurrent.ConcurrentHashMap cache = (java.util.concurrent.ConcurrentHashMap)field.get(null);
		cache.clear();
	}catch(Exception e) {
	    e.printStackTrace(); 
	}
%>
	<script>
    alert("ResourceBundle cache has been successfully reset");
</script>
</body>
</html>