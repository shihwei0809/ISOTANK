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
  const [slot, setSlot] = useState(''); // 儲位
  const [remark, setRemark] = useState('');

  // ★ 修改：新增自訂時間 State
  const [customTime, setCustomTime] = useState('');

  // 重量相關
  const [total, setTotal] = useState('');
  const [head, setHead] = useState('');
  const [empty, setEmpty] = useState('');
  const [net, setNet] = useState(0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [dataFound, setDataFound] = useState(false);

  // 初始化：預設選第一個區域
  useEffect(() => {
    if (zones.length > 0 && !zone) {
      setZone(zones[0].id);
    }
  }, [zones, zone]);

  // ★ 修改：初始化時間為「現在」(格式：YYYY-MM-DDTHH:mm)
  useEffect(() => {
    const now = new Date();
    // 調整時區以符合 datetime-local 格式
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setCustomTime(now.toISOString().slice(0, 16));
  }, []);

  // 自動計算淨重
  useEffect(() => {
    const t = parseFloat(total) || 0;
    const h = parseFloat(head) || 0;
    const e = parseFloat(empty) || 0;
    const val = t - h - e;
    setNet(val > 0 ? val : 0);
  }, [total, head, empty]);

  // 即時查詢功能
  useEffect(() => {
    const timer = setTimeout(async () => {
      const searchId = id.trim();
      if (!searchId || searchId.length < 3) {
        setDataFound(false);
        return;
      }

      const res = await api.getTankMaintenance(searchId);

      if (res.status === 'success' && res.tank) {
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

    // ★ 修改：使用使用者選擇的時間，若無則用現在時間
    const submitTime = customTime ? new Date(customTime).toISOString() : new Date().toISOString();

    const data = {
      id: id.toUpperCase(),
      content,
      zone,
      zoneName: currentZoneName,
      slot: slot.toUpperCase(),
      remark,
      totalWeight: parseFloat(total) || 0,
      headWeight: parseFloat(head) || 0,
      emptyWeight: parseFloat(empty) || 0,
      netWeight: net,
      user,
      customTime: submitTime // 傳送選擇的時間
    };

    const res = await api.gateIn(data);

    if (res.status === 'success') {
      setMsg({ type: 'success', text: res.message });
      setId('');
      setTotal('');
      setRemark('');
      setSlot('');
      setDataFound(false);

      // 重設時間為當下，方便下一筆作業
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setCustomTime(now.toISOString().slice(0, 16));

      onRefresh();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">

      {msg.text && (
        <div className={`p-4 mb-4 rounded-lg text-center font-bold flex items-center justify-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
          <i className={`fa-solid ${msg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">

        {/* 第一列：時間 (可選)、車號、區域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">作業時間</label>
            <div className="relative">
              {/* ★ 修改：改為 datetime-local 輸入框 */}
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-amber-500 transition cursor-pointer"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-bold text-slate-600 mb-1">槽號 *</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition font-mono font-bold text-slate-700"
              placeholder="輸入車號 (如: E61)"
              required
            />
            {dataFound && (
              <div className="text-xs text-red-500 mt-1 flex items-center absolute right-0 -bottom-5">
                <i className="fa-solid fa-circle-info mr-1"></i> 已自動帶入歷史資訊
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">存放區域 *</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white font-bold text-slate-700"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 第二列：內容物、儲位、備註 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">內容物</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition font-bold text-slate-700"
              placeholder="化學品名稱"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">儲位 (Slot)</label>
            <input
              type="text"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="選填 (如: A-01)"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">備註</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="選填備註"
            />
          </div>
        </div>

        {/* 第三列：重量資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">總重</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-center font-bold text-lg"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">車頭重</label>
            <input
              type="number"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-center font-bold text-lg"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">空櫃重</label>
            <input
              type="number"
              value={empty}
              onChange={(e) => setEmpty(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-center font-bold text-lg"
              placeholder="0"
            />
          </div>
          {/* 淨重顯示區塊 */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center justify-center h-[82px]">
            <span className="text-blue-800 font-bold text-sm mb-1">淨重 (Net)</span>
            <span className="text-3xl font-black text-blue-600">{net.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-4 text-white font-bold rounded-lg shadow-lg transition flex justify-center items-center text-lg
            ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl'}`}
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
          確認作業
        </button>

      </form>
    </div>
  );
};

export default Entry;