import React, { useState, useEffect } from 'react';
import { Zone } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  zones: Zone[];
  isAdmin: boolean;
  refreshData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ zones, isAdmin, refreshData }) => {
  const [localZones, setLocalZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalZones(JSON.parse(JSON.stringify(zones)));
  }, [zones]);

  const handleChange = (index: number, field: keyof Zone, value: string | number) => {
    const updated = [...localZones];
    updated[index] = { ...updated[index], [field]: value };
    setLocalZones(updated);
  };

  const handleAdd = () => {
    const newId = `Z-${(localZones.length + 1).toString().padStart(2, '0')}`;
    setLocalZones([...localZones, { id: newId, name: '新區域', limit: 20 }]);
  };

  const handleRemove = (index: number) => {
    if (window.confirm('確定刪除此區域設定？')) {
      const updated = [...localZones];
      updated.splice(index, 1);
      setLocalZones(updated);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    if (!window.confirm('確定儲存所有區域設定？')) return;
    setLoading(true);
    try {
      const res = await api.updateSettings(localZones);
      if (res.status === 'success') {
        alert('設定已儲存');
        refreshData();
      } else {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
      <div className="flex justify-between mb-6 items-center">
        <h3 className="font-bold text-lg">區域管理 (Zone Management)</h3>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 text-sm shadow"
          >
            <i className="fa-solid fa-plus mr-1"></i> 新增
          </button>
        )}
      </div>

      <div className="bg-slate-100 p-2 rounded-t-lg grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase">
        <div className="col-span-3">代號 (ID)</div>
        <div className="col-span-6">名稱 (Name)</div>
        <div className="col-span-2">容量 (Limit)</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pb-4 pt-2">
        {localZones.map((z, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white border p-2 rounded shadow-sm">
            <div className="col-span-3">
              <input
                type="text"
                disabled={!isAdmin}
                className={`w-full border rounded px-2 py-1 text-sm font-mono text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
                value={z.id}
                onChange={(e) => handleChange(i, 'id', e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <input
                type="text"
                disabled={!isAdmin}
                className={`w-full border rounded px-2 py-1 text-sm text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
                value={z.name}
                onChange={(e) => handleChange(i, 'name', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                disabled={!isAdmin}
                className={`w-full border rounded px-2 py-1 text-sm text-center text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
                value={z.limit}
                onChange={(e) => handleChange(i, 'limit', parseInt(e.target.value))}
              />
            </div>
            <div className="col-span-1 text-center">
              {isAdmin && (
                <button onClick={() => handleRemove(i)} className="text-red-400 hover:text-red-600 px-2">
                  <i className="fa-solid fa-trash"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-700 shadow flex justify-center items-center"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
          儲存所有設定
        </button>
      )}
    </div>
  );
};

export default Settings;