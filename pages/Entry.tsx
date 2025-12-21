import React, { useState, useEffect } from 'react';
import { api } from '../services/api'; // 確保路徑正確
import { Tank, InventoryItem, Zone } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
  onRefresh: () => void;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onRefresh, user }) => {
  const [formData, setFormData] = useState({
    tankId: '',
    content: '',
    zone: '', // 預設會自動選擇
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
    customTime: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 當 zones 資料載入後，預設選擇第一個區域 (通常是本廠)
  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      setFormData(prev => ({ ...prev, zone: zones[0].name })); // 假設用 name 或 id
    }
  }, [zones]);

  // 計算淨重：總重 - 車頭 - 空櫃
  useEffect(() => {
    const total = parseFloat(formData.totalWeight) || 0;
    const head = parseFloat(formData.headWeight) || 0;
    const empty = parseFloat(formData.emptyWeight) || 0;

    // 只有當三個都有值的時候才計算，避免出現負數或怪異數字
    if (total > 0 && head > 0 && empty > 0) {
      const net = Math.max(0, total - head - empty);
      setFormData(prev => ({ ...prev, netWeight: net }));
    } else {
      setFormData(prev => ({ ...prev, netWeight: 0 }));
    }
  }, [formData.totalWeight, formData.headWeight, formData.emptyWeight]);

  // 🔴 關鍵修復：車號輸入完畢離開時，去抓取歷史資料
  const handleTankBlur = async () => {
    const id = formData.tankId.trim().toUpperCase();
    if (!id) return;

    // 稍微顯示讀取中(非必要，但體驗較好)
    setLoading(true);

    // 呼叫後端 API 查詢
    const res = await api.getTankMaintenance(id);

    if (res.status === 'success' && res.tank) {
      // 自動帶入資料
      setFormData(prev => ({
        ...prev,
        content: res.tank.content || prev.content, // 如果歷史有就帶入，沒有就維持現狀
        totalWeight: res.tank.lastTotal ? String(res.tank.lastTotal) : prev.totalWeight,
        headWeight: res.tank.lastHead ? String(res.tank.lastHead) : prev.headWeight,
        emptyWeight: res.tank.empty ? String(res.tank.empty) : prev.emptyWeight,
        // 如果需要，也可以帶入上次的備註
        // remark: res.tank.lastRemark || prev.remark 
      }));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tankId || !formData.zone) {
      setMessage({ text: '請填寫完整車號與區域', type: 'error' });
      return;
    }

    setLoading(true);
    // 尋找對應的 Zone ID (如果後端需要 ID)
    const selectedZone = zones.find(z => z.name === formData.zone) || zones[0];
    const zoneId = selectedZone ? selectedZone.id : 'Z-01'; // 預防萬一

    const payload = {
      id: formData.tankId.toUpperCase(),
      content: formData.content,
      zone: zoneId,           // 傳送代號 (Z-01)
      zoneName: formData.zone, // 傳送中文名稱 (本廠) 寫入 Log 用
      netWeight: formData.netWeight,
      totalWeight: formData.totalWeight,
      headWeight: formData.headWeight,
      emptyWeight: formData.emptyWeight,
      remark: formData.remark,
      user: user,
      customTime: formData.customTime || undefined
    };

    const res = await api.gateIn(payload);

    if (res.status === 'success') {
      setMessage({ text: '進場作業成功！', type: 'success' });
      // 清空表單，保留區域
      setFormData({
        tankId: '', content: '', zone: formData.zone, netWeight: 0,
        totalWeight: '', headWeight: '', emptyWeight: '', remark: '', customTime: ''
      });
      onRefresh(); // 通知上層更新列表
    } else {
      setMessage({ text: res.message || '作業失敗', type: 'error' });
    }
    setLoading(false);

    // 3秒後消除訊息
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-700">🚛 槽車進場作業</h2>

      {message.text && (
        <div className={`mb-4 p-2 rounded text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 車號 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">車號 (Tank ID)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="例如: TNKU1234567"
            value={formData.tankId}
            onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            onBlur={handleTankBlur} // 🟢 這裡觸發自動帶入
            required
          />
        </div>

        {/* 內容物 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">內容物 (Content)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        {/* 區域選擇 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">區域 (Zone)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={formData.zone}
            onChange={e => setFormData({ ...formData, zone: e.target.value })}
          >
            {zones.map(z => (
              <option key={z.id} value={z.name}>{z.name}</option>
            ))}
          </select>
        </div>

        {/* 重量區塊：總重 / 車頭 / 空櫃 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">總重 (Total)</label>
            <input type="number" step="0.01" className="w-full p-2 border rounded mt-1"
              value={formData.totalWeight} onChange={e => setFormData({ ...formData, totalWeight: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">車頭重 (Head)</label>
            <input type="number" step="0.01" className="w-full p-2 border rounded mt-1"
              value={formData.headWeight} onChange={e => setFormData({ ...formData, headWeight: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">空櫃重 (Empty)</label>
          <input type="number" step="0.01" className="w-full p-2 border rounded mt-1"
            value={formData.emptyWeight} onChange={e => setFormData({ ...formData, emptyWeight: e.target.value })} />
        </div>

        {/* 自動計算的淨重 */}
        <div className="bg-blue-50 p-3 rounded text-center">
          <span className="text-gray-600 font-bold">淨重 (Net Weight): </span>
          <span className="text-2xl font-bold text-blue-600">{formData.netWeight}</span>
        </div>

        {/* 備註 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">備註 (Remark)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={formData.remark}
            onChange={e => setFormData({ ...formData, remark: e.target.value })}
          />
        </div>

        {/* 自訂時間 (選填) */}
        <div>
          <label className="block text-sm text-gray-500">補登時間 (選填)</label>
          <input
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded mt-1 text-gray-500 text-sm"
            value={formData.customTime}
            onChange={e => setFormData({ ...formData, customTime: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 text-white font-bold rounded shadow transition 
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? '處理中...' : '確認進場'}
        </button>
      </form>
    </div>
  );
};

export default Entry;