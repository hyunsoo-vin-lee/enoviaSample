/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define("UM5Modules/FiltersMechanisms", [], function() {
    var filters = {
        _appliedFilters: [], //Format to use : [{select:"id", values : [...]}, ... ]

        addToFilters: function(select, values) {
            //Search if select already there or not then update or add filter info
            var filterInfoToUpdate = null;
            var i;
            for (i = 0; i < filters._appliedFilters.length; i++) {
                var filterInfo = filters._appliedFilters[i];
                if (filterInfo.select === select) {
                    filterInfoToUpdate = filterInfo;
                    break;
                }
            }
            if (!filterInfoToUpdate) {
                filterInfoToUpdate = {
                    select: select,
                    values: []
                };
                filters._appliedFilters.push(filterInfoToUpdate);
            }
            if (select === "search") {
                filterInfoToUpdate.values = values; //Will be a RegExp
            } else {
                var valuesToPush = [];
                if (typeof values === "string") {
                    valuesToPush.push(values);
                } else {
                    valuesToPush = values;
                }
                for (i = 0; i < valuesToPush.length; i++) {
                    var val = valuesToPush[i];
                    if (filterInfoToUpdate.values.indexOf(val) === -1) {
                        filterInfoToUpdate.values.push(val);
                    } //else already in filters
                }
            }
        },

        removeFromFilters: function(select, values) {
            //Search if select already there or not then update or add filter info
            var filterInfoToUpdate = null;
            var i;
            for (i = 0; i < filters._appliedFilters.length; i++) {
                var filterInfo = filters._appliedFilters[i];
                if (filterInfo.select === select) {
                    filterInfoToUpdate = filterInfo;
                    break;
                }
            }
            if (filterInfoToUpdate) {
                if (select === "search") {
                    filters._appliedFilters.splice(filters._appliedFilters.indexOf(filterInfoToUpdate), 1);
                } else {
                    var valuesToRemove = [];
                    if (typeof values === "string") {
                        valuesToRemove.push(values);
                    } else {
                        valuesToRemove = values;
                    }
                    for (i = 0; i < valuesToRemove.length; i++) {
                        var val = valuesToRemove[i];
                        var idxVal = filterInfoToUpdate.values.indexOf(val);
                        if (idxVal !== -1) {
                            filterInfoToUpdate.values.splice(idxVal, 1);
                        }
                    }
                    if (filterInfoToUpdate.values.length <= 0) {
                        //If no more values, then remove the filter from the list.
                        filters._appliedFilters.splice(filters._appliedFilters.indexOf(filterInfoToUpdate), 1);
                    }
                }
            }
        },

        filterRecursively: function(arrSearchIn) {
            var filteringMode = "OR";

            var prefFilterMode = widget.getValue("filterMode");
            if (prefFilterMode && prefFilterMode !== "") {
                if (typeof prefFilterMode === "object") {
                    filteringMode = prefFilterMode.value;
                } else {
                    filteringMode = prefFilterMode;
                }
            }
            var i;
            for (i = 0; i < arrSearchIn.length; i++) {
                var objTest = arrSearchIn[i];
                var numberOfValidFilters = 0;

                for (var j = 0; j < filters._appliedFilters.length; j++) {
                    var filterInfo = filters._appliedFilters[j];
                    var selectFilter = filterInfo.select;
                    var oneOrAllValuesAreOK = false;
                    var k;
                    if (selectFilter === "search") {
                        var searchRegExp = filterInfo.values;
                        var searchKeys = widget.getValue("searchKeys").split(",");
                        for (k = 0; k < searchKeys.length; k++) {
                            var searchKey = searchKeys[k].trim();
                            if (objTest[searchKey] && searchRegExp.test(objTest[searchKey])) {
                                oneOrAllValuesAreOK = true;
                                break;
                            }
                        }
                    } else {
                        var valuesFilter = filterInfo.values;

                        var objValues = objTest[selectFilter].split("");

                        var countOk = 0;
                        for (k = 0; k < objValues.length; k++) {
                            var singleVal = objValues[k];
                            if (valuesFilter.indexOf(singleVal) !== -1) {
                                countOk++;
                                if (filteringMode === "OR") break;
                            }
                        }
                        if ((filteringMode === "OR" && countOk >= 1) || countOk >= valuesFilter.length) {
                            oneOrAllValuesAreOK = true;
                        }
                    }
                    if (oneOrAllValuesAreOK) {
                        numberOfValidFilters++;
                        if (filteringMode === "OR") break; //We don't need to check any more filters
                    }
                }

                if ((filteringMode === "OR" && numberOfValidFilters >= 1) || numberOfValidFilters >= filters._appliedFilters.length) {
                    objTest.filtered = false;
                } else {
                    objTest.filtered = true;
                }
                if (objTest.childs) {
                    filters.filterRecursively(objTest.childs);
                }
            }
        },

        resetFilterRecursively: function(arrToRecurse) {
            for (var i = 0; i < arrToRecurse.length; i++) {
                var objTest = arrToRecurse[i];
                objTest.filtered = false; //Reset Filter to false
                if (objTest.childs) {
                    filters.resetFilterRecursively(objTest.childs);
                }
            }
        },

        clearAllFilters: function() {
            filters._appliedFilters = [];
        },

        clearFilter: function(selectFilter) {
            var i;
            for (i = 0; i < filters._appliedFilters.length; i++) {
                var filterInfo = filters._appliedFilters[i];
                if (filterInfo.select === selectFilter) {
                    filterInfo.values = [];
                    break;
                }
            }
        },

        isFilterApplied: function() {
            return filters._appliedFilters.length >= 1;
        }
    };
    return filters;
});
