import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogsProps {
  logs: LogEntry[];
}

const Logs: React.FC<LogsProps> = ({ logs }) => {
  const [search, setSearch] = useState('');

  // Reverse copy to show newest first
  const displayLogs = logs.slice().reverse().filter(l => 
    search === '' || 
    `${l.time} ${l.tank} ${l.action} ${l.zone} ${l.content} ${l.user} ${l.remark}`.toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-[1200px] mx-auto">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 flex items-center">
        <i className="fa-solid fa-search text-slate-300 mr-3"></i>
        <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full outline-none bg-transparent" 
            placeholder="搜尋時間、槽號、動作、內容物、備註..."
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b text-slate-500">
                    <tr>
                        <th className="p-4">時間</th>
                        <th className="p-4">槽號</th>
                        <th className="p-4">動作</th>
                        <th className="p-4">內容物</th>
                        <th className="p-4">區域</th>
                        <th className="p-4">淨重</th>
                        <th className="p-4">備註</th>
                        <th className="p-4">操作人員</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {displayLogs.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">無紀錄</td></tr>
                    ) : (
                        displayLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 text-slate-500">{l.time}</td>
                                <td className="p-4 font-bold font-mono text-slate-700">{l.tank}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        l.action === '進場' ? 'bg-green-100 text-green-700' :
                                        l.action === '出場' ? 'bg-red-100 text-red-700' :
                                        l.action === '移區' ? 'bg-purple-100 text-purple-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {l.action}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-slate-600">{l.content}</td>
                                <td className="p-4 text-slate-600">{l.zone}</td>
                                <td className="p-4 font-mono">{Number(l.weight).toLocaleString()}</td>
                                <td className="p-4 text-slate-500 text-xs truncate max-w-[150px]" title={l.remark}>{l.remark || '-'}</td>
                                <td className="p-4 text-xs text-slate-400">{l.user}</td>
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