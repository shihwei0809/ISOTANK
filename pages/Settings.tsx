import React, { useState, useEffect } from 'react';
import { Zone } from '../types';

interface SettingsProps {
  zones: Zone[];
  onSave: (zones: Zone[]) => Promise<any>;
  onRefresh: () => void;
}

const Settings: React.FC<SettingsProps> = ({ zones, onSave, onRefresh }) => {
  // 注意：這裡將 limit 改為 capacity 以配合 Dashboard 的統計邏輯
  const [localZones, setLocalZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 深拷貝以避免直接修改 props
    setLocalZones(JSON.parse(JSON.stringify(zones)));
  }, [zones]);

  const handleChange = (index: number, field: keyof Zone, value: string | number) => {
    const updated = [...localZones];
    // @ts-ignore: Dynamic assignment
    updated[index] = { ...updated[index], [field]: value };

    // Sync limit and capacity for backward compatibility
    if (field === 'capacity') {
      updated[index].limit = value as number;
    }
    if (field === 'limit') {
      updated[index].capacity = value as number;
    }

    setLocalZones(updated);
  };

  const handleAdd = () => {
    const newId = `Z${(localZones.length + 1).toString().padStart(2, '0')}`;
    // 預設容量設為 35，同時設定 limit 以符合型別定義
    setLocalZones([...localZones, { id: newId, name: 'New Zone', capacity: 35, limit: 35 }]);
  };

  const handleRemove = (index: number) => {
    if (window.confirm('確定刪除此區域設定？將無法復原。')) {
      const updated = [...localZones];
      updated.splice(index, 1);
      setLocalZones(updated);
    }
  };

  const handleSave = async () => {
    if (!window.confirm('確定儲存所有區域設定？')) return;
    setLoading(true);
    try {
      const res = await onSave(localZones);
      if (res.status === 'success') {
        // 使用自定義 alert 或 toast 更好，這裡暫用 alert
        alert('設定已成功更新！');
        onRefresh();
      } else {
        alert('儲存失敗：' + res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">

        <div className="flex justify-between mb-6 items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-xl text-slate-800">區域參數設定</h3>
            <p className="text-slate-400 text-sm">Zone Configuration</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 text-sm shadow transition flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> 新增區域
          </button>
        </div>

        {/* 表頭 */}
        <div className="bg-slate-50 p-3 rounded-t-xl grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-200 border-b-0">
          <div className="col-span-3">區域代號 (ID)</div>
          <div className="col-span-5">區域名稱 (Name)</div>
          <div className="col-span-3">最大容量 (Capacity)</div>
          <div className="col-span-1 text-center">刪除</div>
        </div>

        {/* 列表內容 */}
        <div className="border border-slate-200 rounded-b-xl overflow-hidden divide-y divide-slate-100 bg-white">
          {localZones.map((z, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-slate-50 transition">
              <div className="col-span-3">
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
                  value={z.id}
                  onChange={(e) => handleChange(i, 'id', e.target.value)}
                  placeholder="ID"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 focus:border-blue-500 outline-none transition"
                  value={z.name}
                  onChange={(e) => handleChange(i, 'name', e.target.value)}
                  placeholder="區域說明"
                />
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-center font-bold text-slate-700 focus:border-blue-500 outline-none transition"
                    value={z.capacity || 35} // 預設顯示
                    onChange={(e) => handleChange(i, 'capacity', parseInt(e.target.value))}
                  />
                  <span className="absolute right-8 top-2 text-xs text-slate-400 hidden sm:block">TEU</span>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <button
                  onClick={() => handleRemove(i)}
                  className="w-8 h-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center mx-auto"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))}

          {localZones.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              尚無區域設定，請點擊上方按鈕新增。
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 shadow-lg hover:shadow-xl transition flex items-center disabled:bg-slate-400"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-save mr-2"></i>}
            儲存所有變更
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;