import '../../index.css';

import {React,  ReactDOM, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, Polyline, useMap, Rectangle, LayerGroup, LayersControl } from 'react-leaflet'
import { CRS, icon, map } from 'leaflet'
import { useResizeDetector } from 'react-resize-detector';
import { graphcms, QUERY_MAPENTRY } from '../../graphql/Queries';
import { dolwynd, anterros, northsea, argov, iorstav, dorrim, cantoc, molog, ferveirn } from './DornnMapConstants';

const screenBounds = [
  [0, 0],
  [511, 1068],
]

const screenBoundsWiggle = [
  [-500, -500],
  [1011, 1568],
]



const zoneArray = [dolwynd, northsea, anterros, argov, iorstav, dorrim, cantoc, molog]



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
  const [mapControlState, setMapControlState] = useState([false, false]); //represents drag and zoom restrictions

  const [opacities, setOpacities] = useState([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  const [runMonitor, setRunMonitor] = useState(false);

  function wrapSetBio(bio){
    console.log("SET BIO")
    setBio(bio);
  }

  const pagedesc = `

  <img id="what-header" className="mx-auto align-top opacity-90 pt-16 w-2/5" src="../../what_is_this.png"/>
  <img id="what-title" className="mx-auto align-top opacity-90 w-3/5" src="../../what_bumper.png"/>

  
  <p>
  This is an interactive map-guidebook to Dornn, the setting associated with Down the Worldwell's rules and system. You can click on any region to get an overview of the population, culture,
  geography and history of the local area. The pinned flags represent political powers that control that area--click on them to learn specifics about their size, relationships and general presence in the modern age.
  Each of this panel's subpages elaborate on the broader aspects of the Dornnian Midlands - the region's territories, people and histories. 
  <br /> <br />
  Dornn is a large, convoluted and foreign place. It's built on the bones of classic high fantasy (owing to its roots as a reworking of WoTC's D&D staples for homebrew's sake), but baked under years of paranoid rethinking and
  conceptual drift. It's centered on the Midlands, three re-re-shattered continent-archipelago things that play host to a mess of magically-paralyzed politicking. A long history of divine convolution, depths-secreting, meddlesome intruders
  and unexpected immortal super-expansionists has crushed and rewritten the realm into something that only scantly resembles the high-Modern familiars it pulls from. Dornn is big, overfull with confusing interests and predicated on a lot of
  repeatedly-recalibrated principles.
  <br /> <br />
  The systems of Down the Worldwell are built to adhere to Dornnian cosmology. There are a few quirks to this. Magic in Dornn is the result of an attempt at systemizing the unsystemizable. In layman's terms, it is
  the programmatic cheating of fate and physics. It is reactive, prone to misfire, always unreliable and extremely dangerous. This is represented as Strain, a metered degradation of your character's mental fortitude as 
  you continue to bend the rules that make up the world around you. As strain increases, your spells can fail in more and more spectacular ways - perhaps even to your benefit - but tipping the scale too far will induce a catastrophe that is all
  but certain to kill you. 
  <br /> <br />
  Combat is tuned to the unheroic kinetics of a Dornnian adventurer's life. It is excruciatingly difficult to stay competitive in the field - magic is hard to learn and always wont to fail in the worst of ways, 
  but everybody has to use it to stay ahead. Everyone's a glass cannon, capable of performing absurdly volatile feats whilst constantly maintaining the mental calculus required to defend from lethal magics. This is why
  you are more fragile than you may expect in DtWW - the setting it is built on is a bit of a meat-grinder.
  <br /> <br />
  The inhabitants of Dornn have adopted their homeworld's strangeness in many ways. They are usually named for the races they were originally pulled from, but they won't always resemble them as one might expect.
  It is also important to note that the "species" of Dornn can <i>sort-of</i> crossbreed freely. This means it isn't very likely that any one mortal will have a single point of species-heritage to work with, and the traits
  they adopt will be partial composites. This can get extremely unusual with the severities of some species features, so it is probably easiest to use the /character-creation subpage to assist. Variant rules are included with DtWW to handle 
  "Supertraits and Dominances", allowing you to freely customize your family tree without doing lots of trait homework.
  <br /> <br />
  Dornn doesn't have a strong analogue to 5e-style pantheons or alignments. There are thousands of named Gods vaguely correlated to the effects and responses of various prayers and rituals, with groups constantly squabbling over the exacts of
  proper faith. Faith-oriented spellcasters are usually using shortcuts, strange artifacts, or convoluted processes of prayer and reaction to achieve their magics, and there is no clean way to describe moral alignment on the axis of the Divine. 
  This means two things - you can feel free to leaf through the pages of named Divines included in the Dornnian sourcebook and pick your favorite, or just make up your own - the setting is made for that sort of thing. 
  <br /> <br />
  Dornn is far too big to map comprehensively. There is always room to add your own stuff! Nestle towns in new areas, write new histories, change the fates of entire species if you want. Like any good setting, this is about helping your mental garden flourish - 
  steal what works and bin the rest. 

  </p>`

  const realms = `
  <img id="realm-header" className="mx-auto align-top opacity-90 pt-16 w-2/5" src="../../world_cover_scrappy.png"/>
  <img id="realm-title" className="mx-auto align-top opacity-90 w-3/5" src="../../world_bumper.png"/>

  <p className='text-white m-auto text-center w-5/6 pb-20 block'>
  <br /><br />
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
`


//For bottom infopanel
const [bio, setBio] = useState(pagedesc)

  function setZoneOpacities(which){

    var newOpacitiesArray = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

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

  function hoverToggleOpacs(which, sel){ //play on mouseevent. if sel is true, disable everything shadow this. otherwise flat restore + zero out
    var setterArray = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
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
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            setMapControlState(false, false);
            
            map.flyToBounds(dolwynd, {duration: 2})
            setZoneOpacities(dolwynd, true);
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
              setZoneOpacities(anterros, true);
              setFocused(true);
              console.log(focused);
              map.invalidateSize();
              
              map.flyToBounds(anterros, {duration: 2})
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
            setZoneOpacities(argov, true);
            setFocused(true);
            console.log(focused);
            map.invalidateSize();
            
            map.flyToBounds(argov, {duration: 2})
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
          setZoneOpacities(iorstav, true);
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          
          map.flyToBounds(iorstav, {duration: 2})
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
          setZoneOpacities(dorrim, true);
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          
          map.flyToBounds(dorrim, {duration: 2})
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
          setZoneOpacities(cantoc, true);
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          
          map.flyToBounds(cantoc, {duration: 2})
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
          setZoneOpacities(molog, true);
          setFocused(true);
          console.log(focused);
          map.invalidateSize();
          
          map.flyToBounds(molog, {duration: 2})
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
                      <LayersControl position="topright">
                        <LayersControl.Overlay checked name="Regional Nameplates">
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
                  { focused ? <div className="map-info text-center overflow-y-scroll">
                    <h className="inline-block text-6xl pt-5 pb-5 map-info-header" style={{'color': selectedBody.headerColor.hex}}>{selectedBody.header}</h>
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
            <button onClick={() => setBio(realms)}>- The Inhabitants -</button>
            <button onClick={() => setBio(realms)}>- The Polities -</button>
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

