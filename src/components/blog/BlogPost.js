import {React, useEffect} from 'react';
import Chip from '../blog/Chip';
import EmptyList from '../blog/EmptyList';
import '../../index.css';
import { Link } from 'react-router-dom';
import { Routes, Route, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const BlogPost = ({content, postOrDevlog}) => {

  function tagReplacer(text){
    //this method is a lazy circumvention of Hygraph's uncontrollable substitution of characters in an RTF.
    //you *should* refactor to use a custom renderer. but. lol.

    text = text.replaceAll("&lt;hr&gt;", "<hr>");

    //aligned image structuring
    text = text.replaceAll("<p>wrapimagefirst_left</p>", "<figure style=\"float: left; margin-left: 0px; margin-right: 25px; margin-top: 40px; margin-bottom: 20px; border-style: double; border-width: 4px; border-color: gray;  max-width: 35%;\">");
    text = text.replaceAll("<p>wrapimagefirst_right</p>", "<figure style=\"float: right; margin-left: 25px; margin-right: 0px; margin-top: 40px; margin-bottom: 20px; border-style: double; border-width: 4px; border-color: gray;  max-width: 35%;\">");
    text = text.replaceAll("<p>wrapimage_caption_pre", "<figcaption style=\"text-align: center; margin-top: 5px; margin-bottom: 5px;\"><i>");
    text = text.replaceAll("wrapimage_caption_post</p>", "</i></figcaption>");
    text = text.replaceAll("<p>wrapimagelast</p>", "</figure>");

    return text;
  }

  function generateShorthand(text){
    
    //sentence matcher
    const sentences = text.replaceAll("\\\\n", "").split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/).filter(sentence => sentence.trim() !== "").slice(0, 2);
    if(sentences[1].slice(-3) != '...'){
      sentences[1] = sentences[1].slice(0, -1) + '...'; //if i didn't already put an ellipsis there, cut it in
    }

    return sentences.join(' ');
  }

  useEffect(() => {
  }, [])

  const { slug } = useParams();
  const post = content.find((post) => post.slug === slug);

  const composedUrl = 'https://iznaroth.com/blog/' + slug;
  const composedTitle = post.title + ' - iznaroth';

  return (
    <>
      
      {content ? (
      
      <section id="blogpost">
        <Helmet>
          <title>{composedTitle}</title>
          <meta property="og:title" content={composedTitle}/>
          <meta property="og:type" content="website" />
          <meta property="og:url" content={composedUrl}  />
          <meta property="og:image" content={post.headerImage.url} />
          <meta property="og:description" content={generateShorthand(post.content.text)} />
          <meta name="theme-color" content="#FF0000"/>
          <meta name="twitter:card" content="summary_large_image"></meta>
        </Helmet>
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
              <p className='blog-date'>Published {new Date(post.timestamp).toLocaleString()}</p>
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
