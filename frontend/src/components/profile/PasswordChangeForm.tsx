import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PasswordStrengthMeter from '../common/PasswordStrengthMeter';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSuccess }) => {
  const { handlePasswordChange, isSubmitting, setError } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // フォームリセット
  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    
    // 入力検証
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上である必要があります');
      return;
    }
    
    // 強化されたパスワード検証
    if (!/[A-Z]/.test(newPassword)) {
      setError('パスワードには少なくとも1つの大文字を含める必要があります');
      return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
      setError('パスワードには少なくとも1つの小文字を含める必要があります');
      return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      setError('パスワードには少なくとも1つの数字を含める必要があります');
      return;
    }
    
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError('パスワードには少なくとも1つの特殊文字を含める必要があります');
      return;
    }
    
    // 一般的なパスワードのチェック
    const commonPasswords = ['password', 'password123', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(newPassword.toLowerCase())) {
      setError('このパスワードは一般的すぎるため使用できません');
      return;
    }
    
    // パスワード変更処理
    const success = await handlePasswordChange(currentPassword, newPassword);
    
    if (success) {
      setSuccessMessage('パスワードが正常に変更されました');
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">パスワード変更</h2>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            現在のパスワード
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
          <PasswordStrengthMeter password={newPassword} />
          <div className="mt-2 text-xs text-gray-500">
            <p>パスワードは以下の条件を満たす必要があります：</p>
            <ul className="list-disc pl-5 mt-1">
              <li>8文字以上</li>
              <li>大文字を1文字以上</li>
              <li>小文字を1文字以上</li>
              <li>数字を1文字以上</li>
              <li>特殊文字を1文字以上</li>
            </ul>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? '変更中...' : 'パスワードを変更'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
