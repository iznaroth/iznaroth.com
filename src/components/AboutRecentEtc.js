// src/components/About.js

import React from "react";
import BlogShorthand from './blog/BlogShorthand.js';

const About = ({ blogContent }) => {
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
         <br/><br/>
         The steel-wired corpse of this site is currently incapable of accommodating comments, so if you want to get in touch, please send me an
         email at iznaroth@gmail.com. If you have my Discord, that's probably a better option. 
         <br/><br/>
        – iznaroth
         </p>
       </div>
       <div className="lg:max-w-lg lg:w-full md:w-1/2  md:text-right">
          <h1 className="text-black text-center sm:text-4xl text-3xl">
            Recent Posts / Updates
           <br className="hidden lg:inline-block" />
         </h1>
         <div className='blogList-stubs-wrap'>
          {blogContent.map((blog) => (
            <BlogShorthand blogContent={blog} postOrDevlog={true}  />
          ))}
        </div>
        <div className="h-12"></div>
        <h1 className="text-black text-center sm:text-4xl text-3xl">
            A Lay of the Land
           <br className="hidden lg:inline-block" />
        </h1>
        <p className="mb-8 leading-relaxed lg:px-8 text-center"><i className="!text-center text-slate-700">...or Frontier Incompletes as of (4/22/24)</i></p>
        <p className="mb-8 leading-relaxed lg:px-8 text-black text-left text-sm">
          Under the gallows? Nothing changes.
          <br/><br/>
          - Brittle is a starving and unquenched pit of lightless, inverted hellfire. The Mechanic is always lost, because it goes down forever. It will be dissected and exposed as a series of vignettes.
          <br/><br/>
          - Down the Worldwell is an unlovable mutant with hands in too many drawers. Expect a lot of 5e homebrew. I haven't yet ran out of lore (phasiogenetic mapping protocol when?)
          <br/><br/>
          - M4 may one day eclipse Brittle in sheer scope, but not in precision or granularity (this is good, we can actually curb that behavior.) Never forget the rule of fives; Ordhomman Parallelism is watching you even when you harbor no love for it. Mörtz knows your favorite pickaxes.
          <br/><br/>
          - Nothing can outlive Dolom's flame, right? Balance paralysis and networking nightmares. What's the best way to pitch six collaborators against each-other when they're all essential personnel?
          <br/><br/>
          - The Grenz Expeditionsteam is proud to report that construction of the Modem Highway is theoretically complete, though they are unable to provide the IRSTYS with any direct footage at this time. Your patience is appreciated.
          <br/><br/>
          - The Interior, despite claims to the contrary, is not unexplored. It just grew faster than the Imperial Navigators could accurately map it. Postmortal Protocol is in the process of thawing disabled surveyors as we speak.
          <br/><br/>
          Don't worry about it. I'll figure it out.
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
