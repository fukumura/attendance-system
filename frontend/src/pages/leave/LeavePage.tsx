import React, { useState } from 'react';
import {
  LeaveRequestForm,
  LeaveRequestList,
  LeaveRequestDetails,
} from '../../components/leave';
import { LeaveRequest } from '../../store/leaveStore';

const LeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handleCreateSuccess = () => {
    // 申請作成後にリストタブに切り替え
    setActiveTab('list');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">休暇申請</h1>
      
      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('list')}
        >
          申請一覧
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'create'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('create')}
        >
          新規申請
        </button>
      </div>
      
      {/* タブコンテンツ */}
      <div className="mb-8">
        {activeTab === 'list' && (
          <LeaveRequestList onViewDetails={handleViewDetails} />
        )}
        
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <LeaveRequestForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setActiveTab('list')}
            />
          </div>
        )}
      </div>
      
      {/* 詳細モーダル */}
      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={handleCloseDetails}
          onUpdate={() => {
            // 詳細を閉じた後にリストを更新するため、一度選択状態をリセット
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default LeavePage;
