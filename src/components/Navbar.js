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
          <button className="dropbtn">Projects
            <i className="fa fa-caret-down"></i>
          </button>
          <div className="dropdown-content">
            <a href="dtww">Down the Worldwell</a>
            <a href="#">Manic Mechanics</a>
            <a href="#">Brittle</a>
            <a href="#">Doloman Epoch</a>
            <a href="#">Other Stuff</a>
          </div>
        </div>
        <a href="blog">Thoughts</a>
        <a href="#news">Devlogs</a>
        <a href="#news">Roadmaps</a>
        <a href="#news">Physical Junk</a>
        <div className="dropdown">
          <button className="dropbtn">Socials
            <i className="fa fa-caret-down"></i>
          </button>
          <div className="dropdown-content">
            <a href="#">itch</a>
            <a href="#">Github</a>
            <a href="#">Twitter</a>
          </div>
        </div>
      </div>
    </section>
  );
}
