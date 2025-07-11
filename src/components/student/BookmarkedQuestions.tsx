import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { Bookmark, BookmarkMinus, Search, HelpCircle, Loader2 } from 'lucide-react';
import { generateContent } from '../../services/gemini/client';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface BookmarkedQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  quizId: string;
  quizTitle: string;
  subject?: string;
  grade?: string;
  isBookmarked: boolean;
  explanation?: string;
}

const BookmarkedQuestions: React.FC = () => {
  const { currentUser } = useAuth();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all'); // 'all', or specific subject/grade values
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});
  
  // Helper function to log messages (console only)
  const logMessage = (message: string) => {
    console.log(message);
  };
  // Load cached explanations from localStorage when component mounts
  useEffect(() => {
    const loadCachedExplanations = () => {
      if (!currentUser) return;
      
      try {
        const cachedExplanationsKey = `ai-explanations-${currentUser.uid}`;
        const cachedExplanations = localStorage.getItem(cachedExplanationsKey);
        
        if (cachedExplanations) {
          const explanations = JSON.parse(cachedExplanations);
          // We'll apply these cached explanations after fetching questions
          return explanations;
        }
      } catch (error) {
        console.error("Error loading cached explanations:", error);
      }
      
      return {};
    };
    
    // Store this for later use
    (window as any).cachedExplanations = loadCachedExplanations();
  }, [currentUser]);
  
  // Fetch bookmarked questions
  useEffect(() => {
    const fetchBookmarkedQuestions = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }try {
        setLoading(true);
        logMessage(`Starting to fetch bookmarked questions for user: ${currentUser.uid}`);
        
        // Try a direct approach to the specific quiz we know exists
        const hardcodedQuizId = "3c706189-b42d-4d17-ad69-ea2e48abbf77";
        const userAttemptsRef = collection(db, 'quizResults', hardcodedQuizId, currentUser.uid);
        const userAttempts = await getDocs(userAttemptsRef);
        
        logMessage(`Found ${userAttempts.docs.length} attempts for quiz ${hardcodedQuizId}`);
        
        const bookmarkedQuestionsArr: BookmarkedQuestion[] = [];
        
        for (const attemptDoc of userAttempts.docs) {
          logMessage(`Processing attempt: ${attemptDoc.id}`);
          const attemptData = attemptDoc.data();
          
          // Debug the structure of the data
          logMessage(`Attempt data has quiz: ${!!attemptData.quiz}`);
          logMessage(`Attempt has userAnswers: ${!!attemptData.userAnswers}, is array: ${Array.isArray(attemptData.userAnswers)}`);
          
          // Check for bookmarked questions
          if (attemptData.userAnswers && Array.isArray(attemptData.userAnswers)) {
            const bookmarked = attemptData.userAnswers.filter(
              (answer: any) => answer.isBookmarked === true
            );
            
            logMessage(`Found ${bookmarked.length} bookmarked questions in this attempt`);
            
            if (bookmarked.length > 0) {
              // For each bookmarked question, get its details
              for (const answer of bookmarked) {
                let question;
                
                // Check if we have question data in quiz field
                if (attemptData.quiz?.questions) {
                  question = attemptData.quiz.questions.find(
                    (q: any) => q.id === answer.questionId
                  );
                  logMessage(`Found question details for ${answer.questionId}: ${!!question}`);
                }
                
                if (question) {
                  // We found the question details
                  bookmarkedQuestionsArr.push({
                    id: question.id,
                    questionText: question.questionText,
                    options: question.options,
                    quizId: hardcodedQuizId,
                    quizTitle: attemptData.title || "Unknown Quiz",
                    subject: attemptData.subject,
                    grade: attemptData.grade,
                    isBookmarked: true
                  });
                } else {
                  // No question details, use placeholder
                  logMessage(`Could not find question details for ${answer.questionId}`);
                  bookmarkedQuestionsArr.push({
                    id: answer.questionId,
                    questionText: "Question data unavailable",
                    options: [{ id: "unknown", text: "Question data not available", isCorrect: false }],
                    quizId: hardcodedQuizId,
                    quizTitle: attemptData.title || "Unknown Quiz",
                    subject: attemptData.subject,
                    grade: attemptData.grade,
                    isBookmarked: true
                  });
                }
              }
            }
          }
        }
        
        logMessage(`Total bookmarked questions found: ${bookmarkedQuestionsArr.length}`);
        setBookmarkedQuestions(bookmarkedQuestionsArr);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bookmarked questions:", error);
        logMessage(`Error fetching bookmarked questions: ${error}`);
        setLoading(false);
      }
    };

    fetchBookmarkedQuestions();
  }, [currentUser]);

  // Filter questions based on search and filter criteria
  const filteredQuestions = bookmarkedQuestions.filter(question => {
    const matchesSearch = 
      question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.quizTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      filter === 'all' ||
      (question.subject && filter === question.subject) ||
      (question.grade && filter === question.grade);
    
    return matchesSearch && matchesFilter;
  });

  // Get unique subjects and grades for filter options
  const subjects = [...new Set(bookmarkedQuestions.map(q => q.subject).filter(Boolean))];
  const grades = [...new Set(bookmarkedQuestions.map(q => q.grade).filter(Boolean))];
  // Get AI explanation for a question
  const getAIExplanation = async (questionId: string, questionText: string) => {
    try {
      const questionKey = questionId;
      
      // Set loading state for this specific question
      setLoadingExplanations(prev => ({ ...prev, [questionKey]: true }));
      
      // Create a prompt for the AI
      const prompt = `
        Please explain this question in simple terms:
        "${questionText}"
        
        Provide:
        1. A clear explanation of the concept
        2. The key principles involved
        3. How to approach solving this type of question
        4. Any formulas or rules that apply
      `;
      
      // Call the Gemini API
      const response = await generateContent(prompt);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update the bookmarked questions with the explanation
      setBookmarkedQuestions(prev => 
        prev.map(q => q.id === questionId ? { ...q, explanation: response.text } : q)
      );
        } catch (error) {
      console.error("Error getting AI explanation:", error);
      logMessage(`Error getting AI explanation: ${error}`);
    } finally {
      // Clear loading state for this question
      setLoadingExplanations(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Remove bookmark handler
  const removeBookmark = async (questionId: string, quizId: string) => {
    if (!currentUser) return;

    try {
      console.log(`Attempting to remove bookmark for question ${questionId} in quiz ${quizId}`);
      
      // Get all attempts for this quiz by this user
      const userAttemptsRef = collection(db, 'quizResults', quizId, currentUser.uid);
      const userAttempts = await getDocs(userAttemptsRef);
      console.log(`Found ${userAttempts.docs.length} attempts for quiz ${quizId}`);
      
      let updated = false;
      
      for (const attemptDoc of userAttempts.docs) {
        const attemptData = attemptDoc.data();
        console.log(`Checking attempt ${attemptDoc.id}, has userAnswers: ${!!attemptData.userAnswers}, is array: ${Array.isArray(attemptData.userAnswers)}`);
        
        // Check if this attempt has the bookmarked question
        if (attemptData.userAnswers && Array.isArray(attemptData.userAnswers)) {
          const index = attemptData.userAnswers.findIndex(
            (answer: any) => answer.questionId === questionId && answer.isBookmarked === true
          );
          
          if (index !== -1) {
            // Update the bookmark status in the database
            const updatedUserAnswers = [...attemptData.userAnswers];
            updatedUserAnswers[index] = {
              ...updatedUserAnswers[index],
              isBookmarked: false
            };
            
            // Update the document using its reference
            await updateDoc(attemptDoc.ref, {
              userAnswers: updatedUserAnswers
            });
            
            updated = true;
            
            // Update local state
            setBookmarkedQuestions(prev => 
              prev.filter(q => !(q.id === questionId && q.quizId === quizId))
            );
            
            console.log(`Successfully removed bookmark for question ${questionId}`);
            break; // Found and updated the bookmark, no need to continue
          }
        }
      }
      
      if (!updated) {
        console.log("Could not find the bookmarked question to remove");
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bookmarked Questions</h1>
          <p className="text-gray-600">Review and study questions you've saved for later.</p>
        </header>

        {bookmarkedQuestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Bookmark size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Bookmarked Questions Yet</h2>
            <p className="text-gray-500 mb-6">When taking quizzes, use the bookmark feature to save questions you want to review later.</p>
          </div>
        ) : (
          <>            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="relative flex-grow max-w-xl">
                  <Search size={20} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {subjects.map(subject => (
                      <option key={`subject-${subject}`} value={subject}>
                        {subject}
                      </option>
                    ))}
                    {grades.map(grade => (
                      <option key={`grade-${grade}`} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <Search size={48} className="mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">No Questions Match Your Search</h2>
                  <p className="text-gray-500">Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div key={`${question.quizId}-${question.id}`} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          {question.grade && <span className="mr-2">Grade {question.grade}</span>}
                          {question.subject && <span>{question.subject}</span>}
                        </div>
                        <div className="text-md font-medium text-blue-600">{question.quizTitle}</div>
                      </div>
                      <button
                        onClick={() => removeBookmark(question.id, question.quizId)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove bookmark"
                      >
                        <BookmarkMinus size={20} />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.questionText}</h3>                    <div className="space-y-2 mb-4">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg ${
                            option.isCorrect
                              ? 'border-green-500 border bg-green-50 text-green-700'
                              : 'border border-gray-200 bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {option.isCorrect && (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            )}
                            <span>{option.text}</span>
                            {option.isCorrect && (
                              <span className="ml-auto text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* AI Explanation Section */}
                    <div className="mt-4 border-t pt-4">
                      {!question.explanation && !loadingExplanations[question.id] && (
                        <button
                          onClick={() => getAIExplanation(question.id, question.questionText)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <HelpCircle size={16} />
                          <span>Get AI Explanation</span>
                        </button>
                      )}
                      
                      {loadingExplanations[question.id] && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Generating explanation...</span>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="text-md font-semibold text-purple-800 mb-2 flex items-center gap-2">
                            <HelpCircle size={16} />
                            AI Explanation
                          </h4>
                          <div className="text-sm text-gray-800 whitespace-pre-line">
                            {question.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookmarkedQuestions;
