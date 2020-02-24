<template>
    <table class='compareStructureTable'>
        <thead>
            <tr>
                <th style="width:2em;"> </th>
                <th>Left structure</th>
                <th>Right Structure</th>
                <th title='Major Differences'>Maj. Diff.</th>
                <th title='Noticeable Differences'>Diff.</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for='(item,i) in flattenStructure()' :key='i' is="compare-node-result" :node='item'></tr>
        </tbody>
    </table>
</template>

<style scoped>
table.compareStructureTable {
    min-width: 100%;
}

table.compareStructureTable th {
    text-align: center;
    background-color: #f9fafb;
    font-weight: bold;
}
</style>

<script>
define(["vue"], function(Vue) {
    return Vue.component("compare-structure-result", {
        template: template,
        props: ["structure", "level"],
        data: function() {
            return {};
        },
        methods: {
            flattenStructure: function() {
                let flatStructure = [];
                let recursStructure = node => {
                    flatStructure.push(node);
                    if (node.childs) {
                        //Copy the array before sorting it to avoid issues with reactivty that is trying to update the view making a loop
                        let childsArraySorted = node.childs.slice().sort((a, b) => {
                            let res = 0;
                            let aVal = "",
                                bVal = "";
                            if (a._leftNode) {
                                aVal = a._leftNode.name.toLowerCase();
                            } else if (a._rightNode) {
                                aVal = a._rightNode.name.toLowerCase();
                            }
                            if (b._leftNode) {
                                bVal = b._leftNode.name.toLowerCase();
                            } else if (b._rightNode) {
                                bVal = b._rightNode.name.toLowerCase();
                            }
                            return aVal < bVal ? -1 : bVal < aVal ? 1 : 0;
                        });
                        for (let i = 0; i < childsArraySorted.length; i++) {
                            let childNode = childsArraySorted[i];
                            recursStructure(childNode);
                        }
                    }
                };
                recursStructure(this.structure);
                return flatStructure;
            }
        }
    });
});
</script>