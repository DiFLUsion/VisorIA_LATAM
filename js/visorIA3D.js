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
  "esri/Graphic",

], (Map,
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
  Graphic) => {


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
  legendOptions: {
    title: "Especies"
  },
  field: "is_wild",

  uniqueValueInfos: [
    {
      value: "Wild",
      symbol: WildSym,
      label: "Wild"
    },
    {
      value: "Domestic",
      symbol: DomesticSym,
      label: "Domestic"
    },
    {
      value: "Captive",
      symbol: CaptiveSym,
      label: "Captive"
    }
  ]
};



  // Create iconSymbol and add to renderer
  const iconSymbol = {
    type: "point-3d", // autocasts as new PointSymbol3D()
    symbolLayers: [
      {
        type: "icon", // autocasts as new IconSymbol3DLayer()
        size: 10,
        // resource: {
        //   primitive: "square"
        // },
        material: {
          color: [255, 0, 0, 0.4]
        }
      }
    ]
  };
  const iconSymbolRenderer = {
    type: "simple", // autocasts as new SimpleRenderer()
    symbol: iconSymbol
  };
  // Request feature layers and overwrite renderer

  const featureLayerBrotes = new FeatureLayer({
    url: "https://gis.inia.es/server/rest/services/CISA/outbreaks_HPAI/FeatureServer/0",
    copyright: "Influenza Aviar",
    title: "Outbreak",
    outFields: ['*'],
    visible: true,
    renderer: iconSymbolRenderer,
    popupTemplate: {
      title: "Outbreak information",
      content: getInfoBrotes,
      returnGeometry: true,
      fieldInfos: [
        {
          fieldName: 'Reporting_date',
          format: {
            dateFormat: 'short-date'
          }
        }
      ],
    },
  },
renderer: brotesRenderer,

);


function getInfoBrotes(feature) {
  return "<p>Country: {country_name}</p>" +
         "<ul>" +
         "<li>Report date: {Reporting_date}</li>" +
         "<li>Species: {species}</li>" +
          "" +
         "</ul>";
}


  var lineSymbolMigrations = new LineSymbol3D({
    symbolLayers: [
      new LineSymbol3DLayer({
        material: { color: [237, 237, 237, 0.3] },
        size: 0.1
      })
    ]
  });


  var rendererMigrations = new SimpleRenderer({

    symbol: lineSymbolMigrations

  });

  const featureLayerRutas = new FeatureLayer({
    url: "https://services.arcgis.com/8df8p0NlLFEShl0r/arcgis/rest/services/rutas_UsaFinal/FeatureServer",
    copyright: "EySA | INIA-CSIC",
    title: "Movements",
    outFields: ["*"],
    renderer: rendererMigrations,
    popupTemplate: {
      title: "Group: {Group_spec}" +
        "<br>Total number of banding records: {Total}",
      /* content: [
          {
              type: "fields",
              fieldInfos: [
                  {
                      fieldName: "species",
                      label: "Especie",
                      visible: true
                  },
              {
                  fieldName: "idAlerta",
                  label: "Codigo",
                  visible: true
              },
              ]
          }
      ] */
    },
    visible: false,
    availableFields: true,

  });



  const rendererNuts = {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [178, 220, 247, 0.03],
      outline: {
        color: [4, 178, 194],
        width: 1
      }
    }
  };

  window.onload = function () {
    document.getElementById("migrations").addEventListener("click", activarMigrations);

    view.ui.add(migrations, "top-right");

  }



  function activarMigrations(feature) {
    if (featureLayerRutas.visible === false) {
      return featureLayerRutas.visible = true;
    } else {
      return featureLayerRutas.visible = false;
    }

  }

  /// DEFINICIÓN DE LOS NUTS

  const featureLayerNuts = new FeatureLayer({
    url: "https://services.arcgis.com/8df8p0NlLFEShl0r/ArcGIS/rest/services/nuts_USA/FeatureServer/0",
    copyright: "EySA | INIA-CSIC",
    title: "Nuts",
    outFields: ['*'],
    visible: true,
    renderer: rendererNuts,
    supportsQuery: true,
    popupTemplate: {
      title: "Admin: {ADMIN_NAME}," +
        "<br>Country: {CNTRY_NAME}"/*  +
            "<br>Group: {Group_spec_1}</br>" */,
      content: getInfoComarcas,
      visible: false,
      returnGeometry: true,
    },

  });



  /// ESTA FUNCIÓN PROGRAMA EL POPUPTEMPLATE
  function getInfoComarcas(feature) {

    /* view.graphics.removeAll() */

    var graphic, attributes;

    graphic = feature.graphic;
    attributes = graphic.attributes;
    /* console.log("Atributes:" + attributes) */


    var urlRutas = 'https://raw.githubusercontent.com/josh4ever/applicacionWeb.github.io/main/GeoJSON/rutasUsa.geojson';

    // Se inicia la peticion ajax a la url ruta

    var request = new XMLHttpRequest();
    request.open("GET", urlRutas, false); // false for synchronous request
    request.send(null);
    let rutas = JSON.parse(request.responseText)
    console.log('obj ruta', rutas)

    for (let index = 0; index < rutas.features.length; index++) {
      const element = rutas.features[index];
      console.log('element', element)
      if (element.properties.FIPS_ADMIN_Recov == attributes.FIPS_ADMIN || element.properties.FIPS_ADMIN_banding == attributes.FIPS_ADMIN ) {
        var polyline = {
          type: "polyline", // new Polyline()
          paths: element.geometry.coordinates
        };
        var lineSymbol = {
          type: "simple-line", // new SimpleLineSymbol()
          color: [51, 200, 200/* , 0.9 */], // RGB color values as an array
          width: 1
        };
        var polylineGraphic = new Graphic({
          geometry: polyline, // Add the geometry created in step 4
          symbol: lineSymbol, // Add the symbol created in step 5
          popupTemplate: {
            title: "Group_spec: " + element.properties.Group_spec +
              "<br>Total: " + element.properties.Total/*  +
                  "<br>Group: {Group_spec_1}</br>" */,
            content: getInfoComarcas,
            visible: false,
            returnGeometry: true,
          },
        });
        view.graphics.add(polylineGraphic);
      }
    }

    view.on("hold", function (e) {
      view.graphics.removeAll(polylineGraphic);
      console.log("Remove")
    })


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
      position: {
        latitude: 20.00000,
        longitude: -105.00000,
        z: 10000000
      },
      tilt: 11.5,
      heading: 1
    },


    highlightOptions: {
      color: "cyan"
    }
  });

  view.constraints = {

    minScale: 147000000
  };

  // Agregar la leyenda
  const legendExpand = new Expand({
    collapsedIconClass: "esri-icon-legend",
    expandIconClass: "esri-icon-legend",
    expandTooltip: "Legend",
    view: view,
    content: new Legend({
      view: view
    }),
    expanded: false
  });
  view.ui.add(legendExpand, "top-left");


  //// SCALEBAR

  var scaleBar = new ScaleBar({
    view: view,
    unit: "metric",
    estilo: "line",
  });
  // Add widget to the bottom left corner of the view
  view.ui.add(scaleBar, {
    position: "bottom-right",

  });

  /// SEARCH WIDGET
  var searchWidget = new Search({
    view: view
  });
  // Add the search widget to the top right corner of the view
  view.ui.add(searchWidget, {
    position: "top-right"
  });

  /// WIDGET DE MAPAS BASES

  var basemapGallery = new BasemapGallery({
    view: view,
    container: document.createElement("div")
  });

  /// BASEMAP GALLERY

  // Create an Expand instance and set the content
  // property to the DOM node of the basemap gallery widget
  // Use an Esri icon font to represent the content inside
  // of the Expand widget
  var bgExpand = new Expand({
    collapsedIconClass: "esri-icon-basemap",
    expandIconClass: "esri-icon-basemap",
    expandTooltip: "Mapas",
    content: basemapGallery,
    view: view
  });

  // close the expand whenever a basemap is selected
  basemapGallery.watch("activeBasemap", function () {
    var mobileSize =
      view.heightBreakpoint === "xsmall" ||
      view.widthBreakpoint === "xsmall";

    if (mobileSize) {
      bgExpand.collapse();
    }
  });

  // Add the expand instance to the ui

  view.ui.add(bgExpand, "top-right");

  /// WIDGET DE HOME PARA LA VISTA INICIAL
  var homeBtn = new Home({
    view: view,

  });

  // Add the home button to the top left corner of the view
  view.ui.add(homeBtn, "top-right");

  ///TIMESLIDER DE BROTES

  const timeSliderBrotes = new TimeSlider({
    container: "timeSliderBrotes",
    // la propiedad "playRate" del widgetb es el tiempo (en milisegundos) entre los pasos de la animación. Este valor predeterminado es 1000.
    playRate: 100,
    view: featureLayerBrotes,
    stops: {
      interval: {
        value: 1,
        unit: "days"
      }
    }
  });
  view.ui.add(timeSliderBrotes, "manual");

  // espera hasta que se cargue la vista de capa
  view.whenLayerView(featureLayerBrotes).then(function (lv) {
    layerViewBrotes = lv;

    // hora de inicio del control deslizante de tiempo
    const startBrotes = new Date(2003, 0, 1);
    /* startBrotes.setHours(0, 0, 0, 0);
    startBrotes.setDate(startBrotes.getDate());
    startBrotes.setDate(startBrotes.getDate() - 8030);*/

    const LastMonday = new Date();
    LastMonday.setHours(0, 0, 0, 0);
    LastMonday.setDate(LastMonday.getDate());

    // set time slider's full extent to
    // until end date of layer's fullTimeExtent
    timeSliderBrotes.fullTimeExtent = {
      start: startBrotes,
      end: LastMonday
    };
    const endBrotes = new Date(LastMonday);
    endBrotes.setDate(endBrotes.getDate() - 365);

    timeSliderBrotes.values = [endBrotes, LastMonday];
  });

});
