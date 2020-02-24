define("DS/sampleCard/tableList",[
	"UWA/Drivers/jQuery",
	"UWA/Core",
	"DS/WAFData/WAFData",
	"DS/PlatformAPI/PlatformAPI"
	],
	function( $, UWA, WAFData, PlatformAPI){
		//"use strict";
		var tableList = function(){
			console.log("New tableList");
		};
		tableList.prototype = {
			init : function(widget, options){
				console.log("init");
				window.XX = this;
				this.widget = widget;	
				this.options = options;
				this.content = options.content || {};
				this.mContainer = null;
				this.mContainerName = options.mContainer || "defaultContainer";
				this.bodyContainer = null;
				this.widgetUrl = this.onGetWidgetUrl();
				this.contentBody = widget.createElement('div',{'class':'contentBody'});
				
				this.buildSkeleton();
				
			},
			buildSkeleton : function(){
				var that = this,
				options = this.options,
				
				mContainerName = this.mContainerName,
				content = this.content,
				widget = this.widget;
				
				widget.body.empty();
				
				this.bodyContainer = widget.createElement('div',{id:"bodyContainer", 'class':'bodyContainer' }).inject(widget.body);
				
				this.bodyContainer.addContent(this.contentBody);
				this.onTableDraw();
				
			},
			onTableDraw: function(){
				var that = this,
				options = this.options,				
				contentBody = this.contentBody,
				content = this.content,
				widget = this.widget;
				
				var table = widget.createElement('div',{ styles:{ "display":"table","table-layout":"fixed","max-width":"100%","font-weight":"bold","font-size":"15px","line-height":"18px","font-family":"Arial, Helvetica, sans-serif","color":"#2a2a2a","background":"linear-gradient(to bottom, #f5f6f7 0%,#e2e4e3 100%)" } });
				var tr = widget.createElement('div',{ styles:{ "display":"table-row","height":"40px"} });
				console.log("build");
				for(var i=0;i<content.header.length;i++){
					var header = content.header[i];
					//console.log("header::"+header);
					var td = widget.createElement('div',{ text:header ,styles:{ "display":"table-cell", "border" : "solid 1px #d4d4d5","min-width":"100px","vertical-align":"middle","text-align":"center" } });
					tr.addContent(td);
				}
				
				table.addContent(tr);
				
				var data = [["BMW 18 제품개발","금형 설계","290 / 40","22 %","2019년 3월 30일","곽준범","진행 중"],
							["BMW 17 제품개발","금형 설계","280 / 70","22 %","2019년 3월 30일","곽준범","진행 중"],
							["BMW 16 제품개발","금형 설계","270 / 60","22 %","2019년 3월 30일","곽준범","진행 중"],
							["BMW 15 제품개발","금형 설계","260 / 50","22 %","2019년 3월 30일","곽준범","진행 중"]];
				
				for(var i=0;i<4;i++){
					var row = widget.createElement('div',{ styles:{ "display":"table-row","height":"40px","border" : "solid 1px #d4d4d5" } });
					table.addContent(row);
					for(var j=0;j<content.header.length;j++){
						var td = widget.createElement('div',{ text:data[i][j] ,styles:{ "cursor":"pointer","display":"table-cell","min-width":"100px","vertical-align":"middle","text-align":"center","background":"white" },
						events:{ 
							click:function(e){
							//e.target.id
							console.log(e);
							var url = "https://3dspace.r2018x.rs.com/3dspace/common/emxNavigator.jsp?collabSpace=Default";
							window.open(url);
							}
						} });				
						row.addContent(td);
					}
				}
								
				
				contentBody.addContent(table);
				
				
			},
			onGetWidgetUrl : function(){
			    var widget = this.widget;
			    var widgetURL = widget.getUrl();
				
			    widgetURL = widgetURL.substring(0,widgetURL.indexOf('/3dspace/')+8);
			 	return widgetURL;
			},
			onServiceAPI : function(obj,value){
				if(value==null||value=="undefined"||value==undefined){
					value = obj.oid;
				}
				var serviceUrl = this.restAPI + obj.program+":"+obj.method+"&oid="+value;
				return serviceUrl;
			}
		};
		DSK = window.DSK = window.DSK || {};
		DSK.tableList = tableList
		return tableList;
	});