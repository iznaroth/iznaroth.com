// src/components/About.js

import React from "react";

export default function About() {
  return (
   <section id="about">
     <div className="container mx-auto flex px-10 py-20 md:flex-row flex-col items-center">
       <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
         <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-white">
            What's all this, then?
           <br className="hidden lg:inline-block" />
         </h1>
         <p className="mb-8 leading-relaxed">
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
         <div className="flex justify-center">
           <a
             href="#contact"
             className="inline-flex text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg">
             Contact
           </a>
           <a
             href="#projects"
             className="ml-4 inline-flex text-gray-400 bg-gray-800 border-0 py-2 px-6 focus:outline-none hover:bg-gray-700 hover:text-white rounded text-lg">
             See My Projects
           </a>
         </div>
       </div>
       <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
         <img
           className="object-cover object-center rounded"
           alt="hero"
           src="./me.png"
         />
       </div>
     </div>
   </section>
 );
}
