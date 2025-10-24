import React, { Suspense } from "react";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
}) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

export default LazyWrapper;
