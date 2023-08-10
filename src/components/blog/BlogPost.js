import {React, useEffect} from 'react';
import Chip from '../blog/Chip';
import EmptyList from '../blog/EmptyList';
import '../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';

const BlogPost = ({content, postOrDevlog}) => {

  useEffect(() => {

    console.log("at BlogItem, we have")
    console.log(content)

  }, [])

  const { slug } = useParams();
  const post = content.find((post) => post.slug === slug);

  return (
    <>
      
      {content ? (
        
      <section id="blogpost">

        <div  className="flex h-96">
          
          {postOrDevlog ? (


          <img
              className="m-auto w-2/5"
              alt="evil thoughts"
              src="../../evil_thoughts.png"
            />
          ) : (

            <img
              className="m-auto w-2/5"
              alt="evil thoughts"
              src="../../devlogs.png"
            />

          )

          }
        </div>
        <div className='blog-bg'>
          <div className='blog-wrap'>
            <Link className='blog-goBack' to='/'>
              <span> &#8592;</span> <span>Go Back</span>
            </Link>
            <header>
              <p className='blog-date'>Published {post.timestamp}</p>
              <h1>{post.title}</h1>
              <div className='blog-subCategory'>
                
                  <div>
                    <Chip label={post.relevantTags[0]} />
                  </div>
                
              </div>
            </header>
            <img src={post.headerImage.url} alt='cover' className='p-4'/>
            <div className='blog-content' dangerouslySetInnerHTML={{__html: post.content.html}}></div>
          </div>
        </div>
        <div className='blog-footer' />
      </section>
      ) : (
        <EmptyList />
      )}
    </>
  );
};
export default BlogPost;