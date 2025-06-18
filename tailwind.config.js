import colors from 'tailwindcss/colors';

export const darkMode = 'class';
export const content = [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
];
export const theme = {
    extend: {
        colors: {
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            primary: 'var(--primary)',
        },
    },
};
export const plugins = [];
