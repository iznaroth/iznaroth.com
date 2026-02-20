import '../../index.css';
import * as turf from "@turf/turf";
import { GeoJSON2SVG } from 'geojson2svg';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import geojsonRbush from 'geojson-rbush';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo, Component } from 'react';
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
import { ClassNames } from '@emotion/react';

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
              fillOpacity: 0.5
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

  function generateAndStoreVoronoiPolygons(){

    console.log('attempt to run voronoi generator');
  
    const options = {
      bbox: [0, 0, 4271, 2045]
    };
    const points = turf.points(testVoronoiPoints);

    console.log('loaded points');
    const voronoiPolygons = turf.voronoi(points, options);
    console.log('finished generation');

    const geoJSONstring = JSON.stringify(voronoiPolygons);

    const blob = new Blob([geoJSONstring], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'voronoi_data.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('succesfully saved file');
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
    console.log('responsible for: ' + features.length + ' features');
    console.log(typeof(features));
    console.log(features[0]);
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

  //BASELINE SHAPE RENDER
  const MonocolorPixiLayer = ({ data, name }) => {
    const map = useMap();
    const graphicsRef = useRef(new PIXI.Graphics());

    useEffect(() => {
      if (!map || !data) return;

      const graphics = graphicsRef.current;
      graphics.clear(); // Clear only when the DATA changes, not on zoom
      graphics.lineStyle(8, 0x0000FF);
      graphics.beginFill(0x0000FF, 0.5);

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

  //BASELINE SHAPE RENDER
  const MulticolorPixiLayer = ({ data, name }) => {
    const map = useMap();
    const graphicsRef = useRef(new PIXI.Graphics());

    useEffect(() => {
      if (!map || !data) return;

      const graphics = graphicsRef.current;
      graphics.clear(); // Clear only when the DATA changes, not on zoom

      console.log('rerender' + name);
      console.log(data);
      if(data.features){
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
      }
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


  //MAP EDITOR TOOL

  //we leverage a turf-rbush tree to handle painting 
  //a handler on the map will send the current cursor position continuously while clicked
  //the method will use the r-tree to find the polygon the point is inside
  //checkers will be based on other tool props to determine if the shape can be 'drawn'
  //a 'drawn' shape is added to the PixiOverlay FeatureCollection corresponding to the layer we're currently drawing on, and if necessary, the entry is instead modified to respect
  //a new color and parent. that's pretty much it *shrug*

  //the other half of this is a form that handles a complex object and maintains multiple states
  const [rbush, setRbush] = useState(null); //contains spatially-indexed form of the concat set
  
  //threemap - we need to retrieve and replace so there has to be a binding
  //the key for a polygon is the hashcode of the shape it copies - exactly as returned from the r-tree
  const entityLayer = new Map();
  const subentityLayer = new Map();
  const interLayer = new Map();

  var [entityRenderSet, setEntityRenderSet] = useState(null);

  const [selectedLayer, setSelectedLayer] = useState(entityLayer);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [entityEntries, setEntityEntries] = useState(new Map());

  //initialize rbush
  useEffect(() => {
    console.log('init');
    let tree = geojsonRbush();
    console.log(concat);
    tree.load(concat);
    console.log(tree.all());
    setRbush(tree); //holy ugly call

    let subentitiesMap = new Map();
    subentitiesMap.set('dyrit', {
      name: 'dyrit',
      color: '#3a478f'
    })

    subentitiesMap.set('palis', {
      name: 'palis',
      color: '#583e3e'
    })

    subentitiesMap.set('rona', {
      name: 'rona',
      color: '#477456'
    })

    subentitiesMap.set('laar', {
      name: 'laar',
      color: '#617437'
    })

    subentitiesMap.set('paxta', {
      name: 'paxta',
      color: '#69385d'
    })

    let interentities = new Map();
    interentities.set('terraneve', {
      name: 'Ordo Terra-néve',
      color: '#684392'
    });

    //this will be assembled from the website tomorrow, but this is a patch
    entityEntries.set('glassblood', {
      name: 'glassblood',
      color: '#79c5bb',
      subentities: subentitiesMap,
      inter: interentities
    });

    console.log(entities);

    setSelectedEntity(entityEntries.get('glassblood'));

  }, []);

  useEffect(() => {
    console.log('run every time entityRenderSet changes');
    console.log(entityRenderSet);
  }, [entityRenderSet])

  const LocationFinder = () => {
    const [position, setPosition] = useState(null);

    useMapEvents({
      click(e) {
        // Access the latitude and longitude from the event object
        setPosition(e.latlng);
        console.log('Clicked coordinates:', e.latlng.lng, e.latlng.lat);
        // You can also use the map instance if needed, via `const map = useMapEvents(...)`
        let pt = turf.point([e.latlng.lng, e.latlng.lat]);
        let result = rbush.search(pt);
        console.log(result);

        tryPaint(result);
      },
    });

    return position ? (
      <p>
        Latitude: {position.lat.toFixed(4)}, Longitude: {position.lng.toFixed(4)}
      </p>
    ) : (
      <p>Click the map to get coordinates</p>
    );
  };

  function changeMode(event){
    console.log(event.target.value);
    switch (event.target.value){
      case "entities":
        setSelectedLayer(entityLayer);
      case "subentities":
        setSelectedLayer(subentityLayer);
      case "internal":
        setSelectedLayer(interEntityLayer);
    } 
  }

  //map onclick handler
  function tryPaint(hits){
    //console.log('clicked! dependencies loaded:');
    //console.log(selectedLayer);
    //console.log(selectedEntity);

    //for whatever map you have selected, we need to hash and look for collisions in the currently selected layer
    hits.features.forEach(hit => {
      let hash = quickHash(JSON.stringify(hit));
      //console.log(hash);
      let collision = selectedLayer.get(hash);

      //handle replacement per mode
      if(collision){
          //
      }

      let hitCopy = structuredClone(hit);
      hitCopy.owner = selectedEntity.name;
      hitCopy.color = selectedEntity.color;

      //console.log(hitCopy);

      selectedLayer.set(hash, hitCopy);
    })

    console.log(entityRenderSet);

    setEntityRenderSet(turf.featureCollection([...selectedLayer.values()]));
    
    //console.log('map');
    //console.log(mapRef);
    mapRef.fire('viewreset');

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
            >
              <LandmassLayer />
              <MonocolorPixiLayer data={concat} name="base"/>
              <MulticolorPixiLayer data={entityRenderSet} name="entity"/>
              <LocationFinder />
              <LayersControl ref={layerNodeRef} position="topright">
                <LayersControl.Overlay name="indi">
                  <IndivisibleLayer />
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
              SELECTED: {selectedEntity?.name}
            </div>
          </div>
          <div style={{'width':'85%', 'margin': 'auto', 'margin-bottom':'48px', 'max-height':'300px', 'overflowY':'auto'}}>
            <ul style={{'list-style-type':'none'}}>
              { 
                [...entityEntries.values()].map(entity => <li key={entity.name} className='list-hoverable' style={{'margin-top':'2px', 'margin-bottom':'2px', 'padding':'6px','border':'1px solid #585858', 'background-color':'black'}}> 
                  <div style={{'display':'flex'}}>
                    <div className='circle' style={{'background-color':entity.color}}></div>
                    <p>{entity.name}</p>
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

