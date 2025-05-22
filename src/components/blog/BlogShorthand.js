import {React,  useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Chip from './Chip';
import '../../index.css';
const BlogShorthand = ({blogContent, content, postOrDevlog}) => {

  useEffect(() => {

    console.log("at BlogItem, we have")
    console.log(blogContent)

  }, [])

  return (
   <div className='blogShorthand-wrap' key={blogContent.title}>
      <Chip label={blogContent.relevantTags != null ? blogContent.relevantTags[0] : "No Tags"} />
      <Link className='blogShorthand-link' to={postOrDevlog ? `/blog/${blogContent.slug}` : `/devlogs/${blogContent.slug}` } onClick={()=>{content(blogContent)}}>
          {blogContent.title}
      </Link>
      
        <div className='blogShorthand-author'>
            <p>{new Date(blogContent.timestamp).toLocaleString()}</p>
        </div>
        
      
    </div>
  );
};
export default BlogShorthand;
