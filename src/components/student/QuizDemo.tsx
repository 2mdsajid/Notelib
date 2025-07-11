import React, { useState } from 'react';
import QuizPlayer, { QuizResult } from './QuizPlayer';
import QuizResultComponent from './QuizResult';

// Sample quiz data for testing
const sampleQuiz = {
  id: 'sample-quiz-1',
  title: 'Basic Mathematics Quiz',
  grade: 'Grade 10',
  subject: 'Mathematics',
  timeLimit: 5, // 5 minutes for demo
  questions: [
    {
      id: 'q1',
      questionText: 'What is 2 + 2?',
      options: [
        { id: 'q1-opt1', text: '3', isCorrect: false },
        { id: 'q1-opt2', text: '4', isCorrect: true },
        { id: 'q1-opt3', text: '5', isCorrect: false },
        { id: 'q1-opt4', text: '6', isCorrect: false }
      ]
    },
    {
      id: 'q2',
      questionText: 'What is 10 × 5?',
      options: [
        { id: 'q2-opt1', text: '40', isCorrect: false },
        { id: 'q2-opt2', text: '45', isCorrect: false },
        { id: 'q2-opt3', text: '50', isCorrect: true },
        { id: 'q2-opt4', text: '55', isCorrect: false }
      ]
    },
    {
      id: 'q3',
      questionText: 'What is the square root of 16?',
      options: [
        { id: 'q3-opt1', text: '2', isCorrect: false },
        { id: 'q3-opt2', text: '3', isCorrect: false },
        { id: 'q3-opt3', text: '4', isCorrect: true },
        { id: 'q3-opt4', text: '5', isCorrect: false }
      ]
    },
    {
      id: 'q4',
      questionText: 'What is 15% of 200?',
      options: [
        { id: 'q4-opt1', text: '25', isCorrect: false },
        { id: 'q4-opt2', text: '30', isCorrect: true },
        { id: 'q4-opt3', text: '35', isCorrect: false },
        { id: 'q4-opt4', text: '40', isCorrect: false }
      ]
    },
    {
      id: 'q5',
      questionText: 'If x + 5 = 12, what is x?',
      options: [
        { id: 'q5-opt1', text: '5', isCorrect: false },
        { id: 'q5-opt2', text: '6', isCorrect: false },
        { id: 'q5-opt3', text: '7', isCorrect: true },
        { id: 'q5-opt4', text: '8', isCorrect: false }
      ]
    }
  ]
};

const QuizDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'quiz' | 'result'>('menu');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setCurrentView('result');
    
    // Console log all the quiz data for testing
    console.log('=== QUIZ DEMO COMPLETE ===');
    console.log('Quiz Data:', sampleQuiz);
    console.log('User Result:', result);
    console.log('========================');
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setCurrentView('quiz');
  };

  const handleBackToMenu = () => {
    setQuizResult(null);
    setCurrentView('menu');
  };

  const startQuiz = () => {
    setCurrentView('quiz');
    console.log('Starting quiz demo with sample data:', sampleQuiz);
  };

  if (currentView === 'quiz') {
    return (
      <QuizPlayer
        quiz={sampleQuiz}
        onQuizComplete={handleQuizComplete}
        onExit={handleBackToMenu}
      />
    );
  }

  if (currentView === 'result' && quizResult) {
    return (
      <QuizResultComponent
        result={quizResult}
        onRetakeQuiz={handleRetakeQuiz}
        onBackToQuizzes={handleBackToMenu}
      />
    );
  }

  // Default menu view
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Quiz Player Demo</h1>
          <p className="text-gray-600 mb-8">
            This is a demo of the quiz player and result components. 
            Click "Start Demo Quiz" to begin with sample questions.
          </p>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Demo Quiz Details:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold">Title</div>
                <div>{sampleQuiz.title}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold">Grade</div>
                <div>{sampleQuiz.grade}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold">Subject</div>
                <div>{sampleQuiz.subject}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold">Questions</div>
                <div>{sampleQuiz.questions.length}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={startQuiz}
              className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Demo Quiz
            </button>
            
            <p className="text-sm text-gray-500">
              Note: All quiz data and results will be logged to the console for testing purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDemo;
