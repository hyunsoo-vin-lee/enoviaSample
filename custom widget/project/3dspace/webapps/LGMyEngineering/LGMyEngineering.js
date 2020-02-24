define("DS/LGMyEngineering/LGMyEngineering",[
	"UWA/Drivers/jQuery",
	"UWA/Core",
	"DS/WAFData/WAFData",
	"DS/UIKIT/Input/Select",
	"DS/PlatformAPI/PlatformAPI"
	],
	function( $, UWA, WAFData, Select, PlatformAPI){
		//"use strict";
		var sampleCard = function(){
			console.log("New SampleCard");
		};
		sampleCard.prototype = {
			init : function(widget, options){
				console.log("init");
				window.XX = this;
				this.widget = widget;
				this.restAPI = "/rest/common/invokeJPO?program=";
				this.options = options;
				this.content = options.content || {};
				this.filterContent = options.filterContent || {};
				this.mContainer = null;
				this.mContainerName = options.mContainer || "defaultContainer";
				this.mFilterContainer = null;
				this.mFilterContainerName = options.filterContent.filterTargetName || "selectContainer";
				this.filterType = options.filterContent.filterType;
				this.filterTitle = options.filterContent.filterTitle;
				this.isSelectAll = options.filterContent.isSelectAll || "";
				this.topFilter = null;
				this.bodyContainer = null;
				this.isSortable = options.isSortable || "true";
				this.searchMode = "true";
				this.searchUrl = "";
				this.widgetUrl = this.onGetWidgetUrl();
				this.contentSize = 0;
				this.contentBody = widget.createElement('div',{'class':'contentBody'});
				this.cookiePrefix = options.cookiePrefix + "_sampleCard2";
				this.onCardContentLoading();
				
				this.buildSkeleton();
				console.log("START CARD");
			},
			buildSkeleton : function(){
				var that = this,
				options = this.options,
				isSortable = this.isSortable,
				mContainerName = this.mContainerName,
				content = this.content,
				widget = this.widget,
				cookiePrefix = this.cookiePrefix,
				filterTitle = this.filterTitle,filterDiv,
				cardNames = [];
				for(var tab in content){
					cardNames.push(tab);
				}
				widget.body.empty();
				this.mFilterContainer = widget.createElement('div', {
					id:this.mFilterContainerName, text:filterTitle, 'class':'searchFilterContainer'});
			//}
				this.topFilter = widget.createElement('div', {
					id :'filterHeader',
					html : [ this.mFilterContainer ],
						'Class' : 'filterHeader'
					}).inject(widget.body);
				this.bodyContainer = widget.createElement('div',{id:"bodyContainer", 'class':'bodyContainer' });
				
				this.topFilter.addContent(this.bodyContainer);

				this.onDrawFilter();
				console.log("===================");
				this.onInitContents();
	console.log(mContainerName+"==================="+isSortable);			
				if(isSortable=="true"){
					$("#"+mContainerName).sortable({
						update : function(){
							console.log("update::"+cookiePrefix);
							var save = [];
							$("#"+mContainerName).children().each(function (i){
								save.push($(this).attr('ord'));
							});
							$.cookie(cookiePrefix, null, { path: "/" });
							$.cookie(cookiePrefix, save.join(','), {expires : 365, path : "/" });
							
							console.log(save);
							console.log($.cookie(cookiePrefix));
						}
					});
					$("#"+mContainerName).disableSelection();
				}
				for(var tab in content){
					this.onRenderCard("ALL");
				}
				
			},
			onDrawFilter : function(){
				var that = this,
			    searchMode = this.searchMode,
			    widget = this.widget,
			    searchUrl;
				if(searchMode=="true"){
					this.onInitDataLoading();
				}
			},
			onInitContents : function(){
				var that = this,
				mContainer = this.mContainer, 
				widget = this.widget,
				widgetUrl = this.widgetUrl,
				cardConfig = [],
				topFilter = this.topFilter,
				contentBody = this.contentBody,
				bodyContainer = this.bodyContainer,
				contentSize = this.contentSize,
				content = this.content;

				if(!content){
					return false;
				}
				mContainer = widget.createElement('div',{ 
					id:this.mContainerName, styles: {'justify-content':'space-between','display':'flex','width':'100%'} });

				for(var el in content){
					contentSize ++;
					var array = [];
					array.push({ tag:'div', 'class':'cardItem'});
					array.push({ tag:'div', text:content[el].name, 'class':'cardTitle' });
					array.push({ tag:'div', text:'', 'class':'cardDesc' });
//					array.push({ tag:'div', text:content[el].role, 'class':'cardRole' });
					array.push({ tab:'div', html : [{ 
						tag :'img', 
						src : this.widgetUrl+content[el].icon, 
						'class':'cardIconImg', 
						'cardId':el, 
						styles:{ 'cursor':'pointer' }, 
						events : {
							click : function(evt){ 
								that.publishToIndentedTable(that, e);
							}
						}
						}], 
						class:'cardIcon' });
					array.push({ 
							tab:'div',
							text : 0, 
							'class':'cardItemCount',
							events:{
								click:function(e){
									that.publishToIndentedTable(that, e);
								}
							}
					});
					array.push({ tag:'div', 'class':'cardItem'});
//					array.push({
//							tag:'div',
//							html : [{ tag:'img', src:this.widgetUrl+"/common/images/iconActionHelp.gif", 'class':'cardHowImg' },
//								 	{ tag:'span', text:'HOW', 'class':'cardHowSpan', id:content[el].howLink}],
//							'class':'cardHow',
//							events:{ click:function(e){ //filedownload 
//								
//							}}
//					});
					var cardTop = widget.createElement('div',{'id':el, html:[array], 'class':'cardTop'});
					var cardSection = widget.createElement('div',{'id':el+'_section', 'class':'cardSection', 'ord':el, styles:{} });
					cardSection.addContent(cardTop);
					mContainer.addContent(cardSection);
				}
			
				contentBody.empty();
				bodyContainer.empty();
				mContainer.inject(contentBody);
				bodyContainer.addContent(contentBody);

				var widgetW = contentSize * 150;
//				var widgetW = "650";
				console.log(contentSize+"::::"+widgetW);
				$(document.body).css("min-width",widgetW+"px").css("overflow-x","auto").css("overflow-y","hidden");

			},
			onInitDataLoading : function(){
				var that = this,
				filterContent = this.filterContent,
				widget=this.widget,
				content=this.content,
				mFilterContainer = this.mFilterContainer, 
				selectUrl=this.widgetUrl+this.onServiceAPI(filterContent);

				var selectContainer = widget.createElement('div', {id:this.filterContent.filterTargetName, 'class':'selectContainer'});
				mFilterContainer.addContent(selectContainer);

				var sel = new Select({
         					placeholder: false,
         					nativeSelect: true,                
                    		attributes: {
                    			id : 'selectSeparator',
                  	  	    	disabled: false, 
                        	}       
                    	});
				sel.add([
                        {
                            value: "ALL",
                            label: "전체"
                        }, {
                            value: "WORKING",
                            label: "작업 중"
                        }, {
                            value: "COMPLETE",
                            label: "완료"
                        }]);
				sel.addEvent('onChange', function(e, item) {
					that.onRenderCard(e.currentTarget.value);
				});
				sel.getContent().setStyle("width", 100) ;  
				selectContainer.addContent(sel);
			},
			onSelectDataLoding : function(serviceUrl, ids, obj){
				var selectUrl = this.widgetUrl + serviceUrl;
				var that = this, widget=this.widget, widgetUrl = this.widgetUrl, checkRoleOptions = this.checkRoleOptions, bodyContainer = this.bodyContainer;
				WAFData.authenticatedRequest(selectUrl, {
					method : "GET",
					type : "json",
					onComplete: function(res){
						var jsonData = JSON.parse(JSON.stringify(res));
//						var len = jsonData.content.length;
						var len = jsonData == null ? 0 : jsonData.length;
						$("#"+ids).find("div:eq(4)").text(len);
						var idArr = new Array();
						for (var data in jsonData)
						{
							idArr.push(jsonData[data].id);
						}
						obj.idArr = idArr;
						/*
						 * 
						var result = [];
						var ul = widget.createElement('ul',{'class':'cardItemUL', styles:{}});
						for(var i=0;i<len;i++){
							
							
							var counter = jsonData.content[i];
							var str = counter.name;
							var li = widget.createElement('li',{id:counter.id,text:str,disp:"null",'class':'cardItemLi',
								styles :{ 'background':'url('+widgetUrl+obj.itemImg+')','background-repeat':'no-repeat','padding-left':'20px','background-position-y':'3px'}, 
								event:{ 
									click:function(e){
									//e.target.id
									}
								} });
							ul.addContent(li);
						}
						$("#"+ids).find("div:eq(5)").find("ul").remove();
						$("#"+ids).find("div:eq(5)").append(ul);
						 */
					},
					onFailure : function(error){
						console.log(error);
					}
				 });
				
			},
			onGetWidgetUrl : function(){
			    var widget = this.widget;
			    var widgetURL = widget.getUrl();
				console.log(widgetURL.substring(0,widgetURL.indexOf('/3dspace/')+8));
			    widgetURL = widgetURL.substring(0,widgetURL.indexOf('/3dspace/')+8);
			 	return widgetURL;
			},
			onServiceAPI : function(obj,value){
				if(value==null||value=="undefined"||value==undefined){
					value = obj.oid;
				}
				var serviceUrl = null;
				if ( obj.uri !== undefined )
				{
					serviceUrl = obj.uri + obj.queryString + "&oid="+value;
				}
				else
				{
					//serviceUrl = this.restAPI + obj.program+":"+obj.method+"&oid="+value + obj.queryString;
					serviceUrl = this.restAPI + obj.program+":"+obj.method+"&filter="+value + obj.queryString;
				}
				return serviceUrl;
			},
			onRenderCard : function(currentOption){
				var that=this, content=this.content,targetId=currentOption.value;
				for(var i in content){
					var obj = content[i];
					if(obj!="undefined"&&obj!=undefined){
						if(currentOption.text=="ALL"){
							targetId = obj.oid;
						}
						else
						{
							targetId = currentOption;
						}
						if(obj.method!=null){
							var serviceUrl = that.onServiceAPI(obj,targetId);
							that.onSelectDataLoding(serviceUrl,i,obj);
						}
					}
				}
			},
			onCardContentLoading : function(){
				var that = this, 
				content=this.content,
				cookiePrefix=this.cookiePrefix,
				tempArr=[],
				tempContent=[];
				var saveCookie = [];
				saveCookie = $.cookie(cookiePrefix);
				console.log(cookiePrefix+" saveCookie "+saveCookie);
				if(saveCookie!=null&&saveCookie!="null"){
					var items = saveCookie ? saveCookie.split(/,/) : new Array();
					for(var i=0;i<items.length;i++){	
						tempArr[items[i]]=content[items[i]];
					}
					tempContent.push(tempArr);
					that.content = tempContent[0];
				}
			},
			publishToIndentedTable : function(widget, event) {
				var objArray = widget.content[event.target.parentNode.id].idArr;
				PlatformAPI.publish("Add_Ids", {
					"ids" : objArray
					, "doInit" : true
				});
			}
		};
		DSK = window.DSK = window.DSK || {};
		DSK.sampleCard = sampleCard
		return sampleCard;
	});