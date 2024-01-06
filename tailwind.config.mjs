/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        black: 'var(--black)',
        gray: 'var(--gray)',
        'gray-light': 'var(--gray-light)',
        'gray-light-50': 'rgb(var(--gray-light) 50%)',
      },
    },
  },
  plugins: [],
};
