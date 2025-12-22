export interface User {
  username: string;
  role: 'admin' | 'view';
}

export interface Zone {
  id: string;
  name: string;
  limit: number;
}

export interface Tank {
  id: string;
  content: string;
  weight: number | string;
  zone: string; // This maps to Zone ID or Name depending on context, normalized to Zone ID in our app
  zoneName?: string;
  time: string;
  remark?: string;
  slot?: string;
}

export type InventoryItem = Tank;

export interface LogEntry {
  id: number;
  time: string;
  tank: string;
  action: '進場' | '出場' | '移區' | '更新';
  zone: string;
  user: string;
  content: string;
  weight: number | string;
  total?: number | string;
  head?: number | string;
  empty?: number | string;
  remark?: string;
  slot?: string;
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

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface AllData {
  zones: Zone[];
  inventory: Tank[];
  logs: LogEntry[];
  registry: RegistryItem[];
}

export type InventoryItem = Tank;

export interface TankMaintenanceData {
  id: string;
  empty: number | string;
  content: string;
  lastNet: number | string; // Note: api.ts returns lastNet, but naming might be inconsistent with RegistryItem
  lastTotal: number | string;
  lastHead: number | string;
}
