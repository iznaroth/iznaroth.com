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
      <div className="navbar">
        <a href="blog">Blog</a>
        <a href="#news">Devlogs</a>
        <a href="#news">Reviews</a>
        <a href="#news">Programming</a>
        <div className="dropdown">
          <button className="dropbtn">Projects
            <i className="fa fa-caret-down"></i>
          </button>
          <div className="dropdown-content">
            <a href="#">Down the Worldwell</a>
            <a href="#">Brittle</a>
            <a href="#">Doloman Epoch</a>
            <a href="#">Manic Mechanics</a>
            <a href="#">Modem Highway</a>
            <a href="#">Debtshredder</a>
            <a href="#">The Settler</a>
            <a href="#">KOMMHAGOTIQ</a>
            <a href="#">Intyriur</a>
            <a href="#">Other Stuff</a>
          </div>
        </div>
      </div>
    </section>
  );
}
