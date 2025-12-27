export interface Zone {
  id: string;
  name: string;
  limit?: number; // V6: 支援動態容量
}

export interface InventoryItem {
  id: string;
  content: string;
  zone: string;
  time: string;
  weight?: number;
  remark?: string;
  slot?: string; // V6: 支援儲位
}

export interface LogEntry {
  id: number; // Supabase ID
  time: string;
  tank: string;
  action: string;
  content: string;
  zone: string;
  slot?: string; // V6
  weight?: number | string; // 兼容 string 以防萬一
  total?: number | string;
  head?: number | string;
  empty?: number | string;
  remark?: string;
  user: string;
}

export interface RegistryItem {
  id: string;
  empty: number | string;
  content: string;
  lastTotal?: number | string;
  lastHead?: number | string;
}

export interface DashboardStats {
  totalCapacity: number;
  currentInventory: number;
}

// 核心修改：統一的使用者介面
export interface User {
  id: string;          // 統一使用 id，不使用 user
  name?: string;
  role: 'admin' | 'op' | 'view';
  isSuper: boolean;    // 統一使用 boolean
}

// 統一的 API 回傳格式
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  zones?: Zone[];
  inventory?: InventoryItem[];
  logs?: LogEntry[];
  registry?: RegistryItem[];
  users?: User[];      // 使用上面定義的 User
  tank?: any;
  history?: any[];
  user?: string;       // 登入回傳用
  role?: string;
  isSuper?: boolean;
}

export interface AllData {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: LogEntry[];
  registry: RegistryItem[];
}

export interface TankMaintenanceData {
  id: string;
  empty: number | string;
  content: string;
  lastNet: number | string;
  lastTotal: number | string;
  lastHead: number | string;
  zoneName?: string;
}