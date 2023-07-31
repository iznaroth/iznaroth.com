import '../../index.css';

import {React,  useState, useEffect } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';



const WorldwellCharacters = ({blogContent}) => {

  // function to get selected blog content

  return (
    <div className='min-h-screen' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
      {/* */}

      


      <section id="logo" className="wwlogo">
        <img
            className="m-auto lg:w-2/5 md:w-3/5 sm:w-4/5"
            alt="Down the Worldwell"
            src="../../dtww.png"
            />
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
            <a href="/dtww/system" class><img src="../../system.png"/></a>
            <a href="/dtww/dornn"><img src="../../world.png"/></a>
            <a href="/dtww/character-creation"><img src="../../char.png"/></a>
            <a href="/dtww/assembly"><img src="../../assembly.png"/></a>
        </div>
      </section>

      <div className="dark-background">
         <div className="mid-border">
            


              <div className="container">

              <img className="mx-auto align-top pt-64 pb-64 w-4/6" src="../../unfinished.png"/>
                
              </div>
      </div>
    </div>
      
      <div className='blog-footer' />
    </div>

    
    
  );
};
export default WorldwellCharacters;