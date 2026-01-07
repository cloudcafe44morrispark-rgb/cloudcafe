import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductSectionProps {
  imageUrl: string;
  imagePosition: 'left' | 'right';
  backgroundColor: string;
  title: string;
  titleColor?: string;
  description: string;
  buttonText: string;
  buttonVariant?: 'solid' | 'outline';
}

export function ProductSection({
  imageUrl,
  imagePosition,
  backgroundColor,
  title,
  titleColor = 'text-white',
  description,
  buttonText,
  buttonVariant = 'solid',
}: ProductSectionProps) {
  const isImageLeft = imagePosition === 'left';
  const isBrandColorBg = backgroundColor.includes('#B88A68') || backgroundColor.includes('B88A68');
  
  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
      <div className={`grid md:grid-cols-2 gap-0 overflow-hidden ${
        isImageLeft ? '' : 'md:grid-flow-dense'
      }`}>
        {/* Image Section */}
        <div className={`relative h-[300px] md:h-[400px] lg:h-[500px] ${
          isImageLeft ? '' : 'md:col-start-2'
        }`}>
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Section */}
        <div className={`${backgroundColor} flex items-center justify-center p-8 md:p-12 lg:p-16 ${
          isImageLeft ? '' : 'md:col-start-1 md:row-start-1'
        }`}>
          <div className="max-w-md text-center">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 ${titleColor}`}>
              {title}
            </h2>
            <p className={`text-base md:text-lg mb-8 leading-relaxed ${
              isBrandColorBg ? 'text-white' : 'text-gray-700'
            }`}>
              {description}
            </p>
            <button className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-colors ${
              buttonVariant === 'outline'
                ? 'border-2 border-[#B88A68] text-[#B88A68] hover:bg-[#B88A68] hover:text-white'
                : 'border-2 border-white text-white hover:bg-white hover:text-[#B88A68]'
            }`}>
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}