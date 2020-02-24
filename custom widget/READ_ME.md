# 적용하기 전 주의 사항
1. server.xml
   1. 일부 데이터 조회 쿼리에서 []나 {}를 replace하지 않으면 에러 발생
```
<Connector URIEncoding="UTF-8" connectionTimeout="20000" port="9080" protocol="HTTP/1.1" redirectPort="8443" server="nginx/0.5.16" xpoweredBy="false" relaxedQueryChars='|[]{}' relaxedPathChars='|[]{}'/>
```