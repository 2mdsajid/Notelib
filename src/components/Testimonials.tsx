import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, User } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      content: "The notes from Note Library helped me secure 95% in my 12th board exams. The content is well-structured and easy to understand. Highly recommended!",
      name: "Priya Shrestha",
      role: "Class 12 Student, Kalanki",
      rating: 5,
    },
    {
      id: 2,
      content: "The test series really helped me understand my weak areas. The detailed solutions provided after each test were incredibly helpful in improving my understanding.",
      name: "Arjun Aryal",
      role: "Class 11 Student, Dharan",
      rating: 5,
    },
    {
      id: 3,
      content: "What I love about Note Library is their focus on quality. The notes are comprehensive yet concise, making it easy to revise during exams.",
      name: "Sanya Poudel",
      role: "Class 12 Student, Biratnagar",
      rating: 4,
    },
    {
      id: 4,
      content: "The monthly tests kept me consistent with my studies throughout the year. The performance analysis helped me focus on areas that needed improvement.",
      name: "Rahul Sharma",
      role: "Class 11 Student, Chitwan",
      rating: 5,
    },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            What Our <span className="text-amber-500">Students Say</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what students have achieved with Note Library.
          </p>
        </div>
        
        {/* Desktop Testimonials */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Testimonials */}
        <div className="md:hidden relative">
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < testimonials[activeTestimonial].rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic">"{testimonials[activeTestimonial].content}"</p>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">{testimonials[activeTestimonial].name}</h4>
                <p className="text-sm text-gray-600">{testimonials[activeTestimonial].role}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={prevTestimonial}
              className="bg-white rounded-full p-2 shadow-md hover:bg-blue-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6 text-blue-800" />
            </button>
            <button
              onClick={nextTestimonial}
              className="bg-white rounded-full p-2 shadow-md hover:bg-blue-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6 text-blue-800" />
            </button>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <a
            href="#"
            className="inline-block border-2 border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white px-8 py-3 rounded-full font-medium transition-colors"
          >
            Read More Success Stories
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;