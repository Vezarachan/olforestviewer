/* jshint esversion: 6 */
import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Vuetify from "vuetify/lib";

Vue.config.productionTip = false;
Vue.use(Vuetify, {
  iconfont: "fa"
})

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");