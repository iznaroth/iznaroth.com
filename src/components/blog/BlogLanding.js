import '../../index.css';

import {React,  useState, useEffect } from 'react';
import EmptyList from '../blog/EmptyList';
import BlogList from '../blog/BlogList';
import Header from '../blog/Header';
import SearchBar from '../blog/SearchBar';
import { blogList } from '../../config/Api';
import { request } from 'graphql-request';



const BlogLanding = ({blogContent}) => {

  // function to get selected blog content

  useEffect(() => {

    console.log("At LANDING, we have  ")
    console.log(blogContent)

  }, [])

  return (
    <div className='min-h-screen'>
      {/* Page Header */}
      <div  className="flex h-96">
          <img
              className="m-auto w-2/5"
              alt="evil thoughts"
              src="../../evil_thoughts.png"
            />
        </div>
      <Header />
      {/* Blog List & Empty View */}

      
      {!blogContent.length ? <EmptyList /> : <BlogList blogContent={blogContent}/>}
      <div className='blog-footer' />
      <div className='blog-footer copynotice' >©2022 - 2025  iznaroth | All Rights Reserved</div>
      <div className='blog-footer' />
    </div>
    
  );
};
export default BlogLanding;