// ../supabaseClient 代表往上一層找，剛好會找到我們剛建在根目錄的檔案
import { supabase } from '../supabaseClient';
import { AllData } from '../types';

export const api = {
  // 1. 登入功能 (改為讀取 Supabase users 資料表)
  login: async (user: string, pass: string) => {
    try {
      // 去資料庫找看看有沒有這個帳號 (轉小寫比對) 且 密碼正確
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.toLowerCase())
        .eq('password', pass)
        .single();

      if (error || !data) {
        // 找不到或錯誤
        return { status: 'error', message: '帳號或密碼錯誤' };
      }

      // 登入成功，回傳資料庫裡的名稱和權限
      return {
        status: 'success',
        user: data.name,
        role: data.role as 'admin' | 'view'
      };
    } catch (e) {
      return { status: 'error', message: '登入驗證失敗' };
    }
  },

  // 2. 讀取資料 (從 Supabase)
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
      // 更新空車重紀錄
      if (emptyWeight) {
        await supabase.from('registry').upsert({
          id, empty: emptyWeight, content, "lastTotal": totalWeight, "lastHead": headWeight
        });
      }

      // 檢查是否已在場內
      const { data: existingTank } = await supabase.from('inventory').select('*').eq('id', id).single();

      // 更新庫存
      const { error: invError } = await supabase.from('inventory').upsert({
        id, content, weight: netWeight, zone, time: timeStr, remark: remark || ''
      });

      if (invError) throw invError;

      // 寫入紀錄 (Log)
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
    const { id, empty, content, total, head, remark, user } = data;
    try {
      await supabase.from('registry').upsert({ id, empty, content, "lastTotal": total, "lastHead": head });

      const { data: activeTank } = await supabase.from('inventory').select('*').eq('id', id).single();
      if (activeTank) {
        const newNet = Math.max(0, (parseFloat(total) || 0) - (parseFloat(head) || 0) - (parseFloat(empty) || 0));
        await supabase.from('inventory').update({
          content, weight: newNet, remark: remark || activeTank.remark
        }).eq('id', id);

        const { data: zoneData } = await supabase.from('zones').select('name').eq('id', activeTank.zone).single();
        await supabase.from('logs').insert({
          time: new Date().toLocaleString(), tank: id, action: '更新', zone: zoneData?.name || activeTank.zone,
          "user": user, content, weight: newNet, total, head, empty, remark
        });
      }
      return { status: 'success', message: '基本資料更新成功' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },

  // 7. 查詢歷史
  getTankMaintenance: async (id: string) => {
    const { data: regItem } = await supabase.from('registry').select('*').eq('id', id).single();
    const { data: tankLogs } = await supabase.from('logs').select('*').eq('tank', id).order('id', { ascending: false });

    if (!tankLogs) return { status: 'success', tank: { id }, history: [] };

    const lastNet = tankLogs.find((l: any) => ['進場', '移區', '更新'].includes(l.action))?.weight || '無';
    const lastTotal = tankLogs.find((l: any) => l.total)?.total || 0;
    const lastHead = tankLogs.find((l: any) => l.head)?.head || 0;
    // Fallback to history if not in registry
    const lastEmpty = tankLogs.find((l: any) => l.empty)?.empty || '';

    const tank = {
      id, empty: regItem?.empty || lastEmpty, content: regItem?.content || '',
      lastNet, lastTotal, lastHead,
    };

    const history = tankLogs.map((l: any) => ({
      date: String(l.time).split(' ')[0], net: l.weight, action: l.action,
    }));
    return { status: 'success', tank, history };
  }
};