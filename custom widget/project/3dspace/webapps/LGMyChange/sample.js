define("DS/sample/sample",[],function(){});
define("DS/sample/sample",[
	"UWA/Core"
	],
	function( UWA){
		//"use strict";
		var sample = function(){
			console.log("New sample");
		};
		sample.prototype = {
			init : function(widget, options){
				
				console.log("START CARD");
			}
		};
		DSK = window.DSK = window.DSK || {};
		DSK.sample = sample
		return sample;
	});