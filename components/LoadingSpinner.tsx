// components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-12 h-12 border-4 border-gray-800 rounded-full border-t-transparent animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;