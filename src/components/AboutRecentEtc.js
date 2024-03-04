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
            What's all this, then?
           <br className="hidden lg:inline-block" />
         </h1>
         <p className="mb-8 leading-relaxed lg:px-8 text-black">
         Hey! What's up? Welcome to the greater hall of unfinished things!
         <br /><br />
         This is something like a portfolio, I guess? In a concentrated effort to '<i>stop hoarding work and start showing it to people</i>' I made this site about a year ago and have since failed to actually publish anything meaningful (<i>save for an entirely unfinished tour guide of my ill-advised TTRPG system and setting.</i>)
         I do make a lot of stuff, I'm just the ultra-typical washed creative that endlessly starts new projects without ever finishing something presentable. Still, this is the hopeful eventual home to a lot of disorganized thoughts, blog-posts, devlogs, half-finished materials, demos, the works. 
         <br /><br />
        I also keep this site because I make a lot of “conventionally unusable content.” I peddle in unpolished ideas and unedited rambling, descriptions and design breakdowns for games and projects that I don’t necessarily believe in (or just don’t have the capital to make work). I am only accredited as a software engineer - I am not a professional designer, critic, philosopher or poet, though that doesn’t stop me from doing it anyways. Ideas are cheap and common, but I also dislike keeping all this junk locked up in my brain, so it goes here. If it interests you, that’s pretty cool. 
        <br /><br />
        My patreon is frozen right now, not much going on over there. If or when it resumes, I'll make a post about it. Thanks for stopping by!
        <br /><br />
        I love you! Stay baller!
        <br /><br />
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
            What's Current?
           <br className="hidden lg:inline-block" />
        </h1>
        <p className="mb-8 leading-relaxed lg:px-8 text-center"><i className="!text-center text-slate-700">...or Frontier Incompletes as of (2/27/24)</i></p>
        <p className="mb-8 leading-relaxed lg:px-8 text-black text-left text-sm">
        Surprise! It's <i>Down the Worldwell</i> and <i>Brittle.</i> Nothing substantial enough to justify a devlog on either side. <br/><br/>
        
        DtWW is suffering under a cycle of decompression and recompression as I fail
        to settle on a desired threshold of complexity, but I do want to publish and write a bit about my current 4-page draft and how I do not understand the statistical implications of D12 dice pools on long-term progression. 
        I still want to finish a lot of the site writeups (lots of unfinished cities, and damn is that page verbose for no reason) and integrate some character creation tools. Keep an eye out!<br/><br/>

        Brittle is suffocating under a mound of required refactors to player control and state management--an expected outcome as the scope of the game continues to drift out of orbit. Some work is happening in there
        regarding the more neurotic AI expectations a.la squad-sync behavior and conservation of playable space on a 2D plane, a lot of junk I will inevitably talk more about as it graduates from "suboptimal speculation" to "suboptimal reality."
        <br/><br/>
        On the frontier of Website Improvements--no comment box yet. That has unsettled security concerns (<i>the backend is a mess?! How could this be?</i>) and I won't get to it quite yet. Also, the contact box at the bottom doesn't work and scaling
        is miserable on tablet. Check back soon!
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
    <div className='blog-footer copynotice' >©2022 - 2023 iznaroth | All Rights Reserved</div>
    <div className='blog-footer' />
   </section>
   
 );
};
export default About;
