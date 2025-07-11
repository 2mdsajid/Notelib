import React, { useState, useEffect } from 'react';
import Planner from './Planner'; // Assuming Planner.tsx is in the same directory c:\Users\Prabin\Downloads\no\project\src\components\student\
import quotesData from './quotes.json';
import { CalendarDays, BookOpen } from 'lucide-react';

interface Quote {
  quote: string;
  author: string;
}

const StdDashboard: React.FC = () => {
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Filter out quotes that don't have a 'quote' property or have an empty quote, and ensure author is a string
    const validQuotes = quotesData.filter(
      (q): q is Quote => 
        typeof q.quote === 'string' && q.quote.trim() !== '' &&
        typeof q.author === 'string' && q.author.trim() !== ''
    );

    if (validQuotes.length > 0) {
      const today = new Date();
      // Calculate a consistent daily index. Using day of the year.
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const diff = today.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const quoteIndex = dayOfYear % validQuotes.length;
      setDailyQuote(validQuotes[quoteIndex]);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return (    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
        Welcome back to Note Library
      </h1>

      {/* Daily Quote Section */}
      {dailyQuote && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg transition-all duration-500 hover:shadow-2xl">
          <div className="flex items-center mb-3">
            <BookOpen size={28} className="mr-3" />
            <h2 className="text-2xl font-semibold">Quote of the Day</h2>
          </div>
          <blockquote className="text-lg italic mb-2">
            "{dailyQuote.quote}"
          </blockquote>
          <p className="text-right font-medium text-indigo-200">- {dailyQuote.author}</p>
        </div>
      )}

      {/* Planner Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center mb-6">
          <CalendarDays size={28} className="mr-3 text-green-600" />
          <h2 className="text-2xl font-semibold text-gray-700">My Planner</h2>
        </div>
        <Planner />
      </div>
    </div>
  );
};

export default StdDashboard;
