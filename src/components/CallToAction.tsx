import React from 'react';
import { ArrowRight } from 'lucide-react';

const CallToAction = () => {
  return (
    <section className="py-16 md:py-24 bg-blue-900 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="w-96 h-96 bg-blue-600 rounded-full absolute -top-20 -left-20"></div>
        <div className="w-96 h-96 bg-amber-500 rounded-full absolute -bottom-20 -right-20"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Excel in Your <span className="text-amber-400">Academic Journey</span>?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of students who have transformed their learning experience with Note Library's comprehensive study materials and test series.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="#"
              className="bg-white text-blue-900 hover:bg-blue-100 px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a
              href="#"
              className="bg-transparent border-2 border-white hover:bg-white/10 px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
          
          <div className="mt-12 flex justify-center space-x-8 md:space-x-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">5000+</div>
              <div className="text-blue-200">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">98%</div>
              <div className="text-blue-200">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">24/7</div>
              <div className="text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;