// frontend/src/components/tasks/TaskList.tsx
import React, { useEffect, useState } from 'react';
import TaskFormModal from './TaskFormModal';
import DeleteConfirmDialog from './deleteConfirmDialog';
import TaskFilters from './TaskFilters';
import { useTaskStore, Task, TaskFilters as TaskFiltersType } from '../../store/taskStore';

interface TaskListProps {
  onRefreshNeeded?: () => void;
}

const TaskList = ({ onRefreshNeeded }: TaskListProps) => {
  // Zustandストアから状態とアクションを取得
  const { 
    tasks, 
    isLoading, 
    error, 
    filters,
    fetchTasks, 
    toggleTaskCompletion, 
    deleteTask,
    setFilters,
    resetFilters
  } = useTaskStore();
  
  // 編集モーダル用の状態
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 削除確認ダイアログ用の状態
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingTaskTitle, setDeletingTaskTitle] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // コンポーネントマウント時にタスクを取得
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleCompletion = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    if (onRefreshNeeded) onRefreshNeeded();
  };
  
  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setShowEditModal(true);
  };
  
  const handleDeleteClick = (task: Task) => {
    setDeletingTaskId(task.id);
    setDeletingTaskTitle(task.title);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deletingTaskId) return;
    
    try {
      setIsDeleting(true);
      const success = await deleteTask(deletingTaskId);
      if (success) {
        setShowDeleteDialog(false);
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } finally {
      setIsDeleting(false);
      setDeletingTaskId(null);
      setDeletingTaskTitle('');
    }
  };
  
  const handleTaskSaved = () => {
    fetchTasks();
    if (onRefreshNeeded) onRefreshNeeded();
  };
  
  const handleStatusChange = (status: 'all' | 'completed' | 'incomplete') => {
    setFilters({ status });
  };
  
  const handleSearchChange = (search: string) => {
    setFilters({ search });
  };
  
  const handleSortChange = (sortBy: 'createdAt' | 'dueDate' | 'priority', sortOrder: 'asc' | 'desc') => {
    setFilters({ sortBy, sortOrder });
  };
  
  const handleReset = () => {
    resetFilters();
  };

  return (
    <>
      {/* フィルター */}
      <TaskFilters
        status={filters.status || 'all'}
        search={filters.search || ''}
        sortBy={filters.sortBy || 'createdAt'}
        sortOrder={filters.sortOrder || 'desc'}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
      />
      
      {/* ローディング状態 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        // エラー表示
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : tasks.length === 0 ? (
        // タスクが存在しない場合
        <div className="text-center py-10">
          <p className="text-gray-500">
            {filters.search ? 
              `"${filters.search}"に一致するタスクはありません` : 
              filters.status === 'completed' ? 
                '完了済みのタスクはありません' : 
                filters.status === 'incomplete' ? 
                  '未完了のタスクはありません' : 
                  'タスクがありません。新しいタスクを追加しましょう！'
            }
          </p>
        </div>
      ) : (
        // タスク一覧
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleCompletion(task.id)}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      {task.priority && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority === 'HIGH' ? '高' : task.priority === 'MEDIUM' ? '中' : '低'}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          期限: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => handleEditClick(task)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => handleDeleteClick(task)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 編集モーダル */}
      <TaskFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onTaskSaved={handleTaskSaved}
        taskId={editingTaskId || undefined}
      />
      
      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title={deletingTaskTitle}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default TaskList;
