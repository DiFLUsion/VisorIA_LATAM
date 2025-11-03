require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/LineSymbol3DLayer",
  "esri/symbols/LineSymbol3D",
  "esri/widgets/TimeSlider",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/widgets/Search",
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  "esri/Graphic"
], (
  Map,
  SceneView,
  FeatureLayer,
  SimpleRenderer,
  LineSymbol3DLayer,
  LineSymbol3D,
  TimeSlider,
  Expand,
  Legend,
  BasemapGallery,
  Home,
  ScaleBar,
  Search,
  QueryTask,
  Query,
  Graphic
) => {

/***********************************************
 *              SIMBOLOGIA BROTES
 ***********************************************/
const colorsBrotes = [[255, 255, 0, 0.6], [255, 255, 255, 0.6], [255, 127, 127, 0.6]];

function crearSimbolo(color) {
  return {
    type: "point-3d",
    symbolLayers: [{
      type: "icon",
      resource: { primitive: "circle" },
      material: { color },
      size: 10
    }]
  };
}

const CaptiveSym = crearSimbolo(colorsBrotes[0]);
const DomesticSym = crearSimbolo(colorsBrotes[1]);
const WildSym = crearSimbolo(colorsBrotes[2]);

const brotesRenderer = {
  type: "unique-value",
  legendOptions: { title: "Especies" },
  field: "is_wild",
  uniqueValueInfos: [
    { value: "Wild",     symbol: WildSym,     label: "Wild" },
    { value: "Domestic", symbol: DomesticSym, label: "Domestic" },
    { value: "Captive",  symbol: CaptiveSym,  label: "Captive" }
  ]
};

// opcional, ya no se usa como renderer
const iconSymbol = {
  type: "point-3d",
  symbolLayers: [{ type: "icon", size: 10, material: { color: [255, 0, 0, 0.4] } }]
};
const iconSymbolRenderer = { type: "simple", symbol: iconSymbol };

const featureLayerBrotes = new FeatureLayer({
  url: "https://gis.inia.es/server/rest/services/CISA/outbreaks_HPAI/FeatureServer/0",
  copyright: "Influenza Aviar",
  title: "Outbreak",
  outFields: ["*"],
  visible: true,
  renderer: brotesRenderer,
  popupTemplate: {
    title: "Outbreak information",
    content: getInfoBrotes,
    returnGeometry: true,
    fieldInfos: [{ fieldName: "Reporting_date", format: { dateFormat: "short-date" } }]
  }
});

function getInfoBrotes(feature) {
  return "<p>Country: {country_name}</p>" +
         "<ul>" +
         "<li>Report date: {Reporting_date}</li>" +
         "<li>Species: {species}</li>" +
         "</ul>";
}

var lineSymbolMigrations = new LineSymbol3D({
  symbolLayers: [ new LineSymbol3DLayer({ material: { color: [237, 237, 237, 0.3] }, size: 0.1 }) ]
});

var rendererMigrations = new SimpleRenderer({ symbol: lineSymbolMigrations });

const featureLayerRutas = new FeatureLayer({
  url: "https://services.arcgis.com/8df8p0NlLFEShl0r/arcgis/rest/services/rutas_UsaFinal/FeatureServer",
  copyright: "EySA | INIA-CSIC",
  title: "Movements",
  outFields: ["*"],
  renderer: rendererMigrations,
  popupTemplate: {
    title: "Group: {Group_spec}<br>Total number of banding records: {Total}"
  },
  visible: false,
  availableFields: true
});

const rendererNuts = {
  type: "simple",
  symbol: {
    type: "simple-fill",
    color: [178, 220, 247, 0.03],
    outline: { color: [4, 178, 194], width: 1 }
  }
};

window.onload = function () {
  document.getElementById("migrations").addEventListener("click", activarMigrations);
  view.ui.add(migrations, "top-right");
};

function activarMigrations() {
  featureLayerRutas.visible = !featureLayerRutas.visible;
}

/// DEFINICIÓN DE LOS NUTS
const featureLayerNuts = new FeatureLayer({
  url: "https://services.arcgis.com/8df8p0NlLFEShl0r/ArcGIS/rest/services/nuts_USA/FeatureServer/0",
  copyright: "EySA | INIA-CSIC",
  title: "Nuts",
  outFields: ["*"],
  visible: true,
  renderer: rendererNuts,
  supportsQuery: true,
  popupTemplate: {
    title: "Admin: {ADMIN_NAME},<br>Country: {CNTRY_NAME}",
    content: getInfoComarcas,
    visible: false,
    returnGeometry: true
  }
});

/// ESTA FUNCIÓN PROGRAMA EL POPUPTEMPLATE
function getInfoComarcas(feature) {
  var graphic = feature.graphic;
  var attributes = graphic.attributes;

  var urlRutas = "https://raw.githubusercontent.com/josh4ever/applicacionWeb.github.io/main/GeoJSON/rutasUsa.geojson";
  var request = new XMLHttpRequest();
  request.open("GET", urlRutas, false);
  request.send(null);
  let rutas = JSON.parse(request.responseText);

  for (let index = 0; index < rutas.features.length; index++) {
    const element = rutas.features[index];
    if (element.properties.FIPS_ADMIN_Recov == attributes.FIPS_ADMIN ||
        element.properties.FIPS_ADMIN_banding == attributes.FIPS_ADMIN) {
      var polyline = { type: "polyline", paths: element.geometry.coordinates };
      var lineSymbol = { type: "simple-line", color: [51, 200, 200], width: 1 };
      var polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol,
        popupTemplate: {
          title: "Group_spec: " + element.properties.Group_spec + "<br>Total: " + element.properties.Total,
          content: getInfoComarcas,
          visible: false,
          returnGeometry: true
        }
      });
      view.graphics.add(polylineGraphic);
    }
  }

  view.on("hold", function () {
    view.graphics.removeAll();
  });
}

// Create the Map
const map = new Map({
  basemap: "hybrid",
  layers: [featureLayerBrotes, featureLayerNuts, featureLayerRutas]
});

// Create the SceneView and set initial camera
const view = new SceneView({
  container: "viewDiv",
  map: map,
  camera: {
    position: { latitude: 20.0, longitude: -105.0, z: 10000000 },
    tilt: 11.5,
    heading: 1
  },
  highlightOptions: { color: "cyan" }
});

view.constraints = { minScale: 147000000 };

// Leyenda
const legendExpand = new Expand({
  collapsedIconClass: "esri-icon-legend",
  expandIconClass: "esri-icon-legend",
  expandTooltip: "Legend",
  view: view,
  content: new Legend({ view: view }),
  expanded: false
});
view.ui.add(legendExpand, "top-left");

// SCALEBAR
var scaleBar = new ScaleBar({ view: view, unit: "metric", estilo: "line" });
view.ui.add(scaleBar, { position: "bottom-right" });

// SEARCH
var searchWidget = new Search({ view: view });
view.ui.add(searchWidget, { position: "top-right" });

// BASEMAP GALLERY
var basemapGallery = new BasemapGallery({ view: view, container: document.createElement("div") });

var bgExpand = new Expand({
  collapsedIconClass: "esri-icon-basemap",
  expandIconClass: "esri-icon-basemap",
  expandTooltip: "Mapas",
  content: basemapGallery,
  view: view
});

basemapGallery.watch("activeBasemap", function () {
  var mobileSize = view.heightBreakpoint === "xsmall" || view.widthBreakpoint === "xsmall";
  if (mobileSize) { bgExpand.collapse(); }
});
view.ui.add(bgExpand, "top-right");

// HOME
var homeBtn = new Home({ view: view });
view.ui.add(homeBtn, "top-right");

// TIMESLIDER DE BROTES
const timeSliderBrotes = new TimeSlider({
  container: "timeSliderBrotes",
  playRate: 100,
  view: view,
  stops: { interval: { value: 1, unit: "days" } }
});
view.ui.add(timeSliderBrotes, "manual");

// esperar a la layerView
view.whenLayerView(featureLayerBrotes).then(function (lv) {
  layerViewBrotes = lv;

  const startBrotes = new Date(2003, 0, 1);
  const LastMonday = new Date();
  LastMonday.setHours(0, 0, 0, 0);
  LastMonday.setDate(LastMonday.getDate());

  timeSliderBrotes.fullTimeExtent = { start: startBrotes, end: LastMonday };

  const endBrotes = new Date(LastMonday);
  endBrotes.setDate(endBrotes.getDate() - 365);

  timeSliderBrotes.values = [endBrotes, LastMonday];
});
});
