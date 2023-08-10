import React, { useEffect, useState, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { request } from 'graphql-request';

import './App.css';

import Product from './components/Product';
import Logo from './components/Logo';
import Navbar from './components/Navbar';
import Astropanel from './components/Astropanel';
import BlogLanding from './components/blog/BlogLanding';
import BlogPost from './components/blog/BlogPost';
import DevlogLanding from './components/blog/devlog/DevlogLanding';
import About from './components/AboutRecentEtc';
import Contact from './components/Contact';
import WorldwellLanding from './components/dtww/WorldwellLanding';
import WorldwellSystem from './components/dtww/WorldwellSystem';
import WorldwellDornn from './components/dtww/WorldwellDornn';
import WorldwellRK from './components/dtww/WorldwellRK'
import { graphcms, QUERY_POSTLIST, QUERY_SLUG_CATEGORIES, QUERY_DEVLOG } from './graphql/Queries';
import WorldwellCharacters from './components/dtww/WorldwellCharacters';



function App() {
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [devlogs, setDevlogs] = useState(null);
  const [bg, changeBg] = useState('')

  

  useEffect(() => {
    
    if(posts == null){
        console.log("call for blog")
        graphcms.request(QUERY_POSTLIST)
        .then(res => setPosts(res.simplePosts))

        graphcms.request(QUERY_POSTLIST)
        .then(res => console.log(res.simplePosts))
    }

    if(categories == null){
        console.log("call for categories")
        graphcms.request(QUERY_SLUG_CATEGORIES)
        .then(res => setCategories(res.categories))
    }

    if(devlogs == null){
      console.log("call for devlogs")
      graphcms.request(QUERY_DEVLOG)
      .then(res => setDevlogs(res.simplePosts))

      graphcms.request(QUERY_DEVLOG)
      .then(res => console.log(res.simplePosts))
    
    }
    
  }, [])

   
  return (
    <main className="text-gray-400 bg-cover body-font" style={{'backgroundImage': 'url(/iz_bg_simple.png)', 'backgroundSize' : '1920px 1080px'}}>


      {(!posts || !devlogs) ? (
          'Loading'
        ) : (
      <Routes>
          <Route path = "/" element={
          <Fragment>
            <Logo />
            <Navbar />
            <Astropanel />
            <About blogContent={posts}/>
            <Contact />
          </Fragment>}>

          </Route>
          <Route path = "/astromap" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
        
          <Route path = "/blog" element = {
            <Fragment>
              <BlogLanding blogContent={posts}/>
            </Fragment>
          }></Route>
          <Route path = "/blog/:slug" element = {
              <BlogPost content={posts}/>
          }>
          </Route>
          <Route path = "/devlogs" element = {
            <Fragment>
              <DevlogLanding devlogContent={devlogs} />
            </Fragment>
          }>
          </Route>
          <Route path = "/devlogs/:slug" element = {
              <BlogPost content={devlogs}/>
          }>
          </Route>

          {/* START OF WORLDWELL SUBSITE*/}
          
          <Route path = "/dtww" element = {
            <Fragment>
              <WorldwellLanding />
            </Fragment>
          }>
          </Route>

          <Route path = "/dtww/system" element = {
            <Fragment>
              <WorldwellSystem />
            </Fragment>
          }>
          </Route>

          <Route path = "/dtww/dornn" element = {
            <Fragment>
              <WorldwellDornn />
            </Fragment>
          }>
          </Route>

          <Route path = "/dtww/assembly" element = {
            <Fragment>
              <WorldwellRK />
            </Fragment>
          }>
          </Route>

          <Route path = "/dtww/character-creation" element = {
            <Fragment>
              <WorldwellCharacters />
            </Fragment>
          }>
          </Route>

          {/* END OF WORLDWELL SUBSITE*/}

          
          <Route path = "/brittle" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
          <Route path = "/manmech" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
          <Route path = "/fragments" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
    
      </Routes>
        )}
    </main>
  );

}


export default App;
