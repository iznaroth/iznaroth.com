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
         Hey! What's up? Welcome to the Greater House of Unfinished Works!
         <br /><br />
         This is something like a portfolio, I guess? In a concentrated effort to '<i>stop hoarding stuff and start showing it to people</i>' I made this site about a year ago and have since failed to actually publish anything meaningful (<i>save for an entirely unfinished tour guide of my ill-advised TTRPG system and setting.</i>)
         I do make a lot of stuff, I'm just the ultra-typical washed creative that endlessly starts new projects without ever finishing something presentable. Still, this is the hopeful eventual home to a lot of disorganized thoughts, blog-posts, devlogs, half-finished materials, demos, the works. 
         <br /><br />
        I also keep this site because I make a lot of “conventionally unusable content.” I peddle in unpolished ideas and unedited rambling, descriptions and design breakdowns for games and projects that I don’t necessarily believe in (or just don’t have the capital to make work).  Ideas are cheap and common, but I also dislike keeping all this junk locked up in my brain, so it goes here. If it interests you, that’s pretty cool. 
        <br /><br />
        My patreon is frozen right now, not much going on over there. If or when it resumes, I'll make a post about it. Thanks for stopping by!
        <br /><br />
        I love you! Stay cool!
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
        <p className="mb-8 leading-relaxed lg:px-8 text-center"><i className="!text-center text-slate-700">...or Frontier Incompletes as of (4/22/24)</i></p>
        <p className="mb-8 leading-relaxed lg:px-8 text-black text-left text-sm">
        What does two months of doing nothing look like? Nothing!
        <br/><br/>
        I don't have much to update on. I've been working on-and-off with Down the Worldwell as much as usual, but mostly in a zombie-5e homebrew nightmare sense. The core system
        remains untested.
        <br/><br/>
        The other big ones remain on ice and shoved way back in the freezer. Brittle's infinite gravity may be leading places soon, but I am deeply lost in the recursive maze of infinite system speculation. Imagine prototyping when you can just
        think forever! I will emerge from this chasm reforged, older than 50, and carrying a game so primally evil that it releases to a 0 on metacritic.
        <br/><br/>
        M4 is always lingering on the back of my mind, but I also kind-of hate working in Forge so I'm a little unenthused. This is a failure of my own making--I did not learn the tool well, and for some reason, I 
        struggle to use it to its fullest potential. I like to run into the reasonable limits of any engine or toolset I use. An impression of my tendencies is forming in the leaves here - two words spelled, SCOPE CREEP - I wonder what they mean?
        <br/><br/>
        Does Doloman Epoch even deserve to be there? A few new headers may appear soon...
        <br/><br/>
        Site improvements have not occurred. Some loose refactors to the DtWW page notwithstanding, I haven't done any work on comments (because I haven't written any posts, :p) so I can continue
        to assume that everybody loves me and their obviously-intentional silence is a compliment. Thanks!
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
