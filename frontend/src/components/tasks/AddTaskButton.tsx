// frontend/src/components/tasks/AddTaskButton.tsx
import React, { useState } from 'react';

const AddTaskButton = ({ onAddClick }: { onAddClick: () => void }) => {
  return (
    <button
      onClick={onAddClick}
      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      新しいタスク
    </button>
  );
};

export default AddTaskButton;