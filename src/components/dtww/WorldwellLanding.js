import '../../index.css';

import {React,  useState, useEffect } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';



const WorldwellLanding = () => {

  // function to get selected blog content

  return (
    <div className='worldwell min-h-screen cursor-drawnhand' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
      {/* */}

      


      <section id="logo" className="wwlogo">
        <img
            className="m-auto lg:w-2/5 md:w-3/5 sm:w-4/5"
            alt="Down the Worldwell"
            src="./dtww.png"
            />
      </section>

      <section id="navbar" className="">
        <div className="navbar wwnavbar">
            <a href="/">
            <img
                className=""
                alt="return home"
                src="./back_button.png"
                />
            </a>
            <a href="/dtww/system" class><img src="../../system.png"/></a>
            <a href="/dtww/dornn"><img src="../../world.png"/></a>
            <a href="/dtww/character-creation"><img src="../../char.png"/></a>
            <a href="/dtww/assembly"><img src="../../assembly.png"/></a>
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


              <div className="container">
                <img className="mx-auto align-top opacity-90 pt-16 w-1/6" src="../../well.png"/>
                <img className="mx-auto align-top opacity-90 pt-0" src="../../simpleheader_green.png"></img>

                <p className='text-white m-auto text-center w-5/6 pb-20 block'>
                <i className='opacity-60'>Beyond the bottom and looking straight up, where bits of the inverted well-rim broke free and tumbled into open sky, it became clear I hadn't found my mark. One shotty knot - that, or something cut the rope - and I was set to confront it directly. Unfamiliar lands stretched out beneath, foreign stars glared from on high, nothing but cold air in the interim. Behind me, the suspended well-mouth pinched into a line and faded, spitting one last brick into the clouds.
                <br/><br/>
                Have you read the stories? Along the ever-twisting bristles of the Outer Kosmos, there is a lowest-layer, where the chitinous legs of the Carrier coil like a knot around a perfect pinhole. Rumor and legend obey the same thesis—here, amidst a torrid sea of unmarried truths, there is a common end, the Last Stop. Terminus. 
                Evensink, the Teeth of Ages, world-wound - the bedrock of the universe. No going back now...
                </i>
                <br /> <br /><br />  
                <i>Down the Worldwell</i> is a game about broken places and the timid folk that claim to own them. It is about the strains, stresses and disorders
                of an old, unpredictable world at the bottom of the universe, the <i>last stop</i> on every limb of the outer kosmos. The homesteaders call it Dornn--the Broken Lands--
                so frequently visited by catastrophe the ground itself can no longer properly hold shape without falling prey to broken worldlaw and magic malpractice. Held and burned for millenia by the vaunted legions of the old world, stolen by the temperamental
                shoves of the immortal Human Empires, desperately protected by the surviving Inheritors, it is a knotted sprawl of superstructural ruin and discordant anti-nature.  
                <br/><br/>In these suffocated lands, now governed only by recluses, immortalesques and deranged ideologues, where no map nor road can reliably lead you where you wish to go, it falls to the <b>Travellers</b> to keep the world alive.
                <br/><br/>
                Players will pilot these Travellers, the bold-or-foolish few who forsake the paranoid comfort of ruin-state life to hunt for fame, money, history, truth and purpose across Dornn's ever-shifting frontiers.
                Life is a challenge in the Dornnian wilds, where disaster-warped creatures of unknown intent stalk the realm, world-law is fickle, the gods are unresponsive and magic is terribly unstable. 
                <br/><br/>
                Taking inspiration from both OSR-style high-stakes low-fantasy <i>and</i> ultra-high-magic nonsense beyond even D&D's scope, Down the Worldwell's system is a medium-weight TTRPG about 
                strange abilities and strategic sacrifice. A traveller's prowess and experience will be measured by the versatility of their <i>skills</i> and the myriad manipulative <i>spells and abilities</i> they learn, pulled from
                from the <i>arc charts</i> and <i>spellbooks</i> of Dornn's many <b>Tactical Occupations.</b> Be wary, however--combat is highly lethal, injury is difficult to rectify, and everything hinges on
                the delicate balance of magically-induced <i>strain</i> on the stability of the real. Sometimes, the answer lies elsewhere...
                <br /><br />
                <img className="m-auto opacity-40" src="../../split_1.png"/>
                <br/>

                Though the setting guide for Down the Worldwell is not yet complete, this site will always contain the essential information for players to create characters and GMs to acquaint themselves with the setting.
                Eventually, if you're willing to wait it out, I might just publish a full-meat system and setting guide. In that strange far-future world, the guide may even include stuff like this:
                <br /><br />
                <ul className='text-left text-lime-200 list-disc px-10'>
                    <li>13 playable ancestries with a lot of weird history and bonuses</li>
                    <li>15 "tactical occupations", extended power trees that describe different combat pursuits.</li>
                    <li>More than 100 occupation-agnostic abilities you can throw at your players. </li>
                    <li>Hundreds of strange items, where they came from, and who wants them.</li>
                    <li>Many accounts of the warped and cruel creatures inhabiting Broken Lands.</li>
                    <li>A positively stupid amount of tables for generating people, places and things.</li>
                    <li>Hundreds of pages of gibberish lore, locations, relationships and systems to use as idea fodder.</li>
                    <li>A long timeline upon which you can etch your campaign stories anywhere. </li>
                </ul>
                <br />
                <img className="m-auto opacity-40" src="../../split_1.png"/>
                <br/>
                The links at the top will take you through the basics of the system. <b>The System</b> will teach you the rules, <b>The World</b> will give you way too much 
                information about the legendary realms of Dornn, <b>Character Creation</b> will help automate some of the fiddlier aspects of making a new PC, and 
                <b>The Assembly</b> is for my West Marches players only, for now. There are no physical materials for Down the Worldwell (yet!), and much of this site is currently under construction.
                This project is currently a noncommercial hobby by a single person. Progress will be immeasurably slow and bound to my real-world obligations. My apologies for the wait.
                <br /><br />
                <i className='text-slate-400'>
                While the system-particulars of Down the Worldwell do not prescribe a particular tone, there are a few implied content warnings. Your table ought to be comfortable with more grounded
                depictions of severe injury, death, mental strain and various traumas. In addition, the included material on the Dornn setting will occasionally depict the social and political issues that plague
                the varied fantasy species of the realm. While no content in Down the Worldwell is intended to represent or resemble anything in the real world, there will inevitably be familiar concepts. 
                <br /><br />
                If anything at all reads poorly or makes you uncomfortable, please reach out to me at iznaroth@gmail.com. 
                </i>
                <br /><br />
                </p>
               </div>
            </div>
      </div>
    </div>
      <div className='blog-footer' />
      <div className='blog-footer copynotice' >©2022 - 2023 iznaroth | All Rights Reserved</div>
      <div className='blog-footer' />
    </div>

    
    
  );
};
export default WorldwellLanding;