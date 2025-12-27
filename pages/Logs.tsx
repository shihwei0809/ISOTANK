import React, { useState } from 'react';
import { LogEntry, User } from '../types';
import { api } from '../services/api';

interface LogsProps {
  logs: LogEntry[];
  user: User;
}

const Logs: React.FC<LogsProps> = ({ logs, user }) => {
  const [search, setSearch] = useState('');

  // 排序：時間新 -> 舊
  const displayLogs = logs.slice().sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).filter(l =>
    search === '' ||
    `${l.time} ${l.tank} ${l.action} ${l.zone} ${l.slot || ''} ${l.content} ${l.user} ${l.remark}`.toUpperCase().includes(search.toUpperCase())
  );

  // 匯出 CSV
  const handleExport = () => {
    const header = ['時間', '槽號', '動作', '內容物', '區域', '儲位', '重量', '備註', '操作人員'];
    const rows = displayLogs.map(l => [
      l.time,
      l.tank,
      l.action,
      l.content,
      l.zone,
      l.slot || '',
      l.weight,
      l.remark || '',
      l.user
    ]);

    const csvContent = [
      '\uFEFF' + header.join(','), // BOM for Excel
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleEdit = async (log: LogEntry) => {
    // 簡單的 Prompt 編輯範例，完整版應使用 Modal Form
    const newRemark = prompt("修改備註:", log.remark || "");
    if (newRemark !== null && newRemark !== log.remark) {
      const res = await api.editLog(log.id, { remark: newRemark, user: user.id + " (修)" }); // 標記修改者
      if (res.status === 'success') {
        alert("更新成功，請重新整理");
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = async (log: LogEntry) => {
    if (confirm(`確定要刪除此紀錄嗎？\n${log.time} - ${log.tank}`)) {
      const res = await api.deleteLog(log.id);
      if (res.status === 'success') {
        alert("刪除成功，請重新整理");
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">

      {/* 標題與搜尋 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">歷史紀錄</h2>
          <p className="text-slate-500 text-sm">System Logs & History</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center flex-1 md:w-80">
            <i className="fa-solid fa-magnifying-glass text-slate-300 mr-3"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent text-slate-600 placeholder-slate-300"
              placeholder="搜尋任意關鍵字..."
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-bold whitespace-nowrap border border-green-100"
          >
            <i className="fa-solid fa-file-csv"></i>
            匯出 CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">時間 (Time)</th>
                <th className="p-4">槽號 (Tank ID)</th>
                <th className="p-4">動作 (Action)</th>
                <th className="p-4">內容物 (Content)</th>
                <th className="p-4">區域 (Zone)</th>
                <th className="p-4">儲位 (Slot)</th>
                <th className="p-4 text-right">淨重 (Net)</th>
                <th className="p-4">備註 (Remark)</th>
                <th className="p-4">人員 (User)</th>
                {user.isSuper && <th className="p-4 text-center">管理</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={user.isSuper ? 10 : 9} className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                    <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                    <span>查無符合紀錄</span>
                  </td>
                </tr>
              ) : (
                displayLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition group">
                    <td className="p-4 text-slate-500 text-xs">
                      <div className="font-bold text-slate-700">{l.time.split('T')[0]}</div>
                      <div className="scale-90 origin-left opacity-70">{l.time.split('T')[1]?.substring(0, 5)}</div>
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-700 text-base">{l.tank}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${l.action === '進場' ? 'bg-green-50 text-green-600 border-green-100' :
                          l.action === '出場' ? 'bg-red-50 text-red-600 border-red-100' :
                            l.action === '移區' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {l.action === '進場' && <i className="fa-solid fa-arrow-right-to-bracket mr-1"></i>}
                        {l.action === '出場' && <i className="fa-solid fa-arrow-right-from-bracket mr-1"></i>}
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{l.content || '-'}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{l.zone}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {l.slot ? <span className="text-blue-600 font-bold">{l.slot}</span> : '-'}
                    </td>
                    <td className="p-4 font-mono text-right text-slate-700">
                      {Number(l.weight) > 0 ? Number(l.weight).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-slate-400 text-xs max-w-[200px] truncate" title={l.remark}>
                      {l.remark || '-'}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                          {l.user.charAt(0)}
                        </div>
                        {l.user}
                      </div>
                    </td>
                    {user.isSuper && (
                      <td className="p-4 flex gap-2 justify-center">
                        <button onClick={() => handleEdit(l)} className="w-8 h-8 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={() => handleDelete(l)} className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
                      </td>
                    )}
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

export default Logs;