/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 *
 * API to be used in a Page that will be loaded inside the "UM5SmartFrame" widget
 * To allow communication from a Third Party Application Web Page to the Widget Infrastructure
 * Example : From an SAP Page loaded inside the "UM5SmartFrame" widget, be able to indicate a selected object to other widgets.
 * This permit seamless interaction from a Web Page to other widgets loaded in the same Tab of 3DDashboard
 */

//Global Variable
var dsPlatformAPI = {
    _isInitialized: false,
    _mapSubscriptions: {}, //Format {topicName01:[{key : subKey, fct : callbackFct}, ...], ...}
    /**
     * Init function that should be called to initialize the communication
     * If it was already called then it won't redo the init process.
     */
    init: function() {
        if (dsPlatformAPI._isInitialized) {
            return;
        }
        window.addEventListener("message", dsPlatformAPI._receivedPostMessage, false);
    },

    /**
     * Seamlessly publish a message to other widgets
     * The topic and message will be send to the "UM5SmartFrame" widget that will do the Standard PlatformAPI.publish (js module "DS/PlatformAPI/PlatformAPI")
     *
     * @argument message : Will be stringified if needed
     */
    publish: function(topic, message) {
        dsPlatformAPI.init();
        dsPlatformAPI._pubOnWidgetSide(topic, message);
    },
    /**
     * Seamlessly subscribe to other widgets messages
     */
    subscribe: function(topic, fctCallback) {
        dsPlatformAPI.init();
        if (!dsPlatformAPI._mapSubscriptions[topic]) {
            dsPlatformAPI._mapSubscriptions[topic] = [];
        }
        var keySub = "Sub_" + Date.now();
        dsPlatformAPI._mapSubscriptions[topic].push({ key: keySub, fct: fctCallback });
        dsPlatformAPI._subOnWidgetSide(topic);
        return keySub;
    },
    /**
     * Seamlessly unsubscribe to other widgets messages
     */
    unsubscribe: function(subscriptionKey) {
        dsPlatformAPI.init();
        var done = false;
        for (const keyTopic in dsPlatformAPI._mapSubscriptions) {
            if (dsPlatformAPI._mapSubscriptions.hasOwnProperty(keyTopic)) {
                const arrSubs = dsPlatformAPI._mapSubscriptions[keyTopic];
                for (let i = 0; i < arrSubs.length; i++) {
                    const subObj = arrSubs[i];
                    if (subObj.keySub === subscriptionKey) {
                        arrSubs.splice(i, 1);
                        i--;
                        done = true;
                    }
                }
            }
        }
        return done;
    },

    /*
    * Internal methods
    */

    _receivedPostMessage: function(ev) {
        var msg = ev.data;
        try {
            var jsonMsg = JSON.parse(msg);
            if (jsonMsg.type) {
                switch (jsonMsg.type) {
                    case "publish":
                        dsPlatformAPI._receivedPublish(jsonMsg);
                        break;

                    default:
                        console.warn("dsPlatformAPI : Received postMessage unrecognized message type.");
                        break;
                }
            }
        } catch (error) {
            console.warn("dsPlatformAPI : Impossible to translate correctly the received postMessage", error);
        }
    },

    _receivedPublish: function(jsonMsg) {
        var topic = jsonMsg.topic;
        var message = jsonMsg.message;

        if (dsPlatformAPI._mapSubscriptions[topic]) {
            var arrSubs = dsPlatformAPI._mapSubscriptions[topic];
            for (let i = 0; i < arrSubs.length; i++) {
                const subObj = arrSubs[i];
                if (typeof subObj.fct === "function") {
                    subObj.fct(message, topic); //Send also the topic as a reminder just in case it can be needed
                }
            }
        }
    },

    _pubOnWidgetSide: function(topic, message) {
        var action = { type: "doPublish", topic: topic, message: message };
        window.parent.postMessage(JSON.stringify(action), "*");
    },

    _subOnWidgetSide: function(topic) {
        var action = { type: "doSubscribe", topic: topic };
        window.parent.postMessage(JSON.stringify(action), "*");
    }
};
