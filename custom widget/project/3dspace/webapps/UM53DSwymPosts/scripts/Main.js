/*
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

function executeWidgetCode() {
    require([
        "UWA/Drivers/jQuery",
        "UM5Modules/Connector3DSwym",
        "BTWWSemanticUI/SemanticUIMessage_ES5_UM5_v1/SemanticUIMessage",
        "DS/TagNavigatorProxy/TagNavigatorProxy",
        "UM5Modules/SixWTaggerUtils",
        "DS/DataDragAndDrop/DataDragAndDrop"
    ], function($, Connector3DSwym, SemanticUIMessage, TagNavigatorProxy, SixWTaggerUtils, DataDragAndDrop) {
        var myWidget = {
            taggerProxy: null,
            //Manage Pagination of Items
            _currentStartItem: 0,
            _currentMaxItems: 0,
            //Manage current query and refine params
            _currentQuery: null,
            _currentRefine: null,

            _queryPending: false, //Do avoid double query which load the Posts twice (When auto Refresh from Tab)

            // Widget Events
            onLoadWidget: function() {
                var wdgUrl = widget.getUrl();
                wdgUrl = wdgUrl.substring(0, wdgUrl.lastIndexOf("/"));

                widget.setIcon(wdgUrl + "/../UM5Modules/assets/icons/custom-widget-icon.png");

                var wdgTitlePref = widget.getValue("wdgTitle");
                if (wdgTitlePref) {
                    widget.setTitle(wdgTitlePref);
                }

                $(widget.body).html("<div id='content'></div>");

                //Init Notification UI
                SemanticUIMessage.initContainer({
                    parent: widget.body
                });

                //Reset variables
                myWidget._currentStartItem = 0;

                myWidget.initTagger();
                myWidget.listPosts();

                //Done in background to load preferences
                myWidget.loadCommunities();
            },

            onRefreshWidget: function() {
                myWidget._currentStartItem = 0;
                var $content = $("#content");
                $content.empty(); //Clear the div, else it's not cleared dur to pagination mechanisms
                myWidget.listPosts(myWidget._currentQuery, myWidget._currentRefine);
            },

            initTagger: function() {
                if (!myWidget.taggerProxy) {
                    //Init the tagger only once
                    myWidget.taggerProxy = TagNavigatorProxy.createProxy({
                        widgetId: widget.id,
                        filteringMode: "FilteringOnServer",
                        tenant: widget.getValue("x3dPlatformId")
                    });
                    myWidget.taggerProxy.addEvent("onFilterChange", myWidget.on6WTagsFilterChange);
                }
            },

            listPosts: function(query, refine) {
                if (myWidget._queryPending) {
                    console.debug("queryPending so avoid list Posts");
                    return;
                }

                myWidget._queryPending = true;
                myWidget._currentQuery = query;
                myWidget._currentRefine = refine;

                var swymType = widget.getValue("swymType");
                var communityId = widget.getValue("communityId") || "";

                var nbPostPage = parseInt(widget.getValue("nbPostPage")) || 5;

                query = query || "#all";

                if (communityId !== "") {
                    query = "(" + query + ') AND community_id:"' + communityId + '"';
                    //quotes added to avoid issues with special chars of Exalead
                }

                var params = {
                    query: query,
                    contentType: swymType,
                    nresults: nbPostPage,
                    start: myWidget._currentStartItem,
                    order_field: "update",
                    order_by: "desc"
                };

                if (refine) {
                    params.refine = refine;
                }

                Connector3DSwym.call3DSwym({
                    url: "/api/search",
                    method: "POST",
                    type: "json",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify({
                        request_id: 0,
                        params: params
                    }),
                    callbackData: {},
                    forceReload: true,
                    onComplete: function(dataResp /*, headerResp, callbackData*/) {
                        var arrPosts = myWidget.convertSearchResults2Posts(dataResp);
                        var $content = $("#content");

                        $("#morePosts").remove();

                        myWidget._currentMaxItems = dataResp.nhits;
                        myWidget._currentStartItem = dataResp.start;

                        for (let i = 0; i < arrPosts.length; i++) {
                            const post = arrPosts[i];
                            let $postBlock = $(`<div class='post' post-id='${post.id}' post-community='${post.community_id}'></div>`);
                            let $postContentBlock = $(`<div class='postContent' ></div>`);
                            $postBlock.append($postContentBlock);

                            //Title
                            let $postTitle = $(`<div class='title'><a href='${post.ResourceURL}'>${post.title}</a></div>`);
                            $postContentBlock.append($postTitle);

                            //update time
                            let strDate = post.update;
                            try {
                                var datePost = new Date(strDate.replace(/-/g, " "));
                                strDate = datePost.toDateString() + " " + datePost.toLocaleTimeString();
                            } catch (error) {
                                strDate = post.update;
                            }

                            var commuId = post["community_id"];
                            var commuObj = myWidget.getCommunityById(commuId);
                            if (commuObj) {
                                strDate += " in " + commuObj.title;
                            }

                            let $postDate = $(`<div class='date'>${strDate}</div>`);
                            $postContentBlock.append($postDate);

                            //Text extract
                            let $postText = $(`<div class='contentPreview'><div class='text'>${post.text}</div></div>`);
                            $postContentBlock.append($postText);

                            if (post.media_id) {
                                $postBlock.prepend(
                                    `<div class='image'><img src='${Connector3DSwym._Url3DSwym}/api/media/stream/id/${
                                        post.media_id
                                    }/type/thumb/key/s_thumb'/></div>`
                                );
                                $postBlock.addClass("gotImage");
                            }
                            $content.append($postBlock);

                            //Add Click to load in 3DSwym Content Reader widget
                            $postBlock.click(post, function(event) {
                                var myReader = myWidget.getMediaReader(widget.getValue("swymType"));
                                if (myReader) {
                                    myReader.setValue("contentId", event.data.id);
                                    myReader.onLoad();
                                }
                            });

                            myWidget.setDnDOnSwymItem(post, $postBlock.get(0));
                        }

                        if (myWidget._currentStartItem + dataResp.hits.length < myWidget._currentMaxItems) {
                            var $divMorePosts = $(
                                "<div id='morePosts'><i class='icon chevron down'></i>Display " +
                                    nbPostPage +
                                    " more items <i>(" +
                                    (myWidget._currentMaxItems - myWidget._currentStartItem - dataResp.hits.length) +
                                    " items left)</i> <i class='icon chevron down'></i></div>"
                            );
                            $divMorePosts.click(myWidget.morePosts);
                            $content.append($divMorePosts);
                        } else {
                            $content.append("<div id='morePosts' class='noMore'>No more Items to display</div>");
                        }

                        myWidget.setTagsFromSearchResults(dataResp);
                        myWidget._queryPending = false;
                    },
                    onFailure: function(error) {
                        myWidget._queryPending = false;
                        var errorType = "WebService Call Faillure";
                        var errorMsg = JSON.stringify(error);
                        console.error(errorType + errorMsg);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            setDnDOnSwymItem: function(itemSwym, htmlObject) {
                var swymType = itemSwym["ds6w_58_type"] || "post";
                if (swymType.indexOf(":")) {
                    swymType = swymType.substring(swymType.lastIndexOf(":") + 1);
                    swymType = swymType.toLowerCase();
                }

                var data3DXContent = {
                    protocol: "3DXContent",
                    version: "1.0",
                    source: "UM53DSwymPosts",
                    widgetId: widget.id,
                    data: {
                        items: [
                            {
                                envId: "OnPremise",
                                serviceId: "3DSwym",
                                contextId: "",
                                objectId: itemSwym.id,
                                objectType: swymType,
                                displayName: itemSwym.title,
                                displayType: swymType,
                                displayIcon: itemSwym["type_icon_url"],
                                displayPreview: itemSwym.preview_url,
                                defaultApp: "X3DMCTY_AP",
                                urlContent: {
                                    "3DSwym": itemSwym.ResourceURL
                                }
                            }
                        ]
                    }
                };
                var dataDnD = JSON.stringify(data3DXContent);

                DataDragAndDrop.draggable(htmlObject, {
                    data: dataDnD
                });
            },

            morePosts: function() {
                var nbPostPage = parseInt(widget.getValue("nbPostPage")) || 5;

                if (myWidget._currentStartItem < myWidget._currentMaxItems) {
                    myWidget._currentStartItem += nbPostPage;
                    myWidget.listPosts(myWidget._currentQuery, myWidget._currentRefine);
                } else {
                    //TODO Message no more posts to display
                    SemanticUIMessage.addNotif({
                        level: "warn",
                        title: "No more Items",
                        message: "There isn't more items to display (this message shouldn't appear)",
                        sticky: false
                    });
                }
            },

            convertSearchResults2Posts: function(searchResult) {
                var arrPosts = [];
                var hits = searchResult.hits;

                for (let i = 0; i < hits.length; i++) {
                    const hit = hits[i];
                    let newPost = {};
                    let metas = hit.metas;
                    for (let j = 0; j < metas.length; j++) {
                        const meta = metas[j];
                        newPost[meta.name] = meta.value;
                    }
                    arrPosts.push(newPost);
                }
                return arrPosts;
            },

            setTagsFromSearchResults: function(searchResult) {
                if (searchResult && searchResult.groups) {
                    var sixwTags = SixWTaggerUtils.convertExaGroupsToSummaryTags(searchResult.groups);
                    myWidget.setTagsWithSummary(sixwTags);
                } else {
                    console.error("No Tags in search results !?");
                    myWidget.setTagsWithSummary([]); //in Case of refine with tags but no more results cause results are in other widget, we need to send our tags to empty
                }
            },

            setTagsWithSummary: function(sixwTags) {
                //console.log("sixwTags", sixwTags);
                //sixwTags.push({ object: "TestTag", sixw: "ds6w:how/Test", type: "string", count: 1 });
                myWidget.taggerProxy.setTags(
                    {
                        /*"totoURI:test": [{ object: "TestTag", sixw: "ds6w:how/Test", type: "string" }]*/
                    },
                    sixwTags
                );
                //myWidget.taggerProxy.focusOnSubjects(["totoURI:test"]);
                myWidget.summaryTags = sixwTags;
            },

            on6WTagsFilterChange: function(dataTags) {
                var selectedTags = dataTags.allfilters;
                //console.log("selectedTags", selectedTags);
                var arrQueryParams = SixWTaggerUtils.convertSelectedTagsToExaQueryParams(selectedTags);

                //Clean Display
                myWidget._currentStartItem = 0;
                var $content = $("#content");
                $content.empty(); //Clear the div, else it's not cleared dur to pagination mechanisms

                //Refresh Posts by calling 3DSwym Web Services with the Tags in Input
                myWidget.listPosts("#all", arrQueryParams);
                //Done in list Posts : myWidget.setTagsWithSummary(myWidget.summaryTags || []); //Since filtering is done on our side, we have to do a "myWidget.taggerProxy.setTags({}, sixwTags);" again !
            },

            //Get 3DSwym Content Reader Widget
            getMediaReader: function(swymType) {
                var myReader = null;
                var myTab = myWidget.getParentTab();
                if (myTab) {
                    let lWidgets = myTab.getElementsByClassName("moduleContent");
                    for (let i = 0; i < lWidgets.length; i++) {
                        if (-1 != lWidgets[i].className.indexOf("SwymCommunityContentReader")) {
                            let lFrames = lWidgets[i].getElementsByTagName("iframe");
                            if (lFrames && 0 < lFrames.length) {
                                var tmpReader = lFrames[0].contentWindow.widget;
                                if (tmpReader) {
                                    var readerContent = tmpReader.getValue("contentType");
                                    if (-1 != swymType.indexOf(readerContent)) {
                                        myReader = tmpReader;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                return myReader;
            },
            getParentTab: function() {
                var el = window.frameElement;
                var mySelector = ".wp-tab-panel";
                if (!window.parent.document.documentElement.contains(el)) return null;
                do {
                    if (el.matches(mySelector)) return el;
                    el = el.parentElement || el.parentNode;
                } while (el !== null && el.nodeType === 1);
                return null;
            },

            loadCommunities: function(page) {
                page = page || 1;
                var limit = 25;

                Connector3DSwym.call3DSwym({
                    url: "/api/community/listmycommunities/limit/" + limit + "/page/" + page,
                    method: "GET",
                    type: "json",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: null,
                    callbackData: {},
                    forceReload: true,
                    onComplete: function(dataResp /*, headerResp, callbackData*/) {
                        myWidget._queryPending = false;

                        var arrResult = dataResp.result;
                        myWidget.memorizeCommunities(arrResult);

                        var nb_result = dataResp.nb_result;

                        var nbLoaded = (page - 1) * limit + arrResult.length;
                        if (nbLoaded < nb_result) {
                            myWidget.loadCommunities(page + 1);
                        } else {
                            //All loaded
                            myWidget.onCommunitiesLoaded();
                        }
                    },
                    onFailure: function(error) {
                        myWidget._queryPending = false;
                        var errorType = "WebService Call Faillure";
                        var errorMsg = JSON.stringify(error);
                        console.error(errorType + errorMsg);
                        SemanticUIMessage.addNotif({
                            level: "error",
                            title: errorType,
                            message: errorMsg,
                            sticky: false
                        });
                    }
                });
            },

            communities: [],
            memorizeCommunities: function(arrResult) {
                for (let i = 0; i < arrResult.length; i++) {
                    const community = arrResult[i];
                    var idCommunity = community.id;
                    let doAdd = true;
                    for (let j = 0; j < myWidget.communities.length; j++) {
                        const existingCommunity = myWidget.communities[j];
                        if (existingCommunity.id === idCommunity) {
                            myWidget.communities[j] = community;
                            doAdd = false;
                            break;
                        }
                    }
                    if (doAdd) {
                        myWidget.communities.push(community);
                    }
                }
            },

            getCommunityById: function(commuId) {
                for (let i = 0; i < myWidget.communities.length; i++) {
                    const commuObj = myWidget.communities[i];
                    if (commuObj.id === commuId) {
                        return commuObj;
                    }
                }
                return null;
            },

            onCommunitiesLoaded: function() {
                var arrayPrefOptions = [{ value: "", label: "All" }];
                for (let i = 0; i < myWidget.communities.length; i++) {
                    const community = myWidget.communities[i];
                    arrayPrefOptions.push({ value: community.id, label: community.title });
                }

                var idPrefCommuId = "communityId";
                var prefCommu = widget.getPreference(idPrefCommuId);
                if (typeof prefCommu === "undefined") {
                    widget.addPreference({
                        name: idPrefCommuId,
                        type: "hidden",
                        label: "Filter on Community",
                        defaultValue: ""
                    });
                    prefCommu = widget.getPreference(idPrefCommuId);
                }

                var lastCommuSelected = widget.getValue(idPrefCommuId);
                var bValueStillOK = false;
                for (let i = 0; i < arrayPrefOptions.length; i++) {
                    const prefVal = arrayPrefOptions[i];
                    if (prefVal.value === lastCommuSelected) {
                        bValueStillOK = true;
                        break;
                    }
                }
                if (!bValueStillOK) {
                    lastCommuSelected = ""; //All communities
                    SemanticUIMessage.addNotif({
                        level: "warning",
                        title: "Community Filter Changed",
                        message:
                            "The lastly selected community to filter the Post is not available for your user anymore<br>The filter has been reset to All communities",
                        sticky: false
                    });
                }

                prefCommu.type = "list";
                prefCommu.options = arrayPrefOptions;
                prefCommu.defaultValue = lastCommuSelected;

                widget.addPreference(prefCommu);
                widget.setValue(idPrefCommuId, prefCommu.defaultValue); //Set the correct selected Value
            }
        };

        widget.addEvent("onLoad", myWidget.onLoadWidget);
        widget.addEvent("onRefresh", myWidget.onRefreshWidget);
        //widget.addEvent("onSearch", myWidget.onSearchWidget);
        //widget.addEvent("onResetSearch", myWidget.onResetSearchWidget);

        //widget.addEvent("onConfigChange", myWidget.onConfigChange); //For change of Table Config in list
    });
}
