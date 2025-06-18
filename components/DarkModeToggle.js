// components/DarkModeToggle.js
import { toggleDarkMode } from '../utils/theme';

export default function DarkModeToggle() {
  return (
    <button onClick={toggleDarkMode} className="p-2 rounded bg-gray-200 dark:bg-gray-800">
      Toggle Dark Mode
    </button>
  );
}
