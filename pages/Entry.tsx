import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { InventoryItem, Zone } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
  onRefresh: () => void;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onRefresh, user }) => {
  // 1. 取得現在時間 (格式: YYYY-MM-DDTHH:mm) 供 datetime-local 使用
  const getCurrentTime = () => {
    const now = new Date();
    // 台灣時區是 UTC+8，getTimezoneOffset 會回傳 -480 (分鐘)
    // 我們要補回時差來轉成當地的 ISO String
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  // 2. 表單狀態初始化
  const [formData, setFormData] = useState({
    // 🟢 這邊確保 customTime 一開始就有值
    customTime: getCurrentTime(),
    tankId: '',
    content: '',
    zone: '',
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 用來參照整個表單容器，方便抓取下一個欄位
  const formRef = useRef<HTMLDivElement>(null);

  // 預設選擇第一個區域
  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      setFormData(prev => ({ ...prev, zone: zones[0].name }));
    }
  }, [zones]);

  // 自動計算淨重
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

  // 車號輸入完畢抓取歷史資料
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

  // 🟢 處理送出邏輯 (從 form onSubmit 移出來獨立呼叫)
  const handleSubmit = async () => {
    // 驗證
    if (!formData.tankId) {
      setMessage({ text: '錯誤：請填寫車號', type: 'error' });
      return;
    }
    if (!formData.customTime) {
      setMessage({ text: '錯誤：進場時間不可為空', type: 'error' });
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

      // 重置表單，保留區域，時間更新為最新
      setFormData({
        customTime: getCurrentTime(), // 更新時間
        tankId: '',
        content: '',
        zone: formData.zone,
        netWeight: 0,
        totalWeight: '',
        headWeight: '',
        emptyWeight: '',
        remark: '',
      });
      onRefresh();

      // 成功後將焦點移回第一個輸入框 (時間之後的車號，或是時間本身)
      // 這裡示範移回「車號」因為時間通常是自動帶入不需要一直改
      // 如果希望移回時間欄位，請改找 input[type="datetime-local"]
      setTimeout(() => {
        const tankInput = formRef.current?.querySelector('input[name="tankId"]') as HTMLElement;
        tankInput?.focus();
      }, 100);

    } else {
      setMessage({ text: res.message || '作業失敗', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // 🟢 處理按鍵事件：Enter 跳下一格
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 如果正在使用輸入法 (選字中)，不要觸發跳格
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault(); // 100% 阻止預設行為

      const target = e.target as HTMLElement;

      // 取得所有可輸入的欄位 (包含 input, select, button)
      // 排除 hidden 和 disabled
      const inputs = Array.from(
        formRef.current?.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), button:not([disabled])') || []
      ) as HTMLElement[];

      const index = inputs.indexOf(target);

      // 如果焦點在最後一個按鈕上，則執行送出
      if (index === inputs.length - 1) {
        handleSubmit();
        return;
      }

      // 否則移到下一個欄位
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        // 如果是文字框，全選內容方便修改 (選擇性功能)
        if (nextInput instanceof HTMLInputElement) {
          nextInput.select();
        }
      }
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-700">🚛 槽車進場作業</h2>

      {message.text && (
        <div className={`mb-4 p-2 rounded text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* 🟢 改用 div 包覆，不使用 <form> 標籤，徹底避免瀏覽器預設的 Submit 行為 */}
      <div ref={formRef} onKeyDown={handleKeyDown} className="space-y-4">

        {/* 🟢 第一個欄位：進場時間 (移到最上方) */}
        <div>
          <label className="block text-sm font-bold text-gray-700">
            進場時間 (Time) <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="customTime"
            className="w-full p-2 border border-gray-300 rounded mt-1 font-mono text-gray-600 bg-gray-50"
            value={formData.customTime}
            onChange={e => setFormData({ ...formData, customTime: e.target.value })}
            required // 雖然是必填，但在 div 模式下主要靠 handleSubmit 檢查
          />
        </div>

        {/* 車號 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">
            車號 (Tank ID) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="tankId" // 加入 name 屬性方便定位
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            placeholder="例如: TNKU1234567"
            value={formData.tankId}
            onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            onBlur={handleTankBlur}
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

        {/* 重量區塊 */}
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

        {/* 淨重顯示 */}
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

        {/* 🟢 按鈕改為 type="button"，只有按下它或 Enter 在它身上時才觸發 onClick */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full p-3 text-white font-bold rounded shadow transition 
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? '處理中...' : '確認進場'}
        </button>
      </div>
    </div>
  );
};

export default Entry;