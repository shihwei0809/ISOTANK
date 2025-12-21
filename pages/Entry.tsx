import React, { useState, useEffect } from 'react';
import { Tank, Zone, RegistryItem, LogEntry } from '../types';

interface EntryProps {
  zones: Zone[];
  inventory: Tank[];
  logs: LogEntry[];
  registry: RegistryItem[];
  isAdmin: boolean;
  user: string;
  onEntry: (data: any) => Promise<void>;
}

const Entry: React.FC<EntryProps> = ({ zones, inventory, logs, registry, isAdmin, user, onEntry }) => {
  const [formData, setFormData] = useState({
    time: '',
    tankId: '',
    content: '',
    zone: '',
    total: '',
    head: '',
    empty: '',
    remark: '',
  });

  const [autoMsg, setAutoMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Set default time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData((prev) => ({ ...prev, time: now.toISOString().slice(0, 16), zone: zones[0]?.id || '' }));
  }, [zones]);

  const handleTankIdChange = (val: string) => {
    const cleanVal = val.toUpperCase().trim();
    setFormData((prev) => ({ ...prev, tankId: cleanVal }));

    if (cleanVal.length < 3) {
      setFormData((prev) => ({ ...prev, empty: '', content: '', total: '', head: '', remark: '' }));
      setAutoMsg(null);
      return;
    }

    const inStock = inventory.find((t) => t.id === cleanVal);
    let msg: { type: 'error' | 'success' | 'info'; text: string } | null = null;
    let newContent = '';
    let newEmpty = '';
    let newRemark = '';
    let newTotal = '';
    let newHead = '';

    if (inStock) {
      const zName = zones.find((z) => z.id === inStock.zone)?.name || inStock.zone;
      msg = { type: 'error', text: `目前位於：${zName}` };
      newContent = inStock.content;
      newRemark = inStock.remark || '';
    }

    const reg = registry.find((r) => r.id === cleanVal);
    if (reg) {
      newEmpty = reg.empty.toString();
      if (!newContent) newContent = reg.content;
      if (!msg) msg = { type: 'success', text: '找到歷史資料' };
    }

    // Find last log for defaults if not in stock
    if (!inStock) {
      // Search in logs (sort by time desc first to be safe)
      const sortedLogs = [...logs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      // Find latest non-empty values independently
      const lastTotalLog = sortedLogs.find(l => l.tank === cleanVal && l.total && Number(l.total) > 0);
      const lastHeadLog = sortedLogs.find(l => l.tank === cleanVal && l.head && Number(l.head) > 0);
      const lastEmptyLog = sortedLogs.find(l => l.tank === cleanVal && l.empty && Number(l.empty) > 0);

      if (lastTotalLog || lastHeadLog || lastEmptyLog) {
        newTotal = lastTotalLog?.total?.toString() || '';
        newHead = lastHeadLog?.head?.toString() || '';
        newEmpty = lastEmptyLog?.empty?.toString() || '';
        if (!msg) msg = { type: 'success', text: '找到歷史資料' };
      }
    }

    setFormData((prev) => ({
      ...prev,
      content: prev.content || newContent,
      empty: prev.empty || newEmpty,
      remark: prev.remark || newRemark,
      total: prev.total || newTotal,
      head: prev.head || newHead,
    }));

    setAutoMsg(inStock ? { ...msg!, text: msg!.text + ' (自動填入)' } : (msg || { type: 'info', text: '新槽車 (無紀錄)' }));
  };

  const netWeight = Math.max(0, (parseFloat(formData.total) || 0) - (parseFloat(formData.head) || 0) - (parseFloat(formData.empty) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const zoneObj = zones.find(z => z.id === formData.zone);

    await onEntry({
      id: formData.tankId,
      content: formData.content,
      zone: formData.zone,
      zoneName: zoneObj?.name || formData.zone,
      netWeight,
      emptyWeight: formData.empty,
      totalWeight: formData.total,
      headWeight: formData.head,
      remark: formData.remark,
      customTime: formData.time,
      user: user
    });

    // Reset form partially
    setFormData(prev => ({
      ...prev,
      tankId: '',
      content: '',
      total: '',
      head: '',
      empty: '',
      remark: '',
    }));
    setAutoMsg(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
      {!isAdmin && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold">
          僅供檢視 (Read Only)
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-bold block mb-1 text-slate-600">時間 (Time)</label>
          <input
            type="datetime-local"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none transition text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            disabled={!isAdmin}
            required
          />
        </div>

        <div>
          <label className="font-bold block mb-1 text-slate-600">槽號 (Tank ID)</label>
          <input
            type="text"
            value={formData.tankId}
            onChange={(e) => handleTankIdChange(e.target.value)}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg uppercase focus:border-amber-500 outline-none transition text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            placeholder="例如: TNKU1234567"
            disabled={!isAdmin}
            required
          />
          <div className="h-5 mt-1 text-sm font-bold flex items-center">
            {autoMsg && (
              <span className={autoMsg.type === 'error' ? 'text-red-600' : autoMsg.type === 'success' ? 'text-green-600' : 'text-slate-500'}>
                {autoMsg.type === 'error' && <i className="fa-solid fa-triangle-exclamation mr-1"></i>}
                {autoMsg.type === 'success' && <i className="fa-solid fa-check mr-1"></i>}
                {autoMsg.text}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="font-bold block mb-1 text-slate-600">內容物 (Content)</label>
          <input
            type="text"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            disabled={!isAdmin}
            required
          />
        </div>

        <div>
          <label className="font-bold block mb-1 text-slate-600">區域 (Zone)</label>
          <select
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg bg-white focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            disabled={!isAdmin}
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
            <label className="font-bold block mb-1 text-slate-600">總重 (Total Weight)</label>
            <input
              type="number"
              step="10"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
              disabled={!isAdmin}
            />
          </div>
          <div>
            <label className="font-bold block mb-1 text-slate-600">車頭重 (Head Weight)</label>
            <input
              type="number"
              step="10"
              value={formData.head}
              onChange={(e) => setFormData({ ...formData, head: e.target.value })}
              className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
              disabled={!isAdmin}
            />
          </div>
        </div>

        <div>
          <label className="font-bold block mb-1 text-slate-600">空櫃重 (Empty Weight)</label>
          <input
            type="number"
            value={formData.empty}
            onChange={(e) => setFormData({ ...formData, empty: e.target.value })}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            disabled={!isAdmin}
          />
        </div>

        <div>
          <label className="font-bold block mb-1 text-slate-600">備註 (Remark)</label>
          <input
            type="text"
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            className={`w-full border-2 border-slate-200 p-3 rounded-lg focus:border-amber-500 outline-none text-black ${!isAdmin ? 'bg-slate-100' : 'bg-white'}`}
            placeholder="選填 (Optional)"
            disabled={!isAdmin}
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
          <span className="text-slate-600 font-bold">淨重 (Net Weight)</span>
          <span className="text-2xl font-bold text-blue-600">{netWeight.toLocaleString()}</span>
        </div>

        {isAdmin && (
          <button
            type="submit"
            className="w-full bg-slate-900 text-white p-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition shadow-lg mt-4"
          >
            確認作業 (進場 / 更新 / 移區)
          </button>
        )}
      </form>
    </div>
  );
};

export default Entry;