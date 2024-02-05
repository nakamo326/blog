/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: '#2337ff',
        'accent-dark': '#000d8a',
        black: '#0f1219',
        gray: '#60739f',
        'gray-light': '#e5e9f0',
        'gray-dark': '#222939',
      },
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      square: 'square',
      roman: 'upper-roman',
      circle: 'circle',
      'alpha-lower': 'lower-alpha',
      'alpha-upper': 'upper-alpha',
      'greek-lower': 'lower-greek',
      'greek-upper': 'upper-greek',
      greek: 'greek',
      'roman-lower': 'lower-roman',
      'roman-upper': 'upper-roman',
    },
  },
  plugins: [],
};
