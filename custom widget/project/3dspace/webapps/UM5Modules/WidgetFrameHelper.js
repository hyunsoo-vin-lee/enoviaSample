/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define("UM5Modules/WidgetFrameHelper", ["UWA/Drivers/jQuery"], function($) {
    var helper = {
        minimizedHeader: function(windowCtx) {
            helper.setMinizedHeader(windowCtx, true);
        },
        unminimizedHeader: function(windowCtx) {
            helper.setMinizedHeader(windowCtx, false);
        },

        setMinizedHeader: function(windowCtx, doMinimize) {
            //Get moduleWrapper front, which is the block of the widget with the Header and the Content
            var elemWrapper = helper.getWidgetDisplayWrapper(windowCtx);
            var $wdgModContent = $(elemWrapper).children(".moduleContent");
            var $wdgModHeader = $(elemWrapper).find(".moduleHeader");
            var $wdgModHeaderTitle = $wdgModHeader.find(".moduleHeader__title");
            var $wdgModHeaderRight = $wdgModHeader.find(".moduleHeader__right");

            if (doMinimize) {
                $wdgModContent.css("padding-top", "25px");

                $wdgModHeader.css("height", "25px");
                $wdgModHeader.css("line-height", "22px");

                $wdgModHeaderTitle.css("font-size", "12px");

                $wdgModHeaderRight.find(".fonticon").css("font-size", "12px");
                $wdgModHeaderRight.find(".fonticon").css("width", "28px");
            } else {
                $wdgModContent.css("padding-top", "");

                $wdgModHeader.css("height", "");
                $wdgModHeader.css("line-height", "");

                $wdgModHeaderTitle.css("font-size", "");

                $wdgModHeaderRight.find(".fonticon").css("font-size", "");
                $wdgModHeaderRight.find(".fonticon").css("width", "");
            }
        },

        colorizeWidgetFrame: function(windowCtx, color) {
            var elemWrapper = helper.getWidgetDisplayWrapper(windowCtx);
            var $wdgModContent = $(elemWrapper).children(".moduleContent");
            $wdgModContent.css("background-color", color);
        },

        getParentTab: function(windowCtx) {
            var el = windowCtx.frameElement;
            var mySelector = ".wp-tab-panel";
            if (!windowCtx.parent.document.documentElement.contains(el)) return null;
            do {
                if (el.matches(mySelector)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        },

        getWidgetDisplayWrapper: function(windowCtx) {
            //Get moduleWrapper front, which is the block of the widget with the Header and the Content
            var el = windowCtx.frameElement;
            var mySelector = ".moduleWrapper.front";
            if (!windowCtx.parent.document.documentElement.contains(el)) return null;
            do {
                if (el.matches(mySelector)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        }
    };
    return helper;
});
