/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define("UM5Modules/PreferencesSetManager", ["UM5Modules/Connector3DSpace"], function(Connector3DSpace) {
    /**
     *
     * @constructor
     * @param {Object} wdgCtx
     */
    function prefManager(wdgCtx) {
        if (!wdgCtx) throw "Error widget Context is not defined !";

        this._wdgCtx = wdgCtx;

        this._prefsCustom = [];

        this._wdgIdentifier = "Generic";
        this._configPref = "config";
        this._configPrefName = "configName";

        this._show = true;

        this.setupPrefsNames = function(configPref, configPrefName) {
            this._configPref = configPref;
            this._configPrefName = configPrefName;
        };
        this.setupConfig = function(widgetIdentifier, arrayCustomPrefs) {
            this._wdgIdentifier = widgetIdentifier;
            this._prefsCustom = arrayCustomPrefs;
        };

        this.onConfigChange = function(namePref, valuePref) {
            //console.log("onConfigChange namePref="+namePref+"  valuePref="+valuePref);
            var that = this;

            if (namePref === that._configPref) {
                if (valuePref === "Custom") {
                    //Show prefs to the user
                    for (var i = 0; i < that._prefsCustom.length; i++) {
                        var custPref = that._prefsCustom[i];
                        var prefName = "";
                        var prefType = "text";
                        if (typeof custPref === "string") {
                            prefName = custPref;
                        } else {
                            prefName = custPref.name;
                            prefType = custPref.type || "text";
                        }
                        var pref = that._wdgCtx.getPreference(prefName);
                        var currentVal = that._wdgCtx.getValue(prefName);
                        pref.type = prefType;
                        that._wdgCtx.addPreference(pref);
                        that._wdgCtx.setValue(prefName, currentVal); //Set the correct selected Value
                    }
                    that._wdgCtx.dispatchEvent("onEdit");
                } else {
                    //Get the config for server and update the prefs + display new table config
                    //Hide all prefs from the user
                    var confName = valuePref;
                    that.loadSelectedConfig(confName);
                }
            }
        };

        this.checkPreferencesVisibility = function() {
            var that = this;
            var valuePref = that._wdgCtx.getValue(that._configPref);
            var i;
            if (that._show === true && valuePref === "Custom") {
                //Show prefs to the user
                for (i = 0; i < that._prefsCustom.length; i++) {
                    var custPref = that._prefsCustom[i];
                    var prefName = "";
                    var prefType = "text";
                    if (typeof custPref === "string") {
                        prefName = custPref;
                    } else {
                        prefName = custPref.name;
                        prefType = custPref.type || "text";
                    }
                    var pref = that._wdgCtx.getPreference(prefName);
                    var currentVal = that._wdgCtx.getValue(prefName);
                    pref.type = prefType;
                    that._wdgCtx.addPreference(pref);
                    that._wdgCtx.setValue(prefName, currentVal); //Set the correct selected Value
                }
            } else {
                //Hide prefs from user
                for (i = 0; i < that._prefsCustom.length; i++) {
                    var custPref2 = that._prefsCustom[i];
                    var prefName2 = "";
                    var keepVisible = false;
                    if (typeof custPref2 === "string") {
                        prefName2 = custPref2;
                    } else {
                        prefName2 = custPref2.name;
                        keepVisible = custPref2.keepVisible;
                    }
                    if (!keepVisible) {
                        var pref2 = that._wdgCtx.getPreference(prefName2);
                        var currentVal2 = that._wdgCtx.getValue(prefName2);
                        pref2.type = "hidden";
                        that._wdgCtx.addPreference(pref2);
                        that._wdgCtx.setValue(prefName2, currentVal2); //Set the correct selected Value
                    }
                }
            }

            //Also hide or show the Drop down list
            var prefDropDown = that._wdgCtx.getPreference(that._configPref);
            if (that._show === true) {
                prefDropDown.type = "list";
            } else {
                prefDropDown.type = "hidden";
            }
            that._wdgCtx.addPreference(prefDropDown);
        };

        this.isCustomModeSelected = function() {
            var that = this;
            var valuePref = that._wdgCtx.getValue(that._configPref);
            return valuePref === "Custom";
        };

        this.loadPrefConfigs = function() {
            var that = this;
            var opts = {
                url: "/UM5Tools/WdgConfig",
                method: "POST",
                type: "json",
                data: {
                    action: "getConfigsList",
                    wdg: this._wdgIdentifier
                },
                onComplete: function(dataResp) {
                    if (dataResp.msg === "OK") {
                        var arrDataObjs = dataResp.data;

                        var lastConfigSelected = that._wdgCtx.getValue(that._configPref);

                        var optionsConfs = [];
                        var bLastOptionStillThere = false;
                        //Load the options and check that the selected config is still in the list
                        for (var i = 0; i < arrDataObjs.length; i++) {
                            var confName = arrDataObjs[i];
                            optionsConfs.push({
                                value: confName,
                                label: confName
                            });
                            if (confName === lastConfigSelected) {
                                bLastOptionStillThere = true;
                            }
                        }

                        if (!bLastOptionStillThere) {
                            lastConfigSelected = "";
                        }

                        var adminMode = that._wdgCtx.getValue("adminMode");
                        //console.log("Admin Mode="+adminMode);
                        if (typeof adminMode === "undefined" || adminMode === "true") {
                            optionsConfs.push({
                                value: "Custom",
                                label: "Custom..."
                            });
                        }

                        var prefConfig = that._wdgCtx.getPreference(that._configPref);
                        if (that._show === true) {
                            prefConfig.type = "list";
                        } else {
                            prefConfig.type = "hidden";
                        }
                        prefConfig.onchange = "onConfigChange";
                        prefConfig.options = optionsConfs;

                        if (typeof lastConfigSelected === "undefined" || lastConfigSelected === "") {
                            prefConfig.defaultValue = prefConfig.options[0].value;
                        } else {
                            prefConfig.defaultValue = lastConfigSelected;
                        }

                        that._wdgCtx.addPreference(prefConfig);
                        that._wdgCtx.setValue(that._configPref, prefConfig.defaultValue); //Set the correct selected Value

                        that.checkPreferencesVisibility();
                        if (prefConfig.defaultValue !== "Custom") {
                            that.loadSelectedConfig(prefConfig.defaultValue, true);
                        }
                    } else {
                        console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                    }
                },
                onFailure: function(error) {
                    console.error("Call Faillure : " + JSON.stringify(error));
                }
            };

            Connector3DSpace.call3DSpace(opts);
        };

        this.loadSelectedConfig = function(configName, outsidePrefsPanel) {
            var that = this;
            var opts = {
                url: "/UM5Tools/WdgConfig",
                method: "POST",
                type: "json",
                data: {
                    action: "getConfig",
                    wdg: that._wdgIdentifier,
                    configName: configName
                },
                callbackData: {
                    outsidePrefsPanel: outsidePrefsPanel
                },
                onComplete: function(dataResp, headerResp, callbackData) {
                    if (dataResp.msg === "OK" && dataResp.data && dataResp.data.length > 0) {
                        var arrDataObjs = dataResp.data;

                        //Load prefs
                        var configObj = arrDataObjs[0];
                        //var objPrefs=JSON.parse(configObj.prefs);
                        var objPrefs = configObj.prefs;

                        for (var keyPref in objPrefs) {
                            var valPref = objPrefs[keyPref];
                            that._wdgCtx.setValue(keyPref, null === valPref || "null" === valPref ? "" : valPref);
                        }

                        that._wdgCtx.setValue(that._configPrefName, configName);

                        //Hide prefs from user
                        for (var i = 0; i < that._prefsCustom.length; i++) {
                            var custPref = that._prefsCustom[i];
                            var prefName = "";
                            var keepVisible = false;
                            if (typeof custPref === "string") {
                                prefName = custPref;
                            } else {
                                prefName = custPref.name;
                                keepVisible = custPref.keepVisible;
                            }
                            if (!keepVisible) {
                                var pref = that._wdgCtx.getPreference(prefName);
                                var currentVal = that._wdgCtx.getValue(prefName);
                                pref.type = "hidden";
                                that._wdgCtx.addPreference(pref);
                                that._wdgCtx.setValue(prefName, currentVal); //Set the correct selected Value
                            }
                        }
                        if (!callbackData.outsidePrefsPanel) {
                            that._wdgCtx.dispatchEvent("onEdit");
                        }
                    } else {
                        console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                    }
                },
                onFailure: function(error) {
                    console.error("Call Faillure : " + JSON.stringify(error));
                }
            };

            Connector3DSpace.call3DSpace(opts);
        };

        this.saveCustomPrefs = function() {
            var that = this;
            var configContent = {};

            if (!that.isCustomModeSelected()) {
                //console.log("Pref Set " + this._wdgIdentifier + " not saved, not in Custom mode.");
                return;
            }

            var configName = that._wdgCtx.getValue(that._configPrefName);
            if (!configName || configName === "") {
                //console.log("Pref Set " + this._wdgIdentifier + " not saved, no config name given.");
                return;
            }

            for (var i = 0; i < that._prefsCustom.length; i++) {
                var custPref = that._prefsCustom[i];
                var keyPref = "";
                var doSave = true;
                if (typeof custPref === "string") {
                    keyPref = custPref;
                } else {
                    keyPref = custPref.name;
                    if (custPref.noSave) {
                        doSave = false;
                    }
                }
                if (doSave) {
                    configContent[keyPref] = that._wdgCtx.getValue(keyPref);
                }
            }

            var opts = {
                url: "/UM5Tools/WdgConfig",
                method: "POST",
                type: "json",
                forceReload: true,
                data: {
                    action: "saveConfig",
                    wdg: that._wdgIdentifier,
                    configName: configName,
                    configContent: configContent
                },
                onComplete: function(dataResp) {
                    if (dataResp.msg === "OK") {
                        //console.log("Preferences Saved : " + JSON.stringify(configContent));
                        that.loadPrefConfigs(); //Reload the drop down list now !
                    } else {
                        console.error("Error in WebService Response : " + JSON.stringify(dataResp));
                    }
                },
                onFailure: function(error) {
                    console.error("Call Faillure : " + JSON.stringify(error));
                }
            };

            Connector3DSpace.call3DSpace(opts);
        };

        this.showPrefSet = function() {
            var that = this;
            that._show = true;
            that.checkPreferencesVisibility();
        };

        this.hidePrefSet = function() {
            var that = this;
            that._show = false;
            that.checkPreferencesVisibility();
        };
    }

    return prefManager;
});
