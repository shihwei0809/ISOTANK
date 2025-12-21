import { AllData, LogEntry, RegistryItem, Tank, User, Zone } from '../types';

// Initial Mock Data
const INITIAL_ZONES: Zone[] = [
  { id: 'Z-01', name: 'A區 (一般)', limit: 20 },
  { id: 'Z-02', name: 'B區 (危險品)', limit: 15 },
  { id: 'Z-03', name: 'C區 (待修)', limit: 10 },
  { id: 'Z-04', name: 'D區 (清洗)', limit: 12 },
];

const INITIAL_INVENTORY: Tank[] = [
  { id: 'TNKU100001', content: 'Latex', weight: 24500, zone: 'Z-01', time: '2023/10/25 10:00', remark: '' },
  { id: 'TNKU100002', content: 'Acetone', weight: 21000, zone: 'Z-02', time: '2023/10/26 14:30', remark: '急件' },
];

const INITIAL_REGISTRY: RegistryItem[] = [
  { id: 'TNKU100001', empty: 3500, content: 'Latex', lastTotal: 28000, lastHead: 0 },
  { id: 'TNKU100002', empty: 3600, content: 'Acetone', lastTotal: 24600, lastHead: 0 },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: '2023/10/25 10:00', tank: 'TNKU100001', action: '進場', zone: 'A區 (一般)', user: 'admin', content: 'Latex', weight: 24500, remark: '' },
  { id: 2, time: '2023/10/26 14:30', tank: 'TNKU100002', action: '進場', zone: 'B區 (危險品)', user: 'admin', content: 'Acetone', weight: 21000, remark: '急件' },
];

const DB_KEYS = {
  ZONES: 'iso_zones',
  INVENTORY: 'iso_inventory',
  LOGS: 'iso_logs',
  REGISTRY: 'iso_registry',
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadFromStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  return JSON.parse(stored);
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  login: async (user: string, pass: string): Promise<{ status: string; user?: string; role?: 'admin' | 'view'; message?: string }> => {
    await delay(800);
    // Simple mock auth
    if (user.toLowerCase() === 'admin' && pass === '1234') return { status: 'success', user: 'AdminUser', role: 'admin' };
    if (user.toLowerCase() === 'view' && pass === '1234') return { status: 'success', user: 'Viewer', role: 'view' };
    return { status: 'error', message: '帳號或密碼錯誤 (測試帳號: admin/1234 或 view/1234)' };
  },

  read: async (): Promise<AllData> => {
    await delay(500);
    return {
      zones: loadFromStorage(DB_KEYS.ZONES, INITIAL_ZONES),
      inventory: loadFromStorage(DB_KEYS.INVENTORY, INITIAL_INVENTORY),
      logs: loadFromStorage(DB_KEYS.LOGS, INITIAL_LOGS),
      registry: loadFromStorage(DB_KEYS.REGISTRY, INITIAL_REGISTRY),
    };
  },

  gateIn: async (data: any): Promise<{ status: string; message: string }> => {
    await delay(1000);
    const zones = loadFromStorage(DB_KEYS.ZONES, INITIAL_ZONES);
    let inventory = loadFromStorage(DB_KEYS.INVENTORY, INITIAL_INVENTORY);
    const logs = loadFromStorage(DB_KEYS.LOGS, INITIAL_LOGS);
    let registry = loadFromStorage(DB_KEYS.REGISTRY, INITIAL_REGISTRY);

    const { id, content, zone, zoneName, netWeight, totalWeight, headWeight, emptyWeight, remark, user, customTime, action } = data;

    // Update Registry if weights provided
    if (emptyWeight) {
      const existingRegIndex = registry.findIndex((r) => r.id === id);
      const newRegItem = { id, empty: emptyWeight, content, lastTotal: totalWeight, lastHead: headWeight };
      if (existingRegIndex >= 0) registry[existingRegIndex] = newRegItem;
      else registry.push(newRegItem);
      saveToStorage(DB_KEYS.REGISTRY, registry);
    }

    const existingIndex = inventory.findIndex((t) => t.id === id);
    const zoneObj = zones.find((z) => z.id === zone);

    if (!zoneObj) return { status: 'error', message: '找不到此區域' };

    // Check capacity
    const zoneCount = inventory.filter((t) => t.zone === zone).length;
    // If moving within same zone or updating, capacity doesn't change
    const isMovingToSame = existingIndex >= 0 && inventory[existingIndex].zone === zone;
    if (!isMovingToSame && zoneCount >= zoneObj.limit) {
      return { status: 'error', message: `區域 ${zoneName} 已滿！` };
    }

    const timeStr = customTime ? customTime.replace('T', ' ') : new Date().toLocaleString();
    const logAction = existingIndex >= 0 ? (inventory[existingIndex].zone === zone ? '更新' : '移區') : '進場';

    const newTank: Tank = {
      id,
      content,
      weight: netWeight,
      zone,
      time: timeStr,
      remark,
    };

    if (existingIndex >= 0) {
      inventory[existingIndex] = newTank;
    } else {
      inventory.push(newTank);
    }

    const newLog: LogEntry = {
      id: Date.now(),
      time: timeStr,
      tank: id,
      action: logAction,
      zone: zoneName,
      user: user || 'Unknown',
      content,
      weight: netWeight,
      total: totalWeight,
      head: headWeight,
      empty: emptyWeight,
      remark,
    };

    logs.push(newLog);

    saveToStorage(DB_KEYS.INVENTORY, inventory);
    saveToStorage(DB_KEYS.LOGS, logs);

    return { status: 'success', message: `槽車 ${id} 作業成功 (${logAction})` };
  },

  delete: async (id: string, zoneName: string, user: string): Promise<{ status: string; message: string }> => {
    await delay(800);
    let inventory = loadFromStorage(DB_KEYS.INVENTORY, INITIAL_INVENTORY);
    const logs = loadFromStorage(DB_KEYS.LOGS, INITIAL_LOGS);

    const tankIndex = inventory.findIndex((t) => t.id === id);
    if (tankIndex === -1) return { status: 'error', message: '找不到此槽車' };

    const tank = inventory[tankIndex];
    inventory = inventory.filter((t) => t.id !== id);

    const newLog: LogEntry = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      tank: id,
      action: '出場',
      zone: zoneName,
      user: user,
      content: tank.content,
      weight: tank.weight,
      remark: '',
    };
    logs.push(newLog);

    saveToStorage(DB_KEYS.INVENTORY, inventory);
    saveToStorage(DB_KEYS.LOGS, logs);

    return { status: 'success', message: '槽車已移出場站' };
  },

  updateSettings: async (zones: Zone[]): Promise<{ status: string; message: string }> => {
    await delay(500);
    saveToStorage(DB_KEYS.ZONES, zones);
    return { status: 'success', message: '設定已儲存' };
  },

  getTankMaintenance: async (id: string): Promise<{ status: string; tank?: any; history?: any[]; message?: string }> => {
    await delay(600);
    const registry = loadFromStorage(DB_KEYS.REGISTRY, INITIAL_REGISTRY);
    const logs = loadFromStorage(DB_KEYS.LOGS, INITIAL_LOGS);

    const regItem = registry.find((r) => r.id === id);
    const tankLogs = logs.filter((l) => l.tank === id).sort((a, b) => b.id - a.id);

    const lastNet = tankLogs.find((l) => ['進場', '移區', '更新'].includes(l.action))?.weight || '無';
    const lastTotal = tankLogs.find((l) => l.total)?.total || 0;
    const lastHead = tankLogs.find((l) => l.head)?.head || 0;

    const tank = {
      id,
      empty: regItem?.empty || '',
      content: regItem?.content || '',
      lastNet,
      lastTotal,
      lastHead,
    };

    const history = tankLogs.map((l) => ({
      date: l.time.split(' ')[0],
      net: l.weight,
      action: l.action,
    }));

    return { status: 'success', tank, history };
  },

  updateRegistryData: async (data: any): Promise<{ status: string; message: string }> => {
    await delay(800);
    const { id, empty, content, total, head, remark, user } = data;
    let registry = loadFromStorage(DB_KEYS.REGISTRY, INITIAL_REGISTRY);
    const logs = loadFromStorage(DB_KEYS.LOGS, INITIAL_LOGS);
    let inventory = loadFromStorage(DB_KEYS.INVENTORY, INITIAL_INVENTORY);
    const zones = loadFromStorage(DB_KEYS.ZONES, INITIAL_ZONES);

    // Update Registry
    const regIndex = registry.findIndex((r) => r.id === id);
    const newReg = { id, empty, content, lastTotal: total, lastHead: head };
    if (regIndex >= 0) registry[regIndex] = newReg;
    else registry.push(newReg);
    saveToStorage(DB_KEYS.REGISTRY, registry);

    // Update Inventory if exists
    const invIndex = inventory.findIndex((t) => t.id === id);
    if (invIndex >= 0) {
      const activeTank = inventory[invIndex];
      const newNet = Math.max(0, (parseFloat(total) || 0) - (parseFloat(head) || 0) - (parseFloat(empty) || 0));
      
      const zoneName = zones.find(z => z.id === activeTank.zone)?.name || activeTank.zone;

      inventory[invIndex] = {
        ...activeTank,
        content,
        weight: newNet,
        remark: remark || activeTank.remark,
      };
      saveToStorage(DB_KEYS.INVENTORY, inventory);

      // Add Log
      logs.push({
        id: Date.now(),
        time: new Date().toLocaleString(),
        tank: id,
        action: '更新',
        zone: zoneName,
        user,
        content,
        weight: newNet,
        total,
        head,
        empty,
        remark,
      });
      saveToStorage(DB_KEYS.LOGS, logs);
    }

    return { status: 'success', message: '基本資料更新成功' };
  },
};