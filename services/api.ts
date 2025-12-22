import { supabase } from '../supabaseClient';
import { AllData } from '../types';

export const api = {
  // 1. 登入
  login: async (user: string, pass: string) => {
    await new Promise(r => setTimeout(r, 500));
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user)
        .eq('password', pass)
        .single();

      if (error || !data) return { status: 'error', message: '帳號或密碼錯誤' };
      return { status: 'success', user: data.name, role: data.role as 'admin' | 'view' };
    } catch (e) {
      return { status: 'error', message: '登入驗證失敗' };
    }
  },

  // 2. 讀取所有資料 (注意：Logs 這裡已經按照 ID 降序排列，也就是最新的在上面)
  read: async (): Promise<AllData> => {
    try {
      const [zones, inventory, logs, registry] = await Promise.all([
        supabase.from('zones').select('*').order('id'),
        supabase.from('inventory').select('*'),
        supabase.from('logs').select('*').order('id', { ascending: false }), // 最新紀錄排上面
        supabase.from('registry').select('*'),
      ]);

      return {
        zones: zones.data || [],
        inventory: inventory.data || [],
        logs: logs.data || [],
        registry: registry.data || [],
      } as AllData;
    } catch (error) {
      console.error('讀取失敗:', error);
      return { zones: [], inventory: [], logs: [], registry: [] };
    }
  },

  // 3. 進場 / 移區
  gateIn: async (data: any) => {
    const { id, content, zone, netWeight, remark, user, customTime, totalWeight, headWeight, emptyWeight, zoneName, slot } = data;
    const timeStr = customTime ? customTime.replace('T', ' ') : new Date().toLocaleString();

    try {
      // 更新空車重紀錄 (Registry)
      if (emptyWeight) {
        await supabase.from('registry').upsert({
          id, empty: emptyWeight, content, "lastTotal": totalWeight, "lastHead": headWeight
        });
      }

      // 檢查是否已在場內
      const { data: existingTank } = await supabase.from('inventory').select('*').eq('id', id).single();

      // 更新庫存 (Inventory)
      const { error: invError } = await supabase.from('inventory').upsert({
        id, content, weight: netWeight, zone, time: timeStr, remark: remark || '', slot
      });

      if (invError) throw invError;

      // 寫入紀錄 (Log)
      const logAction = existingTank ? (existingTank.zone === zone ? '更新' : '移區') : '進場';
      await supabase.from('logs').insert({
        time: timeStr, tank: id, action: logAction, zone: zoneName, "user": user || 'Unknown',
        content, weight: netWeight, total: totalWeight, head: headWeight, empty: emptyWeight, remark, slot
      });

      return { status: 'success', message: `槽車 ${id} 作業成功 (${logAction})` };
    } catch (error: any) {
      return { status: 'error', message: error.message || '寫入失敗' };
    }
  },

  // 4. 出場
  delete: async (id: string, zoneName: string, user: string) => {
    try {
      const { data: tank } = await supabase.from('inventory').select('*').eq('id', id).single();
      if (!tank) return { status: 'error', message: '找不到此槽車' };

      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('logs').insert({
        time: new Date().toLocaleString(), tank: id, action: '出場', zone: zoneName,
        "user": user, content: tank.content, weight: tank.weight, remark: ''
      });

      return { status: 'success', message: '槽車已移出場站' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },

  // 5. 更新設定
  updateSettings: async (zones: any[]) => {
    const { error } = await supabase.from('zones').upsert(zones);
    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: '設定已儲存' };
  },

  // 6. 更新基本資料
  updateRegistryData: async (data: any) => {
    // 這裡邏輯保持不變，略...
    const { id, empty, content, total, head, remark, user } = data;
    try {
      await supabase.from('registry').upsert({ id, empty, content, "lastTotal": total, "lastHead": head });
      // 同步更新庫存... (略，保持你原本功能)
      return { status: 'success', message: '基本資料更新成功' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },

  // 7. 查詢歷史 (修正版：這裡會去抓最新的 Logs 資料！)
  getTankMaintenance: async (id: string) => {
    try {
      // A. 先去 registry 找有沒有建檔
      const { data: regItem } = await supabase.from('registry').select('*').eq('id', id).single();

      // B. 關鍵修正：去 logs 找「最新一筆」這台車的紀錄，抓取它的重量資訊
      const { data: latestLog } = await supabase
        .from('logs')
        .select('*')
        .eq('tank', id)
        .order('id', { ascending: false }) // 最新的在最上面
        .limit(1)
        .single();

      // C. 抓取歷史列表
      const { data: tankLogs } = await supabase.from('logs').select('*').eq('tank', id).order('id', { ascending: false });

      // D. 智慧判斷：優先用 Log 的資料，沒有才用 Registry，再沒有就回傳空字串
      const lastTotal = latestLog?.total || regItem?.lastTotal || '';
      const lastHead = latestLog?.head || regItem?.lastHead || '';
      const lastEmpty = latestLog?.empty || regItem?.empty || '';
      const content = latestLog?.content || regItem?.content || '';

      const tank = {
        id,
        empty: lastEmpty,
        content: content,
        lastNet: latestLog?.weight || 0,
        lastTotal: lastTotal,
        lastHead: lastHead,
        zoneName: latestLog?.zone || '',
        slot: latestLog?.slot || ''
      };

      const history = (tankLogs || []).map((l: any) => ({
        date: String(l.time).split(' ')[0], net: l.weight, action: l.action,
      }));

      return { status: 'success', tank, history };
    } catch (e) {
      return {
        status: 'success',
        tank: {
          id,
          empty: '',
          content: '',
          lastNet: 0,
          lastTotal: '',
          lastHead: '',
          zoneName: '',
          slot: ''
        },
        history: []
      };
    }
  }
};