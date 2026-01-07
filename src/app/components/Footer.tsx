import { Instagram, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Mobile Find Us Button */}
        <div className="md:hidden mb-6">
          <a 
            href="https://maps.app.goo.gl/aq1tUzUN4q4EaTH69"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#B88A68] text-white rounded-lg font-semibold hover:bg-[#A67958] transition-colors"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-sm">Find Us</span>
          </a>
        </div>
        
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mb-8">
          <a 
            href="https://www.instagram.com/cloudcafeglasgow/" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-[#B88A68] hover:border-[#B88A68] hover:text-white transition-all duration-300"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a 
            href="https://www.google.com/maps/search/cloud+cafe+glasgow" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-[#B88A68] hover:border-[#B88A68] hover:text-white transition-all duration-300"
            aria-label="Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </a>
        </div>
        
        {/* Footer Links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          <a 
            href="#" 
            className="text-sm text-gray-600 hover:text-[#B88A68] transition-colors"
          >
            Privacy
          </a>
          <span className="hidden md:inline text-gray-400">|</span>
          <a 
            href="#" 
            className="text-sm text-gray-600 hover:text-[#B88A68] transition-colors"
          >
            Cookie
          </a>
          <span className="hidden md:inline text-gray-400">|</span>
          <a 
            href="#" 
            className="text-sm text-gray-600 hover:text-[#B88A68] transition-colors"
          >
            Terms and Conditions
          </a>
        </div>
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2026 Cloud Cafe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}