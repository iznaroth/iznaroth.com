import React from 'react'
import axios from "axios";


const read_token = process.env.REACT_APP_BUTTER_CMS_API_KEY;

export const blogList = async ()=>{
const url = `
  https://api.buttercms.com/v2/posts?auth_token=${read_token}`;
  return axios.get(url).then((res) => {
    return res.data.data;
  });
}