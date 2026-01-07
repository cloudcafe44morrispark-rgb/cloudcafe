export function HeroBanner() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Video Background - All devices */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&q=80"
      >
        <source src="/videos/hero-mobile.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Content centered over video */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
          It's a great day for coffee
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 md:mb-10 max-w-md md:max-w-2xl drop-shadow-md">
          Start your day with Cloud Cafe
        </p>
        <button className="px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-semibold bg-white text-[#B88A68] rounded-full hover:bg-white/90 transition-all shadow-lg">
          Start an order
        </button>
      </div>
    </div>
  );
}