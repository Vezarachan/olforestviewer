<template>
  <!-- <v-app>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Vuetify</span>
        <span class="font-weight-light">MATERIAL DESIGN</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank">
        <span class="mr-2">Latest Release</span>
      </v-btn>
    </v-toolbar>

    <v-content>
      <HelloWorld/>
    </v-content>
  </v-app>-->
  <div id="app">
    <router-link to="/home"></router-link>
    <router-view></router-view>
  </div>
</template>

<script>
// import HelloWorld from "./components/HelloWorld";
import OlMap from "./components/OlMap";

export default {
  name: "App",
  components: {
    OlMap
  },
  data() {
    return {
      //
    };
  }
};
</script>

<style>
#app {
  height: 100%;
  padding: 0;
  margin: 0;
}
</style>

