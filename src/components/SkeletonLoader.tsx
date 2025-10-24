import React from "react";

interface SkeletonLoaderProps {
  type?: "card" | "grid" | "list";
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = "card",
  count = 1,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-3 w-3/4"></div>
            <div className="h-32 bg-gray-700 rounded mb-3"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-700 rounded w-1/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        );

      case "grid":
        return (
          <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-40 bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        );

      case "list":
        return (
          <div className="bg-gray-800 rounded-lg p-4 animate-pulse mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-3"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default SkeletonLoader;
