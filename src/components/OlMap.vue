<template>
  <v-app id="inspire" dark>
    <!-- 侧滑功能栏 -->
    <v-navigation-drawer
      fixed
      :clipped="$vuetify.breakpoint.lgAndUp"
      elevation-15
      app
      floating
      v-model="drawer"
      light
      id="nav-drawer"
    >
      <div id="infoBox">
        <v-flex md12 id="layerinfo-top">
          <v-list dense v-show="isToolListShow">
            <template v-for="item in items">
              <v-list-group
                v-if="item.children"
                v-model="item.model"
                :key="item.text"
                :prepend-icon="item.model ? item.icon : item['icon-alt']"
                append-icon
              >
                <v-list-tile slot="activator">
                  <v-list-tile-content>
                    <v-list-tile-title>{{ item.text }}</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
                <v-list-tile
                  v-for="(child, i) in item.children"
                  :key="i"
                  @click.stop="clickCallback(child.method)"
                >
                  <v-list-tile-action v-if="child.icon">
                    <v-icon>{{ child.icon }}</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-content>
                    <v-list-tile-title>{{ child.text }}</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </v-list-group>
              <v-list-group v-else-if="item.boxselection" :key="item.text" @click.stop>
                <v-list-tile slot="activator">
                  <v-list-tile-action>
                    <v-icon>{{ item.icon }}</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-content>
                    <v-list-tile-title>{{ item.text }}</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
                <v-list-tile>
                  <v-select
                    label="选择图层"
                    :items="item.selects"
                    return-object
                    v-model="item.boxLayerSelection"
                  ></v-select>
                </v-list-tile>
              </v-list-group>
              <v-list-tile v-else :key="item.text" @click.stop>
                <v-list-tile-action>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                  <v-list-tile-title>{{ item.text }}</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </template>
          </v-list>
        </v-flex>
        <!-- 属性列表 start -->
        <properties-list :items="layerInfo" v-if="selection"></properties-list>
        <!-- 属性列表 end -->
      </div>
    </v-navigation-drawer>
    <!-- 工具栏 -->
    <v-toolbar color="teal lighten-2" dense fixed clipped-left app>
      <v-tooltip bottom>
        <v-btn icon slot="activator" @click.stop="drawer = !drawer">
          <v-icon>fab fa-connectdevelop</v-icon>
        </v-btn>
        <span>工具箱</span>
      </v-tooltip>

      <v-btn icon>
        <v-icon class="mx-2" size="30px">fas fa-tree</v-icon>
      </v-btn>
      <v-toolbar-title class="mr-5 align-center">
        <span class="title">天目山林场森林资源管理系统</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-tooltip bottom>
        <v-btn icon slot="activator">
          <v-icon>fas fa-calendar-check</v-icon>
        </v-btn>
        <span>事件</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn icon slot="activator">
          <v-icon>fas fa-user-circle</v-icon>
        </v-btn>
        <span>用户中心</span>
      </v-tooltip>
    </v-toolbar>
    <!-- 地图内容 -->
    <v-content app>
      <div id="mapContainer" class="mapContainer" ref="mapContainer" :style="{height: mapHeight}">
        <div id="map" class="map">
          <pre id="info"/>
        </div>
      </div>
    </v-content>
    <v-footer app color="teal lighten-2">
      <v-container fill-height fluid>
        <v-layout justify-center align-center>
          <span>Zhejiang A&F University &copy; {{ new Date().getFullYear() }}</span>
        </v-layout>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
/* openlayers modules */
// Style
import "ol/ol.css";
import "ol-popup/src/ol-popup.css";
import "ol-layerswitcher/src/ol-layerswitcher.css";
// Main Modules
import Map from "ol/Map";
import View from "ol/View";
import LayerGroup from "ol/layer/Group";
import {
  get as getprojection,
  transform as transformprojection
} from "ol/proj";
import { getWidth, getTopLeft } from "ol/extent";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import TileWMS from "ol/source/TileWMS";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text, Icon } from "ol/style";
import Collection from "ol/Collection";
// 地图控件
import { defaults as defaultControls, Control } from "ol/control";
import Zoom from "ol/control/Zoom";
import ScaleLine from "ol/control/ScaleLine";
import ZoomSlider from "ol/control/ZoomSlider";
import ZoomToExtent from "ol/control/ZoomToExtent";
import OverviewMap from "ol/control/OverviewMap";
import FullScreen from "ol/control/FullScreen";
// Extension
import LayerSwitcher from "ol-layerswitcher";
import Popup from "ol-popup";
import EventBus from "../plugins/eventBus.js";
// projection
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { fromLonLat } from "ol/proj.js";
// Web Client
import axios from "axios";
// Interaction
import { DragBox, Select } from "ol/interaction";
import { platformModifierKeyOnly } from "ol/events/condition";

import PropertiesList from "../components/PropertiesList";
import QueryingBox from "../components/QueryingBox";
import FilterUtils from "../utils/FilterUtils.js";

export default {
  components: {
    PropertiesList,
    QueryingBox
  },
  data() {
    return {
      map: null,
      view: null,
      layerInfo: new Array(),
      drawer: null,
      mapHeight: document.body.clientHeight - 84,
      quickPanTo: false,
      selection: false,
      boxSelection: false,
      boxSelectionItems: FilterUtils.layerProperties,
      isToolListShow: true,
      // boxLayerSelection: null,
      querySelection: null,
      quickQueryDialog: false,
      items: [
        {
          icon: "fas fa-thumbtack",
          "icon-alt": "fas fa-crosshairs",
          text: "快速到达工具",
          children: [
            { text: "东天目林区", method: "panToDongTianmu" },
            { text: "千秋林区", method: "panToQianqiu" },
            { text: "一都林区", method: "panToYidu" }
          ]
        },
        {
          icon: "fas fa-vector-square",
          text: "框选要素工具",
          boxselection: true,
          selects: [
            { text: "林场小班图层", index: 1 },
            { text: "林场公益林图层", index: 2 },
            { text: "林场古树名木图层", index: 3 }
          ],
          boxLayerSelection: null
        },
        {
          icon: "fas fa-search-location",
          "icon-alt": "fas fa-search",
          text: "查询要素工具",
          children: [{ text: "快速查询", method: "openQuickQuery" }]
        },
        {
          icon: "fas fa-chart-pie",
          "icon-alt": "fas fa-chart-bar",
          text: "统计分析工具",
          children: [{ icon: "add", text: "Create label" }]
        },
        {
          icon: "fas fa-edit",
          "icon-alt": "fas fa-pencil-alt",
          text: "要素编辑工具",
          children: [
            { text: "Import" },
            { text: "Export" },
            { text: "Print" },
            { text: "Undo changes" },
            { text: "Other contacts" }
          ]
        },
        {
          icon: "fas fa-vr-cardboard",
          text: "3D展示工具"
        }
      ]
    };
  },
  mounted() {
    //#region 投影、基本参数定义
    // 定义CGCS2000 GK 120E坐标系
    proj4.defs(
      "EPSG:4549",
      "+proj=tmerc +lat_0=0 +lon_0=120 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs"
    );
    register(proj4);
    var proj4549 = new getprojection("EPSG:4549");
    proj4549.setExtent([347872.25, 2703739.74, 599933.05, 5912395.2]);
    // 定义WGS84 坐标系
    var projection = getprojection("EPSG:3857");
    var projectionExtent = projection.getExtent();
    var size = getWidth(projectionExtent) / 256;
    var resolutions = new Array(21);
    var matrixIds = new Array(21);
    for (let z = 0; z < 22; z++) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }
    var TileGrid = new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    });
    // console.log(projectionExtent);
    // console.log(projection);
    // console.log(size);
    //#endregion

    //#region  数据图层
    /* 矢量图层样式 start */
    var forestCourseStyle = new Style({
      fill: new Fill({
        color: "#e0f7fa"
      }),
      stroke: new Stroke({
        color: "#26c6da",
        width: 4
      }),
      text: new Text({
        font: "12px Calibri,sans-serif",
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      })
    });

    var welfareForestCourseStyle = new Style({
      fill: new Fill({
        color: "#ffecb3"
      }),
      stroke: new Stroke({
        color: "#ffd54f",
        width: 4
      }),
      text: new Text({
        font: "12px Calibri,sans-serif",
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      })
    });

    var iconStyle = new Style({
      image: new Icon({
        src: "http://localhost:8090/Images/old-valtrees.png"
      })
    });
    /* 矢量图层样式 end */

    //WFS服务图层（GeoJSON）
    /* 矢量图数据源 start */
    var TMSCourseSource = new VectorSource({
      format: new GeoJSON(),
      url: extent => {
        return (
          // "http://47.106.130.112:8080/geoserver/ol-forestdb/wfs?service=WFS&" +
          // "version=1.1.0&request=GetFeature&typename=ol-forestdb:tmslinchangcourses&" +
          // "outputFormat=application/json&srsname=EPSG:3857&" +
          // "bbox=" +
          // extent.join(",") +
          // ",EPSG:3857"
          "http://localhost:8090/geoserver/ol-forestdb/wfs?service=WFS&" +
          "version=1.1.0&request=GetFeature&typename=ol-forestdb:tmslinchangcourses&" +
          "outputFormat=application/json&srsname=EPSG:3857&" +
          "bbox=" +
          extent.join(",") +
          ",EPSG:3857"
        );
      },
      strategy: bboxStrategy
    });

    var TMSWelfareCourseSource = new VectorSource({
      format: new GeoJSON(),
      url: extent => {
        return (
          // "http://47.106.130.112:8080/geoserver/ol-forestdb/wfs?service=WFS&" +
          // "version=1.1.0&request=GetFeature&typename=ol-forestdb:tmswelfareforestcoursesdata&" +
          // "outputFormat=application/json&srsname=EPSG:3857&" +
          // "bbox=" +
          // extent.join(",") +
          // ",EPSG:3857"
          "http://localhost:8090/geoserver/ol-forestdb/wfs?service=WFS&" +
          "version=1.1.0&request=GetFeature&typename=ol-forestdb:tmswelfareforestcourses&" +
          "outputFormat=application/json&srsname=EPSG:3857&" +
          "bbox=" +
          extent.join(",") +
          ",EPSG:3857"
        );
      },
      strategy: bboxStrategy
    });

    var valuableTreesSource = new VectorSource({
      format: new GeoJSON(),
      url: extent => {
        return (
          // "http://47.106.130.112:8080/geoserver/ol-forestdb/wfs?service=WFS&" +
          // "version=1.1.0&request=GetFeature&typename=ol-forestdb:oldvaluabletrees&" +
          // "outputFormat=application/json&srsname=EPSG:3857&" +
          // "bbox=" +
          // extent.join(",") +
          // ",EPSG:3857"
          "http://localhost:8090/geoserver/ol-forestdb/wfs?service=WFS&" +
          "version=1.1.0&request=GetFeature&typename=ol-forestdb:oldvaluabletrees&" +
          "outputFormat=application/json&srsname=EPSG:3857&" +
          "bbox=" +
          extent.join(",") +
          ",EPSG:3857"
        );
      },
      strategy: bboxStrategy
    });

    var spatial_analysis_source = new VectorSource();
    /* 矢量图数据源 end */

    /* 矢量图层 start */
    var TMSCourse_layer = new VectorLayer({
      title: "林场小班图层",
      opacity: 0.75,
      zIndex: 10,
      source: TMSCourseSource,
      style: forestCourseStyle
    });

    var TMSWelfareCourse_layer = new VectorLayer({
      title: "林场公益林图层",
      opacity: 0.6,
      zIndex: 20,
      source: TMSWelfareCourseSource,
      style: welfareForestCourseStyle
    });

    var valuableTrees_layer = new VectorLayer({
      title: "林场古树名木图层",
      zIndex: 100,
      source: valuableTreesSource,
      style: iconStyle
    });

    var spatial_analysis_layer = new VectorLayer({
      title: "空间分析图层",
      zIndex: 1000,
      style: welfareForestCourseStyle,
      source: spatial_analysis_source
    });

    // 森林事件图层
    var forestRanger_layer = new VectorLayer({
      title: "护林员巡护路线",
      zIndex: 200
    });
    // 森林火灾图层
    var forestFire_layer = new VectorLayer({
      title: "森林火灾图层",
      zIndex: 300
    });
    /* 矢量图层 end */

    // WMS服务图层（不能修改）
    /* 图像图层 start */
    var tianmushan_courselayer = new TileLayer({
      title: "林场小班图层",
      zIndex: 10,
      visible: true,
      opacity: 0.8,
      source: new TileWMS({
        // url: "http://47.106.130.112:8080/geoserver/ol-forestdb/wms",
        url: "http://localhost:8090/geoserver/ol-forestdb/wms",
        params: {
          FORMAT: "image/png",
          VERSION: "1.1.0",
          tiled: true,
          LAYERS: "ol-forestdb:tmslinchangcourses"
        }
      })
    });

    var tianmushan_welfareforestlayer = new TileLayer({
      title: "林场公益林图层",
      zIndex: 20,
      visible: true,
      opacity: 0.8,
      source: new TileWMS({
        // url: "http://47.106.130.112:8080/geoserver/ol-forestdb/wms",
        url: "http://localhost:8090/geoserver/ol-forestdb/wms",
        params: {
          FORMAT: "image/png",
          VERSION: "1.1.0",
          tiled: true,
          LAYERS: "ol-forestdb:tmswelfareforestcoursesdata"
        }
      })
    });

    var tianmushan_buildingslayer = new TileLayer({
      title: "林场房屋图层",
      zIndex: 30,
      visible: true,
      opacity: 0.8,
      source: new TileWMS({
        // url: "http://47.106.130.112:8080/geoserver/ol-forestdb/wms",
        url: "http://localhost:8090/geoserver/ol-forestdb/wms",
        params: {
          FORMAT: "image/png",
          VERSION: "1.1.0",
          tiled: true,
          LAYERS: "ol-forestdb:residentbuildings"
        }
      }),
      opacity: 0.75
    });

    var tianmushan_waterfacelayer = new TileLayer({
      title: "林场水域图层",
      zIndex: 40,
      visible: true,
      opacity: 0.8,
      source: new TileWMS({
        // url: "http://47.106.130.112:8080/geoserver/ol-forestdb/wms",
        url: "http://localhost:8090/geoserver/ol-forestdb/wms",
        params: {
          FORMAT: "image/png",
          VERSION: "1.1.0",
          tiled: true,
          LAYERS: "ol-forestdb:watersurfaces"
        }
      }),
      opacity: 0.75
    });

    var tianmushan_valuabletreeslayer = new TileLayer({
      title: "林场古树名木图层",
      zIndex: 50,
      visible: true,
      source: new TileWMS({
        // url: "http://47.106.130.112:8080/geoserver/ol-forestdb/wms",
        url: "http://localhost:8090/geoserver/ol-forestdb/wms",
        params: {
          FORMAT: "image/png",
          VERSION: "1.1.0",
          tiled: true,
          LAYERS: "ol-forestdb:oldvaluabletrees"
        }
      })
    });

    // 天地图底图
    var base_layers = new LayerGroup({
      title: "基础底图",
      fold: "open",
      layers: [
        new LayerGroup({
          title: "全国矢量地图",
          combine: true,
          visible: false,
          layers: [
            new TileLayer({
              source: new WMTS({
                url:
                  "https://t{0-7}.tianditu.gov.cn/vec_w/wmts?tk=7d8ed5074765eff413b73de9bcb46719",
                layer: "vec",
                format: "tiles",
                projection: projection,
                matrixSet: "w",
                tileGrid: TileGrid,
                style: "default",
                wrapX: true
              })
            }),
            new TileLayer({
              source: new WMTS({
                url:
                  "https://t{0-7}.tianditu.gov.cn/cva_w/wmts?tk=7d8ed5074765eff413b73de9bcb46719",
                layer: "cva",
                format: "tiles",
                projection: projection,
                matrixSet: "w",
                tileGrid: TileGrid,
                style: "default",
                wrapX: true
              })
            })
          ]
        }),
        new LayerGroup({
          title: "全国卫星地图",
          // type: 'base',
          combine: true,
          visible: true,
          layers: [
            new TileLayer({
              source: new WMTS({
                url:
                  "https://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=7d8ed5074765eff413b73de9bcb46719",
                layer: "img",
                format: "tiles",
                projection: projection,
                matrixSet: "w",
                tileGrid: TileGrid,
                style: "default",
                wrapX: true
              })
            }),
            new TileLayer({
              source: new WMTS({
                url:
                  "https://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=7d8ed5074765eff413b73de9bcb46719",
                layer: "cia",
                format: "tiles",
                projection: projection,
                matrixSet: "w",
                tileGrid: TileGrid,
                style: "default",
                wrapX: true
              })
            })
          ]
        })
      ]
    });
    /* 图像图层 end */
    //#endregion

    //#region 地图基本外观定义
    (this.view = new View({
      projection: "EPSG:3857",
      center: [13304261, 3548705],
      zoom: 15,
      minZoom: 2,
      maxZoom: 18
    })),
      (this.map = new Map({
        target: "map",
        logo: {
          src: "localhost:8090/Images/oldvaltrees.png",
          href: "http://www.openstreetmap.org/"
        },
        layers: [
          new LayerGroup({
            title: "林场事件图层",
            fold: "open",
            layers: [forestFire_layer, forestRanger_layer]
          }),
          new LayerGroup({
            title: "林场信息图层",
            fold: "open",
            layers: [
              TMSCourse_layer,
              TMSWelfareCourse_layer,
              tianmushan_waterfacelayer,
              tianmushan_buildingslayer,
              valuableTrees_layer
            ]
          }),
          base_layers
        ],
        view: this.view,
        controls: defaultControls({
          attribution: false,
          rotate: false
        }).extend([
          new Zoom({
            // 放大缩小比例
            zoomOutTipLabel: "缩小",
            zoomInTipLabel: "放大"
          }),
          new OverviewMap({
            //缩略图
            tipLabel: "缩略图",
            layers: [base_layers]
          }),
          new ScaleLine(), // 比例尺
          new ZoomSlider(), // 比例大小调整
          new ZoomToExtent({
            // 重置范围
            tipLabel: "重置范围",
            extent: [
              13276175.459538622,
              3539493.031773371,
              13308393.666960824,
              3558869.8184436634
            ]
          }),
          new FullScreen() // 全屏视图
        ])
      }));
    /* 图层管理 start */
    var layerSwitcher = new LayerSwitcher({
      tipLabel: "图层切换"
    });
    this.map.addControl(layerSwitcher);
    /* 图层管理 end */
    //#endregion

    //#region 地图交互
    /* 单击选择 start */
    var select = new Select();
    this.map.addInteraction(select);
    var info = document.getElementById("info");
    this.map.on("singleclick", evt => {
      var features = this.map.getFeaturesAtPixel(evt.pixel);
      if (!features) {
        this.selection = false;
        this.isToolListShow = true;
        return;
      }
      this.selection = true;
      this.isToolListShow = !this.isToolListShow;
      this.layerInfo = Array(features[0].getProperties());
      console.log(this.layerInfo);
    });
    /* 单击选择 end */

    /* 框选 start */
    var selectedFeatures = select.getFeatures();
    var boxFeatures = new Array();
    var boxSelectionSource = null;
    var dragBoxSelect = new DragBox({
      condition: platformModifierKeyOnly
    });
    this.map.addInteraction(dragBoxSelect);
    dragBoxSelect.on("boxend", () => {
      var extent = dragBoxSelect.getGeometry().getExtent();
      switch (this.items[1].boxLayerSelection.index) {
        case 1:
          boxSelectionSource = TMSCourseSource;
          break;
        case 2:
          boxSelectionSource = TMSWelfareCourseSource;
          break;
        case 3:
          boxSelectionSource = valuableTreesSource;
        default:
          break;
      }
      if (!boxSelectionSource) {
        return;
      }
      this.boxSelection = !this.boxSelection;
      console.log(this.items[1].boxLayerSelection.index);
      boxSelectionSource.forEachFeatureIntersectingExtent(extent, function(
        feature
      ) {
        console.log(feature.getProperties());

        boxFeatures.push(feature.getProperties());
        selectedFeatures.push(feature);
      });
      if (!selectedFeatures) {
        this.selection = false;
        return;
      }
      this.selection = true;
      console.log(this.map.getLayers().getArray());
      console.log(this.drawer);
      this.layerInfo = boxFeatures;
    });

    dragBoxSelect.on("boxstart", function() {
      boxFeatures = new Array();
      selectedFeatures.clear();
    });
    /* 框选 end */

    // Popup
    var popup = new Popup();
    this.map.addOverlay(popup);
    //#endregion
  },
  computed: {},
  created() {
    this.getHeight();
  },
  methods: {
    getHeight() {
      this.mapHeight = window.innerHeight - 84 + "px";
    },
    panToQianqiu() {
      this.view.animate({
        center: [13281279, 3549469],
        duration: 2000
      });
    },
    panToDongTianmu() {
      this.view.animate({
        center: [13304361, 3548676],
        duration: 2000
      });
    },
    panToYidu() {
      this.view.animate({
        center: [13303043, 3555264],
        duration: 2000
      });
    },
    clickCallback(methodWords) {
      console.log("methodWords", methodWords);
      this[methodWords]();
    }
  },
  watch: {}
};
</script>

<style>
@import url("//at.alicdn.com/t/font_752750_gnlztkyps9.css");
#mapContainer {
  width: 100%;
  background: white;
  height: 100%;
}

#map {
  height: 100%;
}

#map .ol-overviewmap,
.ol-custom-overviewmap .ol-uncollapsible {
  bottom: 1em;
  left: auto;
  right: 1em;
  top: auto;
}

#map .ol-overviewmap:not(.ol-collapsed) {
  border: 1px solid white;
}

#map .ol-overviewmap .ol-overviewmap-map {
  border: none;
  width: 200px;
  height: 200px;
}

#map .ol-overviewmap .ol-overviewmap-box {
  border: 2px solid red;
}

#map .ol-overviewmap:not(.ol-collapsed) button {
  bottom: 0;
  left: auto;
  right: 0;
  top: auto;
}

#map .ol-rotate {
  top: 170px;
  right: 0;
}

#map .ol-scale-line {
  background: rgba(0, 184, 212, 0.8);
  border-radius: 2px;
  bottom: 8px;
  left: 8px;
  padding: 2px;
  position: absolute;
}

#map .ol-scale-line-inner {
  border: 1px solid #eee;
  border-top: none;
  color: #eee;
  font-size: 12px;
  text-align: center;
  margin: 1px;
  will-change: contents, width;
}

#map .ol-zoomslider {
  top: 4.5em;
  left: 0.5em;
  height: 150px;
}
#map .ol-zoomslider button {
  position: relative;
  height: 15px;
}

#map .ol-control button {
  background-color: rgba(0, 184, 212, 0.8);
  display: block;
  margin: 1px;
  padding: 0;
  color: white;
  font-size: 1.14em;
  font-weight: bold;
  text-decoration: none;
  text-align: center;
  height: 1.375em;
  width: 1.375em;
  line-height: 0.4em;
  border: none;
  border-radius: 2px;
}

#map .ol-zoom-extent {
  top: 16em;
  bottom: auto;
}

#map .layer-switcher button {
  width: 38px;
  height: 38px;
  /* background-image: url("http://47.106.130.112:8080/Images/layers.png"); */
  /*logo.png*/
  background-image: url("http://localhost:8090/Images/layers.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-color: rgba(224, 224, 224, 0.8);
  background-position-x: center;
  background-position-y: center;
  border: none;
}

#map .layer-switcher li.group > label {
  color: black;
}

#map .layer-switcher li.layer label,
.layer-switcher li.layer input {
  display: table-cell;
  vertical-align: sub;
  color: black;
}

#map #info {
  z-index: 1;
  opacity: 0;
  position: absolute;
  bottom: 0;
  left: 100px;
  margin: 0;
  background: rgba(0, 60, 136, 0.7);
  color: white;
  border: 0;
  transition: opacity 100ms ease-in;
}

#nav-drawer {
  z-index: 99999;
}
</style>
