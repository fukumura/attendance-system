// frontend/src/components/tasks/TaskFilters.tsx
import React from 'react';
import { TaskFilters as TaskFiltersType } from '../../store/taskStore';

// タスクフィルターのプロパティ型定義
interface TaskFiltersProps {
  status: NonNullable<TaskFiltersType['status']>;
  search: string;
  sortBy: NonNullable<TaskFiltersType['sortBy']>;
  sortOrder: NonNullable<TaskFiltersType['sortOrder']>;
  onStatusChange: (status: NonNullable<TaskFiltersType['status']>) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: NonNullable<TaskFiltersType['sortBy']>, sortOrder: NonNullable<TaskFiltersType['sortOrder']>) => void;
  onReset: () => void;
}

const TaskFilters = ({
  status,
  search,
  sortBy,
  sortOrder,
  onStatusChange,
  onSearchChange,
  onSortChange,
  onReset,
}: TaskFiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ステータスフィルター */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as 'all' | 'completed' | 'incomplete')}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">すべて</option>
            <option value="completed">完了済み</option>
            <option value="incomplete">未完了</option>
          </select>
        </div>
        
        {/* 並び替え */}
        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
            並び替え
          </label>
          <div className="flex space-x-2">
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'createdAt' | 'dueDate' | 'priority', sortOrder)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="createdAt">作成日</option>
              <option value="dueDate">期限</option>
              <option value="priority">優先度</option>
            </select>
            <button
              type="button"
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {sortOrder === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* 検索 */}
        <div>
          <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
            検索
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="search-filter"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="タイトルで検索..."
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* リセットボタン */}
      {(status !== 'all' || search || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            リセット
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
