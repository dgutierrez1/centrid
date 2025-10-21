/** @type {import('tailwindcss').Config} */
const baseConfig = require('@centrid/ui/tailwind.preset');

module.exports = {
  presets: [baseConfig],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
