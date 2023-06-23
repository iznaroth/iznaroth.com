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
    <div className='h-screen'>
      {/* Page Header */}
      <Header />
      {/* Blog List & Empty View */}

      
      {!blogContent.length ? <EmptyList /> : <BlogList blogContent={blogContent}/>}
    </div>
  );
};
export default BlogLanding;