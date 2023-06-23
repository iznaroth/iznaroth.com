import {React} from 'react';
import Chip from '../blog/Chip';
import EmptyList from '../blog/EmptyList';
import '../../index.css';
import { Link } from 'react-router-dom';

const Blog = ({content}) => {
  return (
    <>
      <Link className='blog-goBack' to='/'>
        <span> &#8592;</span> <span>Go Back</span>
      </Link>
      {content ? (
        <div className='blog-wrap'>
          <header>
            <p className='blog-date'>Published {content.timestamp}</p>
            <h1>{content.title}</h1>
            <div className='blog-subCategory'>
              
                <div>
                  <Chip label={content.relevantTags[0].name} />
                </div>
              
            </div>
          </header>
          <img src={content.headerImage.url} alt='cover' />
          <div className='blog-content' dangerouslySetInnerHTML={{__html: content.content.html}}></div>
        </div>
      ) : (
        <EmptyList />
      )}
    </>
  );
};
export default Blog;