import { supabase } from '../supabaseClient';
import { AllData } from '../types';

export const api = {
  // 1. 登入 (Login)
  login: async (user: string, pass: string) => {
    await new Promise(r => setTimeout(r, 500));
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user) // 移除 .toLowerCase()，支援大小寫
        .eq('password', pass)
        .single();

      if (error || !data) return { status: 'error', message: '帳號或密碼錯誤' };
      return { status: 'success', user: data.name, role: data.role as 'admin' | 'view' };
    } catch (e) {
      return { status: 'error', message: '登入驗證失敗' };
    }
  },

  // 🔴 新增：註冊功能 (Register)
  register: async (id: string, pass: string, name: string) => {
    try {
      // A. 檢查帳號是否已經存在
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();

      if (existing) {
        return { status: 'error', message: '此帳號 ID 已經被註冊過了' };
      }

      // B. 新增帳號 (預設權限為 view)
      const { error } = await supabase.from('users').insert({
        id: id,
        password: pass,
        name: name,
        role: 'view' // 預設大家都是檢視者，需要管理員權限再去資料庫改
      });

      if (error) throw error;
      return { status: 'success', message: '註冊成功！請直接登入' };

    } catch (error: any) {
      return { status: 'error', message: error.message || '註冊失敗' };
    }
  },

  // 2. 讀取所有資料
  read: async (): Promise<AllData> => {
    try {
      const [zones, inventory, logs, registry] = await Promise.all([
        supabase.from('zones').select('*').order('id'),
        supabase.from('inventory').select('*'),
        supabase.from('logs').select('*').order('id', { ascending: false }),
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
    const { id, content, zone, netWeight, remark, user, customTime, totalWeight, headWeight, emptyWeight, zoneName } = data;
    const timeStr = customTime ? customTime.replace('T', ' ') : new Date().toLocaleString();

    try {
      if (emptyWeight) {
        await supabase.from('registry').upsert({
          id, empty: emptyWeight, content, "lastTotal": totalWeight, "lastHead": headWeight
        });
      }

      const { data: existingTank } = await supabase.from('inventory').select('*').eq('id', id).single();
      const { error: invError } = await supabase.from('inventory').upsert({
        id, content, weight: netWeight, zone, time: timeStr, remark: remark || ''
      });

      if (invError) throw invError;

      const logAction = existingTank ? (existingTank.zone === zone ? '更新' : '移區') : '進場';
      await supabase.from('logs').insert({
        time: timeStr, tank: id, action: logAction, zone: zoneName, "user": user || 'Unknown',
        content, weight: netWeight, total: totalWeight, head: headWeight, empty: emptyWeight, remark
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
    const { id, empty, content, total, head } = data;
    try {
      await supabase.from('registry').upsert({ id, empty, content, "lastTotal": total, "lastHead": head });
      return { status: 'success', message: '基本資料更新成功' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },

  // 7. 查詢歷史
  getTankMaintenance: async (id: string) => {
    try {
      const { data: regItem } = await supabase.from('registry').select('*').eq('id', id).single();

      const { data: latestLog } = await supabase
        .from('logs')
        .select('*')
        .eq('tank', id)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      const { data: tankLogs } = await supabase.from('logs').select('*').eq('tank', id).order('id', { ascending: false });

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
      };

      const history = (tankLogs || []).map((l: any) => ({
        date: String(l.time).split(' ')[0], net: l.weight, action: l.action,
      }));

      return { status: 'success', tank, history };
    } catch (e) {
      return { status: 'success', tank: { id }, history: [] };
    }
  }
};