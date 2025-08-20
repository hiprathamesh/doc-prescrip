// components/DarkModeToggle.js
import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toggleDarkMode } from '../utils/theme';
import { flushSync } from 'react-dom';
import { storage } from '../utils/storage';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    // Check current theme
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Load animation settings
    const loadSettings = async () => {
      try {
        const settings = await storage.getSettings();
        // Default to true if not set
        setShowAnimations(settings?.appearance?.showAnimations !== false);
      } catch (error) {
        console.error('Error loading animation settings:', error);
      }
    };
    
    loadSettings();

    // Listen for theme changes from other components (like settings modal)
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setIsDark(newTheme === 'dark');
    };

    // Listen for settings changes to update animation preferences
    const handleSettingsChange = async (event) => {
      try {
        const settings = event.detail.settings || await storage.getSettings();
        setShowAnimations(settings?.appearance?.showAnimations !== false);
      } catch (error) {
        console.error('Error loading updated animation settings:', error);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('settingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('settingsChanged', handleSettingsChange);
    };

  }, []);

  const handleToggle = async () => {
    // If the button is disabled, do nothing
    if (!ref.current) return;
    
    // Save the new theme in settings
    try {
      const settings = await storage.getSettings() || {};
      if (!settings.appearance) settings.appearance = {};
      settings.appearance.theme = !isDark ? 'dark' : 'light';
      await storage.saveSettings(settings);
    } catch (error) {
      console.error('Error saving theme setting:', error);
    }
  
    // Check if animations are enabled and View Transitions API is supported
    if (showAnimations && document.startViewTransition) {
      // Add class to prevent layout shifts during transition
      document.body.classList.add('dark-mode-transitioning');
      
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          toggleDarkMode();
          setIsDark(!isDark);
        });
      });

      await transition.ready;

      const {top, left, width, height} = ref.current.getBoundingClientRect();
      const right = window.innerWidth - left;
      const bottom = window.innerHeight - top;
      const maxRadius = Math.hypot(
        Math.max(left, right),
        Math.max(top, bottom)
      );

      const animation = document.documentElement.animate({
        clipPath: [
          `circle(0px at ${left + width / 2}px ${top + height / 2}px)`,
          `circle(${maxRadius}px at ${left + width / 2}px ${top + height / 2}px)`
        ]
      }, {
        duration: 1500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      });

      // Remove the class after animation completes
      animation.addEventListener('finish', () => {
        document.body.classList.remove('dark-mode-transitioning');
      });
    } else {
      // No animation version
      toggleDarkMode();
      setIsDark(!isDark);
    }
  };

  return (
    <button
      onClick={handleToggle}
      ref={ref}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}
