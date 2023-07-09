import '../../index.css';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, Rectangle } from 'react-leaflet'
import { CRS, icon, map } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav } from './DornnMapConstants';

const screenBounds = [
  [0, 0],
  [511, 1068],
]

const screenBoundsWiggle = [
  [-500, -500],
  [1011, 1568],
]



const zoneArray = [dolwynd, northsea, anterros, argov, iorstav]



const redColor = { color: 'red' }
const whiteColor = { color: 'white' }
const blackColor = { color: 'black' }


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
  const [mapControlState, setMapControlState] = useState([false, false]); //represents drag and zoom restrictions

  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0])

  function setZoneOpacities(which){

    var newOpacitiesArray = [0.0, 0.0, 0.0, 0.0, 0.0];

    for(let i = 0; i < zoneArray.length; i++){
      console.log(which == screenBounds);
        if(which == screenBounds){
          console.log("RESET " + i);
          newOpacitiesArray[i] = 0.0; //reset bounds - disable blockers
        }
        else if(zoneArray[i] != which){
          console.log(zoneArray[i]);
          newOpacitiesArray[i] = 1.0; //When a zone is selected, all other zones crank their bg opacity to 100% and become invisible.
        }
    }

    setOpacities(newOpacitiesArray);
  }

  useEffect(() => {
    if(info == null){
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
  
  function updateFocus(){
     setFocused(false);
     console.log("Returning to origin.");
     setZoneOpacities(screenBounds);
     map.flyTo([256, 534], 0.4);
     setSelectedBody(null);
     setMapControlState(true, true);
     
  }


  function SetBoundsPolygons() {
    const [bounds, setBounds] = useState(screenBounds)
    const map = useMap()
  
    const dolwyndHandlers = useMemo(
      () => ({
        click() {
          if(!focused){
            const post = info.find((post) => post.entryID === "dolwynd")
            setSelectedBody(post);
            console.log(post);
            setBounds(dolwynd);
            setZoneOpacities(dolwynd, true);
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            setMapControlState(false, false);
            
            map.flyToBounds(dolwynd, {duration: 2})
          }
        },
        mouseover(event) {
          console.log("dol over")
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            setOpacities([0.5, 0.0, 0.0, 0.0, 0.0]) //hacky. you can only hover one thing at a time, so just set everyone else to normal. 
          }
        },
        mouseout(event) {
          console.log("dol OUT")
          console.log(event)
          if(!focused && event.target.options.fillOpacity != 0){
            setOpacities([0.0, opacities[1], opacities[2], opacities[3], opacities[4]]) //the absolute hackiest way of doing this. gets grosser with every added region!
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
            setZoneOpacities(northsea, true);
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            
            map.flyToBounds(northsea, {duration: 2})
          }
        },
        
        mouseover(event) {
          console.log("north over")
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            setOpacities([0.0, 0.5, 0.0, 0.0, 0.0]) //the absolute hackiest way of doing this. gets grosser with every added region!
          }
        },
        mouseout(event) {
          console.log("north OUT")
          console.log(event)
          if(!focused && event.target.options.fillOpacity != 0){
            setOpacities([opacities[0], 0.0, opacities[2], opacities[3], opacities[4]]) //the absolute hackiest way of doing this. gets grosser with every added region!
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
              setZoneOpacities(anterros, true);
              setFocused(true);
              console.log(focused);
              map.invalidateSize();
              
              map.flyToBounds(anterros, {duration: 2})
            }
          },
          
          mouseover(event) {
            console.log("north over")
            if(!focused &&  event.target.options.fillOpacity != 0.5){
              setOpacities([0.0, 0.0, 0.5, 0.0, 0.0]) //the absolute hackiest way of doing this. gets grosser with every added region!
            }
          },
          mouseout(event) {
            console.log("north OUT")
            console.log(event)
            if(!focused && event.target.options.fillOpacity != 0){
              setOpacities([opacities[0], opacities[1], 0.0, opacities[3], opacities[4]]) //the absolute hackiest way of doing this. gets grosser with every added region!
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
            setZoneOpacities(argov, true);
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            
            map.flyToBounds(argov, {duration: 2})
          }
        },
        
        mouseover(event) {
          if(!focused &&  event.target.options.fillOpacity != 0.5){
            setOpacities([0.0, 0.0, 0.0, 0.5, 0.0]) //the absolute hackiest way of doing this. gets grosser with every added region!
          }
        },
        mouseout(event) {
          if(!focused && event.target.options.fillOpacity != 0){
            setOpacities([opacities[0], opacities[1], opacities[2], 0.0, opacities[4]]) //the absolute hackiest way of doing this. gets grosser with every added region!
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
          setZoneOpacities(iorstav, true);
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          
          map.flyToBounds(iorstav, {duration: 2})
        }
      },
      
      mouseover(event) {
        if(!focused &&  event.target.options.fillOpacity != 0.5){
          setOpacities([0.0, 0.0, 0.0, 0.0, 0.5]) //the absolute hackiest way of doing this. gets grosser with every added region!
        }
      },
      mouseout(event) {
        if(!focused && event.target.options.fillOpacity != 0){
          setOpacities([opacities[0], opacities[1], opacities[1], opacities[1], 0.0]) //the absolute hackiest way of doing this. gets grosser with every added region!
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
          fillOpacity={opacities[0]}
        />

        <Polygon
          positions={northsea}
          eventHandlers={northseaHandlers}
          pathOptions={bounds === northsea ? whiteColor : blackColor}
          fillOpacity={opacities[1]}
        />

        <Polygon
          positions={anterros}
          eventHandlers={anterrosHandlers}
          pathOptions={bounds === anterros ? whiteColor : blackColor}
          fillOpacity={opacities[2]}
        />   

        <Polygon
          positions={argov}
          eventHandlers={argovHandlers}
          pathOptions={bounds === argov ? whiteColor : blackColor}
          fillOpacity={opacities[3]}
        /> 

        <Polygon
          positions={iorstav}
          eventHandlers={iorstavHandlers}
          pathOptions={bounds === iorstav ? whiteColor : blackColor}
          fillOpacity={opacities[4]}
        />  
      </>
    )
  }

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
                      <SetBoundsPolygons />
                    </MapContainer>
                  </div>
                  { focused ? <div className="map-info text-center overflow-y-scroll">
                    <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': selectedBody.headerColor.hex}}>{selectedBody.header}</h>
                    <p className='pb-2  px-5 text-slate-500'>
                    {selectedBody.environs}
                    </p>
                    <p>
                    {selectedBody.populations}
                    </p>
                    <p className="inline-block pt-5 pb-5  px-5 map-info-content" dangerouslySetInnerHTML={{ __html: selectedBody.body }}>
                    </p>
                    <button className='py-5' onClick={updateFocus}>GO BACK</button>
                    
                    </div> :  null }
                  
                </div>
              </div>
            </div>
      </div>
    </div>

    <div className='blog-footer' />
 
    <div className="dark-background ">
         <div className="mid-border">
            <div className="inner-border">
              <img className="corner-decoration corner-left-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-top" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-right-bottom" src="../../corner-decoration.png"></img>
              <img className="corner-decoration corner-left-bottom" src="../../corner-decoration.png"></img>
              <img className="vertical-decoration top" src="../../horizontally-centered-vertical-decoration.png"></img>
              <img className="vertical-decoration bottom" src="../../horizontally-centered-vertical-decoration.png"></img>


              <div className="container">
                <img className="mx-auto align-top opacity-90 pt-16 w-2/5" src="../../world_cover_scrappy.png"/>
                

                <p className='text-white m-auto text-center w-5/6 pb-20 block'>
                Dornn is an old name. To some, it's the common neologism for every foreign recess; visiting foreigners claim it as the holiest of the Internal Spheres, others still say it’s nothing but a pile of rubble at the center of the Godsgarden’s oldest fountain. Regardless of your experiences, history converges on Dornn - and the records are never flattering. Host of the first, land of the Mortals, the true-and-only-Cradle. Once three great continents, shattered and beaten over by the ages.  Stumbling into the place is easy, as simple as crawling through the wrong crack in the back of an old keep, peeking too deep into a forested cave, taking home the wrong gemstone brooch. Getting out is another story, subject to the tumult of the universe’s sole pressure-point like a waterfall tide from every outward direction. It’s best to think of Dornn as a bottomless well - unfortunately for you, these lands are in deep.
                <br /><br />
                These isles - the Midlands, as they're oft referred - have died more times than you will, seen catastrophes you’d struggle to picture, and played host to stranger creatures than you could ever aspire to be. Some brave few survive on the bones of this ancient place, rebuilding cities and repaving roadways that are always doomed to another eventual collapse. Others still linger in the far corners of the unlit realm, idly working away at the long-ladder to total ascendancy // divine interruption. In every recess, from the star-sworn spires of old-world war-lands to the time-dead depths of the cyclical-amnesiac underworld, the memories of a millennium realm take shape: ancient prizes, esoteric beasts, impossible fortresses, limitless power. As you may expect, this is where you come in. 
                <br /><br />
                There remains some semblance of the civilizations that held these isles in the days of yore, but they are weak and information is scarce. Failures in magical networking, aggressive paramilitary pressganging and stubborn political isolationism have caused a problem: the roads are overgrown, and most people aren’t talking. Old world infrastructure remains, so you can trace the shape of these undead nations with some ease, but you won’t find any help in the towns they connect. Ten paces beyond the town limits and you’re on your own. This in-of itself wouldn’t be as much of a problem, unfortunately, if the geography wasn’t so traitorous.
                <br /><br />
                By most estimations, Dornn has “died” six or seven times before you arrived. With each death, the geographies and metaphysics of the realm have been liberally reworked. Maps are rarely accurate, physical law is woefully inconsistent, politics are strained and fractured and always lousy with conspiracy. Some think that the whole of it is controlled by a roomful of quasi-Gods that have solved the Magical Answer, and they’ve long-since killed the old divines and taken their place. It isn’t an unreasonable belief to hold.
                <br /><br />
                Yet, if power were so easy, we wouldn’t still be fighting. Magic is a boon, but a fickle one. Absent gods leave strange systemics in their wake, local stability is always a step from disaster, and the Great Ladder corrupts and fortifies in equal measure. For each step you take towards ascendancy, you must lose something in return. Plenty of fools take the gamble. Plenty more are content to do the good work and keep their heads down. It’s up to you exactly where you fall on this axis. 
                <br /><br />
                We live, now, in the Seasons of Stagnation. Once stomped under the boot of the immortal Human Familial Empires, their grand migratory seclusion has left their cities and highways quite-nearly abandoned, and those they left behind are either too powerful to bother or already on the run. Their unconditional immortality has lost its appeal over the centuries, acting more as a torturous guarantee of eternal pain than a promise of dominating power. Never forget the laws of the Haze, and always have a plan to kill them again. 
                <br /><br />
                It was a mere seventy cycles ago when the Wireless Admonition God elected to change the law of signal, and so we continue to redraw maps and resurrect ancient routes in uneasy global silence. For us common mortals, this would be called a disaster. Others do not see it that way. Behind the curtain, grand wheels of fate and games of legendary cosmic warfare skew the realm’s future into dark uncertainties. The greater average of this tired plane may be frail, but there is no ceiling to this house, nor is there any shortage of maniac mana-drunk foes to challenge your climb. Wars are played at levels of scale; we’re always puppets to a higher rung. Maybe it’s better to start looking for the string. 
                <br /><br />
                ---------------------
                <br /><br />
                The charted lands of Dornn are split into three "continents." The term is a holdover from a time when they were still whole. To the west is Dornnus, the Cradle, active host to about ninety percent of all living mortals.
                It is a vast realm, mostly characterized by perpetual squabbles between the parasite empires that live off the firmament of old-world ruins. The whole of it was brought to heel by the Five Human Families about a thousand years prior, but their grip 
                has been steadily weakening for several centuries. Immortality is no longer the boon it once was, as their attempts to stifle the progress of science and magic have been slowly overtaken. Unfortunately, the preexisting betrayals of divine worldwork have made the recovery of old technology a slow and torturous process, so wars are still fought with steel, spells, fists and teeth.
                <br /><br />
                In the center of the Sea of Dvirn are the forgotten realms of Ferveirn, the Golden Lands. Once the beating heart of the Dvirran empire, it has been ransacked and devoured many times since their failure to
                conquer the plane (and subsequent disappearance.) The Rhominite inheritors with the most legitimate claim to the realm hold primacy in the seats of Ilkair, the gilded capital, but Elvish holdouts have remained a stubborn
                factor for as long as the Dvirr have been missing. The eastern half of Ferveirn is under varying levels of quarantine - the old capital of Moz Haphora cannot be entered by any living soul,
                lest they volunteer their freewill to Alavaria, the King-under-Sky.
                <br /><br />
                To the east is the frost-wracked frontier wasteland of Jurdenogh. It was once a vibrant mirror to the cultural varieties of Dornnus, but the follies of the Glassblood youngest embroiled the continent itself
                in a metaphysical concept-superwar between ancient deities, freezing the whole thing ten times over. The poor sods that still live there are pretty much stuck--for a mortal, traversal is almost certain death. For a human, it's just a lot of consecutive certain deaths. There's surely a bounty of unclaimed treasure to be found
                in the mostly-untouched ruins that cover the continent, but it would be a costly trip in both coin and mental fortitude. 

                </p>
               </div>
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>


    
  );
};
export default Dornn;

