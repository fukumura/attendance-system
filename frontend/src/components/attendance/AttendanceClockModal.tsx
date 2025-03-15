import React, { useState } from 'react';
import { useAttendanceStore } from '../../store/attendanceStore';

interface AttendanceClockModalProps {
  isOpen: boolean;
  type: 'in' | 'out';
  onClose: () => void;
  onSuccess: () => void;
}

const AttendanceClockModal: React.FC<AttendanceClockModalProps> = ({
  isOpen,
  type,
  onClose,
  onSuccess,
}) => {
  const { clockIn, clockOut, isLoading, error } = useAttendanceStore();
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      location: location || undefined,
      notes: notes || undefined,
    };
    
    let success = false;
    
    if (type === 'in') {
      success = await clockIn(data);
    } else {
      success = await clockOut(data);
    }
    
    if (success) {
      setLocation('');
      setNotes('');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-0">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* モーダルヘッダー */}
        <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
          <h2 
            id="modal-title" 
            className="text-lg sm:text-xl font-semibold text-gray-900"
          >
            {type === 'in' ? '出勤打刻' : '退勤打刻'}
          </h2>
        </div>
        
        {/* モーダル本文 */}
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                勤務場所（オプション）
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="location-description"
              >
                <option value="">選択してください</option>
                <option value="オフィス">オフィス</option>
                <option value="リモート">リモート</option>
                <option value="出張">出張</option>
                <option value="その他">その他</option>
              </select>
              <p id="location-description" className="mt-1 text-xs text-gray-500">
                勤務場所を選択してください。入力は任意です。
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                備考（オプション）
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="備考があれば入力してください"
                aria-describedby="notes-description"
              ></textarea>
              <p id="notes-description" className="mt-1 text-xs text-gray-500">
                特記事項があれば入力してください。入力は任意です。
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            {/* モーダルフッター */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm sm:text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  type === 'in'
                    ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
                    : 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    処理中...
                  </span>
                ) : type === 'in' ? (
                  '出勤打刻'
                ) : (
                  '退勤打刻'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceClockModal;
