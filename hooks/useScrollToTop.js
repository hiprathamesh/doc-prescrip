import { useEffect } from 'react';

/**
 * Custom hook that scrolls to top when component mounts or dependencies change
 * @param {Array} deps - Dependencies that trigger scroll to top
 * @param {boolean} smooth - Whether to use smooth scrolling (default: false for instant)
 */
const useScrollToTop = (deps = [], smooth = true) => {
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'instant'
      });
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToTop, 10);

    return () => clearTimeout(timeoutId);
  }, deps);
};

export default useScrollToTop;
