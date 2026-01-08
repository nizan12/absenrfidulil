import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Accent color options
const accentColors = {
    blue: { name: 'Blue', primary: '#3b82f6', light: '#dbeafe' },
    indigo: { name: 'Indigo', primary: '#6366f1', light: '#e0e7ff' },
    violet: { name: 'Violet', primary: '#8b5cf6', light: '#ede9fe' },
    emerald: { name: 'Emerald', primary: '#10b981', light: '#d1fae5' },
    amber: { name: 'Amber', primary: '#f59e0b', light: '#fef3c7' },
    rose: { name: 'Rose', primary: '#f43f5e', light: '#ffe4e6' },
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Initialize from localStorage or default to light
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' ? 'dark' : 'light';
    });

    const [accentColor, setAccentColor] = useState(() => {
        const saved = localStorage.getItem('accentColor');
        return saved && accentColors[saved] ? saved : 'blue';
    });

    // Apply theme class on mount and when theme changes
    useEffect(() => {
        const root = document.documentElement;

        // Remove both classes first
        root.classList.remove('dark', 'light');

        // Add the current theme class
        if (theme === 'dark') {
            root.classList.add('dark');
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply accent color CSS variables
    useEffect(() => {
        const accent = accentColors[accentColor];
        if (accent) {
            document.documentElement.style.setProperty('--accent-color', accent.primary);
            document.documentElement.style.setProperty('--accent-color-light', accent.light);
            document.documentElement.style.setProperty('--accent-blue', accent.primary);
            document.documentElement.style.setProperty('--accent-blue-light', accent.light);
        }
        localStorage.setItem('accentColor', accentColor);
    }, [accentColor]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        accentColor,
        setAccentColor,
        accentColors,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
