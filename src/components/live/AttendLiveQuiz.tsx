import React, { useEffect, useState } from 'react';
import { getFirstUnarchivedLiveQuizFromFirestore, LiveQuizData } from '../../services/firestore/liveQuizServices';
import { Link } from 'react-router-dom';

const AttendLiveQuiz: React.FC = () => {
  const [quiz, setQuiz] = useState<LiveQuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedQuiz = await getFirstUnarchivedLiveQuizFromFirestore();
        setQuiz(fetchedQuiz);
        if (!fetchedQuiz) {
          setError('No Live Tests are currently available.');
        }
      } catch (err) {
        console.error("Error fetching live quiz:", err);
        setError("Failed to load the live quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg text-blue-600 font-medium">Loading live quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block mt-2">{error}</span>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg max-w-md text-center">
          <strong className="font-bold text-lg">No Quiz Available</strong>
          <span className="block mt-2">No active live quizzes found at this moment. Please check back later!</span>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            Live Quiz: {quiz.details.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-700">Grade/Category</p>
              <p className="text-xl font-semibold text-blue-700 mt-1">{quiz.details.grade}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-700">Time Limit</p>
              <p className="text-xl font-semibold text-blue-700 mt-1">{quiz.details.timeLimit} minutes</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-700">Total Questions</p>
              <p className="text-xl font-semibold text-blue-700 mt-1">{quiz.questions.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium text-gray-700">Target Audience</p>
              <p className="text-xl font-semibold text-blue-700 mt-1">
                {quiz.details.targetAudience.charAt(0).toUpperCase() + quiz.details.targetAudience.slice(1)}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => alert(`Starting quiz: ${quiz.details.title}\n(Implementation for actual quiz play goes here!)`)}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Live Quiz
            </button>
            <Link to="/" className="mt-4 block text-blue-600 hover:text-blue-800 font-medium">
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendLiveQuiz;