import {React, useEffect} from 'react';
import '../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';

const WorldwellSpecies = ({content}) => {



console.log("at WorldwellSpecies, we have this data:")
console.log(content)



  const { slug } = useParams();
  console.log(slug);
  const entry = content.find((entry) => entry.slug === slug);

  return (
    <>
      
      {content ? (
        
    <div className='worldwell min-h-screen cursor-drawnhand' style={{'backgroundImage': 'url(../../terrain_bg_tile.png)'}}>
      {/* */}
        <section id="logo" className="wwlogo">
            <img
                className="m-auto lg:w-2/5 md:w-3/5 sm:w-4/5"
                alt="Down the Worldwell"
                src="../../dtww.png"
                />
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
                    <div className='blog-wrap'>
                        <Link style={{fontSize: '20px'}} className='blog-goBack' to='/dtww/dornn'>
                        <span> &#8592;</span> <span>Go Back</span>
                        </Link>
                        <header>
                        <h1 style={{fontFamily: 'IM Fell DW Pica', color: 'white'}}>{entry.header}</h1>
                        </header>
                        <img src={entry.bannerImage.url}></img>
                        <h2 className='text-2xl text-center text-slate-600'><i>{entry.subtitle}</i></h2>
                        <div className='blog-content' dangerouslySetInnerHTML={{__html: entry.htmlBody}}></div>
                    </div>
                </div>
            </div>
        </div>
        </div>
        <div className='blog-footer' />
        <div className='blog-footer copynotice' >©2022 - 2023 Jonas Bull | All Rights Reserved</div>
        <div className='blog-footer' />
    </div>

      ) : (
        <p>Something went wrong.</p>
      )}
    </>
  );
};
export default WorldwellSpecies;