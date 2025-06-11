'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PillSelector({ 
  title, 
  items, 
  onSelect, 
  searchPlaceholder = "Search...",
  addButtonText = "Add Custom",
  onAddCustom 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      return () => container.removeEventListener('scroll', checkScrollability);
    }
  }, [items]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleAddCustom = () => {
    if (searchTerm.trim() && onAddCustom) {
      onAddCustom(searchTerm.trim());
      setSearchTerm('');
      setShowSearch(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h4>
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden sm:block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden sm:block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="space-y-3 animate-in slide-in-from-top duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
          
          {searchTerm && (
            <div className="bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto shadow-lg">
              {filteredItems.length > 0 ? (
                <div className="p-2">
                  {filteredItems.slice(0, 10).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-500 text-sm mb-3">No matches found</p>
                  {onAddCustom && (
                    <button
                      onClick={handleAddCustom}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all duration-200 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add "{searchTerm}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Horizontal scrolling pills */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSelect(item)}
              className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 rounded-full text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-blue-300 transform hover:scale-105 whitespace-nowrap"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}