/**
 * BT WW Competencies Center - Fast Prototypes Team
 * @author UM5
 */

define("UM5Modules/SixWTaggerUtils", [], function() {
    var SixWTaggerUtils = {
        convertExaGroupsToSummaryTags: function(exaGroups) {
            //Format of data retrieved from "extractTagsFromExaleadResponse" function in 'DS/SwymUICore/script/lib/6wpanel/utils'
            var sixwTags = [];
            var typeRegExp = /^xsd:/;
            var pushSubjectTagsRecursively = function(resultingSixWTags, category, rootPath, rootPathLevelsCount) {
                var tagType, // xsd:string, xsd:date etc.
                    predicate, // ds6w_what, ds6w_what_ds6wtype etc.
                    k,
                    len,
                    tagNatureIndex,
                    litteral,
                    pathPart,
                    fullPathParts,
                    predicateParts,
                    subCategories = category.categories;

                //checks whether there is a single value in this category or not
                if (subCategories && subCategories.length > 0) {
                    //push all eventual sub-categories
                    for (k = 0, len = subCategories.length; k < len; k++) {
                        resultingSixWTags = pushSubjectTagsRecursively(resultingSixWTags, subCategories[k], rootPath, rootPathLevelsCount);
                    }
                } else {
                    predicateParts = [];
                    fullPathParts = category.fullPath.split("/");

                    //construct the predicate
                    //while looking for the category of the tag (implicit/explicit)
                    tagNatureIndex = -1;

                    for (k = 2, len = fullPathParts.length; k < len; k++) {
                        pathPart = fullPathParts[k];

                        switch (pathPart) {
                            case "implicit":
                            case "explicit":
                                tagNatureIndex = k;
                                break;
                            default:
                                predicateParts.push(pathPart);
                                break;
                        }
                        if (tagNatureIndex > 0) {
                            //stop the loop
                            break;
                        }
                    }
                    predicate = predicateParts.join("/");
                    tagType = fullPathParts[tagNatureIndex + 1];

                    if (rootPathLevelsCount > tagNatureIndex + 1) {
                        //the root path already contains the tag type
                        litteral = category.fullPath.replace(rootPath + "/", "").split("/");
                    } else {
                        //the root path does not contain the tag type
                        litteral = fullPathParts.splice(tagNatureIndex + 2);
                    }

                    if (typeof tagType === "string") {
                        /* strip the 'xsd:' prefix */
                        tagType = tagType.replace(typeRegExp, "");
                        if (tagType === "date") {
                            litteral = litteral.join("/");
                        } else {
                            litteral.forEach(function(val, idx) {
                                litteral[idx] = val.replace(/&#47;/g, "/");
                            });
                            // IR-439013
                            if (litteral.length === 1) {
                                litteral = litteral[0];
                            }
                        }
                    }

                    resultingSixWTags.push({
                        sixw: predicate,
                        object: litteral,
                        type: tagType,
                        count: parseInt(category.count, 10)
                    });
                }
                return resultingSixWTags;
            };
            for (var i = 0; i < exaGroups.length; i++) {
                var group = exaGroups[i];
                if (group.id.substring(0, 4) === "ds6w") {
                    //It's a DS6W Tag do something with it ;)
                    sixwTags = pushSubjectTagsRecursively(sixwTags, group, group.root, group.root.split("/").length);
                }
            }
            return sixwTags;
        },
        convertSelectedTagsToExaQueryParams: function(selectedTags) {
            var queryParams = [];
            var typePrefix = "xsd:";
            var dsSixW = "ds6w";
            if (selectedTags) {
                for (var predicate in selectedTags) {
                    if (selectedTags.hasOwnProperty(predicate)) {
                        var selectedObjects = selectedTags[predicate];
                        for (var i = 0; i < selectedObjects.length; i++) {
                            var objTag = selectedObjects[i];
                            var valueObject = objTag.object;
                            var type = typePrefix + objTag.type;

                            if (Array.isArray(valueObject)) {
                                for (var j = 0; j < valueObject.length; j++) {
                                    var val = valueObject[j];
                                    valueObject[j] = val.replace(/\//g, "&#47;");
                                }
                                valueObject = valueObject.join("/");
                            } else if (objTag.type !== "date") {
                                valueObject = valueObject.replace(/\//g, "&#47;");
                            }

                            var srtFacet = "f/" + dsSixW + "_47_" + predicate.replace(/:/g, "_58_").replace(/\//g, "_47_") + "/" + type + "/" + valueObject;
                            queryParams.push(srtFacet);
                        }
                    }
                }
            }
            return queryParams;
        }
    };
    return SixWTaggerUtils;
});
