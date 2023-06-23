
import {React,  useState, useEffect } from 'react';
import BlogItem from './BlogItem.js';
import '../../index.css';
const BlogList = ({ blogContent }) => {

  useEffect(() => {

    console.log("at BLOG LIST, we have")
    console.log(blogContent)

  }, [])

  return (
    <div className='blogList-wrap'>
      {blogContent.map((blog) => (
        <BlogItem blogContent={blog} />
      ))}
    </div>
  );
};
export default BlogList;