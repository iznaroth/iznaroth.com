import {React,  useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Chip from './Chip';
import '../../index.css';
const BlogItem = ({blogContent, content}) => {

  useEffect(() => {

    console.log("at BlogItem, we have")
    console.log(blogContent)

  }, [])

  return (
   <div className='blogItem-wrap' key={blogContent.title}>
      <Link className='blogItem-link' to={`/blog/${blogContent.slug}`} onClick={()=>{content(blogContent)}}>
        <img className='blogItem-cover' src={blogContent.headerImage.url} alt='cover' />
      </Link>
      <Chip label={blogContent.relevantTags[0]} />
      <Link className='blogItem-link' to={`/blog/${blogContent.slug}`} onClick={()=>{content(blogContent)}}>
        <h3>{blogContent.title}</h3>
      </Link>
      <p className='blogItem-desc'>{blogContent.subtitle}</p>
      <footer>
        <div className='blogItem-author'>
          <img src={blogContent.createdBy.picture} alt='avatar' />
          <div>
            <h6>{blogContent.createdBy.name}</h6>
            <p>{blogContent.timestamp}</p>
          </div>
        </div>
        <Link className='blogItem-link' to={`/blog/${blogContent.slug}`} onClick={()=>{content(blogContent)}}>
          ➝
        </Link>
      </footer>
    </div>
  );
};
export default BlogItem;