import '../../index.css';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, useMapEvent, Rectangle, LayerGroup, LayersControl } from 'react-leaflet'
import { CRS, icon, map, marker } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY, QUERY_SETTLEMENTENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil, pagedesc, realms, inhabitants, history } from './DornnMapConstants';
import { CSSTransition } from 'react-transition-group';

const screenBounds = [
  [0, 0],
  [511, 1068],
]

const screenBoundsWiggle = [
  [-500, -500],
  [1011, 1568],
]


const zoneArray = [dolwynd, northsea, anterros, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil ]



const redColor = { color: 'red' }
const whiteColor = { color: 'white' }
const blackColor = { color: 'black' }
const borderColor = { color: 'black' }


var cantocIcon = icon({
  iconUrl: '../../cantoc_test.png',

  iconSize:     [140, 28], // size of the icon
  iconAnchor:   [35, 7], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});



const Dornn = () => {

  const mapContainerRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [map, setMap] = useState(null);
  const [info, setInfo] = useState(null);
  const [settlements, setSettlements] = useState(null);
  const [selectedBody, setSelectedBody] = useState(null);
  const [selectedPoly, setSelectedPoly] = useState(screenBounds);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [mapControlState, setMapControlState] = useState([false, false]); //represents drag and zoom restrictions

  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  const [runMonitor1, setRunMonitor1] = useState(false);
  const [runMonitor2, setRunMonitor2] = useState(false);

  const [classNames, setClassNames] = useState(['map-polygon'])

  const dw = 'IM Fell DW Pica'
  const roman = 'Gideon Roman'

  const [headerFont, setHeaderFont] = useState(dw)

  const [markerFocused, setMarkerFocused] = useState(false)


  function timeout(delay) {
    return new Promise( res => setTimeout(res, delay) );
  }

  function wrapSetBio(bio){
    console.log("SET BIO")
    setBio(bio);
  }



  //For bottom infopanel
  const [bio, setBio] = useState(0)

  function setZoneOpacities(which){

    var newOpacitiesArray = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    for(let i = 0; i < zoneArray.length; i++){
      console.log(which == screenBounds);
        if(which == screenBounds){
          console.log("RESET " + i);
          newOpacitiesArray[i] = 0.0; //reset bounds - disable blockers
        }
        else if(zoneArray[i] != which){
          console.log(zoneArray[i]);
          newOpacitiesArray[i] = 1.0; //When a zone is selected, all other zones crank their bg opacity to 100% and become invisible.
          setInProp(true);
        }
    }

    setOpacities(newOpacitiesArray);
  }

  function hoverToggleOpacs(which, sel){ //play on mouseevent. if sel is true, disable everything shadow this. otherwise flat restore + zero out
    var setterArray = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    if(!sel){ //if unselect
        for(let i = 0; i < setterArray.length; i++){
            setterArray[i] = opacities[i];
        }
        setterArray[which] = 0.0
    } else {
        setterArray[which] = 0.5;
    }

    setOpacities(setterArray); //this function is primarily to wedge missed mouseover / mouseout collisions - instead of just wiping out it neutrals all entries on deselect just in case.
  }

  useEffect(() => {
    
    if(info == null && !runMonitor1){
    console.log("rereq map info")
      setRunMonitor1(true); //repeat insurance, unnecessary when we add []
      graphcms.request(QUERY_MAPENTRY)
      .then(res => setInfo(res.mapInfos))
    }

    if(settlements == null && !runMonitor2){
      console.log("rereq sett info")
        setRunMonitor2(true);
        graphcms.request(QUERY_SETTLEMENTENTRY)
        .then(res => setSettlements(res.settlementInfos))

        graphcms.request(QUERY_SETTLEMENTENTRY)
        .then(res => console.log(res))
    }


  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if(map != null){ map.invalidateSize(); 
      }
    });
    
    
    resizeObserver.observe(mapContainerRef.current);
  })
  
  function updateFocus(){ //Return to origin. Rename function!
     setFocused(false);
     setSelectedPoly(screenBounds);
     console.log("Returning to origin.");
     setZoneOpacities(screenBounds);
     map.flyTo([256, 534], 0.4);
     setSelectedBody(null);
     setMapControlState(true, true);  
  }


  function closeSettlementPopup(){ //Full-fo
    setMarkerFocused(false)
    map.flyTo([256, 534], 0.4)
    setSelectedSettlement(null)
 }

  function SetBoundsPolygons() {
    const [bounds, setBounds] = useState(screenBounds)
    const map = useMap()

    const mapEvents = useMapEvents({
        zoomend(e){
          if(selectedPoly != screenBounds){
            setZoneOpacities(selectedPoly, true);
            setClassNames(['map-polygon polygon-hover'])
          }
        }
    })
  
    const dolwyndHandlers = useMemo(
      () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === "dolwynd")
            setSelectedBody(post);

            setBounds(dolwynd);
            setFocused(true);

            map.invalidateSize();
            setHeaderFont(dw);
            
            map.flyToBounds(dolwynd, {duration: 2})
            setSelectedPoly(dolwynd);
          }
        },
        mouseover(event) {
          console.log("dol over")
          if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(0, true) 
          }
        },
        mouseout(event) {
          console.log("dol OUT")
          console.log(event)
          if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
            hoverToggleOpacs(0, false) 
           }
        }
      }),
      [map],
    )

    const northseaHandlers = useMemo(
      () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === "northsea")
            setSelectedBody(post);
            setBounds(northsea);
            
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            setHeaderFont(dw);
            
            map.flyToBounds(northsea, {duration: 2})
            setSelectedPoly(northsea);
          }
        },
        
        mouseover(event) {
          console.log("north over")
          if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(1, true) 
          }
        },
        mouseout(event) {
          console.log("north OUT")
          console.log(event)
          if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
            hoverToggleOpacs(1, false) 
          }
        }
        
      }),
      [map],
    )

      const anterrosHandlers = useMemo(
        () => ({
          click() {
            if(!focused){
              const post = info.find((post) => post.entryID === "anterros")
              setSelectedBody(post);
              setBounds(anterros);
              
              setFocused(true);
              console.log(focused);
              map.invalidateSize();
              setHeaderFont(dw);
              
              map.flyToBounds(anterros, {duration: 2})
              setSelectedPoly(anterros);
            }
          },
          
          mouseover(event) {
            if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
              hoverToggleOpacs(2, true) 
            }
          },
          mouseout(event) {
            if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
              hoverToggleOpacs(2, false) 
            }
          }
          
        }),
        [map],
    )

    const argovHandlers = useMemo(
      () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === "argov")
            setSelectedBody(post);
            setBounds(argov);
            
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            setHeaderFont(dw);
            
            map.flyToBounds(argov, {duration: 2})
            setSelectedPoly(argov);
          }
        },
        
        mouseover(event) {
          if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(3, true) 
          }
        },
        mouseout(event) {
          if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
            hoverToggleOpacs(3, false) 
          }
        }
        
      }),
      [map],
  )

  const iorstavHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "iorstav")
          setSelectedBody(post);
          setBounds(iorstav);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(iorstav, {duration: 2})
          setSelectedPoly(iorstav);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(4, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(4, false) 
        }
      }
      
    }),
    [map],
    )

    const dorrimHandlers = useMemo(
    () => ({
      
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "dorrim")
          setSelectedBody(post);
          setBounds(dorrim);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);

          map.flyToBounds(dorrim, {duration: 2})
          setSelectedPoly(dorrim);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(5, true) 
        }
        
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(5, false) 
        }
        
      }
      
    }),
    [map],
    )

    const cantocHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "cantoc")
          setSelectedBody(post);
          setBounds(cantoc);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(cantoc, {duration: 2})
          setSelectedPoly(cantoc);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(6, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(6, false) 
        }
      }
      
    }),
    [map],
    )

    const mologHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "molog")
          setSelectedBody(post);
          setBounds(molog);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(molog, {duration: 2})
          setSelectedPoly(molog);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(7, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(7, false) 
        }
      }
      
    }),
    [map],
    )

    const ferveirnHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "ferveirn")
          setSelectedBody(post);
          setBounds(ferveirn);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(ferveirn, {duration: 2})
          setSelectedPoly(ferveirn);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(8, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(8, false) 
        }
      }
      
    }),
    [map],
    )

    const rhomiHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "rhomi")
          setSelectedBody(post);
          setBounds(rhomi);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(rhomi, {duration: 2})
          setSelectedPoly(rhomi);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(9, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(9, false) 
        }
      }
      
    }),
    [map],
    )

  const lannochHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "lannoch")
          setSelectedBody(post);
          setBounds(lannoch);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(lannoch, {duration: 2})
          setSelectedPoly(lannoch);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(10, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(10, false) 
        }
      }
      
    }),
    [map],
    )

    const mornaHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "morna")
          setSelectedBody(post);
          setBounds(morna);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(morna, {duration: 2})
          setSelectedPoly(morna);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(11, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(11, false) 
        }
      }
      
    }),
    [map],
    )

    const vaicHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "vaic")
          setSelectedBody(post);
          setBounds(vaic);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(dw);
          
          map.flyToBounds(vaic, {duration: 2})
          setSelectedPoly(vaic);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(12, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(12, false) 
        }
      }
      
    }),
    [map],
    )

    const akkvaltHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "akkvalt")
          setSelectedBody(post);
          setBounds(akkvalt);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(akkvalt, {duration: 2})
          setSelectedPoly(akkvalt);
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(13, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(13, false) 
        }
      }
      
    }),
    [map],
    )

    const salirHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "salir")
          setSelectedBody(post);
          setBounds(salir);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(salir, {duration: 2})
          setSelectedPoly(salir);

        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(14, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(14, false) 
        }
      }
      
    }),
    [map],
    )

    const dorsHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "dors")
          setSelectedBody(post);
          setBounds(dors);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(dors, {duration: 2})
          setSelectedPoly(dors);

        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(15, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(15, false) 
        }
      }
      
    }),
    [map],
    )

    const crovonHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "crovon")
          setSelectedBody(post);
          setBounds(crovon);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(crovon, {duration: 2})
          setSelectedPoly(crovon);

        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(16, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(16, false) 
        }
      }
      
    }),
    [map],
    )

    const mosmogaHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "mosmoga")
          setSelectedBody(post);
          setBounds(mosmoga);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(mosmoga, {duration: 2})
          setSelectedPoly(mosmoga);

        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(17, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(17, false) 
        }
      }
      
    }),
    [map],
    )

    const kamdagHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "kamdag")
          setSelectedBody(post);
          setBounds(kamdag);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(kamdag, {duration: 2})
          setSelectedPoly(kamdag);

        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(18, true) 
        }
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(18, false) 
        }
      }
      
    }),
    [map],
    )

    const agosHandlers = useMemo(
      () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === "agos")
            setSelectedBody(post);
            setBounds(agos);
            
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            setHeaderFont(roman);
            
            map.flyToBounds(agos, {duration: 2})
            setSelectedPoly(agos);

          }
        },
        
        mouseover(event) {
          if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(19, true) 
          }
        },
        mouseout(event) {
          if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
            hoverToggleOpacs(19, false) 
          }
        }
        
      }),
      [map],
      )

    const ghommililHandlers = useMemo(
    () => ({
      click() {
        if(!focused){
          const post = info.find((post) => post.entryID === "ghommilil")
          setSelectedBody(post);
          setBounds(ghommilil);
          
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          setHeaderFont(roman);
          
          map.flyToBounds(ghommilil, {duration: 2})
          setSelectedPoly(ghommilil);
      
        }
      },
      
      mouseover(event) {
        if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(20, true) 
        }
        
      },
      mouseout(event) {
        if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(20, false) 
        }
      }
      
    }),
    [map],
    )

      
    if(markerFocused){
      return null
    } else {
    return (
      <>
      
        <Polygon
          positions={dolwynd}
          eventHandlers={dolwyndHandlers}
          pathOptions={bounds === dolwynd ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[0]}
        />

        <Polygon
          positions={northsea}
          eventHandlers={northseaHandlers}
          pathOptions={bounds === northsea ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[1]}
        />
        <Polygon
          ref={nodeRef}
          positions={anterros}
          eventHandlers={anterrosHandlers}
          pathOptions={bounds === anterros ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[2]}
        />   

        <Polygon
          positions={argov}
          eventHandlers={argovHandlers}
          pathOptions={bounds === argov ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[3]}
        /> 

        <Polygon
          positions={iorstav}
          eventHandlers={iorstavHandlers}
          pathOptions={bounds === iorstav ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[4]}
        />  

        <Polygon
          positions={dorrim}
          eventHandlers={dorrimHandlers}
          pathOptions={bounds === dorrim ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[5]}
        />  

        <Polygon
          positions={cantoc}
          eventHandlers={cantocHandlers}
          pathOptions={bounds === cantoc ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[6]}
        />  

        <Polygon
          positions={molog}
          eventHandlers={mologHandlers}
          pathOptions={bounds === molog ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[7]}
        /> 

        <Polygon
          positions={ferveirn}
          eventHandlers={ferveirnHandlers}
          pathOptions={bounds === ferveirn ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[8]}
        /> 

        <Polygon
          positions={rhomi}
          eventHandlers={rhomiHandlers}
          pathOptions={bounds === rhomi ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[9]}
        /> 

        <Polygon
          positions={lannoch}
          eventHandlers={lannochHandlers}
          pathOptions={bounds === lannoch ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[10]}
        /> 

        <Polygon
          positions={morna}
          eventHandlers={mornaHandlers}
          pathOptions={bounds === morna ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[11]}
        /> 

        <Polygon
          positions={vaic}
          eventHandlers={vaicHandlers}
          pathOptions={bounds === vaic ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[12]}
        /> 

        <Polygon
          positions={akkvalt}
          eventHandlers={akkvaltHandlers}
          pathOptions={bounds === akkvalt ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[13]}
        /> 

        <Polygon
          positions={salir}
          eventHandlers={salirHandlers}
          pathOptions={bounds === salir ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[14]}
        /> 

        <Polygon
          positions={dors}
          eventHandlers={dorsHandlers}
          pathOptions={bounds === dors ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[15]}
        /> 

        <Polygon
          positions={crovon}
          eventHandlers={crovonHandlers}
          pathOptions={bounds === crovon ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[16]}
        /> 

        <Polygon
          
          positions={mosmoga}
          eventHandlers={mosmogaHandlers}
          pathOptions={bounds === mosmoga ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[17]}
        /> 

        <Polygon
          positions={kamdag}
          eventHandlers={kamdagHandlers}
          pathOptions={bounds === kamdag ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[18]}
        /> 

        <Polygon
          positions={agos}
          eventHandlers={agosHandlers}
          pathOptions={bounds === agos ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[19]}
        /> 

        <Polygon
          positions={ghommilil}
          eventHandlers={ghommililHandlers}
          pathOptions={bounds === ghommilil ? whiteColor : blackColor}
          opacity = {0}
          fillOpacity={opacities[20]}
        /> 
      

      </>
    )
    }
  }

  function BioContainer() {

    if(bio == 0){
      return (
        pagedesc
      )
    } else if(bio == 1) { 
      return (
        realms
      )
    } else if(bio == 2) {
      return (
        inhabitants
      )
    } else if(bio == 3){
      return (
        polities
      )
    } else if(bio == 4){
      return (
        history
      )
    }

  }

  const [markerList, setMarkerList] = useState([]) 
  const [markerPositions, setMarkerPositions] = useState([]) 

  //list of const - 
  const ss = useRef();
  const ss_position = [218, 188]
  const dyrit = useRef();
  const dyrit_position = [149, 311] //ALL POSITIONS ARE OFFSET BY ~10 X

  const settlement_handles_ordered = ["Seventh Spear", "Dyrit"]


  useEffect(() => {
    setMarkerList([ss, dyrit])
    setMarkerPositions([ss_position, dyrit_position])

    
  }, [])
  

  function PoligridPins() {

    return (
      <>
        <Marker ref={ss} position={ss_position}>
        </Marker>

        <Marker ref={dyrit} position={dyrit_position}>
        </Marker>
      </>

    )
    
  }

  async function selectPoligridPin(which) {
    console.log("SELECT MARKER " + which)

    const marker = markerList[which].current

    const post = settlements.find((post) => post.name === settlement_handles_ordered[which])
    console.log("SETTLEMENT SEARCH:")
    console.log(post)
    setSelectedSettlement(post);

    if(marker)
      mapContainerRef.current.scrollIntoView()

      setMarkerFocused(true)


      const position = [markerPositions[which][0], markerPositions[which][1] + 10] //offset for setup. TODO pick box disp side based on proximity to edge

      map.flyTo(position, 3)
    
  }

  const polities = (

    <>
    <img id="huge-header" className="mx-auto align-top opacity-90 pt-16 w-2/5" src="../../political_cover_alt.png"/>
    
    
    <p id="text-center-83">
    The Dornnian Midlands have changed hands about as many times as you’d expect, burdened by the spasms, expansions and contractions of mortal whim. In the Seasons of Stagnation, the receding Empires of Men have left room for old hands to resume their work; the shape of the map has begun to take on a familiar form.
    <br /> <br />
    Click on any individual faction header to select their capital on the map. 
    </p>
    
    
    <div id="spec-header-box">
      <div id="species-text">
        <h1 className="purple">The Five Human Families</h1>
        <p id="padding-scrunch">
        Though their power wanes in the face of Glassblood-prompted migratory operations and other late-lifecycle issues, the Human Families have not yet released their grip. 
        They’ve been mostly batted out of the northern fringes, but their hold of the southlands remains as tight as it was half a millennium prior. They are:
        </p>
      </div>
    </div>
    
      <div id="politic-box">
        <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <h2 className="blue force-vert-center">The Glassbloods</h2>
        </div>
      </div>
    
      <div id="politic-box">
      <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <h2 className="white force-vert-center">The Crux</h2>
        </div>
      </div>
    
      <div id="politic-box">
        <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <h2 className="red force-vert-center">The Britchoffs</h2>
        </div>
      </div>
    
      <div id="politic-box">
        <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <h2 className="gold force-vert-center">The Drairinni</h2>
        </div>
      </div>
    
      <div id="politic-box">
      <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <h2 className="orange force-vert-center">The Anterrosites</h2>
        </div>
      </div>
    
      <div className='blog-footer'></div>
    
      <h1 className="double"></h1>
    
    
      <div id="spec-header-box">
      <div id="species-text">
        <h1 className="green">The Midland Council (XII)</h1>
        <p id="padding-scrunch">
        Reformed many times in the wake of worldshaking disaster, the Midland Council is the soul and spine of Dornnian peacetime. Their existence is not a symbolic platitude - the Council 
        is the fulcrum of all traditional politics, the mediator, and an armed force backed by the Sword-Saints that will frequently stamp out potential conflict. In a world where the 
        threat a single rogue agent poses can be planar, the highest level of mortal organization must have the power to decisively prevent such catastrophes. This has, does, and will 
        cause problems when they take action too hastily without full-body consultation.
        <br /> <br />
        The Human Families have tentatively agreed to hold seats at the Council in the years following Draid’s “final” incursion. Their representatives will attend any summit deemed sufficiently-severe, which has only happened
        three times since - the fourth Antikosmic Referendum, the discovery of the Timekeeper's Vault in northern Anterros, and the arrival of named-one "Remus".
        <br /><br />
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <a id="poligrid-link" href="/">Tholri's Domain</a>
      <a id="poligrid-link" href="/">The Northfolk Enclave<br/><i id="subtitle-tiny">"Northern Jawbone"</i></a>
      <a id="poligrid-link" href="/">Hezzar’s Pit</a>
      <a id="poligrid-link" href="/">Wormking's Sea</a>
    
      <a id="poligrid-link" href="/">Holger's Keep</a>
      <a id="poligrid-link" href="/">The Elfholds<br/><i id="subtitle-tiny">"Ilvor-Ylvindal"</i></a>
      <a id="poligrid-link" href="/">Northsea Confederacy</a>
      <a id="poligrid-link" href="/">The Demonhunters<br/><i id="subtitle-tiny">(perfunctory)</i></a>
    
      <a id="poligrid-link" href="/">Decryptor Houses</a>
      <a id="poligrid-link" href="/">The Midlands Historical Archive</a>
      <a id="poligrid-link" href="/">Isles of Security</a>
      <a id="poligrid-link" href="/">Wahlrect<br/><i id="subtitle-tiny">House of the Blood Tyrants</i></a>
    
      <a id="poligrid-link" href="/">Ilkair</a>
      <a id="poligrid-link" href="/">Deilān Federation</a>
      <a id="poligrid-link" href="/">The Sword-Saints</a>
      <a id="poligrid-link" href="/">The Faults</a>
    
      <a id="poligrid-link" href="/">Beastguard</a>
      <a id="poligrid-link" href="/">Denton's League</a>
      <a id="poligrid-link" href="/">The Sixfold Star</a>
      <a id="poligrid-link" href="/">Brassworks Fellowship</a>
    
      <a id="poligrid-link" href="/">Ithuk's Initiates</a>
      <a id="poligrid-link" href="/">Dreadpoint Forgesons</a>
      <a id="poligrid-link" href="/">Schools of the Elementalist</a>
      <a id="poligrid-link" href="/">Central Mint</a>
    
    </div>
    
    <div className='blog-footer'></div>
    
    <h1 className="double"> </h1>
    
    <div id="spec-header-box">
      <div id="species-text">
        <h1 className="orange">Free Agents</h1>
        <p id="padding-scrunch">
        Beyond the apocalyptic coalitions of the semi-mortal west, most polities are hacking it on their own. This is usually--not always, but usually--because they have 
        slightly-askew value systems. The Free Agents of Dornn are not inherently dangerous, but something about them is a bit too unfriendly to make it to the diplomatic chambers. 
        Their territories tend to be smaller than those of the Midland Council or the Human Empires, but they also employ exotic defenses and schemes of war to prevent further 
        border-shoves.
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <button id="poligrid-link" >The Theodryian Bridge</button>
      <button id="poligrid-link" >Salíran Dynasties</button>
      <button id="poligrid-link" >Kalamant</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(0)}>Deadlands Purging Company</button>
    
      <button id="poligrid-link" >Ordo Terra-néve<br /><i id="subtitle-tiny">"Twilit Order"</i></button>
      <button id="poligrid-link" >Argo's Riders</button>
      <button id="poligrid-link" >The Captain's Promise</button>
      <button id="poligrid-link" >Rogue Cosmologist Academies</button>
    
      <button id="poligrid-link" >The Encompassed</button>
      <button id="poligrid-link" >Northmount Calamity Concern</button>
      <button id="poligrid-link" >Statesmen</button>
      <button id="poligrid-link" >Tann's Lock</button>
    
      <button id="poligrid-link" >Dreamer's Rise</button>
      <button id="poligrid-link" >The Witchspine</button>
      <button id="poligrid-link" >Irwin's Council</button>
      <button id="poligrid-link" >The Golden Reach</button>
    
      <button id="poligrid-link" >Barod-Dām</button>
      <button id="poligrid-link" >Theodryia</button>
      <button id="poligrid-link" >Isles of Contentment</button>
      <button id="poligrid-link" >People of Krym</button>
    
      <button id="poligrid-link" >Olcrid</button>
      <button id="poligrid-link" >Zaic-Zahl<br /><i id="subtitle-tiny">"Basalt Towers"</i></button>
    
    
    </div>
    
    <div className='blog-footer'></div>
    
    <h1 className="double"></h1>
    
    <div id="spec-header-box">
      <div id="species-text">
        <h1 className="red">Threats</h1>
        <p id="padding-scrunch">
        Absolutely at war with all other groups, at all times. Lousy with exotic magic and unpredictable technique. Sequestered in strange and remote places beyond or beneath the limits
        of Dornnian cartographies. That, or they are plainly-powerful enough to hold their ground amongst the Midlanders despite near-constant invasion and war. Neither is preferable for the average adventurer. 
        Generally speaking, it is not advisable to confront representatives of these factions alone. 
        <br /> <br /> 
        This is what we know. Push beyond the limits of recorded knowledge and it shouldn't be hard to find worse. 
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <a id="poligrid-link" href="/">Draid</a>
      <a id="poligrid-link" href="/">The Stone Unit</a>
      <a id="poligrid-link" href="/">Rhômi's Hand</a>
      <a id="poligrid-link" href="/">The Jawlord Lives!</a>
    
      <a id="poligrid-link" href="/">Cosmolarian Visitors</a>
      <a id="poligrid-link" href="/">Avaroth</a>
      <a id="poligrid-link" href="/">Auditors</a>
      <a id="poligrid-link" href="/">The Remaining Riders</a>
    
      <a id="poligrid-link" href="/">Yardol</a>
      <a id="poligrid-link" href="/">The Five Spines</a>
      <a id="poligrid-link" href="/">Trawlers</a>
      <a id="poligrid-link" href="/">Epitaxor-Lords</a>
    
      <a id="poligrid-link" href="/">Woodsmen</a>
      <a id="poligrid-link" href="/">Escian Relics</a>
      <a id="poligrid-link" href="/">Antimortal Empires</a>
      <a id="poligrid-link" href="/">Basilisks</a>
    
      <a id="poligrid-link" href="/">House of Jai-Urn</a>
      <a id="poligrid-link" href="/">Primal Vampirics</a>
      <a id="poligrid-link" href="/">Coldbody Guardsmen</a>
      <a id="poligrid-link" href="/">Atrophykos</a>
    
      <a id="poligrid-link" href="/">Lilted Ones</a>
      <a id="poligrid-link" href="/">The Scorched</a>
      <a id="poligrid-link" href="/">The Rimed</a>
      <a id="poligrid-link" href="/">Icons</a>
    
      <a id="poligrid-link" href="/">Recluses</a>
      <a id="poligrid-link" href="/">Deeper Echoes</a>
      <a id="poligrid-link" href="/">Ysteria</a>
      <a id="poligrid-link" href="/">Demons</a>
    
    
    </div>
    
    <div className='blog-footer'></div>
    
    
    </>
    )

  const [inProp, setInProp] = useState(false);
  const nodeRef = useRef(null);

  return (
    
    <div className='worldwell min-h-screen' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
      {/* */}

      

      <section id="logo" className="wwlogo">
      <a className="m-auto lg:w-2/5 md:w-3/5 sm:w-4/5" href="/dtww">  
      <img
            
            alt="Down the Worldwell"
            src="../../dtww.png"
            />
       </a>
      </section>

      <section id="navbar" className="">
        <div className="navbar wwnavbar">
            <a href="/">
            <img
                className=""
                alt="return home"
                src="../../back_button.png"
                />
            </a>
            <a href="/dtww/system"><img src="../../system.png"/></a>
            <a href="/dtww/dornn"><img className='opacity-50' src="../../world.png"/></a>
            <a href="/dtww/character-creation"><img src="../../char.png"/></a>
            <a href="/dtww/assembly"><img src="../../assembly.png"/></a>
        </div>
      </section>

      <div className="map-spec">
         <div className="mid-border-map">
            <div className="inner-border">
              <img className="corner-decoration corner-left-top z-50" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-top z-50" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-bottom z-50" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-left-bottom z-50" src="../../corner-decoration.png"></img>

              <div id='content-main'>
                <img className="w-1/2 m-auto pt-5" src="../../world_banner.png" alt="The World - Also Known as The Measured Extent of the Dornnian Midlands"/>
                <div className="mapcontent">
                  
                  {/*<img className="" src="../../whiteout-blank-site.png" useMap="#dornnmap" alt="This is a full-scale linked map of the Dornnian Midlands. It is not navigable by screen reader, so you will instead use the following links to access the information you're looking for. This map is divided into several regions which will be read through in sequence."/>*/}
                  <div id='map' ref={mapContainerRef}>
                    <MapContainer ref={setMap} center={[256, 534]} zoom={0.4} minZoom={0.4} dragging={mapControlState[0]} scrollWheelZoom={mapControlState[1]} zoomControl={false} zoomSnap={0.1} zoomDelta={0.8} crs={CRS.Simple} maxBounds={screenBoundsWiggle} maxBoundsViscosity={0.9} tap={false} closePopupOnClick={false}>
                      <ImageOverlay 
                        url="../../whiteout-blank-site.png" bounds={screenBounds} pagespeed_no_transform
                      />
                      <LayersControl position="topright">
                        <LayersControl.Overlay name="Regional Nameplates">
                          <LayerGroup>
                            <ImageOverlay 
                            url="../../just_names.png" bounds={screenBounds} pagespeed_no_transform
                            />
                          </LayerGroup>
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Settlements">
                          <LayerGroup>
                            <PoligridPins></PoligridPins>
                          </LayerGroup>
                        </LayersControl.Overlay>
                      </LayersControl>
                      <SetBoundsPolygons />
                    </MapContainer>
                  </div>
                  { focused ? <div className="map-info text-center overflow-y-auto">
                    <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': selectedBody.headerColor.hex, 'fontFamily' : headerFont}}>{selectedBody.header}</h>
                    <p className='pb-2  px-5 text-slate-500'>
                    {selectedBody.environs}
                    </p>
                    <p>
                    {selectedBody.populations}
                    </p>
                    <p className="inline-block pt-5 pb-0  px-5 map-info-content" dangerouslySetInnerHTML={{ __html: selectedBody.body }}>
                    </p>
                    <button className='py-5 map-return' onClick={updateFocus}>GO BACK</button>
                    </div> :  null }

                    { (markerFocused && !focused) ? <div className="settlement bg-black border-4 border-gray absolute h-fit w-1/3 map-info text-center">
                    <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': selectedSettlement.nameColor.hex, 'fontFamily' : headerFont}}>{selectedSettlement.name}</h>
                    <p>
                      <i>
                        {selectedSettlement.subtitle}
                      </i>
                    </p>
                    <p className="inline-block pt-5 pb-0  px-5 map-info-content" dangerouslySetInnerHTML={{ __html: selectedSettlement.content }}>
                    </p>
                    <button className='py-5 map-return' onClick={closeSettlementPopup}>GO BACK</button>
                    </div> :  null }
                  
                </div>
              </div>
            </div>
      </div>
    </div>

    <div className='blog-footer' />


    <section id="navbar" className="">
        <div className="wwdnavbar">
            <button onClick={() => setBio(0)}>- What Is This? -</button>
            <button onClick={() => setBio(1)}>- The Realms -</button>
            <button onClick={() => setBio(2)}>- The Inhabitants -</button>
            <button onClick={() => setBio(3)}>- The Polities -</button>
            <button onClick={() => setBio(4)}>- The Histories -</button>
        </div>
    </section>
    <div className="dark-background ">
         <div className="mid-border">
            <div className="inner-border">
              <img className="corner-decoration corner-left-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-bottom" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-left-bottom" src="../../corner-decoration.png"></img>
              <img className="vertical-decoration top" src="../../horizontally-centered-vertical-decoration.png"></img>
              <img className="vertical-decoration bottom" src="../../horizontally-centered-vertical-decoration.png"></img>


              <div className="bio-container">
                <BioContainer />
              </div>
                
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>


    
  );
};
export default Dornn;

