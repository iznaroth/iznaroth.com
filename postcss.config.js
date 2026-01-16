module.exports = {
  content: [
   "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'hero-pattern': "url('./iz_bg_simple.png')",
        'greybox': "url('./iz_bg_simple.png')"
      },
      cursor: {
        'drawnhand': 'url(/tiny_cursor.png), auto',
        'drawnclicker': 'url(/tiny_clickable_hand.png), auto'
      }
    },
  },
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}, // Autoprefixer is optional but recommended
  },
};