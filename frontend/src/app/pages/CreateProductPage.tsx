import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
 
const API_URL = 'http://localhost:5000/api';
 
interface Category {
  _id: string;
  name: string;
}
 
export function CreateProductPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    condition: '' as '' | 'new' | 'like_new' | 'good' | 'fair' | 'poor',
    type: 'sell' as 'sell' | 'donate',
    address: '',
  });
 
  // Ảnh preview (local URL) và file thật
  const [imageFiles, setImageFiles]     = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [forbiddenKeywords, setForbiddenKeywords] = useState<string[]>([]);
 
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
 
  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);
 
  // Load categories từ API
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch {
        // fallback nếu API chưa chạy
        setCategories([
          { _id: 'electronics', name: 'Điện tử' },
          { _id: 'fashion',     name: 'Thời trang' },
          { _id: 'furniture',   name: 'Nội thất' },
          { _id: 'books',       name: 'Sách & Học liệu' },
          { _id: 'sports',      name: 'Thể thao' },
          { _id: 'other',       name: 'Khác' },
        ]);
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  // Load forbidden keywords từ API
  useEffect(() => {
    const loadForbidden = async () => {
      try {
        const res = await fetch(`${API_URL}/products/sensitive-words`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setForbiddenKeywords(data.data);
        }
      } catch (err) {
        console.error('Failed to load sensitive words:', err);
      }
    };
    loadForbidden();
  }, []);

  const checkSensitiveDynamic = (text: string): string | null => {
    if (!text) return null;
    const lower = text.toLowerCase();
    return forbiddenKeywords.find((w) => lower.includes(w.toLowerCase())) || null;
  };
 
  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
 
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    } else {
      const bad = checkSensitiveDynamic(formData.title);
      if (bad) newErrors.title = `Tiêu đề chứa từ không được phép: "${bad}"`;
    }
 
    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Mô tả quá ngắn (ít nhất 20 ký tự)';
    } else {
      const bad = checkSensitiveDynamic(formData.description);
      if (bad) newErrors.description = `Mô tả chứa từ không được phép: "${bad}"`;
    }
 
    if (!formData.categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục';
    if (!formData.condition)  newErrors.condition  = 'Vui lòng chọn tình trạng';
 
    if (formData.type === 'sell') {
      if (!formData.price || Number(formData.price) <= 0)
        newErrors.price = 'Giá bán phải lớn hơn 0';
    }
 
    if (imageFiles.length === 0) newErrors.images = 'Vui lòng chọn ít nhất 1 ảnh';
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  // ── Xử lý chọn ảnh ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const remaining = 8 - imageFiles.length;
    const toAdd = selected.slice(0, remaining);
 
    if (selected.length > remaining)
      toast.warning(`Chỉ thêm được ${remaining} ảnh nữa (tối đa 8)`);
 
    // Kiểm tra size
    const oversized = toAdd.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      toast.error('Một số ảnh quá 5MB và đã bị bỏ qua');
      const valid = toAdd.filter((f) => f.size <= 5 * 1024 * 1024);
      setImageFiles((prev) => [...prev, ...valid]);
      setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
      return;
    }
 
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    setErrors((prev) => ({ ...prev, images: '' }));
  };
 
  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles((prev)    => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };
 
  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
 
    setSubmitting(true);
 
    try {
      const token = sessionStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
 
      const headers = { Authorization: `Bearer ${token}` };
 
      // 1) Tạo sản phẩm
      const productRes = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       formData.title.trim(),
          description: formData.description.trim(),
          price:       formData.type === 'donate' ? 0 : Number(formData.price),
          condition:   formData.condition,
          type:        formData.type,
          categoryId:  formData.categoryId,
          address:     formData.address.trim(),
        }),
      });
 
      const productData = await productRes.json();
 
      if (!productRes.ok) {
        // Backend cũng validate từ nhạy cảm — hiển thị lỗi đúng field
        if (productData.field) {
          setErrors((prev) => ({ ...prev, [productData.field]: productData.message }));
        } else {
          toast.error(productData.message || 'Tạo sản phẩm thất bại');
        }
        return;
      }
 
      const productId = productData.data._id;
 
      // 2) Upload ảnh
      const formDataImg = new FormData();
      imageFiles.forEach((f) => formDataImg.append('images', f));
 
      const imgRes = await fetch(`${API_URL}/products/${productId}/images`, {
        method: 'POST',
        headers,
        body: formDataImg,
      });
 
      if (!imgRes.ok) {
        const imgData = await imgRes.json();
        toast.warning(`Sản phẩm đã tạo nhưng upload ảnh lỗi: ${imgData.message}`);
      }
 
      setSubmitted(true);
    } catch (err) {
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
 
  // ── Màn hình thành công ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Đăng sản phẩm thành công!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Sản phẩm của bạn đã được <strong>đăng công khai</strong> và mọi người có thể xem ngay bây giờ.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/products')}>
                Xem sản phẩm
              </Button>
              <Button className="flex-1" onClick={() => { setSubmitted(false); setFormData({ title:'',description:'',price:'',categoryId:'',condition:'',type:'sell',address:'' }); setImageFiles([]); setImagePreviews([]); }}>
                Đăng thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Đăng sản phẩm mới</CardTitle>
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" />
              Người đăng tự chịu trách nhiệm về toàn bộ thông tin và nội dung của sản phẩm đã đăng
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
 
              {/* Tiêu đề */}
              <div>
                <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors((p) => ({ ...p, title: '' }));
                  }}
                  placeholder="VD: iPhone 13 Pro - Còn bảo hành, 99%"
                  className={`mt-2 ${errors.title ? 'border-red-500' : ''}`}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.title}
                  </p>
                )}
              </div>
 
              {/* Mô tả */}
              <div>
                <Label>Mô tả <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors((p) => ({ ...p, description: '' }));
                  }}
                  placeholder="Mô tả chi tiết về sản phẩm: tình trạng, lý do bán, phụ kiện kèm theo..."
                  rows={5}
                  className={`mt-2 ${errors.description ? 'border-red-500' : ''}`}
                  maxLength={2000}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.description}
                    </p>
                  ) : <span />}
                  <span className="text-xs text-gray-400">{formData.description.length}/2000</span>
                </div>
              </div>
 
              {/* Danh mục + Tình trạng */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Danh mục <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) => { setFormData({ ...formData, categoryId: v }); setErrors((p) => ({ ...p, categoryId: '' })); }}
                    disabled={loadingCats}
                  >
                    <SelectTrigger className={`mt-2 ${errors.categoryId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder={loadingCats ? 'Đang tải...' : 'Chọn danh mục'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                </div>
 
                <div>
                  <Label>Tình trạng <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(v: typeof formData.condition) => { setFormData({ ...formData, condition: v }); setErrors((p) => ({ ...p, condition: '' })); }}
                  >
                    <SelectTrigger className={`mt-2 ${errors.condition ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* FIX: dùng like_new (gạch dưới) cho đúng với model backend */}
                      <SelectItem value="new">Mới 100%</SelectItem>
                      <SelectItem value="like_new">Như mới (99%)</SelectItem>
                      <SelectItem value="good">Tốt (80–98%)</SelectItem>
                      <SelectItem value="fair">Còn dùng được (60–79%)</SelectItem>
                      <SelectItem value="poor">Hư nhẹ / cần sửa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
                </div>
              </div>
 
              {/* Loại + Giá */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Loại đăng <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: 'sell' | 'donate') => setFormData({ ...formData, type: v, price: v === 'donate' ? '0' : formData.price })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell"> Bán</SelectItem>
                      <SelectItem value="donate"> Cho tặng miễn phí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
 
                {formData.type === 'sell' && (
                  <div>
                    <Label>Giá (VNĐ) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setErrors((p) => ({ ...p, price: '' })); }}
                      placeholder="VD: 500000"
                      min="0"
                      className={`mt-2 ${errors.price ? 'border-red-500' : ''}`}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                )}
              </div>
 
              {/* Địa chỉ */}
              <div>
                <Label>Địa chỉ / Khu vực</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: Quận 1, TP.HCM"
                  className="mt-2"
                />
              </div>
 
              {/* Upload ảnh */}
              <div>
                <Label>
                  Hình ảnh <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">({imageFiles.length}/8)</span>
                </Label>
 
                {/* Preview ảnh đã chọn */}
                {imagePreviews.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                            Ảnh bìa
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
 
                {/* Nút thêm ảnh */}
                {imageFiles.length < 8 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                      ${errors.images
                        ? 'border-red-400 bg-red-50 dark:bg-red-950'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950'
                      }`}
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nhấp để chọn ảnh
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Tối đa 5MB/ảnh</p>
                  </div>
                )}
 
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {errors.images && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.images}
                  </p>
                )}
              </div>
 
              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="flex-1"
                  disabled={submitting}
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-green-500 to-blue-500"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Đăng sản phẩm</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}