import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Heart, Share2, Check } from "lucide-react";
import { initialProducts } from "../data/products";
import { useCart } from "../contexts/CartContext";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReviewSection } from "./ReviewSection";
import { toast } from "sonner";
import { BuyNowModal } from "./BuyNowModal";
import { useAuth } from "../contexts/AuthContext";

const sizes = ["XS", "S", "M", "L", "XL"];

const colors = [
  { name: "Ivory", hex: "#f5f3f0", available: true },
  { name: "Blush", hex: "#f5e6e8", available: true },
  { name: "Sage", hex: "#d4ddd4", available: true },
  { name: "Charcoal", hex: "#4a4a4a", available: true },
  { name: "Navy", hex: "#2d3e50", available: false },
];

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = initialProducts.find((p) => p.id === id);

  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const isSellProduct = product?.type === "sell";
  const isOwner = user && product?.ownerId?._id === user.id;
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl mb-4">Product not found</h2>
          <Link to="/shop">
            <Button className="rounded-full">Return to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Multiple product images (simulated - in real app these would come from the product data)
  const productImages = [
    product.image,
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
  ];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/shop"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/20 shadow-lg">
              <ImageWithFallback
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-xl overflow-hidden bg-secondary/20 transition-all ${
                    selectedImage === index
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:opacity-75"
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Name */}
            <div>
              <p className="text-sm uppercase tracking-wide text-primary mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl mb-4">{product.name}</h1>
              <p className="text-3xl text-primary">${product.price}</p>
            </div>

            {/* Description */}
            <div className="border-t border-b border-border py-6">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}. Crafted from premium materials with
                attention to every detail. This piece combines timeless design
                with modern comfort, making it a versatile addition to your
                wardrobe.
              </p>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block mb-3">
                Color:{" "}
                <span className="text-primary">{selectedColor.name}</span>
              </label>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => color.available && setSelectedColor(color)}
                    disabled={!color.available}
                    className={`relative w-12 h-12 rounded-full transition-all ${
                      color.available
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-40"
                    } ${
                      selectedColor.name === color.name
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  >
                    {selectedColor.name === color.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {!color.available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-foreground rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <label className="block mb-3">
                Size: <span className="text-primary">{selectedSize}</span>
              </label>
              <div className="flex gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 rounded-xl border-2 transition-all ${
                      selectedSize === size
                        ? "border-primary bg-primary text-white"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block mb-3">Quantity</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-border hover:border-primary transition-colors"
                >
                  −
                </button>
                <span className="text-xl w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 border-border hover:border-primary transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {isSellProduct && !isOwner && (
                <Button
                  onClick={() => {
                    if (!user) {
                      toast.error("Vui lòng đăng nhập để mua hàng");
                      return;
                    }
                    setShowBuyModal(true);
                  }}
                  size="lg"
                  className="flex-1 rounded-xl h-14 shadow-lg hover:shadow-xl bg-primary"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Mua ngay
                </Button>
              )}

              {!isOwner && (
                <Button
                  variant={isSellProduct ? "outline" : "default"}
                  size="lg"
                  className={`rounded-xl h-14 shadow-lg hover:shadow-xl ${!isSellProduct ? "flex-1" : ""}`}
                  onClick={() => navigate("/messages")}
                >
                  Nhắn tin seller
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="rounded-xl h-14"
                onClick={() => toast.success("Đã thêm vào yêu thích!")}
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl h-14"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Đã sao chép liên kết!");
                }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Details */}
            <div className="bg-secondary/30 rounded-2xl p-6 space-y-4">
              <h3>Product Details</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                  <span>Premium quality fabric with soft hand feel</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                  <span>Tailored fit designed for comfort and elegance</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                  <span>Easy care - Machine washable</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                  <span>Free shipping on all orders</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 shrink-0" />
                  <span>30-day return policy</span>
                </li>
              </ul>
            </div>

            {/* Size Guide */}
            <button className="text-primary hover:underline">
              View Size Guide
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection productId={product.id} productName={product.name} />

        {/* Related Products Section */}
        <div className="mt-20">
          <h2 className="text-3xl mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {initialProducts
              .filter(
                (p) => p.id !== product.id && p.category === product.category,
              )
              .slice(0, 4)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                    <div className="aspect-[3/4] overflow-hidden bg-secondary/20">
                      <ImageWithFallback
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-2 group-hover:text-primary transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-primary text-xl">
                        ${relatedProduct.price}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
      {product && (
        <BuyNowModal
          open={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          product={{
            _id: product._id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            condition: product.condition,
            sellerName: product.ownerId?.fullName,
          }}
          onSuccess={(order) => {
            // Điều hướng đến trang đơn hàng sau khi đặt thành công
            navigate("/orders");
          }}
        />
      )}
    </div>
  );
}
