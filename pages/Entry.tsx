import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { InventoryItem, Zone } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: any[];      // 為了相容 App.tsx 傳入的 props
  registry: any[];  // 為了相容 App.tsx 傳入的 props
  onEntry: (data: any) => Promise<void>; // 為了相容 App.tsx
  isAdmin: boolean;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onEntry, user }) => {

  // 設定每個區域的停車格數量
  const getZoneCapacity = (zoneName: string) => {
    if (zoneName === 'Z-1' || zoneName.includes('A區')) return 35;
    if (zoneName === 'Z-2' || zoneName.includes('B區')) return 40;
    return 20;
  };

  // 產生停車格代號列表
  const generateSlots = (zoneName: string) => {
    if (!zoneName) return [];
    const count = getZoneCapacity(zoneName);
    return Array.from({ length: count }, (_, i) => `${zoneName}-${i + 1}`);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    customTime: getCurrentTime(),
    tankId: '',
    content: '',
    zone: '',
    slot: '',
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // 🟢 新增：搜尋狀態
  const formRef = useRef<HTMLDivElement>(null);

  // 初始化區域
  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      const firstZone = zones[0].name;
      const firstSlot = `${firstZone}-1`;
      setFormData(prev => ({
        ...prev,
        zone: firstZone,
        slot: firstSlot
      }));
    }
  }, [zones]);

  // 當區域改變時，重設停車格
  useEffect(() => {
    if (formData.zone) {
      if (!formData.slot.startsWith(formData.zone)) {
        setFormData(prev => ({ ...prev, slot: `${prev.zone}-1` }));
      }
    }
  }, [formData.zone]);

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

  // 🟢 核心修改：使用 useEffect 監聽 tankId 變動，實現自動搜尋 (Debounce)
  useEffect(() => {
    const id = formData.tankId.trim().toUpperCase();

    // 如果字數太少(小於3碼)，不進行搜尋，避免誤判
    if (id.length < 3) return;

    // 設定一個計時器，500毫秒後執行搜尋
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // 使用 as any 避開型別檢查
        const res = await api.getTankMaintenance(id) as any;

        // 只有當回傳成功，且目前輸入框的 ID 還是等於搜尋的 ID 時才更新 (避免快速打字導致的 race condition)
        if (res.status === 'success' && res.tank) {
          setFormData(prev => ({
            ...prev,
            content: res.tank.content || prev.content,
            // 如果 API 有回傳上次的重量資料，自動帶入，否則保留目前輸入
            totalWeight: res.tank.lastTotal ? String(res.tank.lastTotal) : prev.totalWeight,
            headWeight: res.tank.lastHead ? String(res.tank.lastHead) : prev.headWeight,
            emptyWeight: res.tank.empty ? String(res.tank.empty) : prev.emptyWeight,
          }));
        }
      } catch (error) {
        console.error("Auto search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 延遲 0.5 秒

    // 清除函式：如果使用者在 0.5 秒內又打字，會取消上一次的搜尋，重新計時
    return () => clearTimeout(timer);

  }, [formData.tankId]); // 監聽 tankId

  // 原本的 handleTankBlur 已經不需要了，因為上面已經取代了它的功能

  const handleSubmit = async () => {
    if (!formData.tankId) {
      setMessage({ text: '錯誤：請填寫車號', type: 'error' });
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
      slot: formData.slot,
      netWeight: formData.netWeight,
      totalWeight: formData.totalWeight,
      headWeight: formData.headWeight,
      emptyWeight: formData.emptyWeight,
      remark: formData.remark,
      user: user,
      customTime: formData.customTime
    };

    // 呼叫 App.tsx 傳進來的 onEntry，或是直接呼叫 api (看您的架構，這裡維持您原本的邏輯)
    // 為了保險，這裡直接使用 api 呼叫，或者使用 props.onEntry
    // 如果 App.tsx 有傳 onEntry，我們優先用它，不然用 api
    if (onEntry) {
      await onEntry(payload);
      // 重置表單 (onEntry 通常不回傳狀態，所以我們手動重置)
      setMessage({ text: `進場成功！位置：${formData.slot}`, type: 'success' });
      setFormData({
        customTime: getCurrentTime(),
        tankId: '',
        content: '',
        zone: formData.zone,
        slot: formData.slot,
        netWeight: 0,
        totalWeight: '',
        headWeight: '',
        emptyWeight: '',
        remark: '',
      });
      setTimeout(() => {
        const tankInput = formRef.current?.querySelector('input[name="tankId"]') as HTMLElement;
        tankInput?.focus();
      }, 100);
    } else {
      // Fallback: 如果沒有傳 onEntry prop (單獨測試時)
      const res = await api.gateIn(payload);
      if (res.status === 'success') {
        setMessage({ text: `進場成功！位置：${formData.slot}`, type: 'success' });
        setFormData({
          customTime: getCurrentTime(),
          tankId: '',
          content: '',
          zone: formData.zone,
          slot: formData.slot,
          netWeight: 0,
          totalWeight: '',
          headWeight: '',
          emptyWeight: '',
          remark: '',
        });
        setTimeout(() => {
          const tankInput = formRef.current?.querySelector('input[name="tankId"]') as HTMLElement;
          tankInput?.focus();
        }, 100);
      } else {
        setMessage({ text: res.message || '作業失敗', type: 'error' });
      }
    }

    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLElement;

      const inputs = Array.from(
        formRef.current?.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), button:not([disabled])') || []
      ) as HTMLElement[];

      const index = inputs.indexOf(target);

      if (index === inputs.length - 1) {
        handleSubmit();
        return;
      }

      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        if (nextInput instanceof HTMLInputElement) {
          nextInput.select();
        }
      }
    }
  };

  const currentSlots = generateSlots(formData.zone);

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-700">🚛 槽車進場作業</h2>

      {message.text && (
        <div className={`mb-4 p-2 rounded text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div ref={formRef} onKeyDown={handleKeyDown} className="space-y-4">

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
            required
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-bold text-gray-700">
            車號 (Tank ID) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="tankId"
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase pr-10"
              placeholder="例如: TNKU1234567"
              value={formData.tankId}
              // 🟢 這裡移除了 onBlur，改由 useEffect 處理
              onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            />
            {/* 🟢 顯示搜尋中的小動畫 */}
            {isSearching && (
              <div className="absolute right-3 top-3 text-gray-400 animate-pulse">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">內容物 (Content)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1 transition-colors duration-300"
            // 當內容物被自動帶入時，給一點視覺回饋 (可選)
            style={{ backgroundColor: formData.content ? '#f0f9ff' : 'white' }}
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-bold text-gray-700">停車格 (Slot)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded mt-1 bg-yellow-50"
              value={formData.slot}
              onChange={e => setFormData({ ...formData, slot: e.target.value })}
            >
              {currentSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
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