import '../../../index.css';

import {React,  useState, useEffect, useRef } from 'react';
import EmptyList from '../../blog/EmptyList';
import BlogShorthand from '../../blog/BlogShorthand';




const DevlogLanding = ({devlogContent}) => {

  // function to get selected blog content
  const dtww_entries = useRef();
  const m4_entries = useRef();
  const brittle_entries = useRef();
  const dolom_entries = useRef();
  

  useEffect(() => {

    console.log("INSIDE DEVLOG LANDING:")
    console.log(devlogContent)

    dtww_entries.current = devlogContent.filter((log) => log.relevantTags.includes("dtww"))
    m4_entries.current = devlogContent.filter((log) => log.relevantTags.includes("m4"))
    brittle_entries.current = devlogContent.filter((log) => log.relevantTags.includes("brittle"))
    dolom_entries.current = devlogContent.filter((log) => log.relevantTags.includes("doloman"))



    console.log(dtww_entries)

    //there is almost certainly a better way of doing this, so fix it!
  }, [])
  
  if(dtww_entries.current == null || m4_entries.current == null || brittle_entries.current == null || dolom_entries.current == null ){
    console.log(dtww_entries.current)
    console.log(m4_entries.current)
    console.log(brittle_entries.current)
    console.log(dolom_entries.current)
    return (<div>LOADING!</div>)
  }

  console.log("----------------ONLY ACCESSIBLE ON LEGAL ENTRY--------------------s")

  return (
    
    <div className='min-h-screen'>
      {!devlogContent ? (
      'Loading'
    ) : ( <div /> )}
      {/* Page Header */}
      <div  className="flex h-96">
          <img
              className="m-auto w-2/5"
              alt="devlogs"
              src="../../devlogs.png"
            />
      </div>

    

      <header className='home-header pb-12'>
        <p>This is an archive of devlogs categorized by project and sorted newest-to-oldest. There are no consistent promises regarding any one project's update schedule or roadmapping; 
          I am generally not going to be working continuously on one specific project unless circumstances change drastically (e.g. this stops being a hobby-joke-bit-etc).
          <br/><br/>
          <i className='red'>Click a header to go to the project's homepage, if it exists.</i>
        </p>

      </header>

      
      
      {/* Blog List & Empty View */}
      <div className="container mx-auto flex flex-wrap px-10 py-10 md:flex-row flex-col items-start justify-center w-fit bg-gray-400 rounded" style={{'borderImageSource': 'url(./text_banner_border.png)', 'borderImageSlice': '14%', 'borderWidth' : '33px', 'borderImageRepeat': 'repeat', 'borderStyle' : 'solid', 'imageRendering' : 'pixelated'}}>
        
        <div className="basis-1/2 pb-12">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 pl-8 text-center font-medium text-black">
             Down the Worldwell
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {dtww_entries.current.map((blog) => (
              <BlogShorthand blogContent={blog} postOrDevlog={false} />
            ))}
          </div>
        </div>

        <div className="basis-1/2 pb-12">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 pl-8 text-center font-medium text-black">
             M4
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {m4_entries.current.map((blog) => (
              <BlogShorthand blogContent={blog} postOrDevlog={false}  />
            ))}
          </div>
        </div>

        <div className="basis-1/2 pb-12">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 pl-8 text-center font-medium text-black">
             Brittle
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {brittle_entries.current.map((blog) => (
              <BlogShorthand blogContent={blog} postOrDevlog={false}  />
            ))}
          </div>
        </div>

        <div className="basis-1/2 pb-12">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 pl-8 text-center font-medium text-black">
             Doloman Epoch
            <br className="hidden lg:inline-block" />
          </h1>
          <div className='blogList-stubs-wrap'>
            {dolom_entries.current.map((blog) => (
              <BlogShorthand blogContent={blog} postOrDevlog={false}  />
            ))}
          </div>
        </div>

      </div>

      <div className='blog-footer' />

    
    </div>


    
    
  );
};
export default DevlogLanding;