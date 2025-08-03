'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Activity, Calendar, Search, Trash2, Download } from 'lucide-react';
import { formatDate, formatDateTime, formatTimeAgo } from '../utils/dateUtils';
import { ACTIVITY_ICONS, ACTIVITY_COLORS } from '../utils/activityLogger';
import { storage } from '../utils/storage';
import { toast } from 'sonner';
import useScrollToTop from '../hooks/useScrollToTop';
import CustomDropdown from './CustomDropdown';

// Loading skeleton for activities
const ActivitySkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

export default function RecentActivityPage({ onBack }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Header refs for floating header
  const headerRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const searchInputRef = useRef(null);

  // Add scroll to top when component mounts
  useScrollToTop([]);

  useEffect(() => {
    loadActivities();
  }, []);

  // Intersection Observer for header visibility
  useEffect(() => {
    const headerElement = headerRef.current;

    if (!headerElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-88px";

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(headerElement);

    return () => {
      if (headerElement) {
        observer.unobserve(headerElement);
      }
    };
  }, []);

  // Filter activities when search term or filter type changes
  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    setFilteredActivities(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [activities, searchTerm, filterType]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const { activityLogger } = await import('../utils/activityLogger');
      const allActivities = await activityLogger.getActivities();
      setActivities(allActivities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
      toast.error('Error', {
        description: 'Failed to load recent activities'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllActivities = async () => {
    toast('Confirm Delete All', {
      description: 'Are you sure you want to clear all activity history? This action cannot be undone.',
      action: {
        label: 'Delete All',
        onClick: async () => {
          try {
            const { activityLogger } = await import('../utils/activityLogger');
            const success = await activityLogger.clearActivities();

            if (success) {
              setActivities([]);
              toast.success('Activities Cleared', {
                description: 'All activity history has been cleared'
              });
            } else {
              throw new Error('Failed to clear activities');
            }
          } catch (error) {
            console.error('Error clearing activities:', error);
            toast.error('Error', {
              description: 'Failed to clear activities. Please try again.'
            });
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {} // Just close the toast
      }
    });
  };

  const exportActivities = () => {
    try {
      const dataStr = JSON.stringify(filteredActivities, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-history-${formatDate(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export Complete', {
        description: 'Activity history has been exported'
      });
    } catch (error) {
      console.error('Error exporting activities:', error);
      toast.error('Export Failed', {
        description: 'Failed to export activities'
      });
    }
  };

  const getActivityIcon = (activityType) => {
    const iconName = ACTIVITY_ICONS[activityType] || 'Activity';
    // Map icon names to actual icon components
    const iconMap = {
      FileText: () => <Activity className="w-4 h-4" />,
      UserPlus: () => <Activity className="w-4 h-4" />,
      Plus: () => <Activity className="w-4 h-4" />,
      Edit: () => <Activity className="w-4 h-4" />,
      Trash2: () => <Trash2 className="w-4 h-4" />,
      Award: () => <Activity className="w-4 h-4" />,
      Download: () => <Download className="w-4 h-4" />,
      CreditCard: () => <Activity className="w-4 h-4" />,
      UserMinus: () => <Trash2 className="w-4 h-4" />,
      Activity: () => <Activity className="w-4 h-4" />
    };

    const IconComponent = iconMap[iconName] || iconMap.Activity;
    return <IconComponent />;
  };

  const getActivityColor = (activityType) => {
    const colorName = ACTIVITY_COLORS[activityType] || 'gray';
    const colorMap = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      gray: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    };
    return colorMap[colorName] || colorMap.gray;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get unique activity types for filter dropdown
  const activityTypes = [...new Set(activities.map(activity => activity.type))];
  
  // Create filter options for CustomDropdown
  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    ...activityTypes.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  ];

  // Handle Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '88px' }}
      >
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Recent Activity</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportActivities}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Export Activities"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAllActivities}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  title="Clear All Activities"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="min-w-48">
                  <CustomDropdown
                    options={filterOptions}
                    value={filterType}
                    onChange={setFilterType}
                    placeholder="Filter by type"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Main Header */}
        <div ref={headerRef} className="activity-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activity</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportActivities}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Export Activities"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAllActivities}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  title="Clear All Activities"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="min-w-48">
                  <CustomDropdown
                    options={filterOptions}
                    value={filterType}
                    onChange={setFilterType}
                    placeholder="Filter by type"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-16 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
              >
                Ctrl K
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Activity History
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
                {searchTerm && ' found'}
              </div>
            </div>

            {isLoading ? (
              <ActivitySkeleton />
            ) : filteredActivities.length > 0 ? (
              <>
                <div className="space-y-0">
                  {paginatedActivities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-center space-x-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded-lg px-3 -mx-3">
                        <div className={`p-2.5 rounded-lg ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            <span>•</span>
                            <span>{formatDateTime(activity.timestamp)}</span>
                            {activity.patientName && (
                              <>
                                <span>•</span>
                                <span className="font-medium">{activity.patientName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                      {index < paginatedActivities.length - 1 && (
                        <div className="border-b border-gray-100 dark:border-gray-700"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      showingStart={startIndex + 1}
                      showingEnd={Math.min(endIndex, filteredActivities.length)}
                      totalItems={filteredActivities.length}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? `No activities found matching "${searchTerm}"` : 'No activities recorded yet'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Your activities will appear here as you use the app'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Reusable Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, showingStart, showingEnd, totalItems }) {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];

    if (totalPages > 0) {
      range.push(1);
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    if (start > 2) {
      range.push('...');
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    if (end < totalPages - 1) {
      range.push('...');
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {showingStart}-{showingEnd} of {totalItems} activities
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            }`}
        >
          Previous
        </button>

        <div className="flex space-x-1">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${page === currentPage
                ? 'bg-blue-600 text-white'
                : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
