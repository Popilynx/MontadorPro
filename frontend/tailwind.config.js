/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0D0D12', // Obsidian
                    light: '#2A2A35',  // Slate
                    dark: '#050508',
                },
                accent: {
                    DEFAULT: '#C9A84C', // Champagne
                    hover: '#b59238',
                },
                background: '#FAF8F5', // Ivory
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                drama: ['Playfair Display', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
