define("UWA/Utils/Client",["UWA/Core","UWA/Utils"],function(h,e){var g,c=h.getGlobal(),a=Boolean(c.window),b=Boolean(a&&window.document),f=Boolean(a&&window.navigator),d=(function(){var i=["","moz","Moz","MOZ","webkit","Webkit","WebKit","WEBKIT","ms","Ms","MS","o","O"];return function(n,r,t){var k,p,s,o,m,j,q=r.indexOf("{}");if(q>=0){p=r.slice(0,q);s=r.slice(q+2)}else{p="";s=r}k=s.charAt(0).toUpperCase()+s.slice(1);for(o=0,m=i.length;o<m;o++){j=p+i[o]+s;if(j in n){break}j=p+i[o]+k;if(j in n){break}}if(o<m){return t?j:n[j]}}}());g={Engine:{name:"unknown",version:0},Platform:{name:"unknown"},Features:{window:a,document:b,navigator:f,xpath:b&&Boolean(document.evaluate),json:a&&Boolean(window.JSON),orientation:a&&Boolean(window.orientation),querySelector:b&&Boolean(document.querySelector),fullscreen:Boolean(d(document,"exitFullscreen")||d(document,"cancelFullScreen")),inputPlaceholder:document.createElement("input").placeholder!==undefined,cors:a&&("withCredentials" in new window.XMLHttpRequest()),touchEvents:a&&Boolean("ontouchstart" in window||window.DocumentTouch&&document instanceof window.DocumentTouch),pointerEvents:f&&Boolean(navigator.msPointerEnable||navigator.pointerEnabled),mutationEvents:Boolean(b&&document.implementation&&document.implementation.hasFeature("MutationEvents","2.0"))||(a&&window.MutationEvent),eventCapture:a&&Boolean(window.addEventListener),flexboxCSS:b&&Boolean(d(document.createElement("div").style,"flexBasis",true)),filterCSS:b&&!(document.documentElement&&document.documentElement.style.filter),opacityCSS:b&&!(document.documentElement&&document.documentElement.style.opacity),transitionsCSS:b&&Boolean(d(document.createElement("div").style,"transition",true)),stickyCSS:b&&(function(){var i=document.createElement("div").style;i.position="-webkit-sticky";i.position="sticky";return Boolean(i.position)}()),matrixCSS:(function(){var i=a&&d(window,"CSSMatrix");return Boolean(i)&&new i().m11!==undefined}()),dragAndDrop:a&&!(window.System&&window.System.Gadget)},Locale:(function(){var l=f&&((navigator.languages&&navigator.languages[0])||navigator.language||navigator.userLanguage)||"en-US";var j=l.toLowerCase().split("-");var k=j[0]||"en";var i=j[1]||"us";return{lang:k,locale:i,dir:["ar","he"].indexOf(k)!==-1?"rtl":"ltr"}}()),detect:(function(){var r=/(opera|ie|firefox|chrome|version)[\s/:]([\w\d.]+)[\s/:](safari|version)[\s/:]([\w\d.]+)[\s/:](vivaldi|opr|mms|edge)[\s/:]([\w\d.]+)/,q=/(opera|ie|firefox|chrome|version)[\s/:]([\w\d.]+)?.*?(safari|version[\s/:]([\w\d.]+)|$)/,o=/(webkit)\s\/:(\w\d\.+)/,l=/(trident)\/.*rv:([\d.]+)/,t=/ip(?:ad|od|hone)/,j=/webos|wossystem/,s=/blackberry/,n=/android/,k=/\bphantomjs\b/i,p=/mac|win|linux/;function m(){return(f&&navigator.userAgent.toLowerCase())||""}function i(){var u=((f&&navigator.platform.toLowerCase())||"").split(" ")[0];var y=m();var x=new RegExp("win64","gi");var w=new RegExp("x64","gi");var v=new RegExp("wow64","gi");if(u.match(/win32/i)&&(x.test(y)||w.test(y)||v.test(y))){u="win64"}return u}return function(){g.Engine=(function(){var v,x,z,w,A,u,y=m();x=y.match(r)||y.match(q)||y.match(o)||y.match(l)||(c.process?[null,"nodeJS",c.process.version]:[null,"unknown",0]);z=x[1]==="ie"&&b&&document.documentMode;A=z||(x[1]==="opera"&&x[4]?x[4]:x[2]);u=parseInt(A,10);if(x[5]&&x[6]){w=x[5];A=x[6];u=parseInt(A,10)}else{w=(x[1]==="version")?x[3]:x[1]}if(w==="trident"){w="ie"}else{if(w==="opr"){w="opera"}else{if(w==="mms"){w="opera-neon"}}}v={name:w,version:u,fullVersion:A};v[w]=u;v[w+u]=true;v.webkit=Boolean(y.match(/webkit/));return v}());g.Platform=(function(){var v,u=i(),w=m();v={name:t.test(w)?"ios":j.test(w)?"webos":s.test(w)?"blackberry":n.test(w)?"android":k.test(w)?"phantomjs":p.test(u)||c.process?u:"other"};v[v.name]=true;v.ipad=Boolean(w.match(/ipad/));v.tablet=v.ipad||Boolean(w.match(/tablet/));v.windows=v.name.indexOf("win")===0;return v}());if(b){document.documentElement.className+=" "+g.Engine.name+" "+g.Engine.name+g.Engine.version+" "+g.Platform.name}}}()),isOnline:function(j,i){if(j!==undefined&&i){g.onLine=Boolean(j);setTimeout(function(){delete (g.onLine)},i)}else{if(g.onLine===undefined){if(g.Platform.phantomjs||!f||navigator.onLine===undefined){g.onLine=true}else{g.onLine=navigator.onLine===true}}}return g.onLine},getOrientation:(function(){var i;if(a&&window.self===window.top&&window.orientation){i=function(){var j=window.orientation;return Math.abs(j)===90?"landscape":"portrait"}}else{i=function(){var j=g.getSize();return j.width/j.height<1?"portrait":"landscape"}}return i}()),getSize:function(){var l,k,j=0,i=0;if(a&&typeof window.innerWidth==="number"){j=window.innerWidth;i=window.innerHeight}else{if(b){l=document.documentElement;k=document.body;if(l&&(l.clientWidth||l.clientHeight)){j=l.clientWidth;i=l.clientHeight}else{if(k&&(k.clientWidth||k.clientHeight)){j=k.clientWidth;i=k.clientHeight}}}}return{width:j,height:i}},getScrolls:function(){var l,k,j=0,i=0;if(a&&typeof window.pageYOffset==="number"){i=window.pageYOffset;j=window.pageXOffset}else{if(b){if(k&&(k.scrollLeft||k.scrollTop)){i=k.scrollTop;j=k.scrollLeft}else{if(l&&(l.scrollLeft||l.scrollTop)){i=l.scrollTop;j=l.scrollLeft}}}}return{y:i,x:j}},getScrollbarWidth:e.memoize(function(){var j,k,i=0;if(b){j=document.documentElement;k=document.createElement("div");k.style.cssText="width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;";j.appendChild(k);i=k.offsetWidth-k.clientWidth;j.removeChild(k)}return i}),addStar:function(i,j){if(a){if(window.sidebar){window.sidebar.addPanel(j,i,"")}else{if(window.external){window.external.AddFavorite(i,j)}else{if(window.opera&&window.print){return true}}}}},getVendorProperty:d};g.detect();return h.namespace("Utils/Client",g,h)});