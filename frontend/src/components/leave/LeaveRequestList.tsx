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
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1 hidden sm:block"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1 hidden sm:block"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">休暇申請一覧</h2>
      
      {/* フィルター */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-xs sm:text-sm text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-xs sm:text-sm text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="status" className="text-xs sm:text-sm text-gray-600 mb-1">ステータス</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'ALL')}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            適用
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">休暇申請の取得中にエラーが発生しました</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
        </div>
      )}
      
      {/* 休暇申請テーブル (デスクトップ表示) */}
      {requests.length > 0 ? (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">期間</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日数</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatDate(request.startDate)} 〜 {formatDate(request.endDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {calculateDays(request.startDate, request.endDate)}日
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {getLeaveTypeLabel(request.leaveType)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {getStatusLabel(request.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <button
                        onClick={() => onViewDetails && onViewDetails(request)}
                        className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 休暇申請カード (モバイル表示) */}
          <div className="md:hidden space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="font-medium text-sm text-gray-900">
                    {formatDate(request.startDate)} 〜 {formatDate(request.endDate)}
                  </div>
                  <div>
                    {getStatusLabel(request.status)}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">種別:</span>
                    <span className="text-sm text-gray-900">{getLeaveTypeLabel(request.leaveType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">日数:</span>
                    <span className="text-sm text-gray-900">{calculateDays(request.startDate, request.endDate)}日</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs text-gray-500 block mb-1">理由:</span>
                    <p className="text-sm text-gray-900 break-words">{request.reason}</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onViewDetails && onViewDetails(request)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm sm:text-base">該当する休暇申請がありません</p>
          <p className="text-xs text-gray-400 mt-1">フィルター条件を変更してみてください</p>
        </div>
      )}
      
      {/* ページネーション */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
        <div className="text-xs sm:text-sm text-gray-500">
          {requests.length > 0 ? `${requests.length}件の結果を表示中` : ''}
        </div>
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded text-sm ${
              currentPage === 1 || isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }`}
            aria-label="前のページへ"
          >
            前へ
          </button>
          <span className="flex items-center text-sm text-gray-600 px-2">ページ {currentPage}</span>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={requests.length < 10 || isLoading}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded text-sm ${
              requests.length < 10 || isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }`}
            aria-label="次のページへ"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestList;
