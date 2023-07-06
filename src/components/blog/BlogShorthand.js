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
   <div className='blogShorthand-wrap' key={blogContent.title}>
      <Chip label={blogContent.relevantTags[0]} />
      <Link className='blogShorthand-link' to={`/blog/${blogContent.slug}`} onClick={()=>{content(blogContent)}}>
          {blogContent.title}
        </Link>
      <footer>
        <div className='blogShorthand-author'>
          <div>
            <p>{blogContent.timestamp}</p>
          </div>
        </div>
        
      </footer>
    </div>
  );
};
export default BlogItem;