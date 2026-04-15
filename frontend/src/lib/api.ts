/**
 * API client for communicating with the AgroLink FastAPI backend.
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Auth API ────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  user_type: "farmer" | "buyer" | "admin";
  farm_name?: string;
  business_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ConfirmPayload {
  email: string;
  confirmation_code: string;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserProfile {
  email: string;
  name: string;
  user_type: string;
  email_verified: string;
  sub: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<{ message: string; data: { user_sub: string } }>("/api/auth/register", data),

  confirm: (data: ConfirmPayload) =>
    api.post<{ message: string }>("/api/auth/confirm", data),

  login: (data: LoginPayload) =>
    api.post<TokenResponse>("/api/auth/login", data),

  getMe: (accessToken: string) =>
    api.get<UserProfile>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// ── Products API ────────────────────────────────────────────────────

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  image_url: string | null;
  farmer_email: string;
  farmer_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface CreateProductPayload {
  title: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  image_url?: string;
}

export const productsApi = {
  list: (params?: { category?: string; search?: string }) =>
    api.get<ProductListResponse>("/api/products", { params }),

  get: (id: string) =>
    api.get<Product>(`/api/products/${id}`),

  create: (data: CreateProductPayload, accessToken: string) =>
    api.post<Product>("/api/products", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  update: (id: string, data: Partial<CreateProductPayload>, accessToken: string) =>
    api.put<Product>(`/api/products/${id}`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  delete: (id: string, accessToken: string) =>
    api.delete(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  myListings: (accessToken: string) =>
    api.get<ProductListResponse>("/api/products/me/listings", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// ── Dashboard API ───────────────────────────────────────────────────

export interface DashboardStat {
  icon: string;
  label: string;
  value: string;
  color: string;
}

export interface DashboardStatsResponse {
  role: string;
  stats: DashboardStat[];
}

export const dashboardApi = {
  getStats: (accessToken: string) =>
    api.get<DashboardStatsResponse>("/api/dashboard/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// ── Orders API ──────────────────────────────────────────────────────

export interface Order {
  id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  buyer_email: string;
  buyer_name: string;
  farmer_email: string;
  farmer_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

export const ordersApi = {
  place: (data: { product_id: string; quantity: number }, accessToken: string) =>
    api.post<Order>("/api/orders", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  myOrders: (accessToken: string) =>
    api.get<OrderListResponse>("/api/orders/my", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  updateStatus: (orderId: string, status: string, accessToken: string) =>
    api.put<Order>(`/api/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// ── Farms API ───────────────────────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  location: string;
  size_acres: number;
  soil_type: string;
  description: string;
  image_url: string;
  farmer_email: string;
  farmer_name: string;
  crop_count: number;
  created_at: string;
  updated_at: string;
}

export interface FarmListResponse {
  farms: Farm[];
  total: number;
}

export const farmsApi = {
  create: (data: { name: string; location: string; size_acres: number; soil_type?: string; description?: string; image_url?: string }, accessToken: string) =>
    api.post<Farm>("/api/farms", data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  list: () => api.get<FarmListResponse>("/api/farms"),

  myFarms: (accessToken: string) =>
    api.get<FarmListResponse>("/api/farms/my", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  get: (farmId: string) => api.get<Farm>(`/api/farms/${farmId}`),

  update: (farmId: string, data: Record<string, unknown>, accessToken: string) =>
    api.put<Farm>(`/api/farms/${farmId}`, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  delete: (farmId: string, accessToken: string) =>
    api.delete(`/api/farms/${farmId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// ── Crops API ───────────────────────────────────────────────────────

export interface Crop {
  id: string;
  farm_id: string;
  name: string;
  variety: string;
  planting_date: string;
  expected_harvest_date: string;
  area_acres: number;
  season: string;
  health_status: string;
  growth_stage: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CropListResponse {
  crops: Crop[];
  total: number;
}

export const cropsApi = {
  create: (farmId: string, data: { name: string; variety?: string; planting_date: string; expected_harvest_date?: string; area_acres: number; season?: string; notes?: string }, accessToken: string) =>
    api.post<Crop>(`/api/farms/${farmId}/crops`, data, { headers: { Authorization: `Bearer ${accessToken}` } }),

  list: (farmId: string) => api.get<CropListResponse>(`/api/farms/${farmId}/crops`),

  get: (farmId: string, cropId: string) => api.get<Crop>(`/api/farms/${farmId}/crops/${cropId}`),

  update: (farmId: string, cropId: string, data: Record<string, unknown>, accessToken: string) =>
    api.put<Crop>(`/api/farms/${farmId}/crops/${cropId}`, data, { headers: { Authorization: `Bearer ${accessToken}` } }),

  delete: (farmId: string, cropId: string, accessToken: string) =>
    api.delete(`/api/farms/${farmId}/crops/${cropId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
};

// ── Inventory API ───────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  farm_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  purchase_date: string;
  expiry_date: string;
  supplier: string;
  reorder_level: number;
  linked_crop_id: string;
  linked_product_id: string;
  notes: string;
  low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  low_stock_count: number;
  total_value: number;
  expiring_soon_count: number;
}

export interface InventoryLog {
  id: string;
  farm_id: string;
  item_id: string;
  item_name: string;
  action: string;
  quantity_change: number;
  quantity_after: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export interface InventoryLogListResponse {
  logs: InventoryLog[];
  total: number;
}

export const inventoryApi = {
  create: (farmId: string, data: { item_name: string; category: string; quantity: number; unit?: string; purchase_price?: number; purchase_date?: string; expiry_date?: string; supplier?: string; reorder_level?: number; linked_crop_id?: string; notes?: string }, accessToken: string) =>
    api.post<InventoryItem>(`/api/farms/${farmId}/inventory`, data, { headers: { Authorization: `Bearer ${accessToken}` } }),

  list: (farmId: string) => api.get<InventoryListResponse>(`/api/farms/${farmId}/inventory`),

  update: (farmId: string, itemId: string, data: Record<string, unknown>, accessToken: string) =>
    api.put<InventoryItem>(`/api/farms/${farmId}/inventory/${itemId}`, data, { headers: { Authorization: `Bearer ${accessToken}` } }),

  adjust: (farmId: string, itemId: string, adjustment: number, reason: string, accessToken: string) =>
    api.put<InventoryItem>(`/api/farms/${farmId}/inventory/${itemId}/adjust`, { adjustment, reason }, { headers: { Authorization: `Bearer ${accessToken}` } }),

  useForCrop: (farmId: string, itemId: string, quantity: number, cropName: string, accessToken: string) =>
    api.post<InventoryItem>(`/api/farms/${farmId}/inventory/${itemId}/use-for-crop`, { adjustment: quantity, reason: cropName }, { headers: { Authorization: `Bearer ${accessToken}` } }),

  linkProduct: (farmId: string, itemId: string, productId: string, accessToken: string) =>
    api.put<InventoryItem>(`/api/farms/${farmId}/inventory/${itemId}/link-product`, { product_id: productId }, { headers: { Authorization: `Bearer ${accessToken}` } }),

  logs: (farmId: string) => api.get<InventoryLogListResponse>(`/api/farms/${farmId}/inventory/logs`),

  itemLogs: (farmId: string, itemId: string) => api.get<InventoryLogListResponse>(`/api/farms/${farmId}/inventory/${itemId}/logs`),

  delete: (farmId: string, itemId: string, accessToken: string) =>
    api.delete(`/api/farms/${farmId}/inventory/${itemId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
};

// ── Alarms API ──────────────────────────────────────────────────────

export interface Alarm {
  id: string;
  farm_id: string;
  crop_id: string;
  crop_name: string;
  title: string;
  message: string;
  alarm_date: string;
  alarm_time: string;
  sent: boolean;
  created_at: string;
}

export interface AlarmListResponse {
  alarms: Alarm[];
  total: number;
}

export const alarmsApi = {
  create: (farmId: string, data: { crop_id: string; title: string; message: string; alarm_date: string; alarm_time?: string }, accessToken: string) =>
    api.post<Alarm>(`/api/farms/${farmId}/alarms`, data, { headers: { Authorization: `Bearer ${accessToken}` } }),

  list: (farmId: string) => api.get<AlarmListResponse>(`/api/farms/${farmId}/alarms`),

  trigger: (farmId: string, accessToken: string) =>
    api.post(`/api/farms/${farmId}/alarms/trigger`, {}, { headers: { Authorization: `Bearer ${accessToken}` } }),

  delete: (farmId: string, alarmId: string, accessToken: string) =>
    api.delete(`/api/farms/${farmId}/alarms/${alarmId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
};

export default api;
