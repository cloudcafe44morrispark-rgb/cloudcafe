import { Link } from 'react-router-dom';
import { HeroBanner } from './HeroBanner';
import { ProductSection } from './ProductSection';
import { ArrowRight } from 'lucide-react';

export function Home() {
  return (
    <>
      <HeroBanner />

      {/* Latte Section */}
      <ProductSection
        imageUrl="/gallery/Ice-latte-1.JPEG"
        imagePosition="left"
        backgroundColor="bg-[#B88A68]"
        title="Our Signature Latte"
        description="Start your day with our creamy latte. Made with premium espresso and velvety steamed milk, crafted to perfection for a smooth, rich taste."
        buttonText="Order now"
      />

      {/* Cafe Ambiance Section */}
      <ProductSection
        imageUrl="/gallery/IMG_7599.jpeg"
        imagePosition="right"
        backgroundColor="bg-gray-100"
        title="A cozy escape"
        titleColor="text-[#B88A68]"
        description="Step into Cloud Cafe and experience the perfect blend of comfort and quality. Our warm atmosphere invites you to relax, work, or catch up with friends."
        buttonText="Find us"
        buttonVariant="outline"
      />

      {/* Gallery Preview Section */}
      <section className="py-16 bg-[#f8f5f2]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Life at Cloud Cafe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every cup tells a story, every moment matters
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-square rounded-xl overflow-hidden shadow-md">
              <img
                src="/gallery/IMG_8494.JPG"
                alt="Cloud Cafe"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden shadow-md">
              <img
                src="/gallery/IMG_8496.JPG"
                alt="Cloud Cafe"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden shadow-md">
              <img
                src="/gallery/Ice-latte-1.JPEG"
                alt="Iced Latte"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden shadow-md">
              <img
                src="/gallery/IMG_7599.jpeg"
                alt="Cloud Cafe Interior"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#B88A68] text-white font-semibold rounded-full hover:bg-[#A67958] transition-colors"
            >
              View Gallery
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
