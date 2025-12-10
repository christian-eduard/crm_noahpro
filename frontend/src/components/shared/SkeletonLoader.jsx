import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                );

            case 'table-row':
                return (
                    <tr className="animate-pulse">
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        </td>
                    </tr>
                );

            case 'stat':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                );

            case 'list-item':
                return (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                );
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="mb-4">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default SkeletonLoader;
