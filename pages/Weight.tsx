import React, { useState } from 'react';
import { api } from '../services/api';

interface WeightProps {
  isAdmin: boolean;
  user: string;
  refreshData: () => void;
}

const Weight: React.FC<WeightProps> = ({ isAdmin, user, refreshData }) => {
  const [tankId, setTankId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ tank: any; history: any[] } | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
      empty: '',
      content: '',
      remark: '',
      total: '',
      head: ''
  });

  const handleSearch = async () => {
    if (!tankId) return;
    setLoading(true);
    try {
      const res = await api.getTankMaintenance(tankId.toUpperCase());
      if (res.status === 'success' && res.tank) {
        setData({
          tank: res.tank,
          history: res.history || []
        });
        setEditForm({
            empty: res.tank.empty || '',
            content: res.tank.content || '',
            remark: '',
            total: res.tank.lastTotal || '',
            head: res.tank.lastHead || ''
        });
      } else {
        alert('找不到槽車或讀取錯誤');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
      if(!isAdmin) return;
      if (!window.confirm('確定更新車輛基本資料？')) return;
      
      setLoading(true);
      try {
          const res = await api.updateRegistryData({
              id: tankId.toUpperCase(),
              user,
              ...editForm
          });
          if(res.status === 'success') {
              alert(res.message);
              refreshData();
              handleSearch(); // Refresh local view
          } else {
              alert(res.message);
          }
      } finally {
          setLoading(false);
      }
  };

  const net = Math.max(0, (parseFloat(editForm.total) || 0) - (parseFloat(editForm.head) || 0) - (parseFloat(editForm.empty) || 0));

  return (
    <div className="max-w-3xl mx-auto p-4 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={tankId}
            onChange={(e) => setTankId(e.target.value)}
            className="border-2 border-slate-200 p-3 rounded-lg flex-1 uppercase outline-none focus:border-amber-500 bg-white text-black"
            placeholder="輸入槽號..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
          </button>
        </div>

        {data && (
          <div className="animate-fade-in">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
              <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-2">
                <h4 className="font-bold text-blue-800">基本資料維護</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-blue-600 block mb-1">空櫃重 (Empty)</label>
                  <input
                    type="number"
                    value={editForm.empty}
                    onChange={(e) => setEditForm({...editForm, empty: e.target.value})}
                    className={`w-full p-2 rounded border border-blue-200 text-black ${!isAdmin ? 'bg-gray-100' : 'bg-white'}`}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-600 block mb-1">內容物 (Content)</label>
                  <input
                    type="text"
                    value={editForm.content}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    className={`w-full p-2 rounded border border-blue-200 text-black ${!isAdmin ? 'bg-gray-100' : 'bg-white'}`}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="mb-4">
                 <label className="text-xs font-bold text-blue-600 block mb-1">修改備註 (原因)</label>
                 <input 
                    type="text" 
                    value={editForm.remark}
                    onChange={(e) => setEditForm({...editForm, remark: e.target.value})}
                    className={`w-full p-2 rounded border border-blue-200 text-black ${!isAdmin ? 'bg-gray-100' : 'bg-white'}`}
                    placeholder="請輸入修改原因..."
                    disabled={!isAdmin}
                 />
              </div>

              <div className="bg-slate-100 p-4 rounded-lg mb-4">
                 <div className="text-xs font-bold text-slate-500 mb-2">最近一次進場紀錄 (可編輯)</div>
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400 mb-1">總重 (Total)</div>
                        <input 
                            type="number"
                            value={editForm.total}
                            onChange={(e) => setEditForm({...editForm, total: e.target.value})}
                            className="w-full text-center font-bold text-lg text-black outline-none border-b border-transparent focus:border-blue-500 bg-transparent"
                            placeholder="-"
                            disabled={!isAdmin}
                        />
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400 mb-1">車頭 (Head)</div>
                        <input 
                            type="number"
                            value={editForm.head}
                            onChange={(e) => setEditForm({...editForm, head: e.target.value})}
                            className="w-full text-center font-bold text-lg text-black outline-none border-b border-transparent focus:border-blue-500 bg-transparent"
                            placeholder="-"
                            disabled={!isAdmin}
                        />
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-200 bg-blue-50">
                        <div className="text-[10px] text-blue-500 mb-1">淨重 (計算)</div>
                        <div className="font-bold text-lg text-blue-700">{net.toLocaleString()}</div>
                    </div>
                 </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end">
                    <button 
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700"
                    >
                        更新資料
                    </button>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3 text-left">日期</th>
                    <th className="p-3 text-left">淨重</th>
                    <th className="p-3 text-left">動作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {data.history.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-slate-400">無歷史紀錄</td></tr>
                    ) : (
                        data.history.map((h, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3 text-slate-500">{h.date}</td>
                                <td className="p-3 font-bold text-slate-700">{Number(h.net).toLocaleString()}</td>
                                <td className="p-3">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        h.action === '進場' ? 'bg-green-100 text-green-600' :
                                        h.action === '出場' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {h.action}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weight;