import React, { useEffect, useState } from 'react';
import { useLeaveStore, LeaveRequest, LeaveStatus } from '../../store/leaveStore';
import { useAuthStore } from '../../store/authStore';

interface LeaveRequestListProps {
  onViewDetails?: (request: LeaveRequest) => void;
}

const LeaveRequestList: React.FC<LeaveRequestListProps> = ({ onViewDetails }) => {
  const { user } = useAuthStore();
  const { requests, isLoading, error, fetchRequests } = useLeaveStore();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // コンポーネントマウント時に休暇申請を取得
  useEffect(() => {
    // デフォルトでは今月の申請を表示
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formattedFirstDay = firstDayOfMonth.toISOString().split('T')[0];
    const formattedLastDay = lastDayOfMonth.toISOString().split('T')[0];
    
    setStartDate(formattedFirstDay);
    setEndDate(formattedLastDay);
    
    const params: any = {
      startDate: formattedFirstDay,
      endDate: formattedLastDay,
      page: currentPage,
      limit: 10,
    };
    
    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }
    
    fetchRequests(params);
  }, [fetchRequests, currentPage, statusFilter]);

  // フィルター適用
  const handleFilterApply = () => {
    if (startDate && endDate) {
      setCurrentPage(1);
      
      const params: any = {
        startDate,
        endDate,
        page: 1,
        limit: 10,
      };
      
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      
      fetchRequests(params);
    }
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 休暇種別表示
  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'PAID':
        return '有給休暇';
      case 'UNPAID':
        return '無給休暇';
      case 'SICK':
        return '病気休暇';
      case 'OTHER':
        return 'その他';
      default:
        return type;
    }
  };

  // ステータス表示
  const getStatusLabel = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">申請中</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">承認済</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">却下</span>;
      default:
        return status;
    }
  };

  // 休暇日数計算
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">休暇申請一覧</h2>
      
      {/* フィルター */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-sm text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-sm text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm text-gray-600 mb-1">ステータス</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'ALL')}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">すべて</option>
            <option value="PENDING">申請中</option>
            <option value="APPROVED">承認済</option>
            <option value="REJECTED">却下</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFilterApply}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            適用
          </button>
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">
          <p>休暇申請の取得中にエラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* 休暇申請テーブル */}
      {requests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">期間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.startDate)} 〜 {formatDate(request.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateDays(request.startDate, request.endDate)}日
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getLeaveTypeLabel(request.leaveType)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getStatusLabel(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => onViewDetails && onViewDetails(request)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          該当する休暇申請がありません
        </div>
      )}
      
      {/* ページネーション */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className={`px-4 py-2 rounded ${
            currentPage === 1 || isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          前へ
        </button>
        <span className="text-sm text-gray-600">ページ {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={requests.length < 10 || isLoading}
          className={`px-4 py-2 rounded ${
            requests.length < 10 || isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default LeaveRequestList;
