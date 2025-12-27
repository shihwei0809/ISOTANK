import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface UsersProps {
    currentUserRole: string;
}

const Users: React.FC<UsersProps> = ({ currentUserRole }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);

    // 載入使用者列表
    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.getAllUsers();
            if (res.status === 'success' && res.users) {
                setUsers(res.users);
            } else {
                alert(res.message || '讀取失敗');
            }
        } catch (error) {
            console.error(error);
            alert('連線錯誤');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // 處理角色變更
    const handleRoleChange = async (targetUser: string, newRole: string, currentSuper: boolean) => {
        setUpdating(targetUser);
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === targetUser ? { ...u, role: newRole as any } : u));

        const res = await api.updateUserPermission(targetUser, newRole, currentSuper);

        if (res.status !== 'success') {
            alert('更新失敗: ' + res.message);
            setUsers(originalUsers);
        }
        setUpdating(null);
    };

    // 處理超級使用者權限變更
    const handleSuperChange = async (targetUser: string, currentRole: string, isChecked: boolean) => {
        setUpdating(targetUser);
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === targetUser ? { ...u, isSuper: isChecked } : u));

        const res = await api.updateUserPermission(targetUser, currentRole, isChecked);

        if (res.status !== 'success') {
            alert('更新失敗: ' + res.message);
            setUsers(originalUsers);
        }
        setUpdating(null);
    };

    // 安全檢查
    if (currentUserRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <i className="fa-solid fa-ban text-6xl mb-4 text-red-300"></i>
                <h2 className="text-xl font-bold text-slate-600">您無權限存取此頁面</h2>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">

            {/* 標題區塊 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">人員權限管理</h3>
                        <p className="text-sm text-slate-400 mt-1">設定系統使用者的角色與進階權限</p>
                    </div>
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="text-slate-500 hover:text-blue-600 text-lg transition flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        <i className={`fa-solid fa-sync mr-2 ${loading ? 'fa-spin' : ''}`}></i>
                        重新整理
                    </button>
                </div>
            </div>

            {/* 表格區塊 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-base text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-sm">
                            <tr>
                                <th className="p-5">帳號 (User ID)</th>
                                <th className="p-5">目前權限 (Role)</th>
                                <th className="p-5">刪改權限 (Super User)</th>
                                <th className="p-5 text-center">狀態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">載入中...</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="p-5">
                                            <div className="font-bold text-slate-700 text-lg">{u.id}</div>
                                            {u.name && <div className="text-xs text-slate-400">{u.name}</div>}
                                        </td>

                                        <td className="p-5">
                                            <div className="relative w-32">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value, u.isSuper)}
                                                    className={`w-full appearance-none border-2 rounded-lg py-2 pl-3 pr-8 text-base font-bold outline-none cursor-pointer transition
                            ${u.role === 'admin' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                            u.role === 'op' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                                'border-slate-200 bg-white text-slate-600'}`}
                                                >
                                                    <option value="view">View</option>
                                                    <option value="op">Op</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                    <i className="fa-solid fa-chevron-down text-xs"></i>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-5">
                                            <label className="inline-flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={u.isSuper}
                                                    onChange={(e) => handleSuperChange(u.id, u.role, e.target.checked)}
                                                />
                                                <div className="relative w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer 
                                      peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                      peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] 
                                      after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 
                                      after:transition-all peer-checked:bg-amber-500 transition-colors duration-300"></div>
                                                <span className={`ms-3 text-sm font-bold transition-colors ${u.isSuper ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {u.isSuper ? '允許刪改' : '一般權限'}
                                                </span>
                                            </label>
                                        </td>

                                        <td className="p-5 text-center">
                                            {updating === u.id ? (
                                                <span className="text-blue-500 font-bold text-sm animate-pulse">
                                                    <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> 儲存中...
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-sm">
                                                    <i className="fa-solid fa-check mr-1"></i>已同步
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;