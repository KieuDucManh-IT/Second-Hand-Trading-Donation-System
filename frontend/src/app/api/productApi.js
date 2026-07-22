import { getApiBase } from "../config/apiConfig";

const getBase = () => getApiBase();
export const PRODUCT_CATALOG_UPDATED_KEY = "products:last-updated";

export function notifyProductCatalogChanged() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_CATALOG_UPDATED_KEY, String(Date.now()));
}
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.type) query.set("type", params.type);
  if (params.condition) query.set("condition", params.condition);
  if (params.minPrice != null) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  const res = await fetch(`${getBase()}/products?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
  return res.json();
}
export async function fetchProductById(id) {
  const res = await fetch(`${getBase()}/products/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Không tìm thấy sản phẩm");
  }
  return res.json();
}
export async function fetchCategories() {
  const res = await fetch(`${getBase()}/categories`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Không thể tải danh mục");
  return res.json();
}
export const CONDITION_LABELS = {
  new: "Mới",
  like_new: "Như mới",
  good: "Tốt",
  fair: "Khá",
  poor: "Cũ",
};

export async function toggleProductFavorite(id) {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const res = await fetch(`${getBase()}/products/${id}/favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Không thể thực hiện yêu thích");
  }
  return res.json();
}

export async function fetchFavoriteProducts() {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const res = await fetch(`${getBase()}/products/favorites`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Không thể tải danh sách yêu thích");
  }
  return res.json();
}
