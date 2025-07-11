import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Star, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Trophy,
  Target,
  PenTool,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginOverlay from '../LoginOverlay';

interface TestSeries {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  popular?: boolean;
}

const SubscriptionInfo: React.FC = () => {  const { currentUser } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const testSeries: TestSeries[] = [
    {
      id: 'ioe',
      name: 'IOE Test Series',
      price: 100,
      description: 'Comprehensive preparation for Institute of Engineering entrance examination',
      features: [
        'Full-length mock tests',
        'Subject-wise practice tests',
        'Detailed performance analytics',
        'Previous year question papers',
        'Expert guidance',
        'Progress tracking',
      ],
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      popular: true
    },
    {
      id: 'cee',
      name: 'CEE Test Series',
      price: 100,
      description: 'Complete preparation for Common Medical Entrance examination',
      features: [
        'Comprehensive test coverage',
        'Topic-wise assessments',
        'Real-time performance insights',
        'Question bank with solutions',
        'Study materials included',
        'Doubt clearing sessions',
        'Rank prediction',
      ],
      icon: <Trophy className="w-8 h-8" />,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      id: 'live',
      name: 'CEE Live Test Series',
      price: 150,
      description: 'Live test series for Common Medical Entrance examination every saturday',
      features: [
        'Live proctored mock tests',
        'Real-time performance analysis',
        'Competitive environment',
        'Time management practice',
        'Rank improvement strategies',
      ],
      icon: <Clock className="w-8 h-8" />,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      popular: true
    }
  ];
  const handlePurchase = (seriesId: string) => {
    if (!currentUser) {
      setIsLoginOpen(true);
    } else {
      // Handle purchase logic for authenticated users
      console.log(`Purchasing ${seriesId} series`);
      // You can add payment logic here
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  return (
    <div className="min-h-screen py-12 px-4 transition-colors duration-300 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >          <div className="inline-flex items-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Premium Test Series
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-xl max-w-3xl mx-auto text-gray-600">
            Elevate your exam preparation with our comprehensive test series designed by experts
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {[
            { icon: <Users className="w-6 h-6" />, value: '10,000+', label: 'Students' },
            { icon: <PenTool className="w-6 h-6" />, value: '5,000+', label: 'Practice Questions' },
            { icon: <BookOpen className="w-6 h-6" />, value: '50+', label: 'Mock Tests' },
            { icon: <Star className="w-6 h-6" />, value: '4.9/5', label: 'Rating' }
          ].map((stat, index) => (            <div 
              key={index}
              className="text-center p-6 rounded-xl bg-white/50 border border-gray-200 backdrop-blur-sm"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Test Series Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testSeries.map((series, index) => (
            <motion.div
              key={series.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 + (index * 0.1), duration: 0.6 }}              className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              {/* Popular Badge */}
              {series.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className={`p-8 bg-gradient-to-r ${series.bgGradient} text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  {series.icon}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      {series.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{series.name}</h3>
                  </div>
                  <p className="text-white/90 mb-6">{series.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-sm text-white/70">RS</span>
                    <span className="text-4xl font-bold mx-2">{series.price}</span>

                    {/* mentioned series id so for live tese price appears as per test than lifetime */}
                    <span className="text-white/70">/{series.id !== 'live' ? 'lifetime' : 'test'}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-8">                <h4 className="text-lg font-semibold mb-6 text-gray-900">
                  What's Included:
                </h4>
                <ul className="space-y-3 mb-8">
                  {series.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 text-${series.color}-500 flex-shrink-0`} />
                      <span className="text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(series.id)}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r ${series.bgGradient} hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 group`}
                >
                  <span>Purchase Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}        <motion.div 
          className="text-center p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Why Choose Our Test Series?
            </h3>
          </div>
          <p className="text-lg mb-6 max-w-3xl mx-auto text-gray-700">
            Our test series are crafted by subject matter experts with years of experience in competitive exam preparation. 
            Get personalized insights, detailed analytics, and the edge you need to succeed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Expert Designed', 'Regular Updates', 'Instant Results', 'Mobile Friendly'].map((benefit, index) => (
              <span 
                key={index}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200"
              >
                {benefit}
              </span>
            ))}
          </div>
        </motion.div>
      </div>      {/* Login Overlay */}
      <LoginOverlay 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
};

export default SubscriptionInfo;
