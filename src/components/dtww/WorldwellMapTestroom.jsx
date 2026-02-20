import '../../index.css';
import * as turf from "@turf/turf";
import { GeoJSON2SVG } from 'geojson2svg';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import oneShape from './oneshape.json';
import bigSlice from './25k.json';
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
  const [focused, setFocused] = useState(false);
  const [centered, setCentered] = useState(false);
  const [map, setMap] = useState(null);
  const [extraLayers, setExtraLayers] = useState(null);
  const [info, setInfo] = useState(null);
  const [settlements, setSettlements] = useState(null);
  const [selectedBody, setSelectedBody] = useState(null);
  const [selectedPoly, setSelectedPoly] = useState(screenBounds);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [infoPanel, setInfoPanel] = useState(null);
  const [settlementsTab, setSettlementsTab] = useState(null);
  const [territoriesTab, setTerritoriesTab] = useState(null);
  const [mapControlState, setMapControlState] = useState([false, false]); //represents drag and zoom restrictions
  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  const [runMonitor1, setRunMonitor1] = useState(false);
  const [runMonitor2, setRunMonitor2] = useState(false);
  const [classNames, setClassNames] = useState(['map-polygon'])
  const dw = 'IM Fell DW Pica'
  const roman = 'Gideon Roman'
  const [headerFont, setHeaderFont] = useState(dw)
  const [entityFocused, setEntityFocused] = useState(false)
  const [markerFocused, setMarkerFocused] = useState(false)
  const [markerClass, setMarkerClass] = useState(0);
  const [wakeupDone, setWakeupDone] = useState(false);
  const [testJson, setTestJson] = useState(null);

  //deprecated
  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
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

  function GeoLayer(props){
    return (<><GeoJSON 
        data={props.geoData}
        style={() => ({
          color: props.lineColor,
          weight: 2,
          opacity: 1,
          fillColor: '#ffffff',
          fillOpacity: 0.5
        })}
      ></GeoJSON></>
    )
  }


  //WORKING PIXILAYER, BUT IT DOES NOT EVER FREE ANYTHING ON RECALCULATION
  const PixiGeoJsonLayer = ({ data }) => {
    const map = useMap();
    
    useEffect(() => {
      console.log('in pixi generator');
      console.log(data);

      const pixiContainer = new PIXI.Container();
      const overlay = L.pixiOverlay((utils) => {
        const container = utils.getContainer();
        const project = utils.latLngToLayerPoint;
        const scale = utils.getScale();
        
        // Clear and redraw
        container.removeChildren();
        const graphics = new PIXI.Graphics();
        
        data.features.forEach(feature => {
          graphics.lineStyle(2 / scale, 0xFF0000);
          graphics.beginFill(0xFF0000, 0.5);
          
          //console.log(feature.geometry.coordinates);
          if(feature.geometry.type === 'Polygon'){
            feature.geometry.coordinates.forEach(coords => {
              console.log('RED PRETRANSFORM');
              console.log(coords);
              const points = coords.map(c => {
                //console.log('whats in c? ' + c);
                const p = project([c[1], c[0]]); // GeoJSON [Lon, Lat] -> [Lat, Lon]
                return [p.x, p.y];
              }).flat();
              
              console.log('RED');
              console.log(points);
              graphics.drawPolygon(points);
            })
          } else if (feature.geometry.type === 'MultiPolygon'){
            feature.geometry.coordinates.forEach(coordSet => {
              //console.log('whats in coords?');
              //console.log(coords);
              coordSet.forEach(coords => {
                const points = coords.map(c => {
                    //console.log('whats in c? ' + c);
                    const p = project([c[1], c[0]]); // GeoJSON [Lon, Lat] -> [Lat, Lon]
                    return [p.x, p.y];
                  }).flat();
                  
                  console.log('RED');
                  console.log(points);
                  graphics.drawPolygon(points);
              })
            })
          }
        });

        container.addChild(graphics);
        console.log('rerender!');
        console.log(container);
        utils.getRenderer().render(container);
      }, pixiContainer);

      overlay.addTo(map);
      return () => map.removeLayer(overlay);
    }, [map, data]);

    return null;
  };



  //2ND WORKING PIXILAYER?
  const PixiGeoJsonLayerEdit = ({ data }) => {
    const map = useMap();

    console.log('HOW MANY HITS?');
    const calculatedPoints = data.features.map(feature => {
        const coords = feature.geometry.coordinates;
        if (feature.geometry.type === 'Polygon') {
          // IMPORTANT: Swap [x, y] to [y, x] and project to Zoom 0 pixels
          return {
            coordinates: coords.map(coordinateSet => {
              return coordinateSet.map(c => {
                const projected = map.options.crs.project(L.latLng(c, c));
                const updatedProjected = [projected.y * 64, projected.x * -64];
                return [projected.y * 64, projected.x * -64];
              });
            }),
            type: feature.geometry.type
          };
        }

        if (feature.geometry.type === 'MultiPolygon') {
          // IMPORTANT: Swap [x, y] to [y, x] and project to Zoom 0 pixels
          return {
            coordinates: coords.map(subshape => {
              return subshape.map(coordinateSet => {
                return coordinateSet.map(c => {
                  const projected = map.options.crs.project(L.latLng(c, c));
                  const updatedProjected = [projected.y * 64, projected.x * -64];
                  return [projected.y * 64, projected.x * -64];
                });
              });
            }),
            type: feature.geometry.type
          }
        }
      });

    console.log(calculatedPoints);
    
    useEffect(() => {
      const pixiContainer = new PIXI.Container();

      const overlay = L.pixiOverlay((utils) => {
        const container = utils.getContainer();
        const project = utils.latLngToLayerPoint;
        const scale = utils.getScale();
        
        // Clear and redraw
        container.removeChildren();
        const graphics = new PIXI.Graphics();
        
        calculatedPoints.forEach(feature => {
          graphics.lineStyle(2 / scale, 0x0000FF);
          graphics.beginFill(0x0000FF, 0.5);
          
          //console.log(feature.geometry.coordinates);
          if(feature.type === 'Polygon'){
            feature.coordinates.forEach(pointsUnflat => {
              const points = pointsUnflat.flat();
              graphics.drawPolygon(points);
            })
          } else if (feature.type === 'MultiPolygon'){
            feature.coordinates.forEach(coordSet => {
              coordSet.forEach(pointsUnflat => {
                const points = pointsUnflat.flat();
                graphics.drawPolygon(points);
              })
            })
          }
        });

        container.addChild(graphics);
        console.log('rerender!');
        console.log(container);
        utils.getRenderer().render(container);
      }, pixiContainer);

      overlay.addTo(map);
      return () => map.removeLayer(overlay);
    }, [map, data]);

    return null;
  };

  //2ND WORKING PIXILAYER?
  const PixiGeoJsonLayerEdit2 = ({ data, name }) => {
    const map = useMap();
    const graphicsRef = useRef(new PIXI.Graphics());

    useEffect(() => {
      if (!map || !data) return;

      const graphics = graphicsRef.current;
      graphics.clear(); // Clear only when the DATA changes, not on zoom
      graphics.lineStyle(8, 0x0000FF);
      graphics.beginFill(0x0000FF, 0.5);

      console.log('HOW MANY HITS?');
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
        console.log(graphics)
        
        
        renderer.render(container);
      }, new PIXI.Container());

      overlay.addTo(map);
      const overlayMaps = {
        name: overlay
      };

      L.control.layers(null, overlayMaps).addTo(map)

      // 3. CLEANUP: Explicitly destroy to free GPU memory
      return () => {
        map.removeLayer(overlay);
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

  //entityDrawLayer
  //subEntityDrawLayer

  return (
    <>
      <div id='content-main'>
        <img className="m-auto w-full sm:w-1/2 pt-5" src="../../world_banner.png" alt="The World - Also Known as The Measured Extent of the Dornnian Midlands"/>
        <div className="mapcontent relative">
          
          {/*<img className="" src="../../whiteout-blank-site.png" useMap="#dornnmap" alt="This is a full-scale linked map of the Dornnian Midlands. It is not navigable by screen reader, so you will instead use the following links to access the information you're looking for. This map is divided into several regions which will be read through in sequence."/>*/}
          <div id='map' ref={mapContainerRef}>
            <MapContainer 
              ref={setMap} 
              center={[1024, 2048]} 
              zoom={-2} 
              minZoom={-2}
              dragging={true} 
              zoomControl={true} 
              crs={CRS.Simple} 
              maxBounds={screenBoundsWiggle} 
              maxBoundsViscosity={0.9} tap={false} 
            >
              <LandmassLayer />
              <PixiGeoJsonLayerEdit2 data={concat} name="base"/>
              <PixiGeoJsonLayerEdit2 data={null} name="alliance"/>
              <PixiGeoJsonLayerEdit2 data={null} name="entity"/>
              <PixiGeoJsonLayerEdit2 data={null} name="subentity"/>
              <PixiGeoJsonLayerEdit2 data={null} name="inter"/>
              <LayersControl position="topright">
                <LayersControl.Overlay name="white">
                  <ImageOverlay 
                      url="../../plain_overlay.png" bounds={screenBounds} pagespeed_no_transform
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="uncropped">
                  <GeoLayer geoData={tinySlice} lineColor={'black'}/>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="crop attempt I">
                  <GeoLayer geoData={firstSlice} lineColor={'black'}/>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="indi">
                  <IndivisibleLayer />
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
        </div>
      </div>
      <div style={{'margin-left':'45vw', 'margin-top':'50px','padding-bottom':'50px'}}>
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
      </div>
    </>

  );
};
export default Dornn;

