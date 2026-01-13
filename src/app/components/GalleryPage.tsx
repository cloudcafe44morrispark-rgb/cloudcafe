import { useState } from 'react';
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
    src: string;
    type: 'image' | 'video';
    alt: string;
}

const mediaItems: MediaItem[] = [
    { src: '/gallery/Ice-latte-1.JPEG', type: 'image', alt: 'Iced Latte' },
    { src: '/gallery/IMG_7599.jpeg', type: 'image', alt: 'Cloud Cafe' },
    { src: '/gallery/IMG_8494.JPG', type: 'image', alt: 'Cloud Cafe' },
    { src: '/gallery/IMG_8496.JPG', type: 'image', alt: 'Cloud Cafe' },
    { src: '/gallery/Burgers.MP4', type: 'video', alt: 'Burgers' },
    { src: '/gallery/Chip porky.MP4', type: 'video', alt: 'Chip Porky' },
    { src: '/gallery/Placing 3.MP4', type: 'video', alt: 'Food Preparation' },
];

export function GalleryPage() {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
    };

    const closeLightbox = () => {
        setSelectedIndex(null);
    };

    const goToPrevious = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === 0 ? mediaItems.length - 1 : selectedIndex - 1);
        }
    };

    const goToNext = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === mediaItems.length - 1 ? 0 : selectedIndex + 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Header */}
            <div className="relative bg-[#B88A68] text-white py-20">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Gallery</h1>
                    <p className="text-xl text-white/90">A glimpse into Cloud Cafe</p>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mediaItems.map((item, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                            onClick={() => openLightbox(index)}
                        >
                            {item.type === 'image' ? (
                                <img
                                    src={item.src}
                                    alt={item.alt}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="relative w-full h-full">
                                    <video
                                        src={item.src}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-[#B88A68] ml-1" fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 text-white font-medium">
                                    {item.alt}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
                        onClick={closeLightbox}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Previous Button */}
                    <button
                        className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>

                    {/* Next Button */}
                    <button
                        className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    {/* Media Content */}
                    <div
                        className="max-w-5xl max-h-[90vh] w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {mediaItems[selectedIndex].type === 'image' ? (
                            <img
                                src={mediaItems[selectedIndex].src}
                                alt={mediaItems[selectedIndex].alt}
                                className="w-full h-full object-contain max-h-[85vh]"
                            />
                        ) : (
                            <video
                                src={mediaItems[selectedIndex].src}
                                className="w-full h-full object-contain max-h-[85vh]"
                                controls
                                autoPlay
                                playsInline
                            />
                        )}
                        <p className="text-white text-center mt-4 text-lg">
                            {mediaItems[selectedIndex].alt}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
