// src/components/About.js

import React from "react";
import BlogShorthand from './blog/BlogShorthand.js';

const About = ({ blogContent, devlogContent }) => {
  return (
   <section id="about">
    <div className="mx-50 px-24">
      <img src="./ribbon-short.png"></img>
    </div>
    <div className="bg-gray-400 rounded"  style={{'borderImageSource': 'url(./text_banner_border.png)', 'borderImageSlice': '14%', 'borderWidth' : '33px', 'borderImageRepeat': 'repeat', 'borderStyle' : 'solid', 'imageRendering' : 'pixelated'}}>
      <div className="container !mx-0 md:mx-auto flex lg:px-10 py-10 md:flex-row flex-col items-center sm:items-start max-w-full">
        <div className="lg:flex-grow m-0 md:w-1/2 lg:pr-0 md:pr-0 md:text-left mb-16 md:mb-0 text-center">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 lg:px-8 font-medium text-black">
            The Eternal Prospect
            <br className="hidden lg:inline-block" />
          </h1>
          <p className="mb-8 leading-relaxed lg:px-8 text-black">
            Hey! What's up? 
            <br /><br />
            It's a little bit unfinished, I know. I love you for stopping by anyways. Welcome to the pit!
            <br /><br />
            Within the ever-rotating display case of my unfinishable vanity projects, I'm currently giving attention to the following:
            <br /><br />
            <ul>
              <li><b>= Down the Worldwell,</b> an ill-advised TTRPG system set in my massively over-detailed homebrew setting, Dornn</li>
              <li><b>= Brittle,</b> a structurally-disrespectful metroidvania about a faceless Mechanic with a very hostile inner voice</li>
              <li><b>= Foundations,</b> an RPG about the son of a cultist lost in post-corporate antiphysical northwestern America </li>
              <li><b>= Modem Highway,</b> an open-world roadtrip ramble through the dimlit monochrome Odembolg Basin, ex-American site of divine crashout and subsequent Halgryian colonization</li>
              <li><b>= Doloman Epoch,</b> an utterly harebrained 6-player co-opera-competitive deckbuilder set in a diseased and bizarre interstellar empire, the Ca-or Inwheel</li>
              <li><b>= Mad-Manic Magi-Mechanics (M4),</b> a scatterbrained tech mod for Minecraft involving a lot of market manipulation and outsider influence</li>
              <li><b>= The Interior,</b> a strict semi-novelesque resource manager about a defunct Surveyor-class starship regaining operation ten thousand years after the Royal Domain's collapse</li>
            </ul>
            <br/><br/>
            The steel-wired corpse of this site is currently incapable of accommodating comments, so if you want to get in touch, please send me an
            email at iznaroth@gmail.com. If you have my Discord, that's probably a better option. 
            <br/><br/>
            – iznaroth
          </p>
        </div>
        <div className="lg:max-w-lg lg:w-full md:w-1/2  md:text-right">
          <h1 className="text-black text-center sm:text-4xl text-3xl">
              Recent Posts
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {blogContent.map((blog) => (
              <BlogShorthand blogContent={blog} postOrDevlog={true}  />
            ))}
          </div>
          <div className="h-12"></div>
          <h1 className="text-black text-center sm:text-4xl text-3xl">
              Project Writeups & Updates
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {devlogContent.map((devlog) => (
              <BlogShorthand blogContent={devlog} postOrDevlog={false}  />
            ))}
          </div>
          <div className="h-12"></div>
          <h1 className="text-black text-center sm:text-4xl text-3xl">
              A Lay of the Land
            <br className="hidden lg:inline-block" />
          </h1>
          <p className="mb-8 leading-relaxed lg:px-8 text-center"><i className="!text-center text-slate-700">...or Frontier Incompletes as of (12/22/24) - a six month gap!</i></p>
          <p className="mb-8 leading-relaxed lg:px-8 text-black text-left text-sm">
          I'm not sure if this will be a surprise to you, but I don't have much to report. I'm not particularly adept at creating good bite-sized update material. I mostly just rework backend problems until
          I lose the plot.
          <br/><br/>
          In the process of narrowing focus, only three projects remain relevant: <a href="/devlogs/dtww-overview">Down the Worldwell</a>, <a href="/devlogs/brittle-summary">Brittle</a> and Foundations. Please report to their devlog pages and/or related updates for more details.
          <br/><br/>
          I know nothing of accountability. I will continue to promise unabated! Hahahahaha!
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center pl-3  " style={{flexBasis: 100}}>
           <a
             href="#contact"
             className="inline-flex text-white bg-green-500 mb-2 sm:mb-0 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg">
             Contact
           </a>
           <a
             href="https://www.patreon.com/iznaroth"
             className="ml-4 inline-flex text-gray-400 bg-orange-800 mb-2 sm:mb-0  border-0 py-2 px-6 focus:outline-none hover:bg-orange-700 hover:text-white rounded text-lg">
             Patreon
           </a>
           <a
             href="https://github.com/iznaroth/"
             className="sm:ml-4 inline-flex text-gray-400 bg-gray-800 mb-2 sm:mb-0  border-0 py-2 px-6 focus:outline-none hover:bg-gray-700 hover:text-white rounded text-lg">
             Github
           </a>
         </div>
     </div>
     <div className='blog-footer' />
    <div className='blog-footer copynotice' >©2022 - 2024 iznaroth | All Rights Reserved</div>
    <div className='blog-footer' />
   </section>
   
 );
};
export default About;
