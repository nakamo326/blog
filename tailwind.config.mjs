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
  },
  plugins: [],
};
