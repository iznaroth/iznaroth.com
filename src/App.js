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
import About from './components/AboutRecentEtc';
import Contact from './components/Contact';
import WorldwellLanding from './components/dtww/WorldwellLanding';
import WorldwellSystem from './components/dtww/WorldwellSystem';
import WorldwellDornn from './components/dtww/WorldwellDornn';
import { graphcms, QUERY_POSTLIST, QUERY_SLUG_CATEGORIES } from './graphql/Queries';



function App() {
  const [posts, setPosts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [bg, changeBg] = useState('')

  

  useEffect(() => {

    graphcms.request(QUERY_POSTLIST)
    .then(res => setPosts(res.simplePosts))

    graphcms.request(QUERY_SLUG_CATEGORIES)
    .then(res => setCategories(res.categories))

    graphcms.request(QUERY_POSTLIST)
    .then(res => console.log(res))

    graphcms.request(QUERY_SLUG_CATEGORIES)
    .then(res => console.log(res))

    console.log(posts)
    console.log(categories)
  }, [])

   
  return (
    <main className="text-gray-400 bg-cover body-font" style={{'backgroundImage': 'url(/iz_bg_simple.png)', 'backgroundSize' : '1920px 1080px'}}>


      {!posts ? (
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
          <Route path = "/devlog" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
          <Route path = "/tech" element = {
            <Fragment>
              <Contact />
            </Fragment>
          }>
          </Route>
          <Route path = "/writing" element = {
            <Fragment>
              <Contact />
            </Fragment>
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
