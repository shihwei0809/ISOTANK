import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InventoryItem, Zone } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
  onRefresh: () => void;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onRefresh, user }) => {
  const getCurrentTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    tankId: '',
    content: '',
    zone: '',
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
    customTime: getCurrentTime()
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      setFormData(prev => ({ ...prev, zone: zones[0].name }));
    }
  }, [zones]);

  useEffect(() => {
    const total = parseFloat(formData.totalWeight) || 0;
    const head = parseFloat(formData.headWeight) || 0;
    const empty = parseFloat(formData.emptyWeight) || 0;

    if (total > 0 && head > 0 && empty > 0) {
      const net = Math.max(0, total - head - empty);
      setFormData(prev => ({ ...prev, netWeight: net }));
    } else {
      setFormData(prev => ({ ...prev, netWeight: 0 }));
    }
  }, [formData.totalWeight, formData.headWeight, formData.emptyWeight]);

  const handleTankBlur = async () => {
    const id = formData.tankId.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    const res = await api.getTankMaintenance(id);
    if (res.status === 'success' && res.tank) {
      setFormData(prev => ({
        ...prev,
        content: res.tank.content || prev.content,
        totalWeight: res.tank.lastTotal ? String(res.tank.lastTotal) : prev.totalWeight,
        headWeight: res.tank.lastHead ? String(res.tank.lastHead) : prev.headWeight,
        emptyWeight: res.tank.empty ? String(res.tank.empty) : prev.emptyWeight,
      }));
    }
    setLoading(false);
  };

  // 🟢 新增：處理 Enter 鍵切換焦點的邏輯
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // 如果按下的是 Enter 鍵
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;

      // 如果當前焦點已經在 submit 按鈕上，則允許預設行為(送出表單)
      if (target.getAttribute('type') === 'submit') {
        return;
      }

      // 否則阻止預設的送出行為
      e.preventDefault();

      const form = e.currentTarget;
      // 抓取表單內所有可以輸入的欄位與按鈕 (排除 disable 的)
      const formElements = Array.from(
        form.querySelectorAll('input:not([disabled]), select:not([disabled]), button[type="submit"]:not([disabled])')
      ) as HTMLElement[];

      // 找到當前元素的位置
      const index = formElements.indexOf(target);

      // 如果不是最後一個元素，就將焦點移到下一個
      if (index > -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tankId || !formData.zone) {
      setMessage({ text: '請填寫完整車號與區域', type: 'error' });
      return;
    }

    setLoading(true);
    const selectedZone = zones.find(z => z.name === formData.zone) || zones[0];
    const zoneId = selectedZone ? selectedZone.id : 'Z-01';

    const payload = {
      id: formData.tankId.toUpperCase(),
      content: formData.content,
      zone: zoneId,
      zoneName: formData.zone,
      netWeight: formData.netWeight,
      totalWeight: formData.totalWeight,
      headWeight: formData.headWeight,
      emptyWeight: formData.emptyWeight,
      remark: formData.remark,
      user: user,
      customTime: formData.customTime
    };

    const res = await api.gateIn(payload);

    if (res.status === 'success') {
      setMessage({ text: '進場作業成功！', type: 'success' });
      setFormData({
        tankId: '', content: '', zone: formData.zone, netWeight: 0,
        totalWeight: '', headWeight: '', emptyWeight: '', remark: '',
        customTime: getCurrentTime()
      });
      onRefresh();

      // 🟢 成功後，可選擇自動聚焦回第一個欄位 (選填)
      // document.getElementById('firstInput')?.focus();
    } else {
      setMessage({ text: res.message || '作業失敗', type: 'error' });
    }
    setLoading(false);
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

      {/* 🟢 加入 onKeyDown 監聽 */}
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">

        <div>
          <label className="block text-sm font-bold text-gray-700">進場時間 (Time)</label>
          <input
            id="firstInput" // 方便辨識第一個欄位
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded mt-1 font-mono text-gray-600"
            value={formData.customTime}
            onChange={e => setFormData({ ...formData, customTime: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">車號 (Tank ID)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            placeholder="例如: TNKU1234567"
            value={formData.tankId}
            onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            onBlur={handleTankBlur}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">內容物 (Content)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

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

        <div className="bg-blue-50 p-3 rounded text-center">
          <span className="text-gray-600 font-bold">淨重 (Net Weight): </span>
          <span className="text-2xl font-bold text-blue-600">{formData.netWeight}</span>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">備註 (Remark)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={formData.remark}
            onChange={e => setFormData({ ...formData, remark: e.target.value })}
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