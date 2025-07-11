// src/components/admin/ManageQuizzes.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import AddQuizForm from './AddQuizForm';
import { db } from '../../lib/firebase'; // Assuming firebase is set up
import { collection, getDocs, deleteDoc, doc, Timestamp, where, query } from 'firebase/firestore'; // Removed updateDoc

// Define types for client-side quiz data
interface QuizOptionClient {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionClient {
  id: string; // Ensure this ID is present and comes from your Firestore data
  questionText?: string;
  options: QuizOptionClient[];
}

export interface QuizClient { // Exporting for AddQuizForm if it uses this for initialData
  id: string; // Firestore document ID
  title: string;
  grade: string;
  subject?: string;
  audience: 'auth' | 'non-auth' | 'both'; // Make sure this matches Firestore 'all', 'authenticated', 'non-authenticated' or adapt
  timeLimit: number;
  questions: QuizQuestionClient[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const ManageQuizzes: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizClient | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // Helper function to map Firestore audience to client audience
  const mapFirestoreAudienceToClient = (firestoreAudience: string): 'auth' | 'non-auth' | 'both' => {
    switch (firestoreAudience) {
      case 'authenticated':
        return 'auth';
      case 'non-authenticated':
        return 'non-auth';
      case 'all':
      default:
        return 'both';
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // Fetch ALL quizzes from the collection
      const q = query(collection(db, "quizzes"));
      const querySnapshot = await getDocs(q);
  
      const quizzesData = querySnapshot.docs
        .map(doc => {
          // get all the quizzes then filter those which do not have a type field in them
          //  this will display only the quizzes which are not live
          const data = doc.data();
  
          // Check if 'type' field is missing OR if 'type' is not 'live'
          const hasNoTypeField = !Object.prototype.hasOwnProperty.call(data, 'type');
          const typeIsNotLive = data.type !== 'live';
  
          if (hasNoTypeField || typeIsNotLive) {
            // Map the Firestore data structure to the expected client structure
            const mappedQuiz: QuizClient = {
              id: doc.id,
              title: data.details?.title || data.title || 'Untitled Quiz',
              grade: data.details?.grade || data.grade || 'Unknown Grade',
              subject: data.subject,
              audience: mapFirestoreAudienceToClient(data.details?.targetAudience || data.audience),
              timeLimit: data.details?.timeLimit || data.timeLimit || 30,
              questions: (data.questions || []).map((q: any) => ({
                id: q.id,
                questionText: q.question || q.questionText,
                options: q.options || [
                  { id: 'opt1', text: q.option1 || '', isCorrect: q.correctOption === '1' },
                  { id: 'opt2', text: q.option2 || '', isCorrect: q.correctOption === '2' },
                  { id: 'opt3', text: q.option3 || '', isCorrect: q.correctOption === '3' },
                  { id: 'opt4', text: q.option4 || '', isCorrect: q.correctOption === '4' }
                ]
              })),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };
            return mappedQuiz;
          }
          return null; // Return null for quizzes that don't match the criteria
        })
        .filter((quiz): quiz is QuizClient => quiz !== null); // Filter out the null values
  
      // Sort by creation date, newest first
      quizzesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); // Add null checks
  
      setQuizzes(quizzesData);
  
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError("Failed to load quizzes.");
      if (err instanceof Error) {
        setError(`Failed to load quizzes: ${err.message}`);
      } else {
        setError("Failed to load quizzes due to an unknown error.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSaveSuccess = () => {
    setShowAddForm(false);
    setEditingQuiz(null);
    fetchQuizzes(); // Re-fetch quizzes to show the new/updated one
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    setLoading(true); // Optional: show loading state during delete
    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
      // toast.success('Quiz deleted successfully!'); // If you use a toast library
    } catch (err) {
      console.error("Error deleting quiz:", err);
      setError("Failed to delete quiz.");
      // toast.error('Failed to delete quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz: QuizClient) => {
    setEditingQuiz(quiz);
    setShowAddForm(true);
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/student/quiz/${quizId}`); // Navigate to the quiz player route
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Manage Quizzes</h1>
        <button
          onClick={() => {
            setEditingQuiz(null); 
            setShowAddForm(true);
          }}
          className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow-sm transition-colors"
        >
          {showAddForm && !editingQuiz ? 'Adding New Quiz...' : 'Add New Quiz'}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {showAddForm && (
        <div className="my-8 p-6 bg-white shadow-xl rounded-xl">
          <AddQuizForm
            // Pass initialData for editing, and a key to re-mount the form when initialData changes
            key={editingQuiz ? editingQuiz.id : 'new-quiz-form'} 
            initialData={editingQuiz} 
            onSaveSuccess={handleSaveSuccess}
            onClose={() => {
              setShowAddForm(false);
              setEditingQuiz(null);
            }}
          />
        </div>
      )}

      {loading && quizzes.length === 0 && <p className="text-center py-4 text-slate-500">Loading quizzes...</p>}
      
      {!loading && quizzes.length === 0 && !error && (
        <p className="text-center text-slate-500 py-6">No quizzes found. Add one to get started!</p>
      )}

      {!loading && quizzes.length > 0 && (
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl">
          <ul role="list" className="divide-y divide-slate-200">
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <div className="px-4 py-5 sm:px-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-sky-700 truncate">{quiz.title}</p>
                    <div className="ml-2 flex-shrink-0 flex space-x-3">
                      <button
                        onClick={() => handleStartQuiz(quiz.id)} // Add Start Quiz button
                        className="px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-300 rounded-md transition-colors"
                      >
                        Start Quiz
                      </button>
                      <button 
                        onClick={() => handleEditQuiz(quiz)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-300 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 sm:flex sm:justify-between">
                    <div className="sm:flex space-x-4 text-sm text-slate-600">
                      <p>Grade: <span className="font-medium text-slate-700">{quiz.grade}</span></p>
                      {quiz.subject && <p>Subject: <span className="font-medium text-slate-700">{quiz.subject}</span></p>}
                      <p>Time: <span className="font-medium text-slate-700">{quiz.timeLimit} mins</span></p>
                      <p>Questions: <span className="font-medium text-slate-700">{quiz.questions.length}</span></p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                      <p>
                        Created: {quiz.createdAt ? quiz.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;
