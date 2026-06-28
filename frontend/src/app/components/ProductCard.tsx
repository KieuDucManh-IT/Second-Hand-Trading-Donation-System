import { ShoppingBag } from 'lucide-react';
import { Product } from '../contexts/CartContext';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const handleAddToCart = () => {
    onAddToCart(product);
    toast.success('Added to cart!');
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/20">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs uppercase tracking-wide">
              {product.category}
            </span>
          </div>

          {/* Traded/Sold Overlay */}
          {product.status === 'sold' && (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-4 py-2 rounded-xl bg-red-600/90 text-white font-bold text-sm tracking-wider uppercase shadow-lg">
                Đã giao dịch
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-6">
        <Link to={`/product/${product.id}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="mb-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                {product.description}
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-2xl text-primary">${product.price}</span>
          {product.status === 'sold' ? (
            <span className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 rounded-full border border-red-100 uppercase tracking-wide">
              Đã giao dịch
            </span>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="rounded-full shadow-md hover:shadow-lg"
              size="sm"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}