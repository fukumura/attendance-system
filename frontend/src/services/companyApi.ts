import api from './api';
import { Company } from '../store/authStore';
import { ApiResponse } from '../store/taskStore';

// 企業レスポンスの型定義
export interface CompaniesResponse {
  status: string;
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 企業API
export const companyApi = {
  // 企業一覧取得（スーパー管理者のみ）
  getCompanies: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<CompaniesResponse>> => {
    const response = await api.get('/api/companies', { params });
    return response.data;
  },
  
  // 企業詳細取得
  getCompany: async (id: string): Promise<ApiResponse<Company>> => {
    const response = await api.get(`/api/companies/${id}`);
    return response.data;
  },
  
  // 企業作成（スーパー管理者のみ）
  createCompany: async (data: { name: string; logoUrl?: string; settings?: Record<string, any> }): Promise<ApiResponse<Company>> => {
    const response = await api.post('/api/companies', data);
    return response.data;
  },
  
  // 企業更新（スーパー管理者のみ）
  updateCompany: async (id: string, data: { name?: string; logoUrl?: string; settings?: Record<string, any> }): Promise<ApiResponse<Company>> => {
    const response = await api.put(`/api/companies/${id}`, data);
    return response.data;
  },
  
  // 企業削除（スーパー管理者のみ）
  deleteCompany: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.delete(`/api/companies/${id}`);
    return response.data;
  },
  
  // 企業設定取得
  getCompanySettings: async (id: string): Promise<ApiResponse<Record<string, any>>> => {
    const response = await api.get(`/api/companies/${id}/settings`);
    return response.data;
  },
  
  // 企業設定更新
  updateCompanySettings: async (id: string, settings: Record<string, any>): Promise<ApiResponse<Record<string, any>>> => {
    const response = await api.put(`/api/companies/${id}/settings`, settings);
    return response.data;
  },
};

export default companyApi;
