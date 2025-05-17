import {React, useEffect} from 'react';
import Chip from '../blog/Chip';
import EmptyList from '../blog/EmptyList';
import '../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';

const BlogPost = ({content, postOrDevlog}) => {

  function tagReplacer(string){
    //this method is a lazy circumvention of Hygraph's uncontrollable substitution of characters in an RTF.
    //you *should* refactor to use a custom renderer. but. lol.

    string = string.replaceAll("&lt;hr&gt;", "<hr>");

    //aligned image structuring
    string = string.replaceAll("<p>wrapimagefirst_left</p>", "<figure style=\"float: left; margin-left: 0px; margin-right: 15px; max-width: 35%;\">");
    string = string.replaceAll("<p>wrapimage_caption_pre", "<figcaption style=\"text-align: center; margin-top: 5px;\"><i>");
    string = string.replaceAll("wrapimage_caption_post</p>", "</i></figcaption>");
    string = string.replaceAll("<p>wrapimagelast</p>", "</figure>");

    return string;
  }

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
          
          <img
              className="m-auto w-2/5"
              alt="evil thoughts"
              src="../../evil_thoughts.png"
            />

        </div>
        <div className='blog-bg'>
          <div className='blog-wrap'>
            <Link className='blog-goBack' to='/blog'>
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
            <div className='blog-content' dangerouslySetInnerHTML={{__html: tagReplacer(post.content.html)}}></div>
          </div>
          <div className='blog-footer' />
        </div>
        <div className='blog-footer' />
        <div className='blog-footer copynotice' >©2022 - 2025 iznaroth | All Rights Reserved</div>
        <div className='blog-footer' />
      </section>
      ) : (
        <EmptyList />
      )}
    </>
  );
};
export default BlogPost;