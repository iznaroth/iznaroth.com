// src/components/Logo.js

import React from "react";

export default function Logo() {
  return (
   <section id="logo" className="flex h-96">

     <img
            className="m-auto md:w-2/5 sm:w-3/5 logo-img"
            alt="IZNAROTH"
            src="./iz_logo_over.png"
          />

      <img
            className="cartoon-sun"
            alt="A cartoon star."
            src="./ugly_star.png"
      />

   </section>
 );
}
