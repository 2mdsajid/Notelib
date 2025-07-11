import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight mb-4">
              Elevate Your Learning with <span className="text-amber-500">Quality</span> Education
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-lg">
              Comprehensive notes and test series for grades 11 & 12. Designed to help you excel in your academic journey.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <a 
                href="notes" 
                className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
              >
                Explore Notes
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a 
                href="Test-series" 
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
              >
                Test Series
              </a>
            </div>
            
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-2xl sm:text-3xl font-bold text-blue-800">5K+</span>
                <span className="text-sm sm:text-base text-gray-600">Students</span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-2xl sm:text-3xl font-bold text-blue-800">25+</span>
                <span className="text-sm sm:text-base text-gray-600">Subjects</span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-2xl sm:text-3xl font-bold text-blue-800">98%</span>
                <span className="text-sm sm:text-base text-gray-600">Success</span>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2 relative">
            <div className="transform hover:scale-105 transition-transform duration-300 bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
              <img 
                src="/a.png" 
                alt="Note Library" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;