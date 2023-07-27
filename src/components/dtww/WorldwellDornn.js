import '../../index.css';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, Rectangle, LayerGroup, LayersControl } from 'react-leaflet'
import { CRS, icon, map } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil, pagedesc, realms, inhabitants, polities } from './DornnMapConstants';
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
  const [selectedBody, setSelectedBody] = useState(null);
  const [selectedPoly, setSelectedPoly] = useState(screenBounds);
  const [mapControlState, setMapControlState] = useState([false, false]); //represents drag and zoom restrictions

  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  const [runMonitor, setRunMonitor] = useState(false);

  const [classNames, setClassNames] = useState(['map-polygon'])

  const dw = 'IM Fell DW Pica'
  const roman = 'Gideon Roman'

  const [headerFont, setHeaderFont] = useState(dw)




  function wrapSetBio(bio){
    console.log("SET BIO")
    setBio(bio);
  }



//For bottom infopanel
const [bio, setBio] = useState(pagedesc)

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
    
    if(info == null && !runMonitor){
    console.log("rereq map info")
      setRunMonitor(true);
      graphcms.request(QUERY_MAPENTRY)
      .then(res => setInfo(res.mapInfos))
      
    }
  });

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
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(0, true) 
          }
        },
        mouseout(event) {
          console.log("dol OUT")
          console.log(event)
          if(!focused && event.target.options.fillOpacity != 0){
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
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(1, true) 
          }
        },
        mouseout(event) {
          console.log("north OUT")
          console.log(event)
          if(!focused && event.target.options.fillOpacity != 0){
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
            if(!focused &&  event.target.options.fillOpacity != 0.5){
              hoverToggleOpacs(2, true) 
            }
          },
          mouseout(event) {
            if(!focused && event.target.options.fillOpacity != 0){
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
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(3, true) 
          }
        },
        mouseout(event) {
          if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(4, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(5, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(6, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(7, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(8, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(9, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(10, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(11, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(12, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(13, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(14, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(15, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(16, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(17, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(18, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
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
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(19, true) 
          }
        },
        mouseout(event) {
          if(!focused && event.target.options.fillOpacity != 0){
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
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          hoverToggleOpacs(20, true) 
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
          hoverToggleOpacs(20, false) 
        }
      }
      
    }),
    [map],
    )

      
  
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
                    <MapContainer ref={setMap} center={[256, 534]} zoom={0.4} minZoom={0.4} dragging={mapControlState[0]} scrollWheelZoom={mapControlState[1]} zoomControl={false} zoomSnap={0.1} zoomDelta={0.8} crs={CRS.Simple} maxBounds={screenBoundsWiggle} maxBoundsViscosity={0.9}>
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
                  
                </div>
              </div>
            </div>
      </div>
    </div>

    <div className='blog-footer' />


    <section id="navbar" className="">
        <div className="wwdnavbar">
            <button onClick={() => setBio(pagedesc)}>- What Is This? -</button>
            <button onClick={() => setBio(realms)}>- The Realms -</button>
            <button onClick={() => setBio(inhabitants)}>- The Inhabitants -</button>
            <button onClick={() => setBio(polities)}>- The Polities -</button>
            <button onClick={() => setBio(realms)}>- The Histories -</button>
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


              <div className="bio-container" dangerouslySetInnerHTML={{ __html: bio }}></div>
                
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>


    
  );
};
export default Dornn;

