import '../../index.css';
import * as turf from "@turf/turf";
import { GeoJSON2SVG } from 'geojson2svg';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.pattern';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import geojsonRbush from 'geojson-rbush';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo, Component } from 'react';
import { flushSync } from 'react-dom';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, useMapEvent, Rectangle, FeatureGroup, LayerGroup, LayersControl, GeoJSON, SVGOverlay } from 'react-leaflet'
import { CRS, icon, map, marker } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY, QUERY_SETTLEMENTENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil, pagedesc, realms, inhabitants, history,
councilFort, councilCity, councilSettlement, councilHold, freeFort, freeCity, freeSettlement, freeHold, threatFort, threatCity, threatSettlement, threatHold, humanCapital} from './DornnMapConstants';
import divisibleCutouts from './cutouts_divisible.json';
import indivisibleCutouts from './cutouts_indivisible.json';
import voronoiGeoData from './voronoi_data.json';
import sorted from './sorted_data.json';
import firstSlice from './cropped_data_0.json'
import secondSlice from './cropped_data_1000.json'
import thirdSlice from './cropped_data_11000.json'
import fourthSlice from './cropped_data_21000.json'
import fifthSlice from './cropped_data_31000.json'
import sixthSlice from './cropped_data_41000.json'
import seventhSlice from './cropped_data_51000.json'
import eighthSlice from './cropped_data_61000.json'
import concat from './concat.json'
import paintlayer from './paint_layer_full_edited.json' //all cells + indivisible landmasses
import unified from './svg_cutouts_unified.json'
//import unified from './cutouts_merged.json'
import mapEntities from './map_entities.json';
import superentityEntries from './map_superentities.json';
import subentityCollection from './map_subentities.json';

//import structure
import preloadedPaintState from './paint_state_sub_3.json';

import blankMarker from './blank_marker.png';

import {entityLabelCounts, entityLabelSizes, territoryIcons} from './MapTestroomConstants.jsx';

//const preloadedPaintState = null;



const screenBounds = [
  [0, 0],
  [2045, 4271],
]

const screenBoundsWiggle = [
  [-500, -500],
  [2545, 4771],
]


const zoneArray = [dolwynd, northsea, anterros, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil ]



const redColor = { color: 'red' }
const whiteColor = { color: 'white' }
const blackColor = { color: 'black' }
const borderColor = { color: 'black' }


const Dornn = () => {

  const mapContainerRef = useRef(null);
  const layerNodeRef = useRef(null);
  const [mapRef, setMapRef] = useState(null);
  const dw = 'IM Fell DW Pica'
  const roman = 'Gideon Roman'

  const pixiOverlayRef = useRef(null);

  const [layerCont, setLayerCont] = useState(null);

  //deprecated
  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }

  function componentDidMount() {
    // Access the Leaflet layers control instance after the component mounts
    setLayerCont(this.refs.layersControl.leafletElement); 
    // You can now use the native Leaflet API methods on this.layerControl
    //console.log(layerContRef); 
  }

  const onEachFeature = (feature, layer) => {
    // Add a click event listener
    layer.on({
      click: (e) => {
        //console.log("Clicked on feature:", feature.properties.name);
        // Optional: fit map to feature bounds or other actions
      },
      mouseover: (e) => {
        // Optional: highlight feature on hover
        layer.setStyle({ weight: 3, color: '#666', fillOpacity: 0.9 });
      },
      mouseout: (e) => {
        // Optional: reset style on mouse out
        // Note: resetStyle() can be used if you define a style prop
        layer.setStyle({ weight: 1, color: '#000', fillOpacity: 0.7 }); 
      }
    });

    // Optional: Bind a popup with feature properties
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  };

  //handles the construction of the map subdivision layer for highlighting and splitting (nonperformant)
  function LandmassLayer(){
    return (unified.features.map((item, index) => (<GeoJSON 
              key={index}
              data={item}
              style={() => ({
              color: '#000000',
              weight: 2,
              opacity: 1,
              fillColor: '#ffffff',
              fillOpacity: 1.0
              })}
            ></GeoJSON>)))
    
  }

  function combine(){
    let finalFeatures = turf.featureCollection([...concat.features, ...indivisibleCutouts.features]);

    jsonDownloadUtility(finalFeatures, 'paint_layer_full.json');
  }

  function coercePolygonsToIntersectionBoundary(){
    let features = sorted.features;//voronoiGeo.features;
    let incrementer = 61000;

    let startIndex = 61000; //CHANGE EACH TIME!!! currentValue + batchLength is your new startIndex each time
    let batchLength = 10000;

    let mutationSet = [];

    for(let i = startIndex; i < features.length; i++){
      //if this feature minimally intersects with at least one other feature, keep it.
      if(incrementer%100 == 0){
        //console.log('testing feature ' + incrementer);
      } 
      incrementer++;

      for(const collectionFeature of divisibleCutouts.features){
        if(turf.booleanIntersects(features[i], collectionFeature)){
          mutationSet.push(turf.intersect(turf.featureCollection([features[i], collectionFeature]))); //should replace the feature with the intersection feature
        }
      }
    }

    //console.log('did we produce more than we evaluated? ' + batchLength + ' final count: ' + mutationSet.length);

    let finalFeatures = turf.featureCollection(mutationSet);

    jsonDownloadUtility(finalFeatures, 'cropped_data_' + startIndex + '.json');
  }

  function concatenateFeatureSegments(){
    //we're using this function to combine the batches since I don't want to learn any more libraries. lol.
    //it just takes however many files we make, extracts their features, appends them to one feature collection, then sends it to a master file. durrr

    let finalSet = [];

    firstSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    secondSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    thirdSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    fourthSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    fifthSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    sixthSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    seventhSlice.features.forEach(slice => {
      finalSet.push(slice);
    });

    eighthSlice.features.forEach(slice => {
      finalSet.push(slice);
    });


    let finalFeatures = turf.featureCollection(finalSet);

    jsonDownloadUtility(finalFeatures, 'concat.json');
  }

  function quicksortPolygonsBySize(){
    let features = voronoiGeoData.features;//voronoiGeo.features;
    let incrementer = 0;

    features.forEach(feature => {
      //if this feature minimally intersects with at least one other feature, keep it.
      if(incrementer%100 == 0){
        //console.log('evaluating area of feature ' + incrementer);
      } 
      incrementer++;

      feature.properties.area = turf.area(feature);
    })

    features.sort((a, b) => {
      return b.properties.area - a.properties.area;
    })

    jsonDownloadUtility(features, 'sorted_data.json');
  }

  function selectEntity(name){
    let entry = entityEntries.current.get(name);

    paintSettings.current.mode = 'entity';
    paintSettings.current.selectedPaintableEntity = entry;
    console.log(paintSettings.current);
    setRerender(!rerender);
  }

  function selectSubentity(e, name){
    e.stopPropagation();
    let entry = subentityEntries.current.get(name);

    paintSettings.current.mode = 'subentity';
    paintSettings.current.selectedPaintableEntity = entry;
    console.log(paintSettings.current);
    setRerender(!rerender);
  }

  function jsonDownloadUtility(dataToStringify, filename){
    //console.log('ready to download!');

    const geoJSONstring = JSON.stringify(dataToStringify);

    const blob = new Blob([geoJSONstring], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    //console.log('succesfully saved file');
  }

  function jsonDownloadUtilityObj(dataToStringify, filename){
    //console.log('ready to download!');

    const jsonString = JSON.stringify(dataToStringify);
    //console.log(jsonString);

    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    //console.log('succesfully saved file');
  }

  //BASELINE SHAPE RENDER
  const MonocolorPixiLayer = ({ data, name }) => {
    const map = useMap();
    const graphicsRef = useRef(new PIXI.Graphics());

    useEffect(() => {
      if (!map || !data) return;

      const graphics = graphicsRef.current;
      graphics.clear(); // Clear only when the DATA changes, not on zoom
      graphics.lineStyle(8, 0x9e9e9e);
      graphics.beginFill(0xEFEFEF, 0.0);

      data.features.forEach(feature => {
        const coords = feature.geometry.coordinates;
        if (feature.geometry.type === 'Polygon') {
          // IMPORTANT: Swap [x, y] to [y, x] and project to Zoom 0 pixels
          coords.forEach(coordinateSet => {
            const path = coordinateSet.map(c => {
              const projected = map.options.crs.project(L.latLng(c, c));
              return [projected.y * 64, projected.x * -64];
            }).flat();

            graphics.drawPolygon(path)
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          coords.forEach(subshape => {
            subshape.forEach(coordinateSet => {
              const path = coordinateSet.map(c => {
                const projected = map.options.crs.project(L.latLng(c, c));
                return [projected.y * 64, projected.x * -64];
              }).flat();

              graphics.drawPolygon(path)
            });
          })
        }
      });
      graphics.endFill();

      const overlay = L.pixiOverlay((utils) => {
        const container = utils.getContainer();
        const renderer = utils.getRenderer();
        const project = utils.latLngToLayerPoint;
        const scale = utils.getScale();

        // 2. TRANSFORM ONLY: Don't call drawPolygon here!
        // This origin tells us where the world (0,0) is in current pixels
        const mapOrigin = project(L.latLng(0, 0));
        
        container.addChild(graphics);
        
        renderer.render(container);
      }, new PIXI.Container());

      //overlay.addTo(map);
      const overlayMaps = {
        name: overlay
      };

      layerNodeRef.current.addOverlay(overlay, name);

      //L.control.layers(null, overlayMaps).addTo(map)

      // 3. CLEANUP: Explicitly destroy to free GPU memory
      return () => {
        map.removeLayer(overlay);
        layerNodeRef.current.removeLayer(overlay);
        graphics.destroy({ children: true, texture: true, baseTexture: true });
      };
    }, [map, data]);

    return null;
  };

  //Set up the renderer for the entity painting layer (jank)
  const EntityPixiPaintLayer = ({name}) => {
    const map = useMap();
    const graphicsRef = useRef(new PIXI.Graphics());

    //never rerender using react hooks, we handle manual manip
    useEffect(() => {
      if (!map) return;

      const graphics = new PIXI.Graphics();
      //console.log(graphics);
      if(!graphics) return;
      graphics.clear(); // Clear only when the DATA changes, not on zoom

      const overlay = L.pixiOverlay((utils) => {
        const container = utils.getContainer();
        const renderer = utils.getRenderer();
        const project = utils.latLngToLayerPoint;
        const scale = utils.getScale();

        if(paintSettings.current.mode == 'entity'){
          console.log()
          rerenderEntryTerritories(graphics, [...entityEntries.current.values()], container);
        } else if(paintSettings.current.mode == 'subentity'){
          //we do two render calls here - one with the parent, one with the compiled list of children. don't do it too much!
          let parentEntity = entityEntries.current.get(paintSettings.current.selectedPaintableEntity.parentEntity);
          let subentitiesToRender = [];

          console.log('GET SUBENTITIES');
          parentEntity.subentities.forEach(sub => {
            console.log(subentityEntries.current.get(sub));
            subentitiesToRender.push(subentityEntries.current.get(sub));
          });

          subentitiesToRender.push(parentEntity);
          console.log(subentitiesToRender);
          rerenderEntryTerritories(graphics, subentitiesToRender, container);
        }
        // 2. TRANSFORM ONLY: Don't call drawPolygon here!
        // This origin tells us where the world (0,0) is in current pixels
        const mapOrigin = project(L.latLng(0, 0));
        container.addChild(graphics);

        
        renderer.render(container);
      }, new PIXI.Container());

      pixiOverlayRef.current = overlay;
      overlay.addTo(map);
      layerNodeRef.current.addOverlay(overlay, name);


      //L.control.layers(null, overlayMaps).addTo(map)

      // 3. CLEANUP: Explicitly destroy to free GPU memory
      return () => {
        map.removeLayer(overlay);
        layerNodeRef.current.removeLayer(overlay);
        graphics.destroy({ children: true, texture: true, baseTexture: true });
      };
    }, []);

    return null;
  };

  function rerenderEntryTerritories(graphics, entries, container){
    //clear the graphics!
    if(!mapRef) return;
    graphics.clear();

    console.log('RENDERING THESE ENTRIES: ');
    console.log(entries);
    
    entries.forEach(entry => {
      var color = entry.color ? "0x" + entry.color.replace("#", "") : '0xff0000';
      graphics.lineStyle(8, color);
      graphics.beginFill(color, 0.5);
      ////console.log(entry);

      //for each shape in the territory collection, draw it in this color!
      [...entry.territories.values()].forEach(shape => {
        ////console.log('shapeValid?');
        ////console.log(shape);
        const coords = shape.geometry.coordinates;
        if (shape.geometry.type === 'Polygon') {
          // IMPORTANT: Swap [x, y] to [y, x] and project to Zoom 0 pixels
          coords.forEach(coordinateSet => {
            const path = coordinateSet.map(c => {
              const projected = mapRef.options.crs.project(L.latLng(c, c));
              return [projected.y * 64, projected.x * -64];
            }).flat();

            graphics.drawPolygon(path)
          });
        } else if (shape.geometry.type === 'MultiPolygon') {
          coords.forEach(subshape => {
            subshape.forEach(coordinateSet => {
              const path = coordinateSet.map(c => {
                const projected = mapRef.options.crs.project(L.latLng(c, c));
                return [projected.y * 64, projected.x * -64];
              }).flat();

              graphics.drawPolygon(path)
            });
          })
        }
        /*shape.geometry.coordinates.forEach(coordinateSet => {
          const path = coordinateSet.map(c => {
            const projected = mapRef.options.crs.project(L.latLng(c, c));
            return [projected.y * 64, projected.x * -64];
          }).flat();

          graphics.drawPolygon(path)
        });*/
      })

      graphics.endFill();
    })
  }

  //MAP EDITOR TOOL

  //we leverage a turf-rbush tree to handle painting 
  //a handler on the map will send the current cursor position continuously while clicked
  //the method will use the r-tree to find the polygon the point is inside
  //checkers will be based on other tool props to determine if the shape can be 'drawn'
  //a 'drawn' shape is added to the PixiOverlay FeatureCollection corresponding to the layer we're currently drawing on, and if necessary, the entry is instead modified to respect
  //a new color and parent. that's pretty much it *shrug*

  //the other half of this is a form that handles a complex object and maintains multiple states
  const [rbush, setRbush] = useState(null); //contains spatially-indexed form of the concat set

  const paintSettings = useRef({
    mode: 'entity',
    selectedPaintableEntity: null
  });

  const [rerender, setRerender] = useState(false);

  //SUPERENTITIES are noninteractive - they just store a binding between a name, a collection of subentities and 
  //a 

  //THESE carry the paint-layer's internal reference for shape ownership - they're a binding between a shape's hash and the name of its owner
  const entityCollisionMap = useRef(new Map());
  const subentityCollisionMap = useRef(new Map());
  const interCollisionMap = useRef(new Map());

  //THESE carry definitions of their current poly-shape, because we (currently, barring performance issues)
  //use leaflet's GeoJSON objects with calculated labels to draw them. 
  const entityEntries = useRef(new Map());
  const subentityEntries = useRef(new Map());

  const [showIndevPopup, setShowIndevPopup] = useState(true);


  const [entityItr, setEntityItr] = useState(0);

  function getSelectedCollisionLayer(){
    switch(paintSettings.current.mode){
      case 'entity':
        return entityCollisionMap.current;
      case 'subentity':
        return subentityCollisionMap.current;
      case 'inter':
        return interCollisionMap.current;
    }
  }

  function getSelectedEntryCollection(){
    switch(paintSettings.current.mode){
      case 'entity':
        return entityEntries.current;
      case 'subentity':
        return subentityEntries.current;
    }
  }

  function getParentFontClass(parent){
    switch(parent){
      case 'MIDLAND COUNCIL (XII)':
        return 'midland';
      case 'INDEPENDENTS':
        return 'independents';
      case 'THE UNMORTAL LEAGUE':
        return 'unmortal';
      case 'SALÍRAN DYNASTIES':
        return 'salir';
      case 'DRAIDIC PACT':
        return 'draid';
      case 'FAR-NORTHERN ENCLAVE':
        return 'enclave';
      case 'THE THIRD MANDATE OF POWER':
        return 'mandate';
      case 'THE FRONTIER':
        return 'frontier';
    }

  }

  function onMouseDown(e){ //!! THIS WAS DISABLED - RE-ENABLE TO PAINT
    isMouseDown.current = true;
    ////console.log('mouse down');
  }

  function onMouseUp(e){
    isMouseDown.current = false;
    pixiOverlayRef.current.redraw();
    ////console.log('mouse up');
  }


  //This is an initializer. It loads the rbush tree and the maps.
  //-------------------[INIT]------------------------
  useEffect(() => {
   
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
     
    //console.log('init');
    let tree = geojsonRbush();
    tree.load(paintlayer);
    //console.log(tree.all());
    setRbush(tree); 

    /*
    rona paxta palis 
    */

    if(preloadedPaintState){
      //basemapToTerritory();
      loadSavedPaintState(preloadedPaintState);

      //quickApplyAllSubentitiesToPaintState();

      console.log('DONE LOADING!');
      console.log(entityEntries.current);
      console.log(subentityEntries.current);
    } else {
      mapEntities.data.settlementInfos.forEach(entity => {
        let subentities = new Set();
        entityEntries.current.set(entity.name, {
          name: entity.name,
          color: entity.nameColor.hex,
          labelColor: entity.labelColor.hex,
          subentities: subentities,
          inter: interEntitiesMap,
          territories: new Map(),
          superentityName: entity.mapSuperentity.name,
          aggregatedShape: null
        })
      })
    }

    // HACK to help icon pathing // likely a better way of doing this, but we won't be using
    L.Icon.Default.imagePath = ''; 
    L.Icon.Default.mergeOptions({
        iconUrl: '../../blank_marker.png',
        shadowUrl: '../../blank_marker.png',
        iconSize:     [25, 25], // size of the icon
        shadowSize:   [25, 25], // size of the shadow
        iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
        shadowAnchor: [12, 12],  // the same for the shadow
        popupAnchor:  [12, 12] // point from which the popup should open relative to the iconAnchor
    
    });

    paintSettings.current.selectedPaintableEntry = entityEntries.current.get('Glassblood');
  }, []);

  function quickApplyAllSubentitiesToPaintState(){
    [...entityEntries.current.values()].forEach(entry => {
      entry.subentities = [];
    })

    subentityCollection.mapSubentities.forEach(sub => {
      let parent = entityEntries.current.get(sub.parentEntity);
      parent.subentities.push(sub.name);

      sub.territories = new Map();
      subentityEntries.current.set(sub.name, sub);
    })

    //console.log(entityEntries.current);
  }

  function loadSavedPaintState(state){
    //console.log(state);
    let mappedEntities = new Map();

    //let baseEntity = state.entities.find(entity => entity.name == 'The Frontier');
    ////console.log(baseEntity);
    //basemapToTerritory(baseEntity);

    state.entities.forEach(entry => {
      
      if(entry.territories){
        let mappedTerritories = new Map();
        entry.territories.forEach(shape => {
          let shapeKey = quickHash(JSON.stringify(shape));
          mappedTerritories.set(shapeKey, shape);
          entityCollisionMap.current.set(shapeKey, entry.name);
        });

        entry.territories = mappedTerritories;
      }

      mappedEntities.set(entry.name, entry);
    });

    

    entityEntries.current = mappedEntities;
    //console.log(entityEntries.current);

    //propSurgery();

    //SUBENTITY EXTRACT ----------------
    let mappedSubentities = new Map();
    state.subentities.forEach(entry => {
      if(entry.territories){
        let mappedTerritories = new Map();
        entry.territories.forEach(shape => {
          let shapeKey = quickHash(JSON.stringify(shape));
          mappedTerritories.set(shapeKey, shape);
          subentityCollisionMap.current.set(shapeKey, entry.name);
        });

        entry.territories = mappedTerritories;
      }

      //console.log(entry);
      mappedSubentities.set(entry.name, entry);
    });

    subentityEntries.current = mappedSubentities;
    console.log(subentityEntries.current);
    //console.log(subentityEntries.current);
  }

  const isMouseDown = useRef(false);
  const lastShapeEntered = useRef(null);

  const [lastZoom, setLastZoom] = useState(-2);
  
  const subentityVisible = useRef(false);
  const entityVisible = useRef(false);
  const superEntityVisible = useRef(false);

  const MapEventHandler = () => { //! ZOOM HANDLERS DISABLED
    useMapEvents({/* 
      zoomend(e) {
        
        //console.log(e)
        let zoom = mapRef.getZoom();
        //console.log(zoom);
        if(zoom >= 0 && lastZoom <= -1){
          //console.log('entities?')
          entityVisible.current = true;
          superEntityVisible.current = false;
        } else if(zoom <= -1 && lastZoom >= 0){
          //console.log('supers?')
          entityVisible.current = false;
          superEntityVisible.current = true;
        }

        if(zoom >= 0){
          updateLabelSizes();
        }
        setLastZoom(zoom);
      },*/
      mousemove(e) {
        if(isMouseDown.current && !labeling.current){
          let pt = turf.point([e.latlng.lng, e.latlng.lat]);
          let result = rbush.search(pt);

          let exact = null;
          ////console.log(result);
          result.features.forEach(hit => {
            if(turf.booleanPointInPolygon(pt, hit)){
              exact = hit;
            }
          });

          if(exact && exact != lastShapeEntered.current){
            lastShapeEntered.current = exact;
            tryPaint(exact);
          }
        }
      },
    });
  };

  function updateAggregates(){

    //TEMP rebuilding the entire thing, why not!
    entityEntries.current.forEach(entity => {
      let territorySpread = [...entity.territories.values()];
      if(territorySpread.length > 1){
        console.log(entity.name);
        entity.aggregatedShape = turf.union(turf.featureCollection(territorySpread));
        //entity.aggregatedShape.properties = {};
        entity.aggregatedShape.properties.color = entity.color;
        entity.aggregatedShape.properties.name = entity.name;
        entity.aggregatedShape.properties.superentityName = entity.superentityName;
        //entity.aggregatedShape.properties.labelColor = entity.labelColor;
        //entity.aggregatedShape.properties.labelAnchors = entity.labelAnchors;
        //entity.aggregatedShape.properties.labelSize = entity.labelSize;
      } else if(territorySpread.length == 1){
        entity.aggregatedShape = territorySpread[0];
        //entity.aggregatedShape.properties = {};
        entity.aggregatedShape.properties.color = entity.color;
        entity.aggregatedShape.properties.name = entity.name;
        entity.aggregatedShape.properties.superentityName = entity.superentityName;
        //entity.aggregatedShape.properties.labelColor = entity.labelColor;
        //entity.aggregatedShape.properties.labelAnchors = entity.labelAnchors;
        //entity.aggregatedShape.properties.labelSize = entity.labelSize;
        //console.log(entity.aggregatedShape);
      } else {
        entity.aggregatedShape = null;
      }
    })

    console.log('IN SUPERS');

    //construct superentity aggregates
    superentityEntries.data.mapSuperentities.forEach(superentity =>{
      //console.log(superentity);
      let shapesToAggregate = [];
      superentity.mapEntity.forEach(entity => {
        console.log(entity.name);
        let shape = entityEntries.current.get(entity.name).aggregatedShape;
        shapesToAggregate.push(shape);
      });
      let cleanedShapes = shapesToAggregate.filter(shape => shape !== null);

      superentity.aggregatedShape = turf.union(turf.featureCollection(cleanedShapes));
      superentity.aggregatedShape.properties.name = superentity.name;
      superentity.aggregatedShape.properties.color = superentity.color.hex;
    });

    //console.log(superentityEntries);
  }

  function updateSubAggregates(){
    subentityEntries.current.forEach(sub => {
      let territorySpread = [...sub.territories.values()];
      console.log(sub.parentEntity);
      if(territorySpread.length > 1){
        console.log('sub agg more than 1 ' + sub.name);
        sub.aggregatedShape = turf.union(turf.featureCollection(territorySpread));
        if(!sub.aggregatedShape.properties) sub.aggregatedShape.properties = {};
        sub.aggregatedShape.properties.color = entityEntries.current.get(sub.parentEntity).color;
        sub.aggregatedShape.properties.name = sub.name;
        sub.aggregatedShape.properties.parentName = sub.parentEntity;
      } else if(territorySpread.length == 1){
        console.log('sub agg 1 ' + sub.name);
        sub.aggregatedShape = territorySpread[0];
        if(!sub.aggregatedShape.properties) sub.aggregatedShape.properties = {};
        sub.aggregatedShape.properties.color = entityEntries.current.get(sub.parentEntity).color;
        sub.aggregatedShape.properties.name = sub.name;
        sub.aggregatedShape.properties.parentName = sub.parentEntity;
      } else {
        sub.aggregatedShape = null;
      }

      console.log(sub.aggregatedShape);
    })
  }

  const erasing = useRef(false);

  function toggleErase(event){
    //console.log(event.target.checked);
    erasing.current = event.target.checked;
  }

  const labeling = useRef(false);

  function toggleLabel(event){
    //console.log(event.target.checked);
    labeling.current = event.target.checked;
  }

  //Try and paint a shape onto the map!
  //This method will get an unannotated duplicate of a shape from the original dataset.
  //other datastructures handle binding, we just use these to reproduce hashes for identification and storage.
  function tryPaint(hit){
    var currentCollisionLayer = getSelectedCollisionLayer();
    var currentEntryCollection = getSelectedEntryCollection();

    //for whatever map you have selected, we need to hash and look for collisions in the currently selected layer
    let hash = quickHash(JSON.stringify(hit));

    console.log(paintSettings.current.selectedPaintableEntity);
    

    console.log('TRYING IN MODE: ' + paintSettings.current.mode);
    switch(paintSettings.current.mode){
      case 'entity':
        console.log('what are we even doing here');
        let collision = currentCollisionLayer.get(hash);

        if(collision){
          var owningEntity = currentEntryCollection.get(collision);
          if(owningEntity){
            //if you clicked a DIFFERENT entity, grab the parent that just lost a nib and take this tile away from it
            owningEntity.territories.delete(hash)
          }
        }
        break;
      case 'subentity':
        //if you didn't click inside a parent tile (check the other map), ignore this
        let parentCollision = entityCollisionMap.current.get(hash);
        if(parentCollision){
          var owningParent = entityEntries.current.get(parentCollision);
          if(owningParent.name != paintSettings.current.selectedPaintableEntity.parentEntity){
            return;
          }
        }

        let subcollision = currentCollisionLayer.get(hash);
        if(subcollision){
          var owningEntity = currentEntryCollection.get(subcollision);
          if(owningEntity){
            //if you clicked a DIFFERENT entity, grab the parent that just lost a nib and take this tile away from it
            owningEntity.territories.delete(hash)
          }
        }

        break;
    }

    

    let hitCopy = structuredClone(hit);
    currentCollisionLayer.set(hash, paintSettings.current.selectedPaintableEntity.name);

    if(!erasing.current){
      //if we got here, the paint was valid, so give this tile to the paintSettings.current.selectedPaintableEntity.
      paintSettings.current.selectedPaintableEntity.territories.set(hash, hitCopy);
      //updateAggregate(paintSettings.current.selectedPaintableEntity);
    }
    

    //rerender everything
    //rerenderEntryTerritories(currentGraphics, [...currentEntryCollection.values()]);
    //pixiOverlayRef.current.redraw();


    //we collect each polygon that was 'destroyed' (lost ownership) in one list,
    //and every polygon that was 'added' (gained ownership)
    //then for each, we grab their owner, search THEIR inventory of children, and add or remove it.
    //we rebuild aggregate shapes on mouseUp (a list of dirtied entities is maintained here, and read when that event fires)
  }

  function quickHash(string){
      var hash = 0;
      for (var i = 0; i < string.length; i++) {
          var code = string.charCodeAt(i);
          hash = ((hash<<5)-hash)+code;
          hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
  }

  function basemapToTerritory(targetEntity){
    //sets every cell to a given entity then iteratively reapplies each ownership map until all un-possessed cells are possessed.
    //this is called before the maps are populated
    // 

    let mappedBaseTerritories = new Map();
    
    paintlayer.features.forEach(cell => {
      let hash = quickHash(JSON.stringify(cell));
      mappedBaseTerritories.set(hash, cell);
      entityCollisionMap.current.set(hash, targetEntity.name);
    })

    targetEntity.territories = mappedBaseTerritories;

    //after this completes, loadSavedPaintState should run and overwrite all of this 
  }

  function propSurgery(){
    //this is a quick attempt at smacking props onto all the entities in the authority collection.
    entityEntries.current.forEach(entry => {
      entry.labelAnchors = entry.labelAnchors ?? [];
      //entry.labelAnchors.push(entry.labelAnchor ?? [0, 0]); //multi

      //using the mapped index of entity names to label counts, create a new baselabel at 0, 0
      let extraLabelCount = (entityLabelCounts.get(entry.name)) - entry.labelAnchors.length;
      //console.log(entry.labelAnchors.length)
      //console.log('for ' + entry.name + ' add ' + extraLabelCount);
      for(let i = 0; i < extraLabelCount; i++){
        entry.labelAnchors.push([0, 0]);
      }

      //apply labelsize (normal is the base, small territories or oversized names are "small" and big ones are "large")
      entry.labelSize = entityLabelSizes.get(entry.name);
      ////console.log(entry);
    });

    /*superentityEntries.data.mapSuperentities.forEach(superentity => {
      superentity.labelSize = 'super';
    });*/
  }

  function fixSubColors(){
    [...subentityEntries.current.values()].forEach(entry => {
      entry.color = entry.paintingColor;
      console.log(entry);
    })
  }

  //!!!!!WARNING - THIS IS A DESTRUCTIVE CHANGE
  function frontierFix(){
    let frontier = entityEntries.current.get('The Frontier');

    [...entityEntries.current.values()].forEach(entry => {
      if(entry.name != 'The Frontier'){
        //console.log(entry.name);
        [...entry.territories.keys()].forEach(hash => {
          //console.log(hash);
          frontier.territories.delete(hash);
        })
      }
    });
  }

  var markerPlaced = useRef(new Map());
  function EntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from

    const map = useMap();

    const onEachPoliFeature = (feature, layer) => {
      //pull feature style and apply a fillpattern to it
      //if(![...markerPlaced.current.keys()].includes(feature.properties.name)){
      ////console.log(feature.properties.name);
      if(feature.properties.superentityName == 'ESOTERICS'){
        ////console.log('ESO?');
        var stripes = new L.StripePattern({
          opacity: 0.9, //this is relative
          spaceOpacity: 0.4,
          color: feature.properties.color,
          spaceColor: feature.properties.color,
          angle: 45,
          width: 32,
          height: 32,
          weight: 16,
          spaceWeight: 16
        })

        stripes.addTo(map);


        layer.setStyle({fillPattern: stripes});
      }
    };

    //entityEntries.current.put('The Frontier', null);

    return (<FeatureGroup 
      key={entityItr}
      eventHandlers={{ //markers get added before icons can be applied, but this happens after geo is ready, so we can fix them here.
        add: (e) => {
          //console.log("fix markers");
          fixMarkerIcons(map);
        }
      }}
    >
    {[...entityEntries.current.values()].map((entity, index) => 
      (entity.aggregatedShape ? 
      <GeoJSON 
              onEachFeature={onEachPoliFeature}
              key={index}
              data={entity.aggregatedShape}
              className='mapclass'
              style={() => ({
              color: entity.color,
              weight: 3,
              opacity: 1,
              fillColor: entity.color,
              fillOpacity: 0.6,
              })}
      ></GeoJSON> : 
      <GeoJSON //fallback
                onEachFeature={onEachPoliFeature}
                key={index}
                data={unified.features[0]}
                className='mapclass'
                style={() => ({
                color: '#000000',
                weight: 12,
                opacity: 1,
                fillColor: '#000000',
                fillOpacity: 0.3,
                })}
      ></GeoJSON>))}
    </FeatureGroup>)
  }

  const entityMarkerGroup = useRef(null);
  function EntityMarkerGenerator(){
    useEffect(() => {
      //console.log('GENERATE MARKERS? ------------------------->');
      //console.log(entityMarkerGroup.current);
      entityEntries.current.forEach(entity => {
        if(![...markerPlaced.current.keys()].includes(entity.name)){
          if(!entity.labelAnchors) entity.labelAnchors = [[0, 0]];

          var optIcon = null;
          if(entity.superentityName == 'THE FRONTIER'){
            var iconName = territoryIcons.get(entity.name);

            optIcon = L.icon({
              iconUrl: '../..' + iconName,
              shadowUrl: '../..' + iconName,
              iconSize:     [25, 25], // size of the icon
              shadowSize:   [25, 25], // size of the shadow
              iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
              shadowAnchor: [12, 12],  // the same for the shadow
              popupAnchor:  [12, 12] // point from which the popup should open relative to the iconAnchor
            })

            //console.log(optIcon);
          }

          //console.log('SIZING?');
          //console.log(entity.labelSize);
          //console.log(getFontSizeClass(entity.labelSize));


          entity.labelAnchors.forEach((anchor, index) => {
            var marker = L.marker(anchor ?? [0,0], {
              draggable: true,
              properties: {
                icon: optIcon,
                name: entity.name,
                idx: index
              }
            })
            
            marker.addTo(entityMarkerGroup.current)
            
            if(!optIcon){
              marker.bindTooltip(// 1. Dynamic Content: Inject the unique color into an inline style
                  `<div style="white-space: normal; text-align: center;"><span style="color: ${entity.labelColor}; font-weight: bold;">
                      ${entity.name}
                  </span></div>`, {
                  permanent: true,     // Makes the label always visible
                  direction: 'center', // Centers the label
                  className: `${'map-label label-width-universal' + getFontSizeClass(entity.labelSize) + ' ' + getParentFontClass(entity.superentityName)}`,
                  opacity: 1,
                  offset: [-15, 28]       // Adjust offset if needed
              });/*.addTo(map).bindTooltip(// 1. Dynamic Content: Inject the unique color into an inline style
                  `<div style="width: 150px; white-space: normal; text-align: center;"><span style="color: ${entity.labelColor}; font-weight: bold;">
                      ${entity.name}
                  </span></div>`, {
                  permanent: true,     // Makes the label always visible
                  direction: 'bottom', // Centers the label
                  className: `${'map-label ' + getParentFontClass(entity.superentityName)}`, // Add a custom CSS class for styling
                  opacity: 1,
                  offset: [0, 0]       // Adjust offset if needed
              });*/
            }

            marker.on('dragend', function(e){
              var marker = e.target;
              var position = marker.getLatLng();

              var entity = entityEntries.current.get(marker.options.properties.name);
              entity.labelAnchors[marker.options.properties.idx] = position;
            });

            markerPlaced.current.set(entity.name, marker);
          });
        }
      });
    }, []);
  }

  function SubEntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from

    const map = useMap();
    //entityEntries.current.put('The Frontier', null);

    return (<FeatureGroup>
    {[...subentityEntries.current.values()].map((subentity, index) => 
      (subentity.aggregatedShape ? 
      <GeoJSON 
              key={index}
              data={subentity.aggregatedShape}
              className='mapclass'
              style={() => ({
              color: subentity.aggregatedShape.properties.color,
              weight: 3,
              opacity: 0.7,
              fillColor: subentity.aggregatedShape.properties.color,
              fillOpacity: 0.0,
              })}
      ></GeoJSON> : 
      <GeoJSON //fallback
                key={index}
                data={unified.features[0]}
                className='mapclass'
                style={() => ({
                color: '#000000',
                weight: 12,
                opacity: 1,
                fillColor: '#000000',
                fillOpacity: 0.0,
                })}
      ></GeoJSON>))}
    </FeatureGroup>)
  }

  const subentityMarkerGroup = useRef(null);
  const subentityMarkerPlaced = useRef(new Map());
  function SubEntityMarkerGenerator(){
    useEffect(() => {
      subentityEntries.current.forEach(subentity => {
        console.log(subentity);
        console.log(subentityMarkerPlaced.current.keys());
        if(![...subentityMarkerPlaced.current.keys()].includes(subentity.name)){
          if(!subentity.labelAnchor) subentity.labelAnchor = [0, 0];
          console.log('valid, now we place');

          var marker = L.marker(subentity.labelAnchor ?? [0,0], {
            draggable: true,
            properties: {
              name: subentity.name,
            }
          })
            
          marker.addTo(subentityMarkerGroup.current)
            
          marker.bindTooltip(// 1. Dynamic Content: Inject the unique color into an inline style
              `<div style="white-space: normal; text-align: center;"><span style="color: ${entityEntries.current.get(subentity.parentEntity).color}; font-weight: bold;">
                  ${subentity.name.toUpperCase()}
              </span></div>`, {
              permanent: true,     // Makes the label always visible
              direction: 'center', // Centers the label
              className: `${'map-label subentity'}`,
              opacity: 1,
              offset: [-15, 28]       // Adjust offset if needed
          });

          marker.on('dragend', function(e){
            var marker = e.target;
            var position = marker.getLatLng();

            var subentity = subentityEntries.current.get(marker.options.properties.name);
            subentity.labelAnchor = position;
          });

          subentityMarkerPlaced.current.set(subentity.name, marker);
        }
      });
    }, []);
  }

  function SuperEntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from

    const map = useMap();

    const onEachSuperFeature = (feature, layer) => {
      //pull feature style and apply a fillpattern to it
      //if(![...markerPlaced.current.keys()].includes(feature.properties.name)){
      ////console.log(feature.properties.name);
      if(feature.properties.name == 'ESOTERICS'){
        var stripes = new L.StripePattern({
          opacity: 0.9, //this is relative
          spaceOpacity: 0.4,
          color: feature.properties.color,
          spaceColor: feature.properties.color,
          angle: 45,
          width: 32,
          height: 32,
          weight: 16,
          spaceWeight: 16
        })

        stripes.addTo(map);


        layer.setStyle({fillPattern: stripes});
      }
    };

    //superentityEntries.data.mapSuperentities = superentityEntries.data.mapSuperentities.filter(se => se.name != 'THE FRONTIER');

    return (<FeatureGroup>
    {superentityEntries.data.mapSuperentities.map((superentity, index) => 
      (superentity.aggregatedShape ? 
      <GeoJSON 
              onEachFeature={onEachSuperFeature}
              key={index}
              data={superentity.aggregatedShape}
              className='mapclass'
              style={() => ({
                color: superentity.color.hex,
                weight: 3,
                opacity: 1,
                fillColor: superentity.color.hex,
                fillOpacity: 0.6,
              })}
      ></GeoJSON> : 
      <GeoJSON //fallback
                onEachFeature={onEachSuperFeature}
                key={index}
                data={unified.features[0]}
                className='mapclass'
                style={() => ({
                color: '#000000',
                weight: 12,
                opacity: 1,
                fillColor: '#000000',
                fillOpacity: 0.3,
                })}
      ></GeoJSON>))}
    </FeatureGroup>)
  }

  const superentityMarkerGroup = useRef(null);
  const superentityMarkerPlaced = useRef(new Map());
  function SuperEntityMarkerGenerator(){
    useEffect(() => {
      //console.log('GENERATE MARKERS? ------------------------->');
      //console.log(superentityMarkerGroup.current);
      superentityEntries.data.mapSuperentities.forEach(superentity => {
        if(![...superentityMarkerPlaced.current.keys()].includes(superentity.name)){
          if(!superentity.labelAnchor) superentity.labelAnchor = [0, 0];

          var marker = L.marker(superentity.labelAnchor ?? [0,0], {
            draggable: true,
            properties: {
              name: superentity.name,
            }
          })
            
          marker.addTo(superentityMarkerGroup.current)
            
          marker.bindTooltip(// 1. Dynamic Content: Inject the unique color into an inline style
              `<div style="white-space: normal; text-align: center;"><span style="color: ${superentity.nameColor.hex}; font-weight: bold;">
                  ${superentity.name}
              </span></div>`, {
              permanent: true,     // Makes the label always visible
              direction: 'center', // Centers the label
              className: `${'map-label superentity-label ' + getFontSizeClass(superentity.labelSize) + ' ' + getParentFontClass(superentity.name)}`,
              opacity: 1,
              offset: [-15, 28]       // Adjust offset if needed
          });

          marker.on('dragend', function(e){
            var marker = e.target;
            var position = marker.getLatLng();

            var superentity = superentityEntries.data.mapSuperentities.find(se => se.name == marker.options.properties.name);
            superentity.labelAnchor = position;
          });

          superentityMarkerPlaced.current.set(superentity.name, marker);
        }
      });
    }, []);
  }


  // Function to calculate font size based on zoom level
  function getFontSize(zoom, labelSize) {
      // You can adjust this formula as needed
      switch(labelSize){
        case "small":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '0px';
            case 0:
              return '0px';
            case 1:
              return '0px';
            case 2:
              return '16px';
            default:
              return '24px';
          }
        case "medium":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '6px';
            case 0:
              return '12px';
            case 1:
              return '16px';
            case 2:
              return '24px';
            default:
              return '32px';
          }  
        case "large":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '16px';
            case 0:
              return '24px';
            case 1:
              return '24px';
            case 2:
              return '48px';
            default:
              return '48px';
          }
        case "super":
          switch(zoom){
            case -2:
              return '16px';
            case -1:
              return '24px';
            case 0:
              return '0px';
            case 1:
              return '0px';
            case 2:
              return '0px';
            default:
              return '0px';
          }      
      }
  }

  // Function to calculate label width based on zoom level
  function getLabelWidth(zoom, labelSize) {
      // You can adjust this formula as needed
      switch(labelSize){
        case "small":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '0px';
            case 0:
              return '0px';
            case 1:
              return '0px';
            case 2:
              return '75px';
            default:
              return '150px';
          }
        case "medium":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '50px';
            case 0:
              return '100px';
            case 1:
              return '100px';
            case 2:
              return '150px';
            default:
              return '150px';
          }  
        case "large":
          switch(zoom){
            case -2:
              return '0px';
            case -1:
              return '80px';
            case 0:
              return '100px';
            case 1:
              return '150px';
            case 2:
              return '150px';
            default:
              return '150px';
          }      
      }
  }

  function getFontSizeClass(size){
    switch(size){
      case "small":
        return 'map-label-small';
      case "medium":
        return 'map-label-medium';
      case "large":
        return 'map-label-large';
    }
  }

  function getLabelWidthClass(size){
    switch(size){
      case "small":
        return 'label-width-small';
      case "medium":
        return 'label-width-medium';
      case "large":
        return 'label-width-large';
    }
  }

  // Function to update all labels in the layer
  function updateLabelSizes() {;
    var currentZoom = mapRef.getZoom();
    const root = document.documentElement;
    root.style.setProperty('--label-font-size-small', getFontSize(currentZoom, "small"));
    root.style.setProperty('--label-font-size-medium', getFontSize(currentZoom, "medium"));
    root.style.setProperty('--label-font-size-large', getFontSize(currentZoom, "large"));
    
    root.style.setProperty('--label-width-small', getLabelWidth(currentZoom, "small"));
    root.style.setProperty('--label-width-medium', getLabelWidth(currentZoom, "medium"));
    root.style.setProperty('--label-width-large', getLabelWidth(currentZoom, "large"));
    
    [...markerPlaced.current.values()].forEach(marker => {
      let tooltip = marker.getTooltip();
      if(tooltip) tooltip.update();
    })
  }

  function saveEntityShapeData(){
    let entitySet = [];
    [...entityEntries.current.values()].forEach(entry => {
      //console.log(entry);
      entitySet.push(entry);
    });

    jsonDownloadUtilityObj(entitySet, 'entity_shapes.json');
  }


  //The output of this function should be a keyed set of objects. The name, a parent, shapeData. A single block is exported, sorted by parentName, called Subentities.
  //To protect from inappropriate edits, we should save individual files, and compose them into an aggregate file.
  //eventually, all the mapData should be bulkified into a single payload.
  //optimizing the map's footprint or fragmenting it will eventually be needed.
  function saveSubentityShapeData(){
    let entityToSave = paintSettings.current.selectedPaintableEntity;
    /*[...subentityEntries.current.values()].forEach(entry => {
      //console.log(entry);
      entitySet.push(entry);
    });*/

    //get selected
    console.log('serializing:');
    console.log(entitySet);

    //aggregate shape-as-assigned
    

    //save as [entity_name].json

    jsonDownloadUtilityObj(entitySet, 'subentity_shapes.json');
  }

  function saveSuperentityShapeData(){
    jsonDownloadUtilityObj(superentityEntries.data.mapSuperentities, 'superentity_shapes.json');
  }

  function saveCurrentPaintState(){
    //serialize and return the current entity state, which can be used on-load to reconstruct everything.
    let entitiesFlat = flattenCollectionUtil(entityEntries.current);
    let subentitiesFlat = flattenCollectionUtil(subentityEntries.current);

    console.log(subentitiesFlat);

    let exported = {
      entities: entitiesFlat,
      subentities: subentitiesFlat
    }

    jsonDownloadUtilityObj(exported, 'paint_state.json');
  }

  function saveCurrentSuperentities(){
    jsonDownloadUtilityObj(superentityEntries, 'map_superentities.json');
  }

  function flattenCollectionUtil(collection){
    //takes a map that has a 'territories' map property and flattens them for serialization.
    let flat = [...collection.values()];

    flat.forEach(entry => {
      entry.territories = [...entry.territories.values()];
    });

    return flat;
  }

  function fixMarkerIcons(map){
    var markerList = [];
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            markerList.push(layer);
        }
    });

    //console.log(markerList);
    markerList.forEach(marker => {
      let icon = marker.options.properties.icon;
      if(icon) marker.setIcon(marker.options.properties.icon);
    })
  }

  function closeIndevPopup(){
    //console.log('close ' + showIndevPopup.current);
    setShowIndevPopup(false);
  }



  return (
    <>
      <div id='content-main'>
        <img className="m-auto w-full sm:w-1/2 pt-5" src="../../world_banner.png" alt="The World - Also Known as The Measured Extent of the Dornnian Midlands"/>
        <div className="mapcontent relative">
          
          {/*<img className="" src="../../whiteout-blank-site.png" useMap="#dornnmap" alt="This is a full-scale linked map of the Dornnian Midlands. It is not navigable by screen reader, so you will instead use the following links to access the information you're looking for. This map is divided into several regions which will be read through in sequence."/>*/}
          <div id='map' ref={mapContainerRef}>
            <MapContainer 
              ref={setMapRef} 
              center={[1024, 2048]} 
              zoom={-2} 
              minZoom={-2}
              dragging={false} 
              keyboardPanDelta={200}
              zoomControl={true} 
              crs={CRS.Simple} 
              maxBounds={screenBoundsWiggle} 
              maxBoundsViscosity={0.9} tap={false} 
              doubleClickZoom={false}
            >
              <LandmassLayer />
              <EntityPixiPaintLayer name="entity"/>
              <MapEventHandler />
              <LayersControl ref={layerNodeRef} position="topright">
              <LayersControl.Overlay name="subentities layer" checked={subentityVisible.current}>
                  <LayerGroup ref={subentityMarkerGroup}>
                      <SubEntityLayerComponent />
                      <SubEntityMarkerGenerator/>
                  </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="entities layer" checked={entityVisible.current}>
                  <LayerGroup ref={entityMarkerGroup}>
                    <EntityLayerComponent />
                    <EntityMarkerGenerator/>
                  </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="superentities layer" checked={superEntityVisible.current}>
                  <LayerGroup ref={superentityMarkerGroup}>
                    <SuperEntityLayerComponent />
                    <SuperEntityMarkerGenerator/>
                  </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="dornn">
                  <ImageOverlay 
                    url="../../dornn_standard.png" bounds={screenBounds} pagespeed_no_transform
                    opacity={0.4}
                  />
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
          { showIndevPopup ? 
            <div style={{'position':'absolute', 'display':'flex', 'left':'10%'}}>
              <div style={{'width':'50%','position':'relative'}}>
                <img src="../../map_indev_panel.png"></img>
              </div>
              <button style={{'max-width':'60px', 'right':'5%', 'top':'25%'}}>
                <img src="../../changes_button.png"></img>
              </button>
              <button onClick={closeIndevPopup} style={{'width':'5%'}}>
                <img src="../../close_popup.png" style={{'max-width':'100%'}}></img>
              </button>
            </div> : null}
        </div>
        <div style={{'padding-bottom':'24px'}}>
          <div style={{'width':'fit-content', 'margin': 'auto', 'padding-bottom':'24px'}}>
            <div className='m-auto'>
              <p className='m-left-auto' style={{'color': 'white', 'width': 'fit-content', 'font-size':'32px', 'padding-bottom':'12px'}}>SELECT ENTITY TO PAINT</p>
            </div>
            <div style={{'width':'fit-content', 'margin': 'auto'}}>
              MODE: {paintSettings.current.mode}  | 
              SELECTED: {paintSettings.current.selectedPaintableEntity?.name}  
              <input style={{'margin-left': '16px'}} type="checkbox" id="erase" name="erase" value="Erase" onChange={toggleErase}/>
              <label for="erase">ERASE MODE</label>
              <input style={{'margin-left': '16px'}} type="checkbox" id="labelMode" name="labelMode" value="labelMode" onChange={toggleLabel}/>
              <label for="labelMode">LABEL POSITION MODE</label>
              <div style={{'margin-left':'5vw', 'margin-top':'50px', 'border':'3px solid white'}}>
                <button onClick={updateAggregates}>REBUILD ENTITY SHAPES</button>
              </div>
            </div>
          </div>
          <div style={{'width':'85%', 'margin': 'auto', 'margin-bottom':'48px', 'max-height':'900px', 'overflowY':'auto'}}>
            <ul style={{'list-style-type':'none'}}>
              { 
                [...entityEntries.current.values()].map(entity => <li key={entity.name} onClick={() => selectEntity(entity.name)} className='list-hoverable' style={{'margin-top':'2px', 'margin-bottom':'2px', 'padding':'6px','border':'1px solid #585858', 'background-color':'black'}}> 
                  <div style={{'display':'flex'}}>
                    <div className='circle' style={{'background-color':entity.color, 'margin-top':'6px'}}></div>
                    <p style={{'font-size':'24px', 'padding-bottom':'12px'}}>{entity.name}</p><p> </p>
                  </div>
                  <p>-| SUBENTITIES</p>
                  <ul>
                    {
                      entity.subentities.map(subentity => <li key={subentity} onClick={(e) => selectSubentity(e, subentity)} className='sublist-hoverable' style={{'margin-top':'2px', 'margin-bottom':'2px', 'padding':'6px','border':'1px solid #2c2c2c', 'border-radius':'8px', 'background-color':'black'}}>{subentity}</li>)
                    }
                  </ul>
                </li>)
              }
            </ul>
          </div>
        </div>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={combine}>FINAL JSON</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveEntityShapeData}>SAVE ENTITIES FOR MAIN PAGE</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveSubentityShapeData}>SAVE CURRENT SUBENTITIES FOR MAIN PAGE</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveSuperentityShapeData}>SAVE SUPERS FOR MAIN PAGE</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveCurrentPaintState}>SAVE PAINT STATE</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={fixSubColors}>FIX SUBENTITY COLORS</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveCurrentSuperentities}>SAVE MERGED SUPER</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={updateSubAggregates}>UPDATE SUBENTITY AGGREGATES IN ENTITY COLLECTION</button>
      </div>

      

      {/*<div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={generateAndStoreVoronoiPolygons}>GENERATE VORONOI</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={coercePolygonsToIntersectionBoundary}>COERCE VORONOI</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={quicksortPolygonsBySize}>SORT VORONOI</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={quicksave}>save match batch</button>
      </div>*/}
    </>

  );
};
export default Dornn;

