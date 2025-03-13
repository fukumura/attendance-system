import React, { useState } from 'react';
import { useLeaveStore, LeaveRequest, LeaveStatus } from '../../store/leaveStore';
import { useAuthStore } from '../../store/authStore';

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
  onClose: () => void;
  onUpdate?: () => void;
}

const LeaveRequestDetails: React.FC<LeaveRequestDetailsProps> = ({
  request,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuthStore();
  const { updateStatus, updateRequest, isLoading, error } = useLeaveStore();
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>(
    request.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'
  );
  const [comment, setComment] = useState(request.comment || '');
  const [reason, setReason] = useState(request.reason);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const isOwnRequest = user?.id === request.userId;
  const isPending = request.status === 'PENDING';

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

  // ステータス更新処理
  const handleStatusUpdate = async () => {
    setFormError('');
    
    const success = await updateStatus(request.id, {
      status,
      comment,
    });
    
    if (success && onUpdate) {
      onUpdate();
      onClose();
    }
  };

  // 申請更新処理
  const handleRequestUpdate = async () => {
    setFormError('');
    
    if (!reason) {
      setFormError('理由は必須です');
      return;
    }
    
    const success = await updateRequest(request.id, {
      reason,
    });
    
    if (success) {
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">休暇申請詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">申請者</p>
            <p className="font-medium">{request.user?.name || '不明'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">申請日</p>
            <p className="font-medium">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">期間</p>
            <p className="font-medium">
              {formatDate(request.startDate)} 〜 {formatDate(request.endDate)}
              （{calculateDays(request.startDate, request.endDate)}日間）
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">休暇種別</p>
            <p className="font-medium">{getLeaveTypeLabel(request.leaveType)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ステータス</p>
            <p className="font-medium">{getStatusLabel(request.status)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">最終更新日</p>
            <p className="font-medium">{formatDate(request.updatedAt)}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">理由</p>
          {isEditing ? (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="休暇の理由を入力してください"
              required
            ></textarea>
          ) : (
            <p className="bg-gray-50 p-3 rounded">{request.reason}</p>
          )}
        </div>
        
        {request.comment && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">コメント</p>
            <p className="bg-gray-50 p-3 rounded">{request.comment}</p>
          </div>
        )}
        
        {(formError || error) && (
          <div className="mb-4 text-red-500 text-sm">
            {formError || error}
          </div>
        )}
        
        {/* 管理者用ステータス更新フォーム */}
        {isAdmin && isPending && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">申請ステータス更新</h3>
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="APPROVED">承認</option>
                <option value="REJECTED">却下</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                コメント
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="承認または却下の理由を入力してください"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleStatusUpdate}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isLoading ? '処理中...' : 'ステータスを更新'}
              </button>
            </div>
          </div>
        )}
        
        {/* 自分の申請の場合の編集ボタン */}
        {isOwnRequest && isPending && !isEditing && (
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
            >
              編集
            </button>
          </div>
        )}
        
        {/* 編集モード時の保存・キャンセルボタン */}
        {isEditing && (
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setReason(request.reason);
                setIsEditing(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              onClick={handleRequestUpdate}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        )}
        
        {/* 閉じるボタン */}
        {!isEditing && !(isAdmin && isPending) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestDetails;
