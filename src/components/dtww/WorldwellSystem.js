import '../../index.css';

import {React,  useState, useEffect } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';



const WorldwellSystem = () => {

  // function to get selected blog content

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
            <a href="/dtww/system"><img className='opacity-50' src="../../system.png"/></a>
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
                <img className="mx-auto align-top opacity-90 pt-16 w-1/4" src="../../systembanner.png"/>
                

                <p className='text-white m-auto text-center w-5/6 pb-20 block'>

                <i className='text-slate-400'>Note - If you would prefer to have this site in PDF form, you can download it here: <br />- link - </i>
                <br /><br />
                The following segments will serve as a straightforward summary of Down the Worldwell's core systems, ordered in a manner that should roughly correlate to their relevance. We will begin
                with the fundamentals of character representation, then interacting with the world through skills and dialogue, then combat and conflict, and finally through a variety of other
                potential sub-systems like travel, camping, property ownership, intrigue and worship.
                <br /><br />
                Not all edge cases are covered in this document due to navigational concerns. This is intended as a method of rapid onboarding. For a holistic overview of the system, please download the PDF version. 
                <br /><br />
                ----------------------------------------------------
                 <br /><br />
                Down the Worldwell is a tabletop roleplaying game for any number of players and one Game Master (referred to as the GM from here on.) In it, the players will pilot characters
                of their own making, reacting to a world the GM creates through narration and prompts. When conflicts arise in this world, if they cannot be mediated by the decisions the players make or the GM's discretion alone,
                they will be decided using dice. The most common die you will use to interact with the world at large is the 20-sided die - a D20. 
                
                </p>
               </div>
            </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>

    
    
  );
};
export default WorldwellSystem;