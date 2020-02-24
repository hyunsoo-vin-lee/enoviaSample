define("UWA/Controls/EnhancedTextarea",["UWA/Core","UWA/Class/Timed","UWA/Controls/Input"],function(d,c,b){var a;a=b.Text.extend(c,{name:"uwa-enhanced-textarea",options:{autoGrow:false},_hiddenInput:true,buildInput:function(){return d.createElement("textarea")},buildSkeleton:function(){this._parent();var e=this.elements;e.input.removeClassName("uwa-input-text");e.caret=d.createElement("span",{"class":this.getClassNames("-caret")});e.input.addEvents({scroll:this.syncScroll.bind(this),mouseup:this.syncInput.bind(this),paste:this.syncInput.bind(this)});e.container.addClassName("uwa-input-text").grab(e.input);if(this.isAutoGrow()){e.container.addClassName("autogrow")}},getCaretElement:function(){return this.elements.caret},isAutoGrow:function(){return this.options.autoGrow},syncInput:function(){this.setAnimate("sync-input",function(){var e=this.elements;e.content.empty(true).addContent(this.buildContentMimic(),"\u00A0");if(this.isAutoGrow()){if(e.content.offsetHeight!==e.container.offsetHeight){e.container.setStyle("height",e.content.offsetHeight);this.dispatchEvent("onResize")}else{this.syncScroll();this._hideInputScroll()}}else{this.syncScroll()}})},buildContentMimic:function(){var h=this.elements,g=this.getValue(),i=h.input.selectionStart,f=g.slice(0,i),e=g.slice(i);return[f,h.caret,e]},_hideInputScroll:function(){if(this.isAutoGrow()){var e=this.elements.input;e.setStyles({overflow:e.offsetHeight===e.scrollHeight?"hidden":null})}},syncScroll:function(){this.elements.content.scrollTop=this.elements.input.scrollTop},onMouseDown:function(){}});return d.namespace("Controls/EnhancedTextarea",a,d)});