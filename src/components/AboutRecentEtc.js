// src/components/About.js

import React from "react";
import BlogShorthand from './blog/BlogShorthand.js';

const About = ({ blogContent }) => {
  return (
   <section id="about">
    <div className="mx-50 px-24">
      <img src="./ribbon-short.png"></img>
    </div>
     <div className="container mx-auto flex px-10 py-10 md:flex-row flex-col items-start min-w-none bg-gray-400 rounded" style={{'borderImageSource': 'url(./text_banner_border.png)', 'borderImageSlice': '14%', 'borderWidth' : '33px', 'borderImageRepeat': 'repeat', 'borderStyle' : 'solid', 'imageRendering' : 'pixelated'}}>
       <div className="lg:flex-grow md:w-1/2 lg:pr-0 md:pr-0 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
         <h1 className="title-font sm:text-4xl text-3xl mb-4 px-8 font-medium text-black">
            What's all this, then?
           <br className="hidden lg:inline-block" />
         </h1>
         <p className="mb-8 leading-relaxed px-8 text-black">
         This is a massive quasi-portfolio monolith concerning my work - the me in question being Jonas Bull, iznaroth or whatever name you know me by. 
         It’s more or less an organized storage locker for my brain. I put everything in here somewhere, and I try kind-of hard to make it logical for others to navigate. I built it to explore, so poke around! If you’re on desktop, try the Astral Catalogue for a more interesting format. 
         <br /><br />
         It’s split into a lot of subsites for different things, tools and projects. You should probably bookmark the root page you’re looking for rather than this one - 
         /blogs for my blogposts, for example. 
         <br /><br />
        I keep this site because I make a lot of “conventionally unusable content,” as I call it. I peddle in unpolished ideas and unedited rambling, descriptions and design breakdowns for games and projects that I don’t necessarily believe in (or just don’t have the capital to make work). I am only accredited as a software engineer - I am not a professional designer, critic, philosopher or poet, though that doesn’t stop me from doing it anyways. Ideas are cheap and common, but I also dislike keeping all this junk locked up in my brain, so it goes here. If it interests you, that’s pretty cool. 
        <br /><br />
        If you really like what I do, you can toss me a buck on Patreon, helping me eke a bit closer to self-sufficient creative living. I occasionally post more heavily-edited/targeted content over there, but I don’t like to paywall stuff - most everything will be on this site. Gotta make the bread somehow though. 
        <br /><br />
        I love you! Stay baller!
        <br /><br />
        – Jonas Bull (iznaroth in some places)
         </p>
         <div className="flex justify-center pl-3">
           <a
             href="#contact"
             className="inline-flex text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg">
             Contact
           </a>
           <a
             href="https://www.patreon.com/iznaroth"
             className="ml-4 inline-flex text-gray-400 bg-orange-800 border-0 py-2 px-6 focus:outline-none hover:bg-orange-700 hover:text-white rounded text-lg">
             Patreon
           </a>
           <a
             href="https://github.com/iznaroth/"
             className="ml-4 inline-flex text-gray-400 bg-gray-800 border-0 py-2 px-6 focus:outline-none hover:bg-gray-700 hover:text-white rounded text-lg">
             Github
           </a>
         </div>
       </div>
       <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6 md:text-right">
          <div>
            {/* Perhaps an image of myself and a little textbox? */}
          </div>
          <h1 className="title-font sm:text-4xl text-3xl mb-4 pr-8 font-medium text-black">
            Recently Updated
           <br className="hidden lg:inline-block" />
         </h1>
         <div className='blogList-stubs-wrap'>
          {blogContent.map((blog) => (
            <BlogShorthand blogContent={blog} />
          ))}
        </div>
       </div>
     </div>
   </section>
 );
};
export default About;
