<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, useRef } from 'react';
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
import { api } from '../services/api';
import { InventoryItem, Zone } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
<<<<<<< HEAD
  onRefresh: () => void;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onRefresh, user }) => {
  // 取得現在時間的函式 (格式: YYYY-MM-DDTHH:mm)
  const getCurrentTime = () => {
    const now = new Date();
    // 處理時區問題，確保顯示的是當地時間
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    tankId: '',
    content: '',
    zone: '',
=======
  logs?: any[];
  registry?: any[];
  onEntry?: (data: any) => Promise<void>;
  isAdmin: boolean;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onEntry, user }) => {

  const getZoneCapacity = (zoneName: string) => {
    if (zoneName === 'Z-1' || zoneName.includes('A區')) return 35;
    if (zoneName === 'Z-2' || zoneName.includes('B區')) return 40;
    return 20;
  };

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
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
    netWeight: 0,
    totalWeight: '',
    headWeight: '',
    emptyWeight: '',
    remark: '',
    customTime: getCurrentTime() // 🟢 預設直接帶入現在時間
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD

  // 當 zones 資料載入後，預設選擇第一個區域
  useEffect(() => {
    if (zones.length > 0 && !formData.zone) {
      setFormData(prev => ({ ...prev, zone: zones[0].name }));
    }
  }, [zones]);

  // 計算淨重
=======
  const [isSearching, setIsSearching] = useState(false);
  const [tankLocation, setTankLocation] = useState<string>('');
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

  useEffect(() => {
    if (formData.zone) {
      if (!formData.slot.startsWith(formData.zone)) {
        setFormData(prev => ({ ...prev, slot: `${prev.zone}-1` }));
      }
    }
  }, [formData.zone]);

  // 🟢 修正：計算淨重 (強制取2位小數)
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
  useEffect(() => {
    const total = parseFloat(formData.totalWeight) || 0;
    const head = parseFloat(formData.headWeight) || 0;
    const empty = parseFloat(formData.emptyWeight) || 0;

    if (total > 0 && head > 0 && empty > 0) {
<<<<<<< HEAD
      const net = Math.max(0, total - head - empty);
=======
      const rawNet = total - head - empty;
      // 使用 parseFloat(x.toFixed(2)) 確保數字乾淨
      const net = Math.max(0, parseFloat(rawNet.toFixed(2)));
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
      setFormData(prev => ({ ...prev, netWeight: net }));
    } else {
      setFormData(prev => ({ ...prev, netWeight: 0 }));
    }
  }, [formData.totalWeight, formData.headWeight, formData.emptyWeight]);

<<<<<<< HEAD
  // 車號輸入完畢離開時，抓取歷史資料
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tankId || !formData.zone) {
      setMessage({ text: '請填寫完整車號與區域', type: 'error' });
      return;
    }

    setLoading(true);
    const selectedZone = zones.find(z => z.name === formData.zone) || zones[0];
    const zoneId = selectedZone ? selectedZone.id : 'Z-01';

=======
  // 自動搜尋
  useEffect(() => {
    const id = formData.tankId.trim().toUpperCase();
    if (id.length < 3) {
      setTankLocation('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setTankLocation('');

      try {
        // 使用 as any 避開型別檢查
        const res = await api.getTankMaintenance(id) as any;

        if (res.status === 'success' && res.tank) {
          if (res.tank.zoneName) {
            setTankLocation(res.tank.zoneName);
          }
          setFormData(prev => ({
            ...prev,
            content: res.tank.content || prev.content,
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
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.tankId]);

  const handleSubmit = async () => {
    if (!formData.tankId) {
      setMessage({ text: '錯誤：請填寫車號', type: 'error' });
      return;
    }

    setLoading(true);
    const selectedZone = zones.find(z => z.name === formData.zone) || zones[0];
    const zoneId = selectedZone ? selectedZone.id : 'Z-01';

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
    const payload = {
      id: formData.tankId.toUpperCase(),
      content: formData.content,
      zone: zoneId,
      zoneName: formData.zone,
<<<<<<< HEAD
=======
      slot: formData.slot,
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
      netWeight: formData.netWeight,
      totalWeight: formData.totalWeight,
      headWeight: formData.headWeight,
      emptyWeight: formData.emptyWeight,
      remark: formData.remark,
      user: user,
<<<<<<< HEAD
      customTime: formData.customTime // 傳送畫面上顯示的時間
    };

    const res = await api.gateIn(payload);

    if (res.status === 'success') {
      setMessage({ text: '進場作業成功！', type: 'success' });
      // 重置表單，但時間要重新抓取現在時間
      setFormData({
        tankId: '', content: '', zone: formData.zone, netWeight: 0,
        totalWeight: '', headWeight: '', emptyWeight: '', remark: '',
        customTime: getCurrentTime() // 🟢 重置後時間也要更新
      });
      onRefresh();
    } else {
      setMessage({ text: res.message || '作業失敗', type: 'error' });
    }
=======
      customTime: formData.customTime
    };

    const resetForm = () => {
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
      setTankLocation('');
    };

    if (onEntry) {
      await onEntry(payload);
      setMessage({ text: `進場成功！位置：${formData.slot}`, type: 'success' });
      resetForm();
      setTimeout(() => {
        const tankInput = formRef.current?.querySelector('input[name="tankId"]') as HTMLElement;
        tankInput?.focus();
      }, 100);
    } else {
      const res = await api.gateIn(payload);
      if (res.status === 'success') {
        setMessage({ text: `進場成功！位置：${formData.slot}`, type: 'success' });
        resetForm();
        setTimeout(() => {
          const tankInput = formRef.current?.querySelector('input[name="tankId"]') as HTMLElement;
          tankInput?.focus();
        }, 100);
      } else {
        setMessage({ text: res.message || '作業失敗', type: 'error' });
      }
    }

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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

<<<<<<< HEAD
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 🟢 進場時間 (移到最上面) */}
        <div>
          <label className="block text-sm font-bold text-gray-700">進場時間 (Time)</label>
          <input
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded mt-1 font-mono text-gray-600"
=======
      <div ref={formRef} onKeyDown={handleKeyDown} className="space-y-4">

        <div>
          <label className="block text-sm font-bold text-gray-700">
            進場時間 (Time) <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="customTime"
            className="w-full p-2 border border-gray-300 rounded mt-1 font-mono text-gray-600 bg-gray-50"
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
            value={formData.customTime}
            onChange={e => setFormData({ ...formData, customTime: e.target.value })}
            required
          />
        </div>

<<<<<<< HEAD
        {/* 車號 */}
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
=======
        <div className="relative">
          <label className="block text-sm font-bold text-gray-700">
            車號 (Tank ID) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="tankId"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 outline-none uppercase pr-10 ${tankLocation ? 'border-amber-500 ring-1 ring-amber-500' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="例如: TNKU1234567"
              value={formData.tankId}
              onChange={e => setFormData({ ...formData, tankId: e.target.value.toUpperCase() })}
            />
            {isSearching && (
              <div className="absolute right-3 top-3 text-gray-400 animate-pulse">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
            )}
          </div>

          {tankLocation && (
            <div className="mt-1 text-red-600 text-sm font-bold flex items-center animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              目前位於: {tankLocation} (已自動帶入資訊)
            </div>
          )}

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
        </div>

        {/* 內容物 */}
        <div>
          <label className="block text-sm font-bold text-gray-700">內容物 (Content)</label>
          <input
            type="text"
<<<<<<< HEAD
            className="w-full p-2 border border-gray-300 rounded mt-1"
=======
            className="w-full p-2 border border-gray-300 rounded mt-1 transition-colors duration-300"
            style={{ backgroundColor: formData.content ? '#f0f9ff' : 'white' }}
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

<<<<<<< HEAD
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
=======
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

        {/* 🟢 step=10 設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">總重 (Total)</label>
            <input
              type="number"
              step={10}
              className="w-full p-2 border rounded mt-1"
              value={formData.totalWeight}
              onChange={e => setFormData({ ...formData, totalWeight: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">車頭重 (Head)</label>
            <input
              type="number"
              step={10}
              className="w-full p-2 border rounded mt-1"
              value={formData.headWeight}
              onChange={e => setFormData({ ...formData, headWeight: e.target.value })}
            />
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">空櫃重 (Empty)</label>
<<<<<<< HEAD
          <input type="number" step="0.01" className="w-full p-2 border rounded mt-1"
            value={formData.emptyWeight} onChange={e => setFormData({ ...formData, emptyWeight: e.target.value })} />
        </div>

        {/* 淨重 */}
        <div className="bg-blue-50 p-3 rounded text-center">
          <span className="text-gray-600 font-bold">淨重 (Net Weight): </span>
          <span className="text-2xl font-bold text-blue-600">{formData.netWeight}</span>
        </div>

        {/* 備註 */}
=======
          <input
            type="number"
            step={10}
            className="w-full p-2 border rounded mt-1"
            value={formData.emptyWeight}
            onChange={e => setFormData({ ...formData, emptyWeight: e.target.value })}
          />
        </div>

        <div className="bg-blue-50 p-3 rounded text-center">
          <span className="text-gray-600 font-bold">淨重 (Net Weight): </span>
          {/* 🟢 雙重保險：顯示時再次格式化，絕對不顯示長小數 */}
          <span className="text-2xl font-bold text-blue-600">
            {Number(formData.netWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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
<<<<<<< HEAD
          type="submit"
=======
          type="button"
          onClick={handleSubmit}
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
          disabled={loading}
          className={`w-full p-3 text-white font-bold rounded shadow transition 
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? '處理中...' : '確認進場'}
        </button>
<<<<<<< HEAD
      </form>
=======
      </div>
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
    </div>
  );
};

export default Entry;