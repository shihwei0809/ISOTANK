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

  // 🟢 設定每個區域的停車格數量 (您可以依需求自由修改)
  const getZoneCapacity = (zoneName: string) => {
    // 如果區域名稱包含 "Z-1" 或 "A區" 等等，回傳對應格數
    if (zoneName === 'Z-1') return 35;
    if (zoneName === 'Z-2') return 40;
    // 預設其他區域都給 20 格，您可自行調整
    return 20;
  };

  // 產生停車格代號列表 (例如: Z-1-1 ~ Z-1-35)
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
    slot: '', // 🟢 新增停車格欄位
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // 當 zones 載入時，預設選第一個，並連動設定預設停車格
  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      const firstZone = zones[0].name;
      const firstSlot = `${firstZone}-1`; // 預設選第一格
      setFormData(prev => ({
        ...prev,
        zone: firstZone,
        slot: firstSlot
      }));
    }
  }, [zones]);

  // 🟢 當區域 (zone) 改變時，自動重設 停車格 (slot) 為該區的第一格
  useEffect(() => {
    if (formData.zone) {
      // 檢查目前的 slot 是否符合現在的 zone (例如從 Z-1 切到 Z-2，原本的 Z-1-5 就不合法了)
      if (!formData.slot.startsWith(formData.zone)) {
        setFormData(prev => ({ ...prev, slot: `${prev.zone}-1` }));
      }
    }
  }, [formData.zone]);

  // 計算淨重
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
    // 使用 as any 避開型別檢查
    const res = await api.getTankMaintenance(id) as any;
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
      slot: formData.slot, // 🟢 傳送停車格資料
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
      setMessage({ text: `進場成功！位置：${formData.slot}`, type: 'success' });

      setFormData({
        customTime: getCurrentTime(),
        tankId: '',
        content: '',
        zone: formData.zone,
        slot: formData.slot, // 保留當前選擇的位置，或依需求改成自動跳下一格
        netWeight: 0,
        totalWeight: '',
        headWeight: '',
        emptyWeight: '',
        remark: '',
      });
      onRefresh();

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

  // 取得目前選中區域的所有停車格選項
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

        <div>
          <label className="block text-sm font-bold text-gray-700">
            車號 (Tank ID) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="tankId"
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            placeholder="例如: TNKU1234567"
            value={formData.tankId}
            onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            onBlur={handleTankBlur}
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

        {/* 區域與停車格 並排顯示 */}
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

          {/* 🟢 新增：停車格選擇 */}
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