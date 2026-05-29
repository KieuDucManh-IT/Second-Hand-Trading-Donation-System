import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { ProductCard } from './ProductCard';
import { useCart } from '../contexts/CartContext';
import { initialProducts } from '../data/products';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { HeroCarousel } from './HeroCarousel';

export function CustomerHome() {
  const { addToCart } = useCart();
  const [featuredProducts] = useState(initialProducts.slice(0, 4));

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-4">Featured Pieces</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Carefully selected items that embody our aesthetic philosophy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/shop">
            <Button variant="outline" size="lg" className="rounded-full">
              View All Products
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Trending Collections */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Trending Collections</h2>
            <p className="text-muted-foreground text-lg">
              Explore our most loved styles this season
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Women's Collection */}
            <Link to="/shop?gender=women" className="group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1506619928596-bb8c201545cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZmFzaGlvbiUyMGNsb3RoaW5nJTIwd29tZW58ZW58MXx8fHwxNzYzNTE2OTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Women's Collection"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl mb-2">Women's</h3>
                  <p className="text-white/80">Explore Collection →</p>
                </div>
              </div>
            </Link>

            {/* Men's Collection */}
            <Link to="/shop?gender=men" className="group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1744551154437-133615e57adb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbWVuc3dlYXIlMjBmYXNoaW9ufGVufDF8fHx8MTc2MzUxNjk0OHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Men's Collection"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl mb-2">Men's</h3>
                  <p className="text-white/80">Explore Collection →</p>
                </div>
              </div>
            </Link>

            {/* Unisex Collection */}
            <Link to="/shop?gender=unisex" className="group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1584371632528-60e154034672?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0JTIwYWVzdGhldGljJTIwY2xvdGhpbmd8ZW58MXx8fHwxNzYzNTE2OTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Unisex Collection"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl mb-2">Unisex</h3>
                  <p className="text-white/80">Explore Collection →</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758297679736-2e6ff92d2021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwYWVzdGhldGljfGVufDF8fHx8MTc2MzUxNjk0OHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="About Orien Fashion"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-4xl mb-6">Our Philosophy</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              At Orien Fashion, we believe in the power of timeless design. Each piece in our
              collection is thoughtfully curated to blend romantic aesthetics with modern
              sensibilities.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We celebrate softness, elegance, and the beauty of simplicity. Our clothing tells a
              story of refined taste and effortless sophistication.
            </p>
            <Link to="/shop">
              <Button size="lg" variant="outline" className="rounded-full">
                Discover More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}