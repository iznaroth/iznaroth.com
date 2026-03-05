import '../../index.css';
import * as turf from "@turf/turf";
import { GeoJSON2SVG } from 'geojson2svg';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import geojsonRbush from 'geojson-rbush';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo, Component } from 'react';
import { flushSync } from 'react-dom';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, useMapEvent, Rectangle, LayerGroup, LayersControl, GeoJSON, SVGOverlay } from 'react-leaflet'
import { CRS, icon, map, marker } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY, QUERY_SETTLEMENTENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil, pagedesc, realms, inhabitants, history,
councilFort, councilCity, councilSettlement, councilHold, freeFort, freeCity, freeSettlement, freeHold, threatFort, threatCity, threatSettlement, threatHold, humanCapital} from './DornnMapConstants';
import { CSSTransition } from 'react-transition-group';
import divisibleCutouts from './cutouts_divisible.json';
import indivisibleCutouts from './cutouts_indivisible.json';
import testVoronoiPoints from './filtered_points.json';
import voronoiGeoData from './voronoi_data.json';
import sorted from './sorted_data.json';
import tinySlice from './cut_data_0.json';
import firstSlice from './cropped_data_0.json'
import secondSlice from './cropped_data_1000.json'
import thirdSlice from './cropped_data_11000.json'
import fourthSlice from './cropped_data_21000.json'
import fifthSlice from './cropped_data_31000.json'
import sixthSlice from './cropped_data_41000.json'
import seventhSlice from './cropped_data_51000.json'
import eighthSlice from './cropped_data_61000.json'
import concat from './concat.json'
import unified from './svg_cutouts_unified.json'
import nomulti from './nomulti.json'
import entityAgg from './entity_shapes.json'
import { ClassNames } from '@emotion/react';
import mapEntities from './map_entities.json';

//import structure
import alliances from './alliances.json';
import entities from './entities.json';
import subentities from './subentities.json';
import inter from './inter.json';

//

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

  const [layerCont, setLayerCont] = useState(null);

  var multicolorGraphics = useRef(new PIXI.Graphics());
  const pixiOverlayRef = useRef(null);

  //deprecated
  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }

  function componentDidMount() {
    // Access the Leaflet layers control instance after the component mounts
    setLayerCont(this.refs.layersControl.leafletElement); 
    // You can now use the native Leaflet API methods on this.layerControl
    console.log(layerContRef); 
  }

  const onEachFeature = (feature, layer) => {
    // Add a click event listener
    layer.on({
      click: (e) => {
        console.log("Clicked on feature:", feature.properties.name);
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
              onEachFeature={onEachFeature}
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

  //handles the construction of the map subdivision layer for highlighting and splitting (nonperformant)
  function IndivisibleLayer(){
    return (<GeoJSON 
              onEachFeature={onEachFeature}
              data={indivisibleCutouts.features}
              style={() => ({
              color: '#000000',
              weight: 2,
              opacity: 1,
              fillColor: '#ffffff',
              fillOpacity: 0.5
              })}
            ></GeoJSON>)
    
  }


  function quicksave(){
    let startIdx = 0;
    let size = 25000;

    let saveSet = [];

    for(let i = startIdx; i < startIdx + size; i++){
      saveSet.push(sorted.features[i]);
    }

    let finalFeatures = turf.featureCollection(saveSet);

    jsonDownloadUtility(finalFeatures, 'cut_data_' + startIdx + '.json');
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
        console.log('testing feature ' + incrementer);
      } 
      incrementer++;

      for(const collectionFeature of divisibleCutouts.features){
        if(turf.booleanIntersects(features[i], collectionFeature)){
          mutationSet.push(turf.intersect(turf.featureCollection([features[i], collectionFeature]))); //should replace the feature with the intersection feature
        }
      }
    }

    console.log('did we produce more than we evaluated? ' + batchLength + ' final count: ' + mutationSet.length);

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
        console.log('evaluating area of feature ' + incrementer);
      } 
      incrementer++;

      feature.properties.area = turf.area(feature);
    })

    features.sort((a, b) => {
      return b.properties.area - a.properties.area;
    })

    jsonDownloadUtility(features, 'sorted_data.json');
  }

  function filterOutMultis(){
    let final = concat.features.filter(feature => {
      return feature.geometry.type == 'Polygon';
    })
    console.log(final);
    jsonDownloadUtility(turf.featureCollection(final), 'nomulti');
  }

  function multiprint(){
    console.log('multiprint');
    concat.features.forEach((f, i) => {
      if (!f.geometry || !['Polygon', 'MultiPolygon'].includes(f.geometry.type)) {
        console.error(`Feature at index ${i} is the culprit:`, f);
      }
    });

    const hasEmptyCoords = concat.features.some(f => 
      !f.geometry.coordinates || f.geometry.coordinates.length === 0 || f.geometry.coordinates[0].length === 0
    );
    console.log("Empty coordinates found:", hasEmptyCoords);
  }

  function selectEntity(name){
    console.log('selecting: ' + name);
    let entry = entityEntries.current.get(name);
    console.log(entry);
    //setSelectedEntity(entry);
    selectedEntity.current = entry;
  }

  function jsonDownloadUtility(dataToStringify, filename){
    console.log('ready to download!');

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

    console.log('succesfully saved file');
  }

  function smoothFeatures(data){
    console.log('attempt chaikin smooth');
    console.log(data.features[0]);
    let smoothedFeatures = [];


    for(let i = 0; i < data.features.length; i++){
      try {
        let smoothFeature = turf.polygonSmooth(data.features[i], {
          iterations: 3
        });
        smoothedFeatures.push(smoothFeature.features[0]);
      } catch (error) {
        console.log('FAILED ON ' + i);
        console.log(error);
      }
    }
      
    
    console.log('completed');
    console.log(smoothedFeatures);

    let featureCol = turf.featureCollection(smoothedFeatures);
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

      overlay.addTo(map);
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
      multicolorGraphics.current = graphics;
      console.log(graphics);
      if(!graphics) return;
      graphics.clear(); // Clear only when the DATA changes, not on zoom

      /*
      data.features.forEach(feature => {
        graphics.lineStyle(8, feature.color ?? 0x00FF00);
        graphics.beginFill(feature.color ?? 0x00FF00, 0.5);
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
      */

      //first-pass render of whatever state we had stored
      rerenderEntryTerritories(multicolorGraphics.current, [...entityEntries.current.values()]);


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

      pixiOverlayRef.current = overlay;
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

  function rerenderEntryTerritories(graphics, entries){
    //clear the graphics!
    graphics.clear();
    
    entries.forEach(entry => {
      var color = entry.color ? "0x" + entry.color.replace("#", "") : '0xff0000';
      graphics.lineStyle(8, color);
      graphics.beginFill(color, 0.5);

      //for each shape in the territory collection, draw it in this color!
      [...entry.territories.values()].forEach(shape => {
        shape.geometry.coordinates.forEach(coordinateSet => {
          const path = coordinateSet.map(c => {
            const projected = mapRef.options.crs.project(L.latLng(c, c));
            return [projected.y * 64, projected.x * -64];
          }).flat();

          graphics.drawPolygon(path)
        });
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


  const selectedLayer = useRef('entity');

  //THESE carry the paint-layer's internal reference for shape ownership - they're a binding between a shape's hash and the name of its owner
  const entityCollisionMap = useRef(new Map());
  const subentityCollisionMap = useRef(new Map());
  const interCollisionMap = useRef(new Map());

  //THESE carry definitions of their current poly-shape, because we (currently, barring performance issues)
  //use leaflet's GeoJSON objects with calculated labels to draw them. 
  const entityEntries = useRef(new Map());
  const subentityEntries = useRef(new Map());
  const interEntries = useRef(new Map());

  //const [selectedEntity, setSelectedEntity] = useState(null);
  const selectedEntity = useRef(null);

  function getSelectedCollisionLayer(){
    switch(selectedLayer.current){
      case 'entity':
        return entityCollisionMap.current;
      case 'subentity':
        return interCollisionMap.current.current;
      case 'inter':
        return interCollisionMap;
    }
  }

  function getSelectedEntryCollection(){
    switch(selectedLayer.current){
      case 'entity':
        return entityEntries.current;
      case 'subentity':
        return subentityEntries.current;
      case 'inter':
        return interEntries.current;
    }
  }



  //This is an initializer. It loads the rbush tree and the maps.
  useEffect(() => {
    console.log('init');
    let tree = geojsonRbush();
    console.log(concat);
    tree.load(concat);
    console.log(tree.all());
    setRbush(tree); //holy ugly call

    /*
    rona paxta palis 
    */

    mapEntities.data.settlementInfos.forEach(entity => {
      let subentitiesMap = new Map();
      let interEntitiesMap = new Map();
      entityEntries.current.set(entity.name, {
        name: entity.name,
        color: entity.nameColor.hex,
        subentities: subentitiesMap,
        inter: interEntitiesMap,
        territories: new Map(),
        superentityName: entity.mapSuperentity.name,
        aggregatedShape: null
      })
    })

    
    //setSelectedEntity(entityEntries.get('Glassblood'));
    console.log('SELECTOR');
    console.log(entityEntries.current.get('Glassblood'));
    selectedEntity.current = entityEntries.current.get('Glassblood');

  }, []);

  const LocationFinder = () => {
    useMapEvents({
      click(e) {
        // You can also use the map instance if needed, via `const map = useMapEvents(...)`
        let pt = turf.point([e.latlng.lng, e.latlng.lat]);
        let result = rbush.search(pt);

        //check which shape from the search result the point is actually in
        let exact = null;
        console.log(result);
        result.features.forEach(hit => {
          if(turf.booleanPointInPolygon(pt, hit)){
            exact = hit;
          }
        });

        tryPaint(exact);
      },
    });
  };

  function updateAggregate(entity){
    if(!entity) return;

    console.log(entity);

    let territorySpread = [...entity.territories.values()];
    if(territorySpread.length > 1){
      entity.aggregatedShape = turf.union(turf.featureCollection(territorySpread));
    }

    console.log(entity.aggregatedShape);
    //setEntityEntries(structuredClone(entityEntries)); //try and trip comp refresh
  }


  //change the painting mode and selection context!
  function changeMode(event){
    console.log(event.target.value);
    selectedLayer.current = event.target.value;
  }

  //Try and paint a shape onto the map!
  //This method will get an unannotated duplicate of a shape from the original dataset.
  //other datastructures handle binding, we just use these to reproduce hashes for identification and storage.
  function tryPaint(hit){

    var currentCollisionLayer = getSelectedCollisionLayer();
    var currentEntryCollection = getSelectedEntryCollection();
    var currentGraphics = multicolorGraphics.current; //ADD A GETTER HERE FOR THE OTHER TWO LAYERS!

    //for whatever map you have selected, we need to hash and look for collisions in the currently selected layer
    let hash = quickHash(JSON.stringify(hit));
    let collision = currentCollisionLayer.get(hash);

    //handle replacement per mode
    if(collision){
      var owningEntity = currentEntryCollection.get(collision);
      if(owningEntity){
        switch(selectedLayer.current){
          case 'entity':
            //if you clicked a DIFFERENT entity, grab the parent that just lost a nib and take this tile away from it
            owningEntity.territories.delete(hash)
            
          case 'subentity':
            //if you didn't click inside a parent tile (check the other map), ignore this
            if(owningEntity.parentName != selectedEntity.current.parentName){
              return;
            }

            //otherwise, perform as normal
            owningEntity.territories.delete(hash);
          case 'inter':
            //pop confirm? maybe do nothing
        }
      }
    }

    let hitCopy = structuredClone(hit);
    console.log(selectedEntity.current);
    currentCollisionLayer.set(hash, selectedEntity.current.name);

    //if we got here, the paint was valid, so give this tile to the selectedEntity.
    selectedEntity.current.territories.set(hash, hitCopy);
    updateAggregate(selectedEntity.current);

    //rerender everything
    rerenderEntryTerritories(currentGraphics, [...currentEntryCollection.values()]);
    pixiOverlayRef.current.redraw();

    //something changed
    /*const graphics = multicolorGraphics.current;

    var color = hitCopy.properties.color ? "0x" + hitCopy.properties.color.replace("#", "") : '0xff0000';
    graphics.lineStyle(8, color);
    graphics.beginFill(color, 0.5);

    hitCopy.geometry.coordinates.forEach(coordinateSet => {
      const path = coordinateSet.map(c => {
        const projected = mapRef.options.crs.project(L.latLng(c, c));
        return [projected.y * 64, projected.x * -64];
      }).flat();

      graphics.drawPolygon(path)
    });

    graphics.endFill();*/

    //trip the ownership change
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

  function EntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from
    return (entityAgg.features.map((entity, index) => (<GeoJSON 
              onEachFeature={onEachPoliFeature}
              key={index}
              data={entity}
              className='mapclass'
              style={() => ({
              color: '#000000',
              weight: 12,
              opacity: 1,
              fillColor: '#000000',
              fillOpacity: 0.5,
              })}
      ></GeoJSON>)))
  }

  const onEachPoliFeature = (feature, layer) => {
    // Add a click event listener
    layer.on({
      click: (e) => {
        console.log("Clicked on feature:", feature.properties.name);
        // Optional: fit map to feature bounds or other actions
      },
      mouseover: (e) => {
        // Optional: highlight feature on hover
        layer.setStyle({ weight: 3, color: feature.properties.color, fillOpacity: 0.9 });
      },
      mouseout: (e) => {
        // Optional: reset style on mouse out
        // Note: resetStyle() can be used if you define a style prop
        layer.setStyle({ weight: 1, color: feature.properties.color, fillOpacity: 0.7 }); 
      }, 
      add: (e) => { //an attempt at clipping the path to only the portion 'inside' the shape
        const path = layer.getElement();
        if (!path) return;

        // 1. Find the SVG container (Leaflet's main SVG layer)
        const svg = path.closest('svg');
        let defs = svg.querySelector('defs');
        if (!defs) {
          defs = L.SVG.create('defs');
          svg.insertBefore(defs, svg.firstChild);
        }

        // 2. Create the <clipPath> element
        const clipPath = L.SVG.create('clipPath');
        clipPath.setAttribute('id', clipId);
        
        // 3. Create a clone of the path to act as the mask geometry
        const maskPath = L.SVG.create('path');
        maskPath.setAttribute('d', path.getAttribute('d'));
        
        clipPath.appendChild(maskPath);
        defs.appendChild(clipPath);

        // 4. Apply the clip-path to the actual visible layer
        path.setAttribute('clip-path', `url(#${clipId})`);
      }});

    // Optional: Bind a popup with feature properties
    layer.bindTooltip('Tholri', {
        permanent: true,     // Makes the label always visible
        direction: 'center', // Centers the label
        className: 'map-label', // Add a custom CSS class for styling
        opacity: 1,
        offset: [0, 0]       // Adjust offset if needed
    });
  };

  function saveEntityShapeData(){
    let entitySet = [];
    [...entityEntries.current.values()].forEach(entry => {
      console.log(entry.aggregatedShape);
      entitySet.push(entry.aggregatedShape);
    });

    let featureSet = turf.featureCollection(entitySet);
    jsonDownloadUtility(featureSet, 'entity_shapes.json');
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
              dragging={true} 
              zoomControl={true} 
              crs={CRS.Simple} 
              maxBounds={screenBoundsWiggle} 
              maxBoundsViscosity={0.9} tap={false} 
              onClick={tryPaint}
              doubleClickZoom={false}
            >
              <LandmassLayer />
              <MonocolorPixiLayer data={concat} name="base"/>
              <EntityPixiPaintLayer name="entity"/>
              <LocationFinder />
              <LayersControl ref={layerNodeRef} position="topright">
                <LayersControl.Overlay name="indi">
                  <IndivisibleLayer />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="agg">
                  <EntityLayerComponent />
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
        </div>
        <div style={{'padding-bottom':'24px'}}>
          <div style={{'width':'fit-content', 'margin': 'auto', 'padding-bottom':'24px'}}>
            <div className='m-auto'>
              <p className='m-left-auto' style={{'color': 'white', 'width': 'fit-content', 'font-size':'32px', 'padding-bottom':'12px'}}>SELECT ENTITY TO PAINT</p>
            </div>
            <div style={{'width':'fit-content', 'margin': 'auto'}}>
              MODE: <select style={{'margin-bottom':'18px', 'width':'fit-content', 'margin-left': 'auto', 'margin-right':'8px'}} onChange={changeMode}>
                <option value="entities">Entities</option>
                <option value="subentities">Subentities</option>
                <option value="internal">Internal Entities</option>
              </select>
              SELECTED: {selectedEntity.current?.name}
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
                      [...entity.subentities.values()].map(subentity => <li key={subentity.name} className='sublist-hoverable' style={{'margin-top':'2px', 'margin-bottom':'2px', 'padding':'6px','border':'1px solid #2c2c2c', 'border-radius':'8px', 'background-color':'black'}}>{subentity.name}</li>)
                    }
                  </ul>
                  <p>-| INTERNAL ENTITIES</p>
                  <ul>
                    {
                      [...entity.inter.values()].map(internal => <li key={internal.name} className='sublist-hoverable' style={{'margin-top':'2px', 'margin-bottom':'2px', 'padding':'6px','border':'1px solid #2c2c2c', 'background-color':'black'}}>{internal.name}</li>)
                    }
                  </ul>
                </li>)
              }
            </ul>
          </div>
        </div>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={multiprint}>CUT MULTI</button>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
        <button onClick={saveEntityShapeData}>SAVE POLI</button>
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

