import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Zone, InventoryItem } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: InventoryItem[];
  onRefresh: () => void;
  user: string;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, onRefresh, user }) => {
  // --- State 定義 ---
  const [id, setId] = useState('');
  const [content, setContent] = useState('');
  const [zone, setZone] = useState('');
  const [slot, setSlot] = useState(''); // 新增：儲位

  // 重量相關
  const [total, setTotal] = useState('');
  const [head, setHead] = useState('');
  const [empty, setEmpty] = useState('');
  const [net, setNet] = useState(0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [dataFound, setDataFound] = useState(false); // 用於顯示是否找到舊資料

  // 初始化：預設選第一個區域
  useEffect(() => {
    if (zones.length > 0 && !zone) {
      setZone(zones[0].id);
    }
  }, [zones, zone]);

  // 自動計算淨重
  useEffect(() => {
    const t = parseFloat(total) || 0;
    const h = parseFloat(head) || 0;
    const e = parseFloat(empty) || 0;
    const val = t - h - e;
    setNet(val > 0 ? val : 0);
  }, [total, head, empty]);

  // ★★★ 即時查詢功能 ★★★
  useEffect(() => {
    const timer = setTimeout(async () => {
      const searchId = id.trim();
      if (!searchId || searchId.length < 4) { // 改為 4 碼才觸發，減少請求
        setDataFound(false);
        return;
      }

      const res = await api.getTankMaintenance(searchId);

      if (res.status === 'success' && res.tank) {
        // 自動填入資料
        if (res.tank.content) setContent(res.tank.content);
        if (res.tank.lastHead) setHead(String(res.tank.lastHead));
        if (res.tank.empty) setEmpty(String(res.tank.empty));
        if (res.tank.lastTotal) setTotal(String(res.tank.lastTotal));
        setDataFound(true);
      } else {
        setDataFound(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !zone) {
      setMsg({ type: 'error', text: '請填寫完整資訊 (車號、區域)' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    const currentZoneName = zones.find(z => z.id === zone)?.name || zone;

    const data = {
      id: id.toUpperCase(),
      content,
      zone,
      zoneName: currentZoneName,
      slot: slot.toUpperCase(), // 傳送儲位資料
      totalWeight: parseFloat(total) || 0,
      headWeight: parseFloat(head) || 0,
      emptyWeight: parseFloat(empty) || 0,
      netWeight: net,
      user,
      customTime: new Date().toISOString()
    };

    const res = await api.gateIn(data);

    if (res.status === 'success') {
      setMsg({ type: 'success', text: res.message });
      // 保留部分欄位方便連續輸入，清空關鍵欄位
      setId('');
      setTotal('');
      setSlot('');
      setDataFound(false);
      onRefresh();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center">
            <i className="fa-solid fa-truck-ramp-box text-2xl text-amber-500 mr-3"></i>
            <h2 className="text-xl font-bold text-slate-800">ISO TANK 進場作業</h2>
          </div>
          <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
            Version 9.1
          </div>
        </div>

        {msg.text && (
          <div className={`p-4 mb-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
            <i className={`fa-solid ${msg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 車號輸入區 */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-600 mb-1">車號 (Tank ID) *</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())} // 強制大寫
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition font-mono text-lg"
              placeholder="例如: TNKU1234567"
              required
            />
            {dataFound && (
              <div className="absolute top-0 right-0 mt-8 mr-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 animate-pulse">
                <i className="fa-solid fa-clock-rotate-left mr-1"></i> 已帶入歷史資料
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">內容物 (Content)</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="請輸入化學品名稱"
            />
          </div>

          {/* 區域與儲位 (並排) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">區域 (Zone) *</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">儲位 (Slot)</label>
              <input
                type="text"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
                placeholder="例如: A-01"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">重量資訊 (Weight Info)</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">總重 (Total)</label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">車頭 (Head)</label>
                <input
                  type="number"
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">空櫃 (Empty)</label>
                <input
                  type="number"
                  value={empty}
                  onChange={(e) => setEmpty(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-bold text-sm">計算淨重 (Net):</span>
              <span className="text-3xl font-black text-slate-800">{net.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span></span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center transform active:scale-95
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl'}`}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-check mr-2"></i>}
            {loading ? '資料處理中...' : '確認進場 (GATE IN)'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Entry;