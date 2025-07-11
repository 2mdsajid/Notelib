import React from 'react';

const OurPromotional = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-500 rounded-xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8 my-12">
      <img
        src="https://notelibraryapp.com/output-onlinepngtools.png"
        alt="Promotion"
        className="w-40 h-40 object-contain rounded-lg shadow-md bg-white"
      />
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Premium Study Content</h2>
        <p className="text-white/90 mb-4 text-base md:text-lg">
          Unlock exclusive materials and offers for your exam preparation. Join our special batches and get access to the best resources for MBBS, BDS, BSc Nursing, and more!
        </p>
        <a
          href="tel:9745712755"
          className="inline-block bg-amber-400 hover:bg-amber-500 text-blue-900 font-semibold px-6 py-3 rounded-full shadow transition-transform duration-200 transform hover:scale-105"
        >
          Call Now for Offers
        </a>
      </div>
    </div>
  );
};

export default OurPromotional;
