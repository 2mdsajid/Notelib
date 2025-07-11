import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const Subjects = () => {
  const [activeTab, setActiveTab] = useState('science');
  const [slideDirection, setSlideDirection] = useState('');

  const handleTabChange = (tab: string) => {
    setSlideDirection(tab === 'science' ? 'slide-left' : 'slide-right');
    setActiveTab(tab);
  };

  const scienceSubjects = [
    {
      name: 'Physics',
      image: 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics'],
    },
    {
      name: 'Chemistry',
      image: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Physical Chemistry'],
    },
    {
      name: 'Mathematics',
      image: 'https://images.pexels.com/photos/6238048/pexels-photo-6238048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Algebra', 'Calculus', 'Trigonometry', 'Coordinate Geometry'],
    },
    {
      name: 'Biology',
      image: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Cell Biology', 'Plant Physiology', 'Human Physiology', 'Genetics'],
    },
  ];

  const managementSubjects = [
    {
      name: 'Business Studies',
      image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Business Environment', 'Marketing Management', 'Financial Management', 'Strategic Planning'],
    },
    {
      name: 'Accountancy',
      image: 'https://images.pexels.com/photos/53621/calculator-calculation-insurance-finance-53621.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Financial Statements', 'Partnership Accounts', 'Company Accounts', 'Cash Flow'],
    },
    {
      name: 'Economics',
      image: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Microeconomics', 'Macroeconomics', 'Money & Banking', 'International Trade'],
    },
    {
      name: 'Mathematics',
      image: 'https://images.pexels.com/photos/6238048/pexels-photo-6238048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      topics: ['Statistics', 'Linear Programming', 'Matrices', 'Calculus'],
    },
  ];

  const currentSubjects = activeTab === 'science' ? scienceSubjects : managementSubjects;

  return (
    <section id="subjects" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Browse Our <span className="text-amber-500">Subject Notes</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Comprehensive study materials designed to help you excel in your board exams.
          </p>
        </div>
        
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full shadow-md p-1 inline-flex">
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'science' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('science')}
            >
              Science
            </button>
            <button
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'management' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('management')}
            >
              Management
            </button>
          </div>
        </div>
        
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-500 ${slideDirection}`}
        >
          {currentSubjects.map((subject, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={subject.image}
                  alt={subject.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">{subject.name}</h3>
                <ul className="space-y-2 mb-6">
                  {subject.topics.map((topic, idx) => (
                    <li key={idx} className="flex items-center text-gray-600">
                      <ChevronRight className="w-4 h-4 mr-2 text-amber-500" />
                      {topic}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="inline-block bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  View Notes
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Subjects;