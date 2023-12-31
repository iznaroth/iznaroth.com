// src/components/Navbar.js

import { ArrowRightIcon } from "@heroicons/react/solid";
import React from "react";

import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const options = [
  'one', 'two', 'three'
];
const defaultOption = options[0];


export default function Navbar() {
  return (
    <section id="navbar" className="">
      <div className="navbar hpnavbar">
        <div className="dropdown">
          <button className="picbar">
           <img className = "picbar-img" src = "./navbar(proj).png"/>
            <i className="fa fa-caret-down"></i>
            
          </button>
          <div className="dropdown-content">
            <a href="dtww">Down the Worldwell</a>
          </div>
        </div>
        <a className="rootpic" href="blog">
        <img className = "picbar-img" src = "./navbar(blog).png"/>
        </a>
        <a className="rootpic"  href="devlogs">
        <img className = "picbar-img" src = "./navbar(devlog).png"/>
        </a>
        <div className="dropdown">
          <button className="picbar">
          <img className = "picbar-img" src = "./navbar(socials).png"/>
            <i className="fa fa-caret-down"></i>
          </button>
          <div className="dropdown-content">
            <a href="https://iznaroth.itch.io/" target="_blank">itch</a>
            <a href="https://github.com/iznaroth/" target="_blank">Github</a>
            <a href="https://backloggd.com/u/iznaroth/">Backloggd</a>
            <a href="https://www.patreon.com/iznaroth/">Patreon</a>
          </div>
        </div>
      </div>
    </section>
  );
}
