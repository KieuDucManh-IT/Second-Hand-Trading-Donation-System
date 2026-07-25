import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Star,
  MapPin,
  Calendar,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
const REVIEWS_PER_PAGE = 20;
export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  useEffect(() => {
    if (!userId) return;
    const fetchProfileAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileRes = await fetch(
          `${API_BASE}/api/auth/profile/${userId}`,
        );
        if (!profileRes.ok) {
          throw new Error("Không thể tải thông tin cá nhân");
        }
        const profileData = await profileRes.json();
        setProfileUser(profileData.user);
        const isOwn = currentUser && currentUser.id === userId;
        let productsRes;
        if (isOwn) {
          productsRes = await fetch(`${API_BASE}/api/products/my`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token") || localStorage.getItem("token") || ""}`,
              "Content-Type": "application/json",
            },
          });
        } else {
          productsRes = await fetch(
            `${API_BASE}/api/products/seller/${userId}`,
          );
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data || []);
        }
      } catch (err) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndProducts();
  }, [userId, API_BASE, currentUser]);
  useEffect(() => {
    if (!userId) return;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const res = await fetch(
          `${API_BASE}/api/auth/profile/${userId}/reviews?page=${reviewsPage}&limit=${REVIEWS_PER_PAGE}`,
        );
        if (!res.ok) {
          throw new Error("Không thể tải danh sách đánh giá");
        }
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setReviewsTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        setReviewsError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [userId, API_BASE, reviewsPage]);

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${deleteTarget._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token") || localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể xóa sản phẩm");
      }
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      toast.success("Đã xóa sản phẩm");
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Đang tải thông tin cá nhân...</p>
      </div>
    );
  }
  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-semibold mb-4">
          {error || "Không tìm thấy người dùng"}
        </p>
        <Button onClick={() => navigate("/")}>Quay lại Trang chủ</Button>
      </div>
    );
  }
  const joinedDateFormatted = new Date(
    profileUser.joinedDate,
  ).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
  });
  const locationText =
    profileUser.locations && profileUser.locations.length > 0
      ? profileUser.locations[0].address
      : "Chưa cập nhật địa chỉ";
  const isOwnProfile = currentUser?.id === profileUser.id;
  const effectiveRating =
    averageRating > 0 ? averageRating : profileUser?.rating ?? 5;
  const isActiveListing = (product) =>
    product.status === "available" || product.status === "reserved";
  const isTradedListing = (product) => product.status === "sold";
  const isHiddenListing = (product) => product.status === "hidden";
  const activeListings = products.filter(isActiveListing);
  const transactedListings = products
    .filter(isTradedListing)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  const hiddenListings = products
    .filter(isHiddenListing)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profileUser.avatar || undefined} />
                <AvatarFallback>
                  {profileUser.fullName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profileUser.fullName}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(effectiveRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {Number(effectiveRating).toFixed(1)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({totalReviews} đánh giá)
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{locationText}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Đã tham gia {joinedDateFormatted}</span>
                  </div>
                </div>

                {isOwnProfile ? (
                  <Button
                    onClick={() => navigate("/account-settings")}
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Thiết lập tài khoản
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`/messages?to=${profileUser.id}`)}
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Liên hệ
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">Tin đăng</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                Tin đăng đang bán & trao đổi ({activeListings.length})
              </h2>
              {activeListings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Không có tin đăng nào đang hiển thị.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeListings.map((product) => (
                    <Card
                      key={product._id}
                      className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer relative"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                        <ImageWithFallback
                          src={
                            product.thumbnail ||
                            (product.images && product.images[0]?.imageUrl) ||
                            ""
                          }
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />

                        {product.type === "donate" && (
                          <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                            Miễn phí
                          </Badge>
                        )}
                        {product.status === "reserved" && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <Badge className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1">
                              Đang giao dịch
                            </Badge>
                          </div>
                        )}
                        {isOwnProfile && (
                          <button
                            type="button"
                            title="Xóa sản phẩm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(product);
                            }}
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 text-red-600 hover:bg-red-600 hover:text-white shadow-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">
                          {product.title}
                        </h3>
                        {product.type === "donate" ? (
                          <span className="text-xl font-bold text-green-600">
                            Miễn phí
                          </span>
                        ) : (
                          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {product.price.toLocaleString("vi-VN")} VND
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                Sản phẩm đã giao dịch ({transactedListings.length})
              </h2>
              {transactedListings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Chưa có sản phẩm nào đã giao dịch.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transactedListings.map((product) => (
                    <Card
                      key={product._id}
                      className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                        <ImageWithFallback
                          src={
                            product.thumbnail ||
                            (product.images && product.images[0]?.imageUrl) ||
                            ""
                          }
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />

                        {product.type === "donate" && (
                          <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                            Miễn phí
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1">
                            Đã giao dịch
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">
                          {product.title}
                        </h3>
                        {product.type === "donate" ? (
                          <span className="text-xl font-bold text-green-600">
                            Miễn phí
                          </span>
                        ) : (
                          <span className="text-xl font-bold text-slate-500 dark:text-slate-400 line-through">
                            {product.price.toLocaleString("vi-VN")} VND
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {isOwnProfile && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                  Tin đăng đã ẩn & chờ duyệt ({hiddenListings.length})
                </h2>
                {hiddenListings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      Không có tin đăng nào bị ẩn hoặc đang chờ duyệt.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hiddenListings.map((product) => (
                      <Card
                        key={product._id}
                        className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer opacity-75 hover:opacity-100 transition-opacity relative"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                          <ImageWithFallback
                            src={
                              product.thumbnail ||
                              (product.images && product.images[0]?.imageUrl) ||
                              ""
                            }
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />

                          {product.type === "donate" && (
                            <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                              Miễn phí
                            </Badge>
                          )}
                          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 z-10">
                            {product.pendingApproval ? (
                              <Badge className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1">
                                Đang chờ duyệt
                              </Badge>
                            ) : (
                              <Badge className="bg-red-600 text-white text-xs font-bold px-2.5 py-1">
                                Đã bị ẩn
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            title="Xóa sản phẩm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(product);
                            }}
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 text-red-600 hover:bg-red-600 hover:text-white shadow-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1 line-clamp-1">
                            {product.title}
                          </h3>
                          {product.type === "donate" ? (
                            <div className="text-xl font-bold text-green-600">
                              Miễn phí
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-slate-500 dark:text-slate-400">
                              {product.price.toLocaleString("vi-VN")} VND
                            </div>
                          )}
                          {product.rejectReason && (
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200/50 dark:border-red-900/50">
                              <strong>Lý do từ chối:</strong>{" "}
                              {product.rejectReason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviewsLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Đang tải đánh giá...
                </CardContent>
              </Card>
            ) : reviewsError ? (
              <Card>
                <CardContent className="p-8 text-center text-red-500">
                  {reviewsError}
                </CardContent>
              </Card>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Chưa có đánh giá nào
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.orderId}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={review.buyer?.avatar || undefined}
                            />
                            <AvatarFallback>
                              {
                                (review.buyer?.fullName ||
                                  review.buyer?.userName ||
                                  "U")[0]
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold">
                                {review.buyer?.fullName ||
                                  review.buyer?.userName ||
                                  "Người dùng ẩn danh"}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(review.ratedAt).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 my-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                            {review.product && (
                              <p className="text-xs text-gray-500 mb-1">
                                Sản phẩm: {review.product.title}
                              </p>
                            )}
                            {review.comment && (
                              <p className="text-gray-700 dark:text-gray-300">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {reviewsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reviewsPage <= 1}
                      onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trước
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Trang {reviewsPage} / {reviewsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reviewsPage >= reviewsTotalPages}
                      onClick={() =>
                        setReviewsPage((p) =>
                          Math.min(reviewsTotalPages, p + 1),
                        )
                      }
                    >
                      Sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tin đăng
              {deleteTarget ? ` "${deleteTarget.title}"` : ""} không? Hành động
              này không thể hoàn tác, toàn bộ ảnh và thông tin sản phẩm sẽ bị
              xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa sản phẩm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
