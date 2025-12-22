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

  // 重量相關
  const [total, setTotal] = useState('');
  const [head, setHead] = useState('');
  const [empty, setEmpty] = useState(''); // 空櫃重
  const [net, setNet] = useState(0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

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
    // 淨重 = 總重 - 車頭 - 空櫃
    const val = t - h - e;
    setNet(val > 0 ? val : 0);
  }, [total, head, empty]);

  // ★★★ 即時查詢功能 (已修正：加入總重 total 的自動帶入) ★★★
  useEffect(() => {
    const timer = setTimeout(async () => {
      const searchId = id.trim();
      if (!searchId || searchId.length < 2) return;

      const res = await api.getTankMaintenance(searchId);

      if (res.status === 'success' && res.tank) {
        // 自動填入資料
        if (res.tank.content) setContent(res.tank.content);
        if (res.tank.lastHead) setHead(String(res.tank.lastHead));
        if (res.tank.empty) setEmpty(String(res.tank.empty));

        // --- 新增這行：如果有上次總重，也自動帶入 ---
        if (res.tank.lastTotal) setTotal(String(res.tank.lastTotal));
      }
    }, 500); // 延遲 0.5 秒

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
      setId('');
      setTotal(''); // 進場成功後清空，避免混淆下一筆
      // setContent(''); 
      onRefresh();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center mb-6 border-b pb-4">
          <i className="fa-solid fa-truck-moving text-2xl text-amber-500 mr-3"></i>
          <h2 className="text-xl font-bold text-slate-800">槽車進場作業</h2>
        </div>

        {msg.text && (
          <div className={`p-4 mb-4 rounded-lg text-center font-bold ${msg.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">進場時間 (Time) *</label>
            <input
              type="text"
              value={new Date().toLocaleString()}
              disabled
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">車號 (Tank ID) *</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="例如: TNKU1234567"
              required
            />
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

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">區域 (Zone)</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">總重 (Total)</label>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
                placeholder="過磅總重"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">車頭重 (Head)</label>
              <input
                type="number"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
                placeholder="車頭重量"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">空櫃重 (Empty)</label>
            <input
              type="number"
              value={empty}
              onChange={(e) => setEmpty(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="槽體空重"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
            <span className="text-blue-800 font-bold">淨重 (Net Weight):</span>
            <span className="text-2xl font-bold text-blue-600">{net} <span className="text-sm">kg</span></span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 mt-4 text-white font-bold rounded-lg shadow-lg transition flex justify-center items-center
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-check mr-2"></i>}
            {loading ? '處理中...' : '確認進場'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Entry;