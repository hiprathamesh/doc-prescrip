// components/DarkModeToggle.js
import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toggleDarkMode } from '../utils/theme';
import { flushSync } from 'react-dom';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Check current theme
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleToggle = async () => {
    // If the button is disabled, do nothing
    if (!ref.current) return;
  
    // Check if View Transitions API is supported
    if (document.startViewTransition) {
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
        duration: 1000,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      });

      // Remove the class after animation completes
      animation.addEventListener('finish', () => {
        document.body.classList.remove('dark-mode-transitioning');
      });
    } else {
      // Fallback for browsers that don't support View Transitions
      toggleDarkMode();
      setIsDark(!isDark);
    }
  };

  return (
    <button
      onClick={handleToggle}
      ref={ref}
      className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200 border border-gray-200 dark:border-slate-600"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}
