const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const PRODUCT_CATALOG_UPDATED_KEY = 'products:last-updated';

export function notifyProductCatalogChanged() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRODUCT_CATALOG_UPDATED_KEY, String(Date.now()));
}
 
export interface ApiProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  type: 'sell' | 'donate';
  status: string;
  isAvailable: boolean;
  location: {
    address: string;
    coordinates: [number, number];
  };
  categoryId: {
    _id: string;
    name: string;
  } | null;
  ownerId: {
    _id: string;
    fullName: string;
    avatar?: string;
    rating?: number;
    isVerified?: boolean;
  } | null;
  thumbnail: string | null;
  images: { imageUrl: string; order: number }[];
  pendingApproval?: boolean;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}
 
export interface ApiCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}
 
export interface GetProductsParams {
  keyword?: string;
  categoryId?: string;
  type?: 'sell' | 'donate';
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'price_asc' | 'price_desc';
}
 
export interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
 
export async function fetchProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.keyword)    query.set('keyword',    params.keyword);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.type)       query.set('type',       params.type);
  if (params.condition)  query.set('condition',  params.condition);
  if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
  if (params.page)       query.set('page',  String(params.page));
  if (params.limit)      query.set('limit', String(params.limit));
  if (params.sort)       query.set('sort',  params.sort);
 
  const res = await fetch(`${API_BASE}/api/products?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
  return res.json();
}
 
export async function fetchProductById(id: string): Promise<{ success: boolean; data: ApiProduct; message?: string }> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Không tìm thấy sản phẩm');
  }
  return res.json();
}
 
export async function fetchCategories(): Promise<{ success: boolean; data: ApiCategory[] }> {
  const res = await fetch(`${API_BASE}/api/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Không thể tải danh mục');
  return res.json();
}
 
export const CONDITION_LABELS: Record<string, string> = {
  new:      'Mới',
  like_new: 'Như mới',
  good:     'Tốt',
  fair:     'Khá',
  poor:     'Cũ',
};

export async function toggleProductFavorite(id: string): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/products/${id}/favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Không thể thực hiện yêu thích');
  }
  return res.json();
}

export async function fetchFavoriteProducts(): Promise<{ success: boolean; data: ApiProduct[] }> {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/products/favorites`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Không thể tải danh sách yêu thích');
  }
  return res.json();
}
