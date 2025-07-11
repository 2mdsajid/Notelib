import React from 'react';
import { BookOpen, FileText, Layers, Award, Users, RefreshCw } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-800" />,
      title: 'Comprehensive Notes',
      description: 'Well-structured notes covering the entire syllabus for grades 11 & 12.',
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-800" />,
      title: 'Test Series',
      description: 'Regular tests aligned with board exam patterns to assess your progress.',
    },
    {
      icon: <Layers className="w-6 h-6 text-blue-800" />,
      title: 'Quality Content',
      description: 'Focused on building deep understanding rather than rote memorization.',
    },
    {
      icon: <Award className="w-6 h-6 text-blue-800" />,
      title: 'Expert Teachers',
      description: 'Notes prepared by experienced educators with proven track records.',
    },
    {
      icon: <Users className="w-6 h-6 text-blue-800" />,
      title: 'Student Community',
      description: 'Join a community of dedicated students to collaborate and learn together.',
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-blue-800" />,
      title: 'Regular Updates',
      description: 'Content is continuously updated to align with the latest curriculum changes.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Why Choose <span className="text-amber-500">Note Library</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            We're focused on building quality education that helps students excel in their academic pursuits.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;