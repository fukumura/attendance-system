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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {type === 'in' ? '出勤打刻' : '退勤打刻'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              勤務場所（オプション）
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="オフィス">オフィス</option>
              <option value="リモート">リモート</option>
              <option value="出張">出張</option>
              <option value="その他">その他</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              備考（オプション）
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="備考があれば入力してください"
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                type === 'in'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
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
  );
};

export default AttendanceClockModal;
