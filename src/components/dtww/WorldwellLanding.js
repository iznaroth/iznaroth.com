import '../../index.css';

import {React,  useState, useEffect } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';



const BlogLanding = ({blogContent}) => {

  // function to get selected blog content

  return (
    <div className='min-h-screen' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
      {/* */}

      


      <section id="logo" className="wwlogo">
        <img
            className="m-auto w-2/5"
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
                <img className="mx-auto align-top opacity-30 pt-0" src="../../simpleheader.png"></img>

                <p className='text-white m-auto text-center w-5/6 pb-20 block'>
                <i className='opacity-30'>At the bottom, where bits of the inverted well-rim broke free and tumbled into open sky, it became clear I hadn't found my mark. Too distracting - that, or something cut the rope - and I was set to confront it directly. Unfamiliar lands stretched out beneath, foreign stars glared from on high, miles of cold air either way. Behind me, the mouth pinched into a line and faded away, spitting one last brick into the clouds. <br /><br /> Evensink, the Teeth of Ages, world-wound - the bedrock of the universe. No going back now...</i>

                <br /> <br />  <br />  
                
                <i>Down the Worldwell</i> is a rules-medium tabletop roleplaying game built around the strains, stresses and disorders of a high-magic world. 
                Combat is fast, devastating and unpredictable. Creatures are strange and convoluted. Characters are defined by the knowledge they have and the time they've spent with it. 
                Death comes swiftly and injury is difficult to rectify. There is no logical limit to power, but that's not a promise of safety. How far can you push it before the well eats you whole? 
                <br /><br />
                The system is reminiscent of monolithics like Dungeons & Dragons or Pathfinder, but attitude-skewed closer to OSR classics like Into the Odd and MORK BORG. It uses five base stats, D20 skillchecks, and other familiar
                paradigms, but is built on a system of loose skill categories, atomized pseudo-class tech-tree character progression, freestyle write-in character abilities and a combat system about making tactical decisions rather than managing tight resources.
                <br /><br />
                The system is primarily built for my homebrew setting, Dornn, but it is designed to be adapted fairly easily. It has a few strong thematic baselines - this is a game about people adventuring in a world
                with unclear rules and absent rulers, where magic is overabundant and poorly-understood. Gods are distant and ineffable, information is scant and inconsistent, and the world is imposingly unfamiliar. It is feasible for any random shmuck to become a walking Godhead, but it's a million times more likely that they'll tear themselves apart
                on the way. Social order is weak and unstable - countries are better described as outposts connected by loosely-maintained highways. Everything is built on the bones of older failed states, ancient civilizations who bungled the test and burnt themselves to the ground chasing the same truths your players are. The frontier is everywhere, and nobody knows what's going on. 

                
                <br /><br />

                For an adventurer, that's probably a good thing.

                <br /><br />
                --------------------------
                <br /><br />
                The links at the top will take you through the basics of the system. <b>The System</b> will teach you the rules, <b>The World</b> will give you way too much information about Dornn, <b>Character Creation</b> will help automate some of the fiddlier aspects of making a new PC, and <b>The Assembly</b> is for my West Marches 
                players only, for now. There are no physical materials for Down the Worldwell (yet!)

                </p>
               </div>
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>

    
    
  );
};
export default BlogLanding;