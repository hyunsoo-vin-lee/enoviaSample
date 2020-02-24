<template>
    <div :class='getClasses()' @dragenter.stop="dragOver=true" @dragleave.stop="dragOver=false" @dragover.stop="dragOver=true">
        <div :class='["label",(isDisabled()?"disabled":"")]' @click.stop='selectMe'>{{item.label}}</div>
        <ul v-if='item.display.type==="list"' class='listBlock pl-0'>
            <li v-for='(obj,i) in objectsList' :key="i">
                <span v-if='mapTypeToIcon[obj.type] && mapTypeToIcon[obj.type]!==""' class='iconType'><img :src='getIconTypeURL(obj)'/></span>{{obj.name}}
                <span v-if='editMode === 1 && item.canDisconnect' title='Disconnect'><v-icon @click.stop='disconnetRel(obj)'>delete</v-icon></span>
                <span v-if='isDownloadable(obj)' title='Download'><v-icon @click.stop='download(obj)'>attachment</v-icon></span>
                <span  title='Open in 3DSpace'><a :href='getObj3DSpaceLink(obj)' target='_blank'><v-icon>more_horiz</v-icon></a></span>
            </li>
            <li v-if='editMode && !inFormCreator && item.canCreate'><v-btn color='primary' dark @click='doCreateNewAttachedObject()'><v-icon>add</v-icon>Create</v-btn></li>
        </ul>
        <div v-if='inFormCreator' :class='["dropZoneField", "before", (dragOverBefore ? "dragOver":"")]' @dragenter="dragOverBefore=true" @dragleave="dragOverBefore=false" @dragover.prevent="dragOverBefore=true" @drop.prevent.stop='drop("before")'>
            <v-icon>chevron_left</v-icon>
        </div>
        <div v-if='inFormCreator' :class='["dropZoneField", "after", (dragOverAfter ? "dragOver":"")]' @dragenter="dragOverAfter=true" @dragleave="dragOverAfter=false" @dragover.prevent="dragOverAfter=true" @drop.prevent.stop='drop("after")'>
            <v-icon>chevron_right</v-icon>
        </div>
        <div v-if='!inFormCreator && item.canConnect' :class='["dropZoneNewRel",(dragOverRel ? "dragOver":"")]' @dragenter="dragOverRel=true" @dragleave="dragOverRel=false" @dragover.prevent="dragOverRel=true" @drop.prevent.stop='dropRel($event)'><v-icon>add</v-icon><br>Attach</div>
    </div>
</template>

<style scoped>
.hoverField:hover {
    background-color: rgb(217, 237, 255);
}
.label {
    /*background-color: #f0f0f0;*/
    font-weight: bold;
    /*border-bottom: 1px solid #e4e4e4;*/
    padding-right: 1.25em;
}
.selected .label {
    color: blue;
}
.flexibleContent {
    display: flex;
}
.flexibleContent .label {
    flex: initial;
}
ul.listBlock {
    display: block;
}
.dropZoneNewRel {
    display: none;
}
.dragOverField > .dropZoneNewRel {
    display: block;
    position: absolute;
    height: 100%;
    width: 100%;
    text-align: center;
}
.dropZoneNewRel.dragOver {
    border-radius: 0.25em;
    background-color: rgb(204, 231, 255, 0.5);
    border: 1px dotted rgb(86, 176, 255);
    border-radius: 0.1em;
}

.iconType > img {
    height: 1em;
}
</style>

<script>
define(["vue", "UM5Form/Utils"], function(Vue, Utils) {
    return Vue.component("web-form-rel", {
        template: template,
        props: ["item", "selectedItem", "editMode", "dataObject", "inFormCreator"],
        data: function() {
            return {
                dragOver: false,
                dragOverBefore: false,
                dragOverAfter: false,
                dragOverRel: false,
                mapTypeToIcon: {}
            };
        },
        computed: {
            objectsList: function() {
                let res = [];

                let target = this.item.target;
                let ids = this.dataObject[target + ".id"];
                let names = this.dataObject[target + ".name"];
                let types = this.dataObject[target + ".type"];

                let strTargetIdConn = target.substring(0, target.lastIndexOf(".")) + ".id[connection]";
                let idRels = this.dataObject[strTargetIdConn];

                if (typeof ids !== "undefined") {
                    if (typeof ids === "string") {
                        ids = ids.split("\u0007");
                    }
                    if (typeof names === "string") {
                        names = names.split("\u0007");
                    }
                    if (typeof types === "string") {
                        types = types.split("\u0007");
                    }
                    if (typeof idRels === "string") {
                        idRels = idRels.split("\u0007");
                    }
                    for (let i = 0; i < ids.length; i++) {
                        const id = ids[i];
                        const name = names[i];
                        const type = types[i];
                        const idRel = idRels[i];
                        let obj = {
                            id: id,
                            name: name,
                            type: type,
                            idRel: idRel,
                            iconType: null
                        };
                        res.push(obj);
                        //Async load of iconType
                        Utils.getIconTypeInfo(type, data => {
                            this.$set(this.mapTypeToIcon, type, data); //Use $set function so it's reactive :p, it will re-render the display and the icon of the type will be displayed
                        });
                    }
                }
                return res;
            }
        },
        methods: {
            getClasses: function() {
                let cssClasses = ["hoverField", "flexibleContent", "formField"];
                if (this.item.display.mode == "flex") {
                    cssClasses.push("flex");
                    cssClasses.push("xs" + this.item.display.size);
                } else if (this.item.display.mode == "block") {
                    //Take the full width of the grid
                    cssClasses.push("flex");
                    cssClasses.push("xs12");
                }

                if (this.item === this.selectedItem) {
                    cssClasses.push("selected");
                }

                if (this.dragOver) {
                    cssClasses.push("dragOverField");
                }
                return cssClasses;
            },
            selectMe: function() {
                //Emit event to parent component
                this.$emit("select-item", this.item);
            },
            drop: function(where) {
                //Reset the drag boolean so the drop zone are hidden
                this.dragOver = false;
                this.dragOverBefore = false;
                this.dragOverAfter = false;

                //Emit event to parent component
                this.$emit("item-drop", where, this.item);
            },
            dropRel: function(ev) {
                //Reset the drag boolean so the drop zone are hidden
                this.dragOver = false;
                this.dragOverRel = false;

                let currentId = this.dataObject.physicalid;

                let currentTarget = this.item.target;

                let relDir = "from";
                if (currentTarget.indexOf("to[") === 0) {
                    relDir = "to";
                }

                let relType = currentTarget.substring(currentTarget.indexOf("[") + 1, currentTarget.indexOf("]"));

                let dataTxt = ev.dataTransfer.getData("text");
                let dataDnD = JSON.parse(dataTxt);
                if (dataDnD.protocol === "3DXContent") {
                    try {
                        let arrOids = dataDnD.data.items;
                        for (let i = 0; i < arrOids.length; i++) {
                            let item = arrOids[i];
                            let pidDropped = item.objectId;

                            let fromId = relDir === "to" ? pidDropped : currentId;
                            let toId = relDir === "to" ? currentId : pidDropped;

                            //Try to connect
                            Utils.addConnection(
                                fromId,
                                relType,
                                toId,
                                () => {
                                    this.$emit("refresh-vue");
                                },
                                (errorType, errorMsg) => {
                                    this.$emit("error", errorType, errorMsg);
                                }
                            );
                        }
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    //error
                    this.$emit("error", "Connection Error", "Dropped object does not have a supported format.");
                }
            },
            isDisabled: function() {
                return !this.item.canConnect && this.editMode === 1;
            },
            disconnetRel: function(objRel) {
                let idRel = objRel.idRel;
                if (idRel) {
                    //Disconnect...
                    Utils.removeConnection(
                        idRel,
                        () => {
                            this.$emit("refresh-vue");
                        },
                        (errorType, errorMsg) => {
                            this.$emit("error", errorType, errorMsg);
                        }
                    );
                }
            },
            getIconTypeURL: function(objRel) {
                return Utils.get3DSpaceURL() + this.mapTypeToIcon[objRel.type];
            },
            getObj3DSpaceLink: function(objRel) {
                return Utils.get3DSpaceURL() + "/common/emxNavigator.jsp?objectId=" + objRel.id;
            },
            isDownloadable: function(objRel) {
                return objRel.type === "Document";
            },
            download: function(objRel) {
                let docId = objRel.id;
                Utils.getFCSFileURL(
                    docId,
                    (urlFCS, fileName) => {
                        //Download with the url
                        //var $aCSV = $("<a href=\"" +urlFCS + "\" download='" + fileName + "' style='display:none;'>CSV</a>");
                        var $aFile = $(`<a href="${urlFCS}" download="${fileName}" style='display:none;'>File</a>`);
                        $(widget.body).append($aFile);
                        $aFile.get(0).click();
                        $aFile.remove();
                    },
                    (errorType, errorMsg) => {
                        this.$emit("error", errorType, errorMsg);
                    }
                );
            },
            doCreateNewAttachedObject: function() {
                let currentId = this.dataObject.physicalid;
                let currentTarget = this.item.target;
                this.$emit("create-attached-object", currentId, currentTarget);
            }
        }
    });
});
</script>