import React, { useState } from 'react';

const PromotionalCarousel = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Banner data
  const banners = [
    {
      id: 1,
      title: "Entrance Nepal Medical Preparation",
      subtitle: "CEE 2082 ReStart Batch",
      image: "/aaa.jpeg",
      link: "https://www.facebook.com/EntranceNp/",
      description: "Join medical entrance preparation with 40% OFF on MBBS, BDS, BSc.Nursing, Paramedical courses"
    }
  ];

  // All autoplay and multi-banner logic removed

  return (
    <div className="relative w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden mb-12">
      {/* Partner label */}
      <div className="w-full bg-blue-50 py-2 px-4 border-b border-blue-100 text-blue-700 font-semibold text-center text-sm tracking-wide">
        From Our Partners
      </div>
      {/* Main carousel container */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={banners[0].image}
            alt={banners[0].title}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 10 }}
          />
          {/* Overlay gradient and content overlay on top image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-20"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex justify-start z-30">
            <a
              href={banners[0].link}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold"
            >
              Learn More
            </a>
          </div>
        </div>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionalCarousel;
