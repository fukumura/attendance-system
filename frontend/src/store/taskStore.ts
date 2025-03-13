// frontend/src/store/taskStore.ts
import { create } from 'zustand';
import { taskApi } from '../services/api';

// タスクの型定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// APIレスポンスの型定義
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// タスク一覧レスポンスの型定義
export interface TasksResponse {
  tasks: Task[];
  total: number;
}

// タグの型定義
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// タスクフィルターの型定義
export interface TaskFilters {
  status?: 'all' | 'completed' | 'incomplete';
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  tagIds?: string[];
}

// タスクストアの型定義
interface TaskState {
  tasks: Task[];
  total: number;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  
  // アクション
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskCompletion: (id: string) => Promise<Task | null>;
  
  // フィルター操作
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  total: 0,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  
  // タスク一覧の取得
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskApi.getTasks(get().filters);
      if (response.status === 'success') {
        set({ 
          tasks: response.data.tasks,
          total: response.data.total,
          isLoading: false 
        });
      } else {
        set({
          error: response.message || 'タスクの取得に失敗しました',
          isLoading: false
        });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'タスクの取得中にエラーが発生しました',
        isLoading: false 
      });
    }
  },
  
  // 新規タスクの作成
  createTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskApi.createTask(task);
      if (response.status === 'success') {
        // 新しいタスクを追加して一覧を更新
        set(state => ({
          tasks: [response.data, ...state.tasks],
          total: state.total + 1,
          isLoading: false
        }));
        return response.data;
      } else {
        set({
          error: response.message || 'タスクの作成に失敗しました',
          isLoading: false
        });
      }
      return null;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'タスクの作成中にエラーが発生しました',
        isLoading: false 
      });
      return null;
    }
  },
  
  // タスクの更新
  updateTask: async (id, task) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskApi.updateTask(id, task);
      if (response.status === 'success') {
        // タスク一覧を更新（ローカルで更新して不要なAPI呼び出しを減らす）
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? response.data : t),
          isLoading: false
        }));
        return response.data;
      } else {
        set({
          error: response.message || 'タスクの更新に失敗しました',
          isLoading: false
        });
      }
      return null;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'タスクの更新中にエラーが発生しました',
        isLoading: false 
      });
      return null;
    }
  },
  
  // タスクの削除
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskApi.deleteTask(id);
      if (response.status === 'success') {
        // タスク一覧を更新（ローカルで更新して不要なAPI呼び出しを減らす）
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
          total: state.total - 1,
          isLoading: false
        }));
        return true;
      } else {
        set({
          error: response.message || 'タスクの削除に失敗しました',
          isLoading: false
        });
      }
      return false;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'タスクの削除中にエラーが発生しました',
        isLoading: false 
      });
      return false;
    }
  },
  
  // タスクの完了状態切り替え
  toggleTaskCompletion: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // 楽観的UI更新（即座にUIを更新）
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { ...task, completed: !task.completed } 
            : task
        )
      }));
      
      const response = await taskApi.toggleTaskCompletion(id);
      if (response.status === 'success') {
        // サーバーからの応答で正確なデータに更新
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? response.data : t),
          isLoading: false
        }));
        return response.data;
      } else {
        // エラーの場合は元に戻す
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === id 
              ? { ...task, completed: !task.completed } 
              : task
          ),
          error: response.message || 'タスクの状態変更に失敗しました',
          isLoading: false
        }));
      }
      return null;
    } catch (error: any) {
      // エラーの場合は元に戻す
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { ...task, completed: !task.completed } 
            : task
        ),
        error: error.response?.data?.message || 'タスクの状態変更中にエラーが発生しました',
        isLoading: false
      }));
      return null;
    }
  },
  
  // フィルターの設定
  setFilters: (filters) => {
    set({ 
      filters: { ...get().filters, ...filters } 
    });
    get().fetchTasks();
  },
  
  // フィルターのリセット
  resetFilters: () => {
    set({ 
      filters: {
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } 
    });
    get().fetchTasks();
  },
}));
