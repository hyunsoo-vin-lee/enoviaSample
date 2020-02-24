define("UM5CentralizedNLS/UM5CentralizedNLS",
[
	"UWA/Class",
	"i18n!UM5CentralizedNLS/nls/UM5NLS"
],
function(
	Class,
	UM5NLS
){
	var myNLS = Class.singleton({
		
		getNls: function(){
			return UM5NLS;
		},
		
		getTranslatedValueWithSelect: function(select, currentValue){
			var translatedValue = currentValue;
			
			try{
				//var arrSelect = select.split(".");//Cannot be used directly due to things like : attribute[PLMEntity.V_discipline].value
				
				var arrSelect = [];
				
				//Split on point but not when the point is inside brackets
				var currentIndex=0;
				var idxPoint = -1;
				while( (idxPoint = select.indexOf(".", currentIndex))!==-1 ){
					var idxBracketOpen =  select.indexOf("[", currentIndex);
					var idxBracketClose =  select.indexOf("]", idxBracketOpen);
					if(idxPoint > idxBracketOpen && idxPoint < idxBracketClose){
						//Skip the split of point inside bracket
						var nextStop = idxBracketClose+1;
						var idxPointAfterBracket = select.indexOf(".", idxBracketClose);
						if(idxPointAfterBracket!==-1){
							idxPoint=idxPointAfterBracket;
						}else{
							idxPoint=nextStop;
						}
					}
					var subStr = select.substring(currentIndex,idxPoint);
					arrSelect.push(subStr);
					var currentIndex = idxPoint+1;
				}
				
				var subStrEnd = select.substring(currentIndex);
				arrSelect.push(subStrEnd);
				
				var arrKeysForNLS = [];
				
				//Get the right key for nls in case of complicated select
				//example : "from.to.attribute[Severity]" we want the nls :  UM5NLS["attribute"]["Severity"][currentValue]
				
				for(var i = (arrSelect.length-1); i>=0 ; i--){
					var keySelect = arrSelect[i];
					//Ignore the .value for attribute or other select
					if(keySelect.indexOf("attribute")===0 || keySelect.indexOf("interface")===0){
						var startBracket = keySelect.indexOf("[");
						if(startBracket!==-1){
							var endBracket = keySelect.indexOf("]",startBracket);
							
							var attrOrInterf = keySelect.substring(0, startBracket);
							var attrOrInterfName = keySelect.substring(startBracket+1,endBracket);
							
							arrKeysForNLS.push(attrOrInterf);
							arrKeysForNLS.push(attrOrInterfName);
							arrKeysForNLS.push(currentValue);
						}else{
							//just "attribute" or "interface" as a select
							// For "interface" it can be interesting to have the applied "interface" name for an object
							arrKeysForNLS.push(keySelect);
							arrKeysForNLS.push(currentValue);
						}
						break;
					}else if(keySelect.indexOf("type")===0 || keySelect.indexOf("current")===0){
						arrKeysForNLS.push(keySelect);
						arrKeysForNLS.push(currentValue);
						break;
					}
				}
				
				var nlsVal = UM5NLS;
				for(var i=0; i < arrKeysForNLS.length; i++){
					var nlsVal = nlsVal[arrKeysForNLS[i]];
					if(!nlsVal){
						break;//Stop searching if we are in a non-valid branch
					}
				}
				
				if(typeof nlsVal==="string"){
					translatedValue = nlsVal;
				}
			}catch(err){
				console.warn("UM5CentralizedNLS/UM5CentralizedNLS.getTranslatedValueWithSelect - issue :")
				console.warn(err);
			}
			return translatedValue;
		}
	});
	return myNLS;
});