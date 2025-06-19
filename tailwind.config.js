import colors from 'tailwindcss/colors';

export const darkMode = 'class';
export const content = [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
];
export const theme = {
    extend: {
        colors: {
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            primary: 'var(--primary)',
            // Dark theme specific colors
            'dark-bg': {
                primary: '#0f172a', // slate-900
                secondary: '#1e293b', // slate-800
                tertiary: '#334155', // slate-700
            },
            'dark-surface': {
                primary: '#1e293b', // slate-800
                secondary: '#334155', // slate-700
                tertiary: '#475569', // slate-600
            },
            'dark-border': {
                primary: '#334155', // slate-700
                secondary: '#475569', // slate-600
            }
        },
    },
};
export const plugins = [];
