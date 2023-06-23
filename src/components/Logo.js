// src/components/Logo.js

import React from "react";

export default function Logo() {
  return (
   <section id="logo" className="flex h-96">

     <img
            className="m-auto w-2/5"
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
