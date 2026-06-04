import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1614604975400-b9668cdb1a6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlbGVnYW50JTIwcGFzdGVsfGVufDF8fHx8MTc2MzUxNjk0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'New Collection 2025',
    subtitle: 'Timeless Elegance',
    description: 'Discover curated pieces that blend romantic aesthetics',
    cta: 'Shop Now',
    link: '/shop',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1726232409367-04682eb856a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcnVud2F5JTIwZWxlZ2FudHxlbnwxfHx8fDE3NjM1MTc2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Luxury Essentials',
    subtitle: 'Sophisticated Style',
    description: 'Premium fabrics meet modern design',
    cta: 'Explore Collection',
    link: '/shop?gender=women',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1636619770530-9dd2a402110b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbG90aGluZyUyMGJhbm5lcnxlbnwxfHx8fDE3NjM1MTc2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Seasonal Must-Haves',
    subtitle: 'Winter Collection',
    description: 'Stay warm in style with our curated selection',
    cta: 'View Collection',
    link: '/shop',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1763294631806-b414045e086c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY29sbGVjdGlvbiUyMG1vZGVybnxlbnwxfHx8fDE3NjM1MTc2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Refined Minimalism',
    subtitle: 'Less is More',
    description: 'Clean lines and timeless silhouettes',
    cta: 'Shop Minimalist',
    link: '/shop?gender=unisex',
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-secondary/20">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <ImageWithFallback
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-white">
                  <p className="text-sm md:text-base uppercase tracking-wider mb-4 opacity-90">
                    {slide.title}
                  </p>
                  <h2 className="text-4xl md:text-6xl mb-4 text-white">
                    {slide.subtitle}
                  </h2>
                  <p className="text-lg md:text-xl mb-8 text-white/90">
                    {slide.description}
                  </p>
                  <Link to={slide.link}>
                    <Button size="lg" className="rounded-full shadow-2xl">
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
