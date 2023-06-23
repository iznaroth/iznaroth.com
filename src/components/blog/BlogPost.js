import {React, useEffect} from 'react';
import Chip from '../blog/Chip';
import EmptyList from '../blog/EmptyList';
import '../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';

const Blog = ({content}) => {

  useEffect(() => {

    console.log("at BlogItem, we have")
    console.log(content)

  }, [])

  const { slug } = useParams();
  const post = content.find((post) => post.slug === slug);

  return (
    <>
      <Link className='blog-goBack' to='/'>
        <span> &#8592;</span> <span>Go Back</span>
      </Link>
      {content ? (
        <div className='blog-wrap'>
          <header>
            <p className='blog-date'>Published {post.timestamp}</p>
            <h1>{post.title}</h1>
            <div className='blog-subCategory'>
              
                <div>
                  <Chip label={post.relevantTags[0]} />
                </div>
              
            </div>
          </header>
          <img src={post.headerImage.url} alt='cover' />
          <div className='blog-content' dangerouslySetInnerHTML={{__html: post.content.html}}></div>
        </div>
      ) : (
        <EmptyList />
      )}
    </>
  );
};
export default Blog;