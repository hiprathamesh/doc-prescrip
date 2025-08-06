'use client';

import { useEffect } from 'react';
import { initializeTheme } from '../utils/theme';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFound() {
    usePageTitle('Page Not Found');

    useEffect(() => {
        initializeTheme();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
            <div className="text-center">
                <div className="">
                    <div className="w-50 h-80 mx-auto mb-2 relative overflow-hidden">
                        <picture className="w-full h-full">
                            <source srcSet="/404.avif" type="image/avif" />
                            <source srcSet="/404.webp" type="image/webp" />
                            <img
                                src="/404.png"
                                alt="Page Not Found"
                                className="w-full h-full object-cover"
                                draggable="false"
                            />
                        </picture>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-300 mb-1">
                        404 Not Found
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        maybe the diagnosis was wrong, doc
                    </p>
                </div>

                <div className="absolute bottom-6 text-[11px] text-gray-500 dark:text-gray-400">
                    <div className="mb-2 flex items-center justify-center space-x-1">
                        <button
                            onClick={() => window.history.back()}
                            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            Go Back
                        </button>
                        <span className="text-gray-400">|</span>
                        <a
                            href="/"
                            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            Return to Dashboard
                        </a>
                    </div>
                    <div className=" text-gray-500 dark:text-gray-400">
                        <p>The page you're looking for doesn't exist.</p>
                        <p>Please check the URL or navigate back to continue.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}