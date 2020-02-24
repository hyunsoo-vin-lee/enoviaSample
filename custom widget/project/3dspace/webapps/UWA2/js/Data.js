define("UWA/Data",["UWA/Core","UWA/Utils","UWA/Utils/Client","UWA/Ajax","UWA/Json","UWA/Internal/StringMap","UWA/Class/Events"],function(d,e,b,a,c,f,i){var h=new f();var g={proxies:(function(){var j=d.hosts,k=j.exposition+"/proxy/";return d.merge(j.proxies||{},{ajax:k+"ajax",resolve:k+"resolve",xml:k+"xml",spreadsheet:k+"spreadsheet",soap:k+"soap",feed:k+"feed",icon:k+"icon",richIcon:k+"richIcon",rss:k+"feed"})}()),useJsonpRequest:true,allowCrossOriginRequest:false,useOfflineCache:false,request:(function(){var n=/OPTIONS|GET|HEAD|POST|PUT|DELETE|TRACE|CONNECT/i,r=/json|document|blob|arraybuffer|text/,m=/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/,j=b.isOnline;function q(s){if(j()){j(false,s||5000)}}function l(t){var s=t.body;if(m.test(s)){s=e.base64Decode(s)}return s}function k(u,z){var w,y,t=";base64,",v=u.indexOf(t)+t.length,x=u.substring(v),A=window.atob(x),B=A.length,s=new Uint8Array(B);for(w=0;w<B;++w){s[w]=A.charCodeAt(w)}y=new BlobBuilder();y.append(s.buffer);return y.getBlob(z)}function o(t,s){var u={url:t,timeout:s.timeout,method:s.method,type:s.type,proxy:s.proxy,async:s.async,data:s.data,headers:s.headers};if(s.method!=="GET"||s.useMergeRequest===false){u.uuid=e.getUUID()}return d.Json.encode(u)}var p={text:function(s){if(typeof s!=="string"){s=c.encode(s)}return s},json:function(s){if(typeof s==="string"){s=c.decode(s)}if(!d.is(s,["object","array"])){throw new Error('Invalid JSON Response: "'+String(s)+'"')}return s},xml:function(s){if(typeof s==="string"){s=e.loadXml(s)}return s},document:function(s){if(typeof s==="string"){s=e.loadHtml(s)}return s},blob:function(s,t){var u=e.getOwnPropertyMatchValue(t,"Content-Type")||"text/plain";if(typeof s==="string"){if(m.test(s)){s=k(s,u)}else{s=new Blob([s],{type:u})}}return s},arraybuffer:function(s){if(typeof s==="string"){s=new ArrayBuffer(12)}return s}};return function(s,I){if(!s){throw new Error("Bad or missing url argument.")}I=I||{};var x,z,w,u,A,t,C,y,G,D,E,F=s,H=window.location,B="ajax",v={timeout:25000,method:"GET",type:"text",proxy:false,async:true,headers:{},useMergeRequest:true,useOfflineCache:g.useOfflineCache,allowCrossOriginRequest:g.allowCrossOriginRequest,useJsonpRequest:g.useJsonpRequest,onComplete:function(){},onCancel:function(){},onFailure:function(J){throw J}};if(I.requestHeaders){I.headers=I.requestHeaders;delete I.requestHeaders}if(I.postBody){I.method="POST";I.data=I.postBody;delete I.postBody}else{if(I.parameters){I.method="POST";I.data=I.parameters;delete I.parameters}}if(I.auth){I.authentication=I.auth;delete I.auth}if(I.type==="html"){I.type="document"}else{if(I.type==="feed"){I.type="json"}}I=d.merge(I,v);I.type=(!p[I.type]?v.type:I.type);I.timeout=parseInt(I.timeout,10);if(n.test(I.method)){I.method=I.method.toUpperCase()}if(I.type==="json"){if(!e.getOwnPropertyMatchName(I.headers,"Accept")){I.headers.Accept="application/json,text/javascript,*/*"}if(!e.getOwnPropertyMatchName(I.headers,"X-Request")){I.headers["X-Request"]="JSON"}}y=I.type;G=I.useOfflineCache;D=I.allowCrossOriginRequest;E=I.useJsonpRequest;F=s;if(I.proxy){s=g.proxifyUrl(s,I);E=E&&e.matchUrl(s,H)===false&&D===false}else{if(e.matchUrl(s,H)===false&&D===false){E=E&&e.matchUrl(g.proxies[B],H)===false;s=g.proxifyUrl(s,d.extend(I,{proxy:B}))}else{E=false}}g.requests=g.requests||{};A=o(s,I);z={onComplete:I.onComplete,onFailure:I.onFailure,onCancel:I.onCancel,onTimeout:I.onTimeout||I.onFailure};if(g.requests[A]){x=g.requests[A];x.addEvents(z)}else{x=g.requests[A]=new i();x.addEvents(z);t=function(J,M){var K,L=J;delete g.requests[A];K=e.attempt(function(){if(E){M=J.headers;J=l(J)}J=p[y](J,M);if(G){g.storeInCache(F,L)}return true},function(){C("onFailure",arguments);return false});if(K){x.dispatchEvent("onComplete",[J,M])}};C=function(M,L){var K,J=true;delete g.requests[A];if(G){K=g.getFromCache(F);if(d.is(K)){J=false;q();t(K)}}if(J){x.dispatchEvent(M,L)}};w={method:I.method,data:I.data,headers:I.headers,fromDataRequest:F,timeout:I.timeout,async:I.async,withCredentials:I.withCredentials,onComplete:function(J,K){t(J,K)},onFailure:function(){C("onFailure",arguments)},onCancel:function(){C("onCancel",arguments)},onTimeout:function(){C("onTimeout",arguments)},onProgress:I.onProgress};if(G&&j()===false){w.onFailure(new Error("Network is Offline"))}else{if(E){if(I.data&&I.data.length>0&&["POST","PUT"].indexOf(I.method)!==-1){s+=(s.indexOf("?")!==-1?"&":"?");if(I.method==="POST"){s+=e.toQueryString(I.data,"postData")}else{if(I.method==="PUT"){s+=e.toQueryString(I.data,"rawData")}}delete w.data;delete w.method}u=c.request(s,w)}else{if(y&&r.test(y)){w.responseType=y}x.xhr=u=a.request(s,w)}}x.url=F;x.options=I;x.cancel=u.cancel}return x}}()),proxifyUrl:function(l,k){if(!l){throw new Error("Bad or missing url argument.")}var p,o=[],m=k.proxy,n=e.toQueryString,j=g.proxies;if(m&&j[m]){p=j[m];if(l.indexOf(p)===0){return l}if(k.data&&k.method&&k.method.toUpperCase()==="GET"){l+=(l.indexOf("?")>-1?"&":"?")+n(k.data);delete k.data}if(typeof k[m]==="object"){o.push(n(k[m]));delete k[m]}if(k.type){o.push(n({type:k.type}));delete k.type}if(typeof k.authentication==="object"){o.push(n(k.authentication))}if(k.cache){o.push(n({cache:parseInt(k.cache,10)}));if(k.cache<0){o.push(Date.now())}}if(k.headers){o.push(n(k.headers,"headers"));delete k.headers}if(k.connect){o.push(n({connect:k.connect}))}if(k.service){o.push(n({service:k.service}))}if(k.wid){o.push(n({wid:k.wid}))}if(k.method){o.push(n({method:k.method}))}o.push(n({url:l}));l=p+"?"+o.join("&");if(l.length>2048){throw new Error("Proxified url is more than 2048 characters, that is the limit for most of the browsers.")}}else{throw new Error("Invalid proxy")}return l},getFeed:function(j,k){return g.request(j,{method:"GET",proxy:"feed",type:"json",onComplete:k})},getXml:function(j,k){return g.request(j,{method:"GET",type:"xml",onComplete:k})},getText:function(j,k){return g.request(j,{method:"GET",type:"text",onComplete:k})},getJson:function(j,k){return g.request(j,{method:"GET",type:"json",onComplete:k})},getCache:function(){return h},storeInCache:function(k,j){j=e.toArray(j).filter(function(l){return d.is(l)&&!l.nodeType});g.getCache().set(e.getCheckSum(k),j)},getFromCache:function(j){return g.getCache().get(e.getCheckSum(j))}};return d.namespace("Data",g,d)});