import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Rocket, CheckCircle } from 'lucide-react';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Auto advance through animation steps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Animation complete
        setTimeout(onComplete, 1000);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const steps = [
    {
      icon: <BookOpen className="w-16 h-16 text-blue-600" />,
      title: "Welcome to Note Library!",
      description: "Your personalized learning journey starts now."
    },
    {
      icon: <Sparkles className="w-16 h-16 text-amber-500" />,
      title: "Access Premium Content",
      description: "Study notes, practice tests, and more."
    },
    {
      icon: <Rocket className="w-16 h-16 text-purple-600" />,
      title: "Boost Your Performance",
      description: "Track progress and excel in your studies."
    },
    {
      icon: <CheckCircle className="w-16 h-16 text-green-600" />,
      title: "You're All Set!",
      description: "Let's complete your profile to personalize your experience."
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-blue-700 z-50 flex items-center justify-center">
      <div className="max-w-lg w-full px-6">
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: currentStep === index ? 1 : 0,
                scale: currentStep === index ? 1 : 0.8
              }}
              transition={{ duration: 0.5 }}
              style={{ display: currentStep === index ? 'flex' : 'none' }}
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {step.icon}
              </motion.div>
              <motion.h2 
                className="text-2xl font-bold text-gray-900 mt-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {step.title}
              </motion.h2>
              <motion.p 
                className="text-gray-600 mt-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {step.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Progress dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {steps.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                index === currentStep ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
