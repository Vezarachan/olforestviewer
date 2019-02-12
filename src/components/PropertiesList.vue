<template>
  <div>
    <v-flex md12>
      <v-data-iterator
        row
        wrap
        :items="items"
        :pagination.sync="pagination"
        :rows-per-page-items="rowsPerPageItems"
      >
        <v-flex xs12 sm12 md12 slot="item" slot-scope="props">
          <v-card light>
            <v-card-title headline class="teal lighten-4">图层属性</v-card-title>
            <v-list dense>
              <v-list-tile v-for="(value, key, index) in props.item" :key="index" v-if="index >= 2">
                <v-list-tile-content>{{key}}</v-list-tile-content>
                <v-list-tile-content class="align-end">{{value}}</v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-card>
        </v-flex>
      </v-data-iterator>
      <v-btn round block color="cyan" href="#layerinfo-top">返回顶部</v-btn>
    </v-flex>
  </div>
</template>

<script>
export default {
  data() {
    return {
      pagination: {
        rowsPerPage: 1
      },
      rowsPerPageItems: [1, 2]
    };
  },
  props: ["items"]
};
</script>

<style>
</style>
