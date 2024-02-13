import {React, useEffect} from 'react';
import Chip from '../../blog/Chip';
import EmptyList from '../../blog/EmptyList';
import '../../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';

const DevlogPost = ({content}) => {

  useEffect(() => {

    console.log("at BlogItem, we have")
    console.log(content)

  }, [])

  const { slug } = useParams();
  const post = content.find((post) => post.slug === slug);

  return (
    <>
      
      {content ? (
        
      <section id="devlogpost">

        <div  className="flex h-96">
          <img
              className="m-auto w-2/5"
              alt="evil thoughts"
              src="../../devlogs.png"
            />
        </div>
        <div className='blog-bg'>
          <div className='blog-wrap'>
            <Link className='blog-goBack' to='/devlogs'>
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
            <img src={post.headerImage.url} alt='cover' className='p-4 object-cover w-full h-96'/>
            <h2 className='text-2xl text-center text-slate-600'><i>{post.subtitle}</i></h2>
            <div className='blog-content' dangerouslySetInnerHTML={{__html: post.content.html}}></div>
          </div>
        </div>
        <div className='blog-footer' />
        <div className='blog-footer copynotice' >©2022 - 2023  iznaroth | All Rights Reserved</div>
        <div className='blog-footer' />
      </section>
      ) : (
        <EmptyList />
      )}
    </>
  );
};
export default DevlogPost;