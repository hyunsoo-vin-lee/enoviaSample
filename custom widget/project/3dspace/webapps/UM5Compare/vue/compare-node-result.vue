<template>
    <tr class='compareRow' :title='getTooltip()'>
        <td :class="getClasses()"><div class='dispHelper'></div></td>
        <td>
            <span class='lvlSpacer' :style='getSpacerWidth()'></span>
            <span v-if="node._leftNode"><img v-if='node._leftNode.urlIcon' :src='node._leftNode.urlIcon' class='iconType'/>{{node._leftNode.name}}</span>
        </td>
        <td>
            <span class='lvlSpacer' :style='getSpacerWidth()'></span>
            <span v-if="node._rightNode"><img v-if='node._rightNode.urlIcon' :src='node._rightNode.urlIcon' class='iconType'/>{{node._rightNode.name}}</span>
        </td>
        <td><v-chip small v-for='(item,i) in node.majorDiffs' :key='i'>{{item}}</v-chip></td>
        <td><v-chip small v-for='(item,i) in node.noticeableDiffs' :key='i'>{{item}}</v-chip></td>
    </tr>
</template>

<style scoped>
.compareRow {
    border-collapse: collapse;
    height: 100%;
}
tr.compareRow:nth-child(2n) {
    background-color: rgba(0, 0, 50, 0.02);
}

tr.compareRow:hover {
    background-color: rgb(218, 238, 255);
}
tr.compareRow:hover:nth-child(2n) {
    background-color: rgb(214, 231, 247);
}

.compareRow > td {
    border: 1px solid #ededed;
    height: 100%;
    vertical-align: middle;
}

img.iconType {
    height: 1em;
    margin-right: 0.25em;
}

.compareNode {
    min-width: 2em;
}

.compareNode .dispHelper {
    width: 2em;
    border-left-width: 1em;
    border-right-width: 1em;
    box-sizing: border-box;
    min-height: 1em;
    height: 100%;
    display: inline-block;
}

.leftOnly.compareNode .dispHelper {
    border-left-color: rgb(213, 213, 255);
    border-left-style: solid;
    border-right-color: rgb(246, 128, 128);
    border-right-style: solid;
}
.rightOnly.compareNode .dispHelper {
    border-left-color: rgb(246, 128, 128);
    border-left-style: solid;
    border-right-color: rgb(213, 213, 255);
    border-right-style: solid;
}

.exactSame {
    background-color: rgb(128, 246, 128);
}
.similar {
    background-color: rgb(212, 255, 212);
}
.majorDiff {
    background-color: rgb(246, 128, 128);
}
.minorDiff {
    background-color: rgb(255, 247, 212);
}

.lvlSpacer {
    display: inline-block;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("compare-node-result", {
        template: template,
        props: ["node"],
        data: function() {
            return {};
        },
        methods: {
            getClasses: function() {
                let cssClasses = ["compareNode"];

                if (!this.node._leftNode && this.node._rightNode) {
                    cssClasses.push("rightOnly");
                } else if (!this.node._rightNode && this.node._leftNode) {
                    cssClasses.push("leftOnly");
                } else {
                    //Both sides do some additional checks
                    if (this.node._leftNode && this.node._rightNode && this.node._leftNode.physicalid === this.node._rightNode.physicalid) {
                        cssClasses.push("exactSame");
                    } else if (this.node.majorDiffs && this.node.noticeableDiffs) {
                        if (this.node.majorDiffs.length === 0 && this.node.noticeableDiffs.length === 0) {
                            cssClasses.push("similar");
                        } else if (this.node.majorDiffs.length > 0) {
                            cssClasses.push("majorDiff");
                        } else if (this.node.noticeableDiffs.length > 0) {
                            cssClasses.push("minorDiff");
                        }
                    }
                }

                return cssClasses;
            },
            getSpacerWidth: function() {
                return "width:" + this.node._level * 1.5 + "em;";
            },
            getNodeName: function() {
                return (this.node._leftNode && this.node._leftNode.name) || (this.node._rightNode && this.node._rightNode.name) || "...";
            },
            getTooltip: function() {
                let strTooltip = "";
                if (this.node._leftNode && this.node._rightNode) {
                    if (this.node.majorDiffs.length > 0) {
                        strTooltip += "Major Differences on : " + this.node.majorDiffs.join(", ");
                    }
                    if (this.node.noticeableDiffs.length > 0) {
                        if (strTooltip.length !== 0) {
                            strTooltip += "\n";
                        }
                        strTooltip += "Noticeable Differences on : " + this.node.noticeableDiffs.join(", ");
                    }
                    if (strTooltip.length === 0) {
                        if (this.node._leftNode.physicalid === this.node._rightNode.physicalid) {
                            strTooltip = "Objects are exactly the same (same database object)";
                        } else {
                            strTooltip = "No Differences detected (based on configuration of the comparison)";
                        }
                    }
                } else if (!this.node._rightNode) {
                    strTooltip = "Object only in the left structure";
                } else {
                    strTooltip = "Object only in the right structure";
                }

                return strTooltip;
            }
        }
    });
});
</script>