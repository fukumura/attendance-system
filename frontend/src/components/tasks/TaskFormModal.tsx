// frontend/src/components/tasks/TaskFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useTaskStore, Task } from '../../store/taskStore';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved?: () => void;
  taskId?: string; // 編集モード用のタスクID
}

const TaskFormModal = ({ isOpen, onClose, onTaskSaved, taskId }: TaskFormModalProps) => {
  // Zustandストアから状態とアクションを取得
  const { tasks, error: storeError, createTask, updateTask } = useTaskStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!taskId;

  // 編集モードの場合、既存のタスク情報を取得
  useEffect(() => {
    if (isEditMode && isOpen && taskId) {
      const fetchTaskData = async () => {
        try {
          setIsLoading(true);
          // まずストアから該当するタスクを検索
          const task = tasks.find(t => t.id === taskId);
          
          if (task) {
            // ストアにタスクが存在する場合はそれを使用
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setDueDate(task.dueDate 
              ? new Date(task.dueDate).toISOString().split('T')[0] 
              : '');
          } else {
            // ストアにタスクが存在しない場合はAPIから取得
            try {
              const { taskApi } = await import('../../services/api');
              const response = await taskApi.getTask(taskId);
              
              if (response.status === 'success') {
                const apiTask = response.data;
                setTitle(apiTask.title);
                setDescription(apiTask.description || '');
                setPriority(apiTask.priority);
                setDueDate(apiTask.dueDate 
                  ? new Date(apiTask.dueDate).toISOString().split('T')[0] 
                  : '');
              } else {
                setError('タスクの取得に失敗しました');
              }
            } catch (err) {
              setError('タスクの取得中にエラーが発生しました');
            }
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTaskData();
    }
  }, [isEditMode, taskId, isOpen, tasks]);

  // ストアのエラー状態を監視
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // モーダルを閉じるときにフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const taskData = {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };
      
      let result;
      if (isEditMode && taskId) {
        result = await updateTask(taskId, taskData);
      } else {
        result = await createTask(taskData);
      }
      
      if (result) {
        onClose();
        if (onTaskSaved) onTaskSaved();
      }
    } catch (err: any) {
      setError(`タスクの${isEditMode ? '更新' : '作成'}中にエラーが発生しました`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {isEditMode ? 'タスクを編集' : '新しいタスクを作成'}
                </h3>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        タイトル <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        説明
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        優先度
                      </label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="LOW">低</option>
                        <option value="MEDIUM">中</option>
                        <option value="HIGH">高</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        期限
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                      >
                        {isSubmitting ? (isEditMode ? '更新中...' : '作成中...') : (isEditMode ? '更新' : '作成')}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
