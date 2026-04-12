import '../../index.css';
import * as turf from "@turf/turf";
import L from 'leaflet';
import 'leaflet.pattern';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, useMapEvent, Rectangle, FeatureGroup, LayerGroup, LayersControl, GeoJSON, SVGOverlay } from 'react-leaflet'
import { CRS, icon, map, marker } from 'leaflet'
import { graphcms, QUERY_MAPENTRY, QUERY_SETTLEMENTENTRY, QUERY_ENTITY_1, QUERY_ENTITY_2} from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil, pagedesc, realms, inhabitants, history, entityLabelCounts, entityLabelSizes, territoryIcons} from './DornnMapConstants';
import unified from './svg_cutouts_unified.json';
import superentityShapes from './superentity_shapes.json';
import entityShapes from './entity_shapes.json';

const screenBounds = [
  [0, 0],
  [2045, 4271],
]

const screenBoundsWiggle = [
  [-2000, -3000],
  [4045, 7271],
]


const zoneArray = [dolwynd, northsea, anterros, argov, iorstav, dorrim, cantoc, molog, ferveirn, rhomi, lannoch, morna, vaic, akkvalt, salir, dors, crovon, mosmoga, kamdag, agos, ghommilil ]


const whiteColor = { color: 'white' }
const blackColor = { color: 'black' }


const Dornn = () => {

  const mapContainerRef = useRef(null);
  const [focused, setFocused] = useState(null); //NOTE - Changed to string for style prop sensitivity
  const [centered, setCentered] = useState(false);
  const [map, setMap] = useState(null);
  const [info, setInfo] = useState(null);
  const [settlements, setSettlements] = useState(null);
  const [selectedBody, setSelectedBody] = useState(null); //! DEPRECATED - DELETE AFTER REFACTOR!
  const [selectedPoly, setSelectedPoly] = useState(screenBounds); //! DEPRECATED
  const [selectedSettlement, setSelectedSettlement] = useState(null); //! DEPRECATED
  const [infoPanel, setInfoPanel] = useState(null);
  const [settlementsTab, setSettlementsTab] = useState(null);
  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  const [classNames, setClassNames] = useState(['map-polygon'])
  const [entityFocused, setEntityFocused] = useState(false)
  const [markerFocused, setMarkerFocused] = useState(false)
  const [markerClass, setMarkerClass] = useState(0);
  const [wakeupDone, setWakeupDone] = useState(false);
  const [showIndevPopup, setShowIndevPopup] = useState(true);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  const dw = 'IM Fell DW Pica'
  const roman = 'Gideon Roman'

  const [headerFont, setHeaderFont] = useState(dw)
  
  const entityLayerCache = useRef(new Map());

  const [entityMarkerGroup, setEntityMarkerGroup] = useState(null);
  const entityLayerGroup = useRef(null);
  const mapBackgroundGroup = useRef(null);

  //ANTIPATTERN ! We use this to allow for a few forced-conditions. Namely:
  //-> We use this to init-load the entity layer for the sake of caching shapes.
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);

  //Here's where the CMS content sits for now.
  const entityFocusEntries = useRef(new Map());

  //zoom and visibility
  const [lastZoom, setLastZoom] = useState(-2);
  const [entityVisible, setEntityVisible] = useState(true); //this will be set to false upon (! FOR NOW ) the end of the entity layer evaluation/caching process.
  const [superEntityVisible, setSuperEntityVisible] = useState(true);



  //fits the boundaries of the map to the viewport to the best of its ability
  function mapWakeup(mapInstance){
    if(mapInstance != null && !wakeupDone){
      console.log("STARTUP FIT--------------->");
      //map.fitBounds(screenBounds);
      setWakeupDone(true);
    }
  }

  //For bottom infopanel
  const [bio, setBio] = useState(0)

  //hardcodey hack for 
  function setZoneOpacities(which){

    var newOpacitiesArray = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    for(let i = 0; i < zoneArray.length; i++){
        if(which == screenBounds){
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

  //INIT!
  var markerPlaced = useRef(new Map());
  useEffect(() => {
    /*
    if(info == null && !runMonitor1){
      setRunMonitor1(true); //repeat insurance, unnecessary when we add []
      graphcms.request(QUERY_MAPENTRY)
      .then(res => setInfo(res.mapInfos))
    }

    if(settlements == null && !runMonitor2){
        setRunMonitor2(true);
        graphcms.request(QUERY_SETTLEMENTENTRY)
        .then(res => setSettlements(res.settlementInfos))

        graphcms.request(QUERY_SETTLEMENTENTRY)
        .then(res => console.log(res))
    }*/

    if(entityFocusEntries.current.size === 0){
      graphcms.request(QUERY_ENTITY_1)
      .then(res => {
        //console.log(res);
        res.mapEntities.forEach(entity => {
          entityFocusEntries.current.set(entity.name, entity);
        })
      })

      graphcms.request(QUERY_ENTITY_2)
      .then(res => {
        //console.log(res);
        res.mapEntities.forEach(entity => {
          entityFocusEntries.current.set(entity.name, entity);
        })
      })
    }

    //console.log(entityFocusEntries.current);

    // HACK to help icon pathing // likely a better way of doing this, but we won't be using
    L.Icon.Default.imagePath = ''; 
    L.Icon.Default.mergeOptions({
        iconUrl: '../../blank_marker.png',
        shadowUrl: '../../blank_marker.png',
        iconRetinaUrl: '../../blank_marker.png',
        iconSize:     [25, 25], // size of the icon
        shadowSize:   [25, 25], // size of the shadow
        iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
        shadowAnchor: [12, 12],  // the same for the shadow
        popupAnchor:  [12, 12] // point from which the popup should open relative to the iconAnchor
    
    });

    //GENERATE MARKERS!
    if(entityMarkerGroup){
      entityShapes.forEach(entity => {
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
          }


          entity.labelAnchors.forEach((anchor, index) => {
            var marker = L.marker(anchor ?? [0,0], {
              properties: {
                icon: optIcon,
                name: entity.name,
                idx: index
              }
            })
            
            marker.addTo(entityMarkerGroup)
            
            if(!optIcon){
              marker.bindTooltip(// 1. Dynamic Content: Inject the unique color into an inline style
                  `<div style="white-space: normal; text-align: center;"><span style="color: ${entity.labelColor}; font-weight: bold;">
                      ${entity.name}
                  </span></div>`, {
                  permanent: true,     // Makes the label always visible
                  direction: 'center', // Centers the label
                  className: `${'map-label ' + getLabelWidthClass(entity.labelSize) + ' ' + getFontSizeClass(entity.labelSize) + ' ' + getParentFontClass(entity.superentityName)}`,
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

            markerPlaced.current.set(entity.name, marker);
          });
        }
      });

      fixMarkerIcons(mapRef);

      return () => {
        markerPlaced.current = new Map();
      }
    }
  }, [mapRef, entityMarkerGroup]);
  
  function goBack(){ //Revert all popover properties and return to origin. Rename function!
    setFocused(null); 
    mapRef.flyTo([1200, 2350], -1.5);
    setChangelogOpen(false);

    mapRef.addLayer(mapBackgroundGroup.current);
     
    mapRef.dragging.enable();
    //mapRef.zoom.enable();
    mapRef.scrollWheelZoom.enable();
    mapRef._container.classList.toggle('leaflet-container-focused');
    mapRef.options.zoomSnap = 0.5;

    //we know we're zooming to max, so we're entering superentity-only view
    //there's a chance focus-flows will have bounding boxes in 'SOV', so going back
    //won't trigger the zoom-boundary layer update. we do
    setEntityVisible(false);
    setSuperEntityVisible(true);
  }


  function closeSettlementPopup(){ //Full-fo
    setMarkerFocused(false)
    map.flyTo([256, 534], 0.4)
    setSelectedSettlement(null)

    map.dragging.enable();
    map.zoom.enable();
  }

  function selectCapitalPopout(){
    settlementsTab.classList.toggle("banner-extend");
    infoPanel.classList.toggle("settlement-bumped");
  }

  //genuinely how does this work and why is it like this? it's a component function, so i guess it just runs all this once at wakeup 
  function SetBoundsPolygons() {
    const [bounds, setBounds] = useState(screenBounds)
    const map = useMap()
  
    //each memo handler appears to append onclick and  onmouseover/out handlers that are only different in how they pass constants around? let's see if we can achieve a compression of this
    const dolwyndHandlers = useMemo(
      generateHandlersForRegion("dolwynd", dolwynd, dw, map, 0),
      [map],
    )
    
    const northseaHandlers = useMemo(
      generateHandlersForRegion("northsea", northsea, dw, map, 1),
      [map],
    )

    const anterrosHandlers = useMemo(
      generateHandlersForRegion("anterros", anterros, dw, map, 2),
      [map],
    )

    const argovHandlers = useMemo(
      generateHandlersForRegion("argov", argov, dw, map, 3),
      [map],
    )

    const iorstavHandlers = useMemo(
        generateHandlersForRegion("iorstav", iorstav, dw, map, 4),
        [map],
    )

    const dorrimHandlers = useMemo(
        generateHandlersForRegion("dorrim", dorrim, dw, map, 5),
        [map],
    )

    const cantocHandlers = useMemo(
        generateHandlersForRegion("cantoc", cantoc, dw, map, 6),
        [map],
    )

    const mologHandlers = useMemo(
        generateHandlersForRegion("molog", molog, dw, map, 7),
        [map],
    )

    const ferveirnHandlers = useMemo(
        generateHandlersForRegion("ferveirn", ferveirn, dw, map, 8),
        [map],
    )

    const rhomiHandlers = useMemo(
        generateHandlersForRegion("rhomi", rhomi, dw, map, 9),
        [map],
    )

    const lannochHandlers = useMemo(
        generateHandlersForRegion("lannoch", lannoch, dw, map, 10),
        [map],
    )

    const mornaHandlers = useMemo(
        generateHandlersForRegion("morna", morna, dw, map, 11),
        [map],
    )

    const vaicHandlers = useMemo(
        generateHandlersForRegion("vaic", vaic, dw, map, 12),
        [map],
    )

    const akkvaltHandlers = useMemo(
        generateHandlersForRegion("akkvalt", akkvalt, roman, map, 13),
        [map],
    )

    const salirHandlers = useMemo(
        generateHandlersForRegion("salir", salir, roman, map, 14),
        [map],
    )

    const dorsHandlers = useMemo(
        generateHandlersForRegion("dors", dors, roman, map, 15),
        [map],
    )

    const crovonHandlers = useMemo(
        generateHandlersForRegion("crovon", crovon, roman, map, 16),
        [map],
    )

    const mosmogaHandlers = useMemo(
        generateHandlersForRegion("mosmoga", mosmoga, roman, map, 17),
        [map],
    )

    const kamdagHandlers = useMemo(
        generateHandlersForRegion("kamdag", kamdag, roman, map, 18),
        [map],
    )

    const agosHandlers = useMemo(
        generateHandlersForRegion("agos", agos, roman, map, 19),
        [map],
    )

    const ghommililHandlers = useMemo(
        generateHandlersForRegion("ghommilil", ghommilil, roman, map, 20),
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

  //! - EVERYTHING IN HERE NEEDS TO BE REFACTORED TO FIT WITH THE NEW SELECTION PARADIGM
  function generateHandlersForRegion(regionString, regionBounds, regionHeaderFont, map, regionId){
    return () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === regionString)
            setSelectedBody(post);

            setFocused(regionString); 

            map.invalidateSize();
            setHeaderFont(regionHeaderFont);

            map.flyToBounds(regionBounds, {duration: 2})
            setSelectedPoly(regionBounds);

            map.dragging.disable();
            map.zoom.disable();
            map.pinchZoom.disable();
          }
        },
        mouseover(event) {
          if(!focused && !markerFocused &&  event.target.options.fillOpacity != 0.5){
            hoverToggleOpacs(regionId, true) 
          }
        },
        mouseout(event) {
          if(!focused && !markerFocused && event.target.options.fillOpacity != 0){
            hoverToggleOpacs(regionId, false) 
           }
        }
      })
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

  const [markerPositions, setMarkerPositions] = useState([]) ;

  //list of const - move to const file and export array.
  
  const def_position = [-50, 500]

  const gbkeep_position = [149, 311] //ALL POSITIONS ARE OFFSET BY ~10 X
  const hfsd_position = [180, 234]
  const daol_position = [171, 125]
  const ir_pos = [231, 171]
  const hk_pos = [416, 95]
  const tholri_pos = [416, 292]
  const bers_pos = [400, 186]
  const varc_pos = [407, 188] //HAS NO POST, INCLUDED IN BERS ^
  const hzpt_pos = [314, 146]
  const dystd_pos = [274, 231]
  const krst_pos = [301, 197]
  const dely_pos = [340, 209]
  const bodilse_pos = [360, 226]
  const milton_pos = [198, 250]
  const carg_pos = [105, 178]
  const font_pos = [320, 289]
  const heg_pos = [323,  176]
  const manc_pos = [288, 113]
  const ilkair_pos = [245, 508]
  const raka_pos = [368, 635]
  const founders_pos = [309, 244]
  const akeldar_pos = [] //UNDERGROUND
  const blaster_pos = [276, 857]
  const sapphire_pos = [331, 307]
  const fulcrum_pos = [295, 93]
  const donri_pos = [114, 195]
  const maathi_pos = [118, 118]
  const dreadpoint_pos = [46, 332]
  const radial_pos = [305, 164]
  const black_pos = [288, 220]
  const marble_pos = [264, 62]
  const drumbone_pos = [375, 997]
  const kalamant_pos = [107, 936]
  const ss_position = [218, 188]
  const tyrant_pos = [206, 302]
  const argo_pos = [445, 170]
  const shipton_pos = [] //This one is offmap, so there's a needed feature. Stay zoomed out! Special centering?
  const mirror_pos = [453, 309]
  const torment_pos = [428, 298]
  const glacier_pos = [406, 215]
  const farside_pos = [415, 195]
  const wastes_pos = [426, 152]
  const dreamers_pos = [109, 261]
  const delverton_pos = [87, 234]
  const nightmount_pos = [66, 186]
  const silences_pos = [377, 772]
  const barod_pos = [343, 36]
  const ythryannis_pos = [214, 0] //this is in the theodryian!
  const maccaram_pos = [258, 109]
  const krymhold_pos = [101, 198]
  const beds_pos = [] //everywhere
  const protean_pos = [115, 57]
  const draid_pos = [372, 138]
  const pivot_pos = [515, 535]
  const abaalonia_pos = [289, 458]
  const kallabas_pos = [240, 138]
  const space_pos = []
  const singularity_pos = [264, 915]
  const auditor_pos = [184, 271]
  const ralholm_pos = [138, 932]
  const yardol_pos = [209, 860]
  const dragon_pos = []
  const briar_pos = [436, 239]
  const deeprhyn_pos = [361, 268]
  const faewatch_pos = [120, 86]
  const marclight_pos = []
  const spiral_pos = []
  const pelen_pos = []
  const jaiurn_pos = []
  const yveir_pos = []
  const ulinbarre_pos = [102, 62]
  const daesis_pos = [180, 72]
  const calecidonia_pos = [125, 51]
  const bound_pos = [47, 691]
  const platinnian_pos = [453, 527]
  const godsrealm_pos = []
  const ratwarrens_pos = [381, 311]
  const beneath_pos = []
  const ysterian_pos = []
  const vaults_pos = [] 



  const settlement_handles_ordered = ["No Record", "The Glassblood Keep", "Halfstad", "Daol", "Ir", "High Kiln", 
  "Tholri", "Berasithus & Varičula", "Hezzar's Pit", "Daystride", 
  "Karlestal", "The Delyrian Ayre", "Bodilse", "Milton's Terminus", 
  "Caraggah (Mes-vis)", "Font of Triumph", "Hégenol", "Mancer's Wall",
  "Ilkair", "Raka-Khommora", "Hall of the Founders", "Akeldar",
  "Blasterstein", "Sapphire Ark", "Fulcrum", "Donri",
  "Maathi", "Dreadpoint", "Radial Ascent", "Black Tower", 
  "Marble Citadel", "Drumbone", "Kalamant", "Seventh Spear", //FREE AGENTS
  "The Tyrant", "Argo's Post", "Shipton Ruins", "Mirrorweave",
  "Crystal Tormentor's Axis", "Red Glacier", "FOB-117-28-Farside", "The Wastes",
  "Dreamer's Rise", "Delverton", "Nightmount", "The Silences",
  "Barod-Dām", "Ythryannis", "Maccaram", "Krymhold",
  "The Beds", "Protean Spike",
  "Draid", "Pivot's Pride", "Abaalonia", "Kallabas", //THREATS
  "????", "Singularity Chancel", "Deepwood Auditor Holds", "Ralholm",
  "Yardol", "Anywhere", "Old Briar", "Deeprhyn",
  "Faewatch", "The Marclight Observatory", "Spiral Monolithics", "Pel'en",
  "House of Jai-urn", "Old Yveir", "Montas Ulinbarrè", "Daesis",
  "Calecidonia", "The Bound Gateway", "The Platinnian Gateway", "The Godsrealm",
  "Rat-Warrens", "Beneath the Interstitial", "Ysterian Rift", "The Vaults"] 


  useEffect(() => {
    setMarkerPositions([def_position, gbkeep_position, hfsd_position, daol_position, ir_pos, hk_pos, tholri_pos, bers_pos, hzpt_pos, dystd_pos, krst_pos, dely_pos, bodilse_pos, 
                        milton_pos, carg_pos, font_pos, heg_pos, manc_pos, ilkair_pos, raka_pos, founders_pos, akeldar_pos, blaster_pos, sapphire_pos, fulcrum_pos, donri_pos, 
                        maathi_pos, dreadpoint_pos, radial_pos, black_pos, marble_pos, drumbone_pos, kalamant_pos, ss_position, tyrant_pos, argo_pos, shipton_pos, mirror_pos, 
                        torment_pos, glacier_pos, farside_pos, wastes_pos, dreamers_pos, delverton_pos, nightmount_pos, silences_pos, barod_pos, ythryannis_pos, maccaram_pos, 
                        krymhold_pos, beds_pos, protean_pos, draid_pos, pivot_pos, abaalonia_pos, kallabas_pos, space_pos, singularity_pos, auditor_pos, ralholm_pos, yardol_pos, 
                        dragon_pos, briar_pos, deeprhyn_pos, faewatch_pos, marclight_pos, spiral_pos, pelen_pos, jaiurn_pos, yveir_pos, ulinbarre_pos, daesis_pos, calecidonia_pos,
                        bound_pos, platinnian_pos, godsrealm_pos, ratwarrens_pos, beneath_pos, ysterian_pos, vaults_pos])
    
  }, [])

  async function selectPoligridPin(which, centered, targetMarkerClass) {
    
    const post = settlements.find((post) => post.name === settlement_handles_ordered[which])
    setCentered(centered);
    
    setSelectedSettlement(post);

    //purge to blank old marker even if the class is the same
    setMarkerClass(-1);

    if(marker){
      mapContainerRef.current.scrollIntoView()

      var ssOffsetX
      var ssOffsetY

      if(window.innerWidth > 625){
        ssOffsetX = 15
        ssOffsetY = 0
      } else {
        ssOffsetX = 0
        ssOffsetY = -15
      }

      setMarkerFocused(true);
      const position = [markerPositions[which][0] + ssOffsetY, markerPositions[which][1] + ssOffsetX] //offset for setup. TODO pick box disp side based on proximity to edge
      map.flyTo(position, 3)
    
      setMarkerClass(targetMarkerClass);
      map.dragging.disable();
      map.zoom.disable();
    }
  }

  const polities = (

    <>
    <img id="huge-header" className="mx-auto align-top opacity-90 pt-16 w-2/5" src="../../political_cover_alt.png"/>
    <p id="text-center-83">
      Hey there! This portion of the site has been broken by ongoing map upgrades. It may be removed in a later update and folded into the map. Stay tuned! 
    </p>
    <div className="container">
      <img className="mx-auto align-top pt-64 pb-64 w-4/6" src="../../unfinished.png"/>
    </div>
    {/*
    
    <p id="text-center-83">
    The Dornnian Midlands have changed hands about as many times as you’d expect, burdened by the spasms, expansions and contractions of mortal whim. In the Seasons of Stagnation, the receding Empires of Men have left room for old hands to resume their work; the shape of the map has begun to take on a familiar form.
    <br /> <br />
    <b className='green'><u>Click on any individual faction header to select their capital on the map. </u></b>
    </p>

    
    
     

    <div id="politic-box">
      <div id="polwedge"></div>
      <div id="majorpol-text">
        <button onClick={() => selectEntity(1, false, 0)}>
        <h2 className="blue force-vert-center">this button tests the new entity panel.</h2>
        </button>
      </div>
    </div>
    
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
         <button onClick={() => selectPoligridPin(1, false, 0)}>
          <h2 className="blue force-vert-center">The Glassbloods</h2>
         </button>
        </div>
      </div>
    
      <div id="politic-box">
      <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
          <button onClick={() => selectPoligridPin(2, false, 0)}>
            <h2 className="white force-vert-center">The Crux</h2>
          </button>
        </div>
      </div>
    
      <div id="politic-box">
        <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
           <button onClick={() => selectPoligridPin(3, false, 0)}>
            <h2 className="red force-vert-center">The Britchoffs</h2>
           </button>
        </div>
      </div>
    
      <div id="politic-box">
        <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
            <button onClick={() => selectPoligridPin(4, false, 0)}>
                <h2 className="gold force-vert-center">The Drairinni</h2>
            </button>
        </div>
      </div>
    
      <div id="politic-box">
      <div id="polwedge"></div>
        <img id="banner" src="../../species_frame_I.png" />
        <div id="majorpol-text">
            <button onClick={() => selectPoligridPin(5, false, 0)}>
            <h2 className="orange force-vert-center">The Anterrosites</h2>
            </button>
        </div>
      </div>
    
      <div className='blog-footer'></div>
    
      <h1 className="double"></h1>
    
    
      <div id="spec-header-box">
      <div id="species-text">
        <h1 className="green">The Midland Council (XII)</h1>
        <p id="padding-scrunch">
        Reformed many times in the wake of worldshaking disaster, the Midland Council is the soul and spine of Dornnian peacetime. Their existence is not a symbolic platitude - the Council 
        is the fulcrum of all traditional politics, the mediator, and an armed force backed by the Sword-Saints that will frequently stamp out potential conflict. "<i>In times where the 
        threat a single rogue agent poses can be planar, the highest level of mortal organization must have the power to decisively prevent such catastrophes.</i>" - so the councillors say. This has, does, and will 
        continue to cause problems.
        <br /> <br />
        The Human Families have a contentious relationship with the Council. After Draid, the only son of the fifth parriarch, was caught in his scheme to upend the plane in its entirety, the other familial parriarchs have
        tentatively agreed to hold seats at the Council--though they have never been present for a meeting.
        <br /><br />
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <button id="poligrid-link" onClick={() => selectPoligridPin(6, false, 0)}>Tholri's Domain</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(7, false, 0)}>The Northfolk Enclave<br/><i id="subtitle-tiny">"Northern Jawbone"</i></button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(8, false, 0)}>Hezzar’s Pit</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(9, false, 0)}>Wormking's Sea</button>
                                         
      <button id="poligrid-link" onClick={() => selectPoligridPin(10, false, 0)}>Holger's Keep</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(11, false, 0)}>The Elfholds<br/><i id="subtitle-tiny">"Ilvor-Ylvindal"</i></button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(12, false, 0)}>Northsea Confederacy</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(13, false, 1)}>The Demonhunters<br/><i id="subtitle-tiny">(perfunctory)</i></button>
                                         
      <button id="poligrid-link" onClick={() => selectPoligridPin(14, false, 0)}>Decryptor Houses</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(15, false, 1)}>The Midlands Historical Archive</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(16, false, 0)}>Isles of Security</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(17, false, 1)}>Wahlrect<br/><i id="subtitle-tiny">House of the Blood Tyrants</i></button>
                                         
      <button id="poligrid-link" onClick={() => selectPoligridPin(18, false, 0)}>Ilkair</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(19, false, 0)}>Deilān Federation</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(20, false, 1)}>The Sword-Saints</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(21, true, 3)}>The Faults</button>
                                         
      <button id="poligrid-link" onClick={() => selectPoligridPin(22, false, 1)}>Beastguard</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(23, false, 0)}>Denton's League</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(24, false, 1)}>The Sixfold Star</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(25, false, 1)}>Brassworks Fellowship</button>
                                         
      <button id="poligrid-link" onClick={() => selectPoligridPin(26, false, 1)}>Ithuk's Initiates</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(27, false, 0)}>Dreadpoint Forgesons</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(28, false, 0)}>Schools of the Elementalist</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(29, false, 1)}>Central Mint</button>
    
    </div>
    
    <div className='blog-footer'></div>
    
    <h1 className="double"> </h1>
    
    <div id="spec-header-box">
      <div id="species-text">
        <h1 className="orange">Free Agents</h1>
        <p id="padding-scrunch">
        Beyond the apocalyptic coalitions of the semi-mortal west, most polities are hacking it on their own. This is usually--not always, but usually--because they've picked a fight
        with too many of the Council's allies. The Free Agents of Dornn are not inherently dangerous, but something about them is a bit too unfriendly to make it to the diplomatic chambers. 
        Their territories tend to be smaller than those of the Midland Council or the Human Empires, but they also employ exotic defenses and schemes of war to prevent further 
        border-shoves.
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <button id="poligrid-link" onClick={() => selectPoligridPin(30, false, 0)} >The Theodryian Bridge</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(31, false, 0)} >Salíran Dynasties</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(32, false, 0)} >Kalamant</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(33, false, 1)} >Deadlands Purging Company</button>
    
      <button id="poligrid-link" onClick={() => selectPoligridPin(34, false, 1)} >Ordo Terra-néve<br /><i id="subtitle-tiny">"Twilit Order"</i></button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(35, false, 1)} >Argo's Riders</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(36, true, 3)} >The Captain's Promise</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(37, false, 1)} >Rogue Cosmologist Academies</button>
    
      <button id="poligrid-link" onClick={() => selectPoligridPin(38, false, 0)} >The Encompassed</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(39, false, 1)} >Northmount Calamity Concern</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(40, false, 1)} >Statesmen</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(41, false, 2)} >Tann's Lock</button>
    
      <button id="poligrid-link" onClick={() => selectPoligridPin(42, false, 1)} >Dreamer's Rise</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(43, false, 0)} >The Witchspine</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(44, false, 2)} >Irwin's Council</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(45, false, 1)} >The Golden Reach</button>
    
      <button id="poligrid-link" onClick={() => selectPoligridPin(46, false, 1)} >Barod-Dām</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(47, false, 0)} >Theodryia</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(48, false, 0)} >Isles of Contentment</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(49, false, 2)} >People of Krym</button>
    
      <button id="poligrid-link" onClick={() => selectPoligridPin(50, true, 3)} >Olcrid</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(51, false, 2)} >Zaic-Zahl<br /><i id="subtitle-tiny">"Basalt Towers"</i></button>
    
    
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
        </p>
      </div>
    </div>
    
    <div id="poli-grid-box">
      <button id="poligrid-link" onClick={() => selectPoligridPin(52, false, 0)}>Draid</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(53, false, 0)}>The Stone Unit</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(54, false, 0)}>Rhômi's Hand</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(55, false, 0)}>The Jawlord Lives!</button>
      
      <button id="poligrid-link" onClick={() => selectPoligridPin(56, true, 3)}>Cosmolarian Visitors</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(57, false, 0)}>Avaroth</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(58, false, 1)}>Auditors</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(59, false, 1)}>The Remaining Riders</button>
      
      <button id="poligrid-link" onClick={() => selectPoligridPin(60, false, 0)}>Yardol</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(61, true, 3)}>The Five Spines</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(62, false, 0)}>Trawlers</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(63, false, 1)}>Epitaxor-Lords</button>
      
      <button id="poligrid-link" onClick={() => selectPoligridPin(64, false, 1)}>Woodsmen</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(65, true, 3)}>Eschan Relics</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(66, true, 3)}>Antimortal Empires</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(67, true, 3)}>Basilisks</button>
     
      <button id="poligrid-link" onClick={() => selectPoligridPin(68, true, 3)}>House of Jai-Urn</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(69, true, 3)}>Primal Vampirics</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(70, false, 1)}>Coldbody Guardsmen</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(71, false, 2)}>Atrophykos</button>
 
      <button id="poligrid-link" onClick={() => selectPoligridPin(72, false, 0)}>Lilted Ones</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(73, false, 2)}>The Scorched</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(74, false, 2)}>The Rimed</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(75, true, 3)}>Icons</button>
      
      <button id="poligrid-link" onClick={() => selectPoligridPin(76, false, 2)}>Recluses</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(77, true, 3)}>Deeper Echoes</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(78, true, 3)}>Ysteria</button>
      <button id="poligrid-link" onClick={() => selectPoligridPin(79, true, 3)}>Demons</button>
    
    
    </div>

    <div id='species-text'>
    <br /> <br /> 
      <p id='padding-scrunch'>
        <b>This is what we know. </b> Push beyond the limits of recorded knowledge and it shouldn't be hard to find worse. 
      </p>
    </div>
    
    <div className='blog-footer'></div>
    
    */}
    </>
    )

  const [inProp, setInProp] = useState(false);
  const nodeRef = useRef(null);


  //-----------------------[BEGIN MAP ELEMENTS]---------------------------

  const MapEventHandler = () => {
    useMapEvents({
      zoomend(e) {

        let zoom = mapRef.getZoom();
        console.log(zoom);
        console.log(lastZoom);
        //switch layers at or beyond certain breakpoints. 
        //skipped if focused, though we still cache the previous zoom as it changes.
        if(!focused){
          mapZoomLayerChange(zoom);
        }

        setLastZoom(zoom);
      },
      moveend(e){
        if(awaitingZoom){
          setAwaitingZoom(false);
        }
      }
    });
  };

  function mapZoomLayerChange(zoom){
    if(zoom >= 0 && lastZoom < 0){
      setEntityVisible(true);
      setSuperEntityVisible(false);
    } else if(zoom < 0 && lastZoom >= 0){
      setEntityVisible(false);
      setSuperEntityVisible(true);
    }

    if(zoom >= 0){
      updateLabelSizes();
    }
  }

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

  function EntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from

    const map = useMap();
    const svgRenderer = L.svg();

    const onEachPoliFeature = (feature, layer) => {
      if(!firstLoadComplete){
        entityLayerCache.current.set(feature.properties.name, layer);
      }

      layer.on('click', function (e) {
        //console.log(focused);
        if(!focused){
          flyToGeoShape(feature.properties.name)
        }
      });

      if(feature.properties.superentityName == 'ESOTERICS'){
        //console.log('ESO?');
        var stripes = new L.StripePattern({
          opacity: (!focused || focused.name == feature.properties.name) ? 0.9 : 0.2, //this is relative
          spaceOpacity: (!focused || focused.name == feature.properties.name) ? 0.4 : 0.1,
          color: (!focused || focused.name == feature.properties.name) ? feature.properties.color : feature.properties.color,
          spaceColor: (!focused || focused.name == feature.properties.name) ? feature.properties.color : feature.properties.color,
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

    useEffect(() => {
      if (entityShapes) {
        // This runs once after the component renders with new data
        if(!firstLoadComplete){
          setFirstLoadComplete(true);
          setEntityVisible(false);
        }
      }
    }, [entityShapes]);

    return (<FeatureGroup 
      eventHandlers={{ //markers get added before icons can be applied, but this happens after geo is ready, so we can fix them here.
        add: (e) => {
          //console.log("fix markers");
          //fixMarkerIcons(map);
        }
      }}
    >
    {entityShapes.map((entity, index) => 
      (entity.aggregatedShape ? 
      <GeoJSON 
              onEachFeature={onEachPoliFeature}
              key={index}
              data={entity.aggregatedShape}
              className='mapclass'
              style={(feature) => ({
                color: (!focused || focused.name == feature.properties.name) ? entity.color : entity.color,
                weight: (!focused || focused.name == feature.properties.name) ? 3 : 1,
                opacity:  (!focused || focused.name == feature.properties.name) ? 1 : 0.2,
                fillColor: (!focused || focused.name == feature.properties.name) ? entity.color : entity.color,
                fillOpacity: (!focused || focused.name == feature.properties.name) ? 0.6 : 0.05,
              })}
              pathOptions={() => ({
                renderer: entity.superentityName == 'ESOTERICS' ? svgRenderer : null,
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

  function SuperEntityLayerComponent(){
    //return jsx corresponding to the current entity master shapes
    //this is where labels come from

    const map = useMap();
    const svgRenderer = L.svg();

    const onEachSuperFeature = (feature, layer) => {
      //pull feature style and apply a fillpattern to it
      //if(![...markerPlaced.current.keys()].includes(feature.properties.name)){
      //console.log(feature.properties.name);
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

    return (<FeatureGroup>
    {superentityShapes.map((superentity, index) => 
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
              pathOptions={() => ({
                renderer: superentity.name == 'ESOTERICS' ? svgRenderer : null,
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

  const superentityLayerGroup = useRef(null);
  
  //------------------------[MAP LAYER UTILS]------------------------------

  function getParentFontClass(parent){
    //console.log(parent);
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
      case 'ESOTERICS':
        return 'esoterics';
    }
  }
  
  // Function to calculate font size based on zoom level
  function getFontSize(zoom, labelSize) {
      // You can adjust this formula as needed
      switch(labelSize){
        case "small":
          if(zoom <= 1){
            return '0px';
          } else if(zoom <= 2){
            return '16px';
          } else {
            return '24px';
          }
        case "medium":
          if(zoom <= -2){
            return '0px';
          } else if(zoom <= -1){
            return '6px';
          } else if(zoom <= 0){
            return '12px';
          } else if(zoom <= 1){
            return '16px';
          } else if(zoom <= 2){
            return '24px';
          } else {
            return '32px';
          } 
        case "large":
          if(zoom <= -2){
            return '0px';
          } else if(zoom <= -1){
            return '16px';
          } else if(zoom <= 1){
            return '24px';
          } else {
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
          if(zoom <= 1){
            return '0px';;
          } else if(zoom <= 2){
            return '75px';
          } else {
            return '150px';
          }
        case "medium":
          if(zoom <= -2){
            return '0px';
          } else if(zoom <= -1){
            return '100px';
          } else if(zoom <= 1){
            return '100px';
          } else {
            return '150px';
          }
        case "large":
          if(zoom <= -2){
            return '0px';
          } else if(zoom <= -1){
            return '80px';
          } else if(zoom <= 0){
            return '100px';
          } else {
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

  function fixMarkerIcons(map){

    var markerList = [];
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            markerList.push(layer);
        }
    });

    markerList.forEach(marker => {
      let icon = marker.options.properties.icon;
      if(icon) marker.setIcon(marker.options.properties.icon);
    })
  }

  function closeIndevPopup(){
    setShowIndevPopup(false);
  }

  function openChangelog(){
    setChangelogOpen(true);
  }

  function toggleNav(e){
    e.target.parentNode.parentNode.parentNode.classList.toggle('expanded');
  }

  // --------------------[INFORMATIONAL UTILITY & WIKI]----------------------------

  const [awaitingZoom, setAwaitingZoom] = useState(true);
  function flyToGeoShape(name){
    let target = entityLayerCache.current.get(name);

    if(!target){
      //something went wrong. raise an error? and return
      console.log('SOMETHING WENT WRONG WHEN TRYING TO FOCUS SHAPE ? ' + name);
      return;
    }

    mapRef._container.classList.toggle('leaflet-container-focused');

    mapRef.removeLayer(mapBackgroundGroup.current);

    setFocused(entityFocusEntries.current.get(name));

    //this disables the map's default zoom-toggling behavior - 
    //when focused, we manage the layers ourselves.
    setEntityVisible(true);
    setSuperEntityVisible(false);
    //setSubentityVisible(true)? - we don't know how this works yet

    console.log(mapRef);
    mapRef.options.zoomSnap = 0;

    mapRef.flyToBounds(target.getBounds(), {
      paddingTopLeft: [25, 25], //! These values seem to cause major issues on mobile. They likely need to be derived from screen size or use vw/vh?
      paddingBottomRight: [600, 225],
      duration: 1.5
    });

    setAwaitingZoom(true);

    

    mapRef.dragging.disable();
    //mapRef.zoom.disable();
    mapRef.scrollWheelZoom.disable();
    mapRef.zoomControl.remove();
  }

  //return an image tag with a background color matching the selected entity, with dimensions
  //of a standard flag. 
  function getFlagForFocus(){
    if(!focused){
      return null;
    } else {
      return (<div style={{
                'aspect-ratio': '16 / 9', 
                'background-color': focused.nameColor.hex,
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'color': 'white',
                'font-family': getParentFontClass(focused.mapSuperentity.name),
                'height': '20%',
                'margin':'auto', 
                'margin-top':'32px'}}>
                  <p style={{'max-width':'200px', 'text-align':'center', 'font-size':'64px'}}>
                    ?
                  </p>
              </div>
      );
    }
  }

  return (
    
    <div className='worldwell min-h-screen' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
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
                <img className="m-auto w-full sm:w-1/2 pt-5" src="../../world_banner.png" alt="The World - Also Known as The Measured Extent of the Dornnian Midlands"/>
                <div className="mapcontent relative" style={{'z-index':'0'}}>
                  
                  {/*<img className="" src="../../whiteout-blank-site.png" useMap="#dornnmap" alt="This is a full-scale linked map of the Dornnian Midlands. It is not navigable by screen reader, so you will instead use the following links to access the information you're looking for. This map is divided into several regions which will be read through in sequence."/>*/}
                  { focused && !markerFocused ? <div className="map-selection-header text-center overflow-y-auto"> { /* !REFACTOR NEEDED! */}
                    <h className={`inline-block text-7xl pt-5 pb-5 map-info-header ${getParentFontClass(focused.mapSuperentity.name)}`} style={{'color': focused.labelColor.hex}}>{focused.name}</h>
                    <p className="text-xl">
                    {focused.subtitle}
                    </p>
                    </div> : null 
                  }
                  <div className="map" ref={mapContainerRef} style={{'z-index':'0'}}>
                    <MapContainer 
                      ref={setMapRef} 
                      center={[1024, 2048]} 
                      zoom={-1.5} 
                      minZoom={-2}
                      zoomSnap={0.5}
                      zoomDelta={0.5}
                      wheelPxPerZoomLevel={120}
                      dragging={true} 
                      keyboardPanDelta={200}
                      zoomControl={true} 
                      crs={CRS.Simple} 
                      maxBounds={screenBoundsWiggle} 
                      maxBoundsViscosity={0.9} tap={false} 
                      doubleClickZoom={false}
                      preferCanvas={false}
                    >
                      <LayerGroup ref={mapBackgroundGroup}>
                        <LandmassLayer/>
                      </LayerGroup>
                      <MapEventHandler />
                      {entityVisible ? (
                        <>
                          { !focused ? (
                          <LayerGroup ref={setEntityMarkerGroup}>
                          </LayerGroup>
                          ) : <></>}
                          <LayerGroup ref={entityLayerGroup}>
                            <EntityLayerComponent />
                          </LayerGroup>
                        </>
                      ) : <></>}
                      {superEntityVisible ? (
                        <LayerGroup ref={superentityLayerGroup}>
                          <SuperEntityLayerComponent />
                        </LayerGroup>
                      ) : <></>}
                    </MapContainer>
                  </div>
                  { showIndevPopup ? 
                    <div style={{'position':'absolute', 'display':'flex', 'left':'10%'}}>
                      <div style={{'width':'50%','position':'relative'}}>
                        <img src="../../map_indev_panel.png"></img>
                      </div>
                      <button onClick={openChangelog} style={{'max-width':'60px', 'right':'5%', 'top':'25%'}}>
                        <img src="../../changes_button.png"></img>
                      </button>
                      <button onClick={closeIndevPopup} style={{'width':'5%'}}>
                        <img src="../../close_popup.png" style={{'max-width':'100%'}}></img>
                      </button>
                    </div> : null }

                  {/* MAP INFO PANELS */}
                  { (changelogOpen) ? <div className="settlement-centered bg-black border-4 border-white absolute map-info text-center overflow-y-auto" style={{'color':'white','fontFamily' : 'Grenze Gotisch'}}>
                      <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color':'white','fontFamily' : 'Grenze Gotisch'}}>Maplog!</h>
                      <p className='pb-2  px-5 text-slate-500'>
                        ver. 1.2
                      </p>
                      <p className="inline-block pt-5 pb-0  px-5 map-info-content" style={{'text-align':'left'}}>
                        The map is currently being reworked from the ground up. This has broken a lot of the functionality from 1.0. The following features no longer work the way they used to:
                        <br/><br/>
                        <ul >
                          <li>Landmass Selection & their bios</li>
                          <li>Political Entity selections and their bios</li>
                        </ul>
                        <br/>
                        This is mostly due to a broad-scope reevaluation of how these features ought to work and what they convey. The preexisting descriptors for landmasses were overly-pithy
                        and not really useful for any kind of play or expansion of setting. Similarly, while amusing, the political entities were a disorganized jumble of cities, states and organizations that
                        often failed to distinguish the binding between their formal titles and the pin they were linked to.
                        <br/><br/>
                        ...and so, I'm redoing it! There's a fancy new mode that allows you to view the map subdivided by CONTROL or REGION. The first, CONTROL, describes the various landholding 
                        entities of Dornn. It has three levels of detail and one unusual conditional view, of which two are already implemented:
                        <br/><br/>
                        <ul >
                          <li>SUPERENTITIES are alliances and other agreements between landholding entities, so they unify all common territories into one shape.</li>
                          <li>ENTITIES are *any* kind of landholding organization of people (the distinctions between their types will come later)</li>
                          <li>SUBENTITIES are administrative divisions of entity territories.</li>
                          <li>INTERNAL ENTITIES are non-landholding organizations that can operate within and sometimes beyond the borders of the entity which they reside in.</li>
                        </ul>
                        <br/>
                        Currently, the map supports those first two layers. At base, it shows SUPERENTITIES, and beyond a certain zoom, it will break these entities into their constituent ENTITIES. 
                        This is a very early-alpha version of the feature, so expect (and report!) bad performance and weird behavior. Lots of bugs. No real interactivity at this time.
                        <br/><br/>
                      </p>
                      <h className="inline-block text-4xl pt-5 pb-5 map-info-header" style={{'color':'white','fontFamily' : 'IM Fell DW Pica'}}>What's Next?</h>
                      <p className="inline-block pt-5 pb-0  px-5 map-info-content" style={{'text-align':'left'}}>
                        A lot of stuff is on the way. Most of this work was foundational (the ability to project and control arbitrary shapes on the map was a hard-fought feature :L) and so now, I get to move into the 
                        content phase. Here's a rapid-fire overview:
                        <br/><br/>
                        <ul >
                          <li>Subentities! Also, aggregate territories will, at the proper zoom level, show traced subdivisions of their contents.</li>
                          <li>Selectable pins for cities and settlements!</li>
                          <li>An overlay that allows for more sensible control of these views and provides contextual information about what they represent and how they work.</li>
                          <li>Reintroducing the Regions view as an extension of these political shapes! (landmasses -> regions)</li>
                          <li>Performance improvements - this will probably have to be rebuilt at some point to accommodate an outsized number of shapes, subshapes and pins.</li>
                        </ul>
                        <br/>
                        Stay tuned!
                        <br/><br/>
                      </p>
                      <button className='py-5 map-return' onClick={goBack}>GO BACK</button>
                    </div> :  null 
                  }  

                  {/* CENTERED & BLOCKED BIOS for information that decontextualizes the map on select. */}  
                  { (markerFocused && !focused && centered) ? <div className="mapBlocker bg-black absolute"></div> :  null }
                  { focused && !markerFocused ? <div className="map-info text-center overflow-y-auto"> { /* !REFACTOR NEEDED! */}
                    
                    {focused.flagEmblem?.url ? <img style={{'height':'20%', 'display':'block', 'margin':'auto', 'margin-top':'32px'}} alt="Down the Worldwell" src="../../demo_flag.png"/>
                     : getFlagForFocus()}
                    {/* THIS IS A PLACEHOLDER REPRESENTING THE HOVERABLE EYECATCH BITES */}
                    <div style={{'display':'flex', 'justify-content':'center', 'align-items':'center', 'margin-top':'12px', 'margin-bottom':'12px'}}>
                      {focused.summaryProperties?.bubbles ? (
                        <div style={{'margin-right':'12px'}}>
                        {
                            focused.summaryProperties.bubbles.map(bubble => {
                              return (<div className='circle tooltip' style={{'background-color':bubble.color, 'margin-left':'12px', 'margin-right':'12px', 'margin-top':'6px'}}><span className='tooltiptext tooltiptop !text-sm'>{bubble.text}</span></div>)
                            })
                        }
                        </div> 
                       ) : <></>} 
                      <button style={{'color': 'white', 'border':'2px solid #3d3d3d', 'border-radius':'6px'}}>
                        <div style={{'display':'flex'}}>
                          <img style={{'max-height':'35px', 'padding-left':'8px'}} src="../../crown_icon.png"/>
                          <p style={{'line-height':'35px', 'color':'white', 'font-size':'14px', 'text-align':'center', 'padding-left':'12px', 'padding-right':'12px'}}>{focused.summaryProperties?.capital}</p>
                        </div>
                      </button>
                    </div>
                    <p className="px-10" style={{'color':'grey', 'font-size':'14px'}}>
                      {focused.eyecatchFacts}
                    </p>
                    <p className="inline-block pt-5 pb-0  px-10 map-info-content">
                    {focused.content}
                    </p>
                    <br/><br/>
                    <div className="grid-box">
                      <button className="grid-item-bordered">Demographics & Culture</button>
                      <button className="grid-item-bordered">Geography & Climate</button>
                      <button className="grid-item-bordered">History</button>
                      <button className="grid-item-bordered">Economy</button>                       
                      <button className="grid-item-bordered">Government & Politics</button>
                      <button className="grid-item-bordered">Settlements & Landmarks</button>
                      <button className="grid-item-bordered">Foreign Relations</button>
                    </div>
                    <button className='py-5 map-return' onClick={goBack}>GO BACK</button>
                    </div> :  null 
                  }

                  {/* SETTLEMENT SELECTION with lefthand pin focus */}  
                  { (markerFocused && !focused) ?
                    <div>
                      { markerClass == 0 ? <div className='animatedPin animatedPinCapital'></div> : null }
                      { markerClass == 1 ? <div className='animatedPin animatedPinFortress'></div> : null }
                      { markerClass == 2 ? <div className='animatedPin animatedPinUnknown'></div> : null }
                      <div className={centered ? "settlement-centered bg-black border-4 border-white absolute map-info text-center overflow-y-auto" : "settlement bg-black border-4 border-white absolute map-info text-center overflow-y-auto"}>
                      <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': selectedSettlement.nameColor.hex, 'fontFamily' : headerFont}}>{selectedSettlement.name}</h>
                      <p>
                        <i>
                          {selectedSettlement.subtitle}
                        </i>
                      </p>
                      <p className="inline-block pt-5 pb-0  px-5 map-info-content" dangerouslySetInnerHTML={{ __html: selectedSettlement.content }}>
                      </p>
                      <button className='py-5 map-return' onClick={closeSettlementPopup}>GO BACK</button>
                      </div>
                    </div> :  null }

                  {/* WIP - ENTITY SELECTION with lefthand territory focus */}  
                  { (entityFocused && !focused) ?
                    <div className="settlement-base"> 
                      <div ref={setInfoPanel} className={centered ? "settlement-centered bg-black border-4 border-white absolute map-info text-center overflow-y-auto" : "settlement bg-black border-4 border-white absolute map-info text-center overflow-y-auto"}>
                        <div className="settlement-content-scrollable">
                          <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': 'white', 'fontFamily' : headerFont}}>Test Entity</h>
                          <p>
                            <i>
                              Test Entity Subtitle
                            </i>
                          </p>
                          <p className="inline-block pt-5 pb-0  px-5 map-info-content">
                            Test Entity Content

                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut sagittis ante quis velit egestas pharetra. Curabitur quis laoreet dui. Integer volutpat felis consectetur pellentesque sodales. Aenean lobortis neque enim, a semper urna semper quis. Maecenas diam elit, tincidunt sed tellus nec, dapibus hendrerit ante. Nullam eu efficitur sem. Fusce semper iaculis ex ac porttitor. Integer sit amet nulla ac nunc ullamcorper ultricies sed id dolor. Etiam pharetra, nisl a suscipit malesuada, eros leo lobortis metus, ut condimentum felis dolor in turpis. Praesent viverra arcu eget sollicitudin sodales. Proin lacinia ipsum vel nunc sodales, vel cursus leo mollis. Vivamus et quam tincidunt, maximus ante eget, fermentum purus. Sed laoreet nisi vitae diam elementum, at consectetur arcu scelerisque. Aenean efficitur sit amet ex in consequat. Maecenas tempor nulla non consectetur varius.

                            Nam porta at arcu et porttitor. In quis purus non ex pharetra fermentum id eget risus. Vestibulum mollis, eros quis pharetra vulputate, odio ante volutpat felis, vel ultricies nisi ante a orci. Pellentesque sit amet condimentum augue, sit amet bibendum elit. Donec fermentum ullamcorper dui vel placerat. Pellentesque vel libero et ex imperdiet molestie a id felis. Nulla finibus, lorem porttitor pellentesque tempus, purus massa tincidunt metus, ut tincidunt massa orci eu felis. Etiam bibendum ut dui quis venenatis.

                            Praesent non neque imperdiet ipsum dictum pretium id ac metus. Nullam ex ligula, maximus in risus ac, fringilla luctus lorem. Pellentesque id augue a ante consectetur dignissim. Fusce vulputate neque at dolor fermentum, in vulputate metus mollis. Fusce mattis auctor orci, at rhoncus nibh. Sed dictum augue id arcu ornare, quis tincidunt nunc facilisis. Proin ut eros ut mauris suscipit porttitor id eu lorem. Duis at varius urna.

                            Nam pharetra mi tempus felis consequat interdum. Maecenas maximus scelerisque euismod. Mauris tempus, leo in rhoncus auctor, mauris ligula fringilla sem, vulputate rhoncus erat nibh vitae erat. Morbi sed tellus sapien. Vestibulum ante purus, bibendum nec gravida iaculis, suscipit tincidunt nisi. Duis libero nunc, ultricies sed euismod vitae, vestibulum sed augue. Nullam velit urna, vulputate in sapien consequat, vestibulum maximus neque. Nullam ut aliquam turpis, in ultricies turpis. Nunc pharetra sodales erat quis placerat.
                          </p>
                          <div>
                            <button className='py-5 map-return' onClick={closeSettlementPopup}>GO BACK</button>
                          </div>
                        </div>
                        <div ref={setSettlementsTab} className="hoverTab holdingsHoverTab" style={{'borderImage': 'url(/hoverbar_tile.png) 20 / 16px / .25 stretch'}}>
                          <div className='px-5 '>
                            <div className='text-center whitespace-nowrap dynamic-header' style={{'fontFamily' : headerFont, 'color' : 'white'}}>Test Capital</div>
                            <div className='text-center whitespace-nowrap dynamic-subtitle' style={{'fontFamily' : headerFont, 'color' : 'grey'}}>Test Capital Subtitle (489750832974539)</div>
                          </div>
                          <button  onClick={selectCapitalPopout}>
                            <img className='px-1 hovericon' src="../../crown_icon.png"></img>
                          </button>
                        </div>
                      </div>
                      <div className="territoriesHoverTab"></div>
                    </div> :  null }
                  
                </div>
              </div>
            </div>
      </div>
    </div>

    <div className="map-nav-drawer">
      <div style={{'display':'flex','justify-content':'center'}}>
        <div style={{'width':'30%'}}>
          <img style={{'width':'100%'}} src="../../nav_divider_l.png"></img>
        </div>
        <h1 style={{'color':'white','text-align':'center', 'fontFamily' : 'Grenze Gotisch'}}> - Navigation  - </h1>
        <div style={{'width':'30%'}}>
          <img style={{'width':'100%'}} src="../../nav_divider_r.png"></img>              
        </div>
      </div>
      <div className="expand-container">
        <div className="content">
          <p style={{'text-align':'center', 'padding-top':'8px'}}>( -- this section is a work in progress! click at your own peril! --)</p>
          {superentityShapes.map(se => {
            return (
              <details style={{'width':'100%', 'margin-bottom':'18px'}}>
                <summary className={getParentFontClass(se.name)} style={{'color':se.nameColor.hex, 'font-size':'36px', 'text-align':'center'}}>{se.name}</summary>
                <div id="poli-grid-box">
                {
                    entityShapes.filter(entity => entity.superentityName == se.name).sort((a, b) => a.name.localeCompare(b.name)).map(entity => {
                      return (<>
                        <button className={getParentFontClass(se.name)} id="poligrid-link" onClick={() => flyToGeoShape(entity.name)}>{entity.name}</button>
                      </>)
                    })
                }
                </div>
            </details>
            )
          })}
        </div>
        <div style={{'display':'flex','justify-content':'center'}}>
          <button style={{'width':'5%'}} onClick={toggleNav}>
            <img src="../../down_arrow.png" style={{'max-width':'100%'}}></img>
          </button>
        </div>
      </div>
    </div>

    <div className='blog-footer' />



    {/*<section id="navbar" className="">
        <div className="wwdnavbar">
            <button onClick={() => setBio(0)}>- What Is This? -</button>
            <button onClick={() => setBio(1)}>- The Realms -</button>
            <button onClick={() => setBio(2)}>- The Inhabitants -</button>
            <button onClick={() => setBio(3)}>- The Polities -</button>
            <button onClick={() => setBio(4)}>- The Histories -</button>
        </div>
    </section>*/}
    <div className="dark-background ">
         <div className="mid-border" style={{'min-height':'0px'}}>
            <div className="inner-border">
              <img className="corner-decoration corner-left-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-bottom" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-left-bottom" src="../../corner-decoration.png"></img>
              <img className="vertical-decoration top" src="../../horizontally-centered-vertical-decoration.png"></img>
              <img className="vertical-decoration bottom" src="../../horizontally-centered-vertical-decoration.png"></img>


              <div className="bio-container">
                <img id="what-header" className="" src="../../what_is_this.png"/>
                <h2 className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color':'white','fontFamily' : 'Grenze Gotisch', 'text-align':'center','width':'100%'}}>COMING SOON</h2>
                <h4 className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color':'gray','fontFamily' : 'Grenze Gotisch', 'text-align':'center','width':'100%', 'padding-bottom':'8vh'}}>The Codex will contain a living glossary of setting terms by generic category and allow for cross-site linking.</h4>
                {/*<BioContainer />*/}
              </div>
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
      <div className='blog-footer copynotice' >©2022 - 2026 iznaroth | All Rights Reserved</div>
      <div className='blog-footer' />
    </div>


    
  );
};
export default Dornn;

