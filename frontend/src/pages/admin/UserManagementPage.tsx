import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { adminApi, AdminUser } from '../../services/api';
import RegisterForm from '../../components/auth/RegisterForm';

// ユーザー一覧の型定義
interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// 編集用ユーザーの型定義
interface EditUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState<EditUserData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, user: currentUser } = useAuthStore();

  // ユーザー一覧を取得する関数
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminApi.getUsers();
      if (response.status === 'success' && response.data) {
        // APIレスポンスのユーザーデータをUserListItem型に変換
        const userList: UserListItem[] = response.data.data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }));
        setUsers(userList);
      } else {
        setError('ユーザーデータの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にユーザー一覧を取得
  useEffect(() => {
    fetchUsers();
  }, []);

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // ユーザー編集を開始する関数
  const handleEditClick = (user: UserListItem) => {
    setSelectedUser(user);
    setEditData({
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'EMPLOYEE'
    });
    setShowEditForm(true);
  };

  // ユーザー削除を開始する関数
  const handleDeleteClick = (user: UserListItem) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  // ユーザー編集をキャンセルする関数
  const handleEditCancel = () => {
    setSelectedUser(null);
    setEditData({});
    setShowEditForm(false);
  };

  // ユーザー削除をキャンセルする関数
  const handleDeleteCancel = () => {
    setSelectedUser(null);
    setShowDeleteConfirm(false);
  };

  // ユーザー編集を保存する関数
  const handleEditSave = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await adminApi.updateUser(selectedUser.id, editData);
      setShowEditForm(false);
      setSelectedUser(null);
      setEditData({});
      // ユーザー一覧を再取得
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新中にエラーが発生しました');
      console.error('Error updating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ユーザー削除を実行する関数
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await adminApi.deleteUser(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      // ユーザー一覧を再取得
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除中にエラーが発生しました');
      console.error('Error deleting user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ユーザー登録が完了したときの処理
  const handleRegisterSuccess = () => {
    setShowRegisterForm(false);
    // ユーザー一覧を再取得
    fetchUsers();
  };

  // 入力フィールドの変更を処理する関数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showRegisterForm ? 'キャンセル' : '新規ユーザー登録'}
        </button>
      </div>

      {showRegisterForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">新規ユーザー登録</h2>
          <RegisterForm onSuccess={handleRegisterSuccess} isAdminForm={true} />
        </div>
      )}

      {showEditForm && selectedUser && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">ユーザー編集: {selectedUser.name}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">名前</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editData.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editData.email || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード（変更する場合のみ）</label>
              <input
                type="password"
                id="password"
                name="password"
                value={editData.password || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">ロール</label>
              <select
                id="role"
                name="role"
                value={editData.role || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="EMPLOYEE">一般</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedUser && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">ユーザー削除の確認</h2>
          <p className="mb-4">
            ユーザー「{selectedUser.name}」を削除してもよろしいですか？この操作は元に戻せません。
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDeleteCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">ユーザー一覧</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <p>読み込み中...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'ADMIN' ? '管理者' : '一般'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        disabled={currentUser?.id === user.id}
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900"
                        disabled={currentUser?.id === user.id}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
