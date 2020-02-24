/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {

    require.config({
        paths: {
            vue: "./BTWWLibrairies/vue/vue", //Need this with "vue" all lower case, else Vuetify can't load correctly
            Vuetify: "./BTWWLibrairies/vuetify/vuetify",
            CSSRoboto: "./BTWWLibrairies/fonts/Roboto", //"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700",
            CSSMaterial: "./BTWWLibrairies/MaterialDesign/material-icons",
            vueloader: "./BTWWLibrairies/requirejs-vue", //"https://unpkg.com/requirejs-vue@1.1.5/requirejs-vue",
            current: "./UM5_TemplateVue"
        }
    });

    let vueApp; //Declare it here so it can be used in some modules defined here

    require(["vue",
        "Vuetify",
        "css!BTWWLibrairies/vuetify/vuetify.min.css",
        "css!CSSRoboto",
        "css!CSSMaterial",
    ], function (Vue, Vuetify) {

        Vue.use(Vuetify); //To plug vuetify components

        var myWidget = {
            // Widget Events
            onLoadWidget: function () {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                widget.setBody(
                    `<div id='appVue'>
                        <v-app style='height:100%;'></v-app>
                    </div>`
                );

                //Init vue App
                vueApp = new Vue({
                    el: "#appVue",
                    data: {

                    },
                    computed: {

                    },
                    methods: {}
                });
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        //widget.addEvent("onRefresh", myWidget.onLoadWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}