import { Link } from 'react-router-dom';
import { HeroBanner } from './HeroBanner';
import { ProductSection } from './ProductSection';
import { Play, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function Home() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

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

      {/* Video Showcase Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fresh from Our Kitchen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch our chefs prepare delicious meals with passion and care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Burgers Video */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
              <video
                src="/gallery/Burgers.MP4"
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay={playingVideo === 'burgers'}
                onClick={() => setPlayingVideo(playingVideo === 'burgers' ? null : 'burgers')}
              />
              {playingVideo !== 'burgers' && (
                <div
                  className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer group-hover:bg-black/40 transition-colors"
                  onClick={() => setPlayingVideo('burgers')}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-[#B88A68] ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">Gourmet Burgers</h3>
                <p className="text-white/80 text-sm">Handcrafted with premium ingredients</p>
              </div>
            </div>

            {/* Chip Porky Video */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
              <video
                src="/gallery/Chip porky.MP4"
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay={playingVideo === 'porky'}
                onClick={() => setPlayingVideo(playingVideo === 'porky' ? null : 'porky')}
              />
              {playingVideo !== 'porky' && (
                <div
                  className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer group-hover:bg-black/40 transition-colors"
                  onClick={() => setPlayingVideo('porky')}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-[#B88A68] ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">Crispy Delights</h3>
                <p className="text-white/80 text-sm">Golden perfection every time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
