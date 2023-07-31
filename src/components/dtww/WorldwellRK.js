import '../../index.css';

import {React,  useState, useEffect } from 'react';




const WorldwellRK = () => {

  // function to get selected blog content

  return (
    <div className=' min-h-screen' style={{'backgroundColor': 'black'}}>
      {/* */}

      


      <img className=' m-auto lg:w-2/6 md:w-2/5 sm:w-3/5'
            
            alt="Recordkeeper's Archives"
            src="../../rk_banner.jpg"
            />
       <div className='blog-footer' />
       <form className='m-auto'>
        <input className="block m-auto" type="text"></input>
       </form>

    </div>

    
    
  );
};
export default WorldwellRK;