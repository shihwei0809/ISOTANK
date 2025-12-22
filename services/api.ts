import { supabase } from '../supabaseClient';
import { AllData } from '../types';

export const api = {
<<<<<<< HEAD
  // 1. 登入 (修正版)
=======
  // 1. 登入 (Login)
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
  login: async (user: string, pass: string) => {
    // 模擬網路延遲，讓使用者感覺有在運算
    await new Promise(r => setTimeout(r, 500));

    try {
      // 去除前後空白，避免複製貼上時多餘的空格導致錯誤
      const cleanUser = user.trim();
      const cleanPass = pass.trim();

      const { data, error } = await supabase
        .from('users')
        .select('*')
<<<<<<< HEAD
        .eq('id', cleanUser) // 修正：移除 .toLowerCase()，支援大寫帳號如 C0664
        .eq('password', cleanPass)
=======
        .eq('id', user) // 移除 .toLowerCase()，支援大小寫
        .eq('password', pass)
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
        .single();

      if (error || !data) {
        console.log("登入失敗詳細原因:", error); // 方便除錯
        return { status: 'error', message: '帳號或密碼錯誤' };
      }

      // 回傳 id 當作 user 識別，同時回傳 name 供顯示
      return {
        status: 'success',
        user: data.id,
        name: data.name,
        role: data.role as 'admin' | 'view'
      };
    } catch (e) {
      return { status: 'error', message: '登入驗證失敗' };
    }
  },

<<<<<<< HEAD
  // 新增：註冊功能 (配合新的 Login.tsx)
  register: async (user: string, pass: string, name: string) => {
    try {
      const cleanUser = user.trim();
      const cleanPass = pass.trim();
      const cleanName = name.trim();

      // 1. 先檢查帳號是否重複
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', cleanUser)
        .single();

      if (existing) {
        return { status: 'error', message: '此帳號已被使用' };
      }

      // 2. 寫入新帳號
      const { error } = await supabase
        .from('users')
        .insert([
          {
            id: cleanUser,
            password: cleanPass,
            name: cleanName,
            role: 'view' // 預設權限為 view，之後可由管理員手動改 admin
          }
        ]);

      if (error) {
        console.error(error);
        return { status: 'error', message: '註冊寫入失敗' };
      }

      return { status: 'success' };
    } catch (e) {
      return { status: 'error', message: '系統錯誤' };
=======
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
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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
<<<<<<< HEAD

=======
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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
<<<<<<< HEAD
    const { id, empty, content, total, head, remark, user } = data;
=======
    const { id, empty, content, total, head } = data;
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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
      // Return full object structure even on error to avoid union type issues
      const tank = {
        id,
        empty: '',
        content: '',
        lastNet: 0,
        lastTotal: '',
        lastHead: '',
      };
      return { status: 'success', tank, history: [] };
    }
  }
};
