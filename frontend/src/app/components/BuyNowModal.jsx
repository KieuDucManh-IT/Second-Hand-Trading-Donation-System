import { ShoppingBag, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatVND } from "../api/orderApi";
import { useNavigate } from "react-router-dom";
export function BuyNowModal({ open, onClose, product }) {
  const navigate = useNavigate();
  const platformFee = Math.round(product.price * 0.1);
  const handleProceed = () => {
    onClose();
    navigate("/checkout", {
      state: { product },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Xác nhận mua hàng
          </DialogTitle>
        </DialogHeader>

        {}
        <div className="flex gap-4 p-4 bg-secondary/30 rounded-xl">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-20 h-20 object-cover rounded-lg shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-secondary shrink-0" />
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="font-medium text-sm leading-snug line-clamp-2 break-words">
              {product.title}
            </p>
            {product.sellerName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Người bán: {product.sellerName}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              Tình trạng: {product.condition}
            </p>
          </div>
        </div>

        {}
        <div className="space-y-3 px-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Giá sản phẩm</span>
            <span>{formatVND(product.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí vận chuyển</span>
            <span className="text-green-600">Miễn phí</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-medium">Bạn thanh toán</span>
            <span className="text-xl font-semibold text-primary">
              {formatVND(product.price)}
            </span>
          </div>
        </div>

        {}
        <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Nền tảng hỗ trợ giao dịch an toàn. Phí dịch vụ{" "}
            <strong>{formatVND(platformFee)}</strong> (10%) được trừ từ phần
            seller nhận — bạn không trả thêm.
          </p>
        </div>

        {}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button className="flex-1 rounded-xl" onClick={handleProceed}>
            <ShoppingBag className="w-4 h-4 mr-2" />
            Tiếp tục đặt hàng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
