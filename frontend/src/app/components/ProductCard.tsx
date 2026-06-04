import { ShoppingBag, Heart } from 'lucide-react';
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
          
          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-2">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.success('Added to wishlist!');
              }}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs uppercase tracking-wide">
              {product.category}
            </span>
          </div>
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
          <Button
            onClick={handleAddToCart}
            className="rounded-full shadow-md hover:shadow-lg"
            size="sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}