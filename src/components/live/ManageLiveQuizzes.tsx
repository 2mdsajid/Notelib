import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { LiveQuizData, getAllLiveQuizzesFromFirestore, deleteLiveQuizFromFirestore, toggleLiveQuizArchiveStatus } from '../../services/firestore/liveQuizServices';

interface ManageLiveQuizzesProps {
  onEditQuiz?: (quiz: LiveQuizData) => void;
}

const ManageLiveQuizzes: React.FC<ManageLiveQuizzesProps> = ({ onEditQuiz }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [liveQuizzes, setLiveQuizzes] = useState<LiveQuizData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [togglingArchiveId, setTogglingArchiveId] = useState<string | null>(null); // State to track which quiz is being toggled
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchLiveQuizzes = async () => {
    if (authLoading || !isAdmin) {
      if (!authLoading && !isAdmin) {
        setError('Access Denied: You must be an administrator to manage live quizzes.');
      }
      return;
    }
    
    setDataLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const fetchedQuizzes = await getAllLiveQuizzesFromFirestore();
      fetchedQuizzes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setLiveQuizzes(fetchedQuizzes);
    } catch (err) {
      console.error('Error fetching live quizzes:', err);
      setError('Failed to load live quizzes. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveQuizzes();
  }, [isAdmin, authLoading]);

  const handleDeleteLiveQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this LIVE quiz? This action cannot be undone.')) {
      return;
    }
    setDataLoading(true);
    try {
      await deleteLiveQuizFromFirestore(quizId);
      setSuccessMessage('Live quiz deleted successfully!');
      fetchLiveQuizzes();
    } catch (err) {
      console.error('Error deleting live quiz:', err);
      setError('Failed to delete live quiz.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleEditLiveQuiz = (quiz: LiveQuizData) => {
    if (onEditQuiz) {
      onEditQuiz(quiz);
    }
  };

  const handleToggleArchiveStatus = async (quizId: string) => {
    setTogglingArchiveId(quizId); // Set the ID of the quiz currently being toggled
    setSuccessMessage(null);
    setError(null);
    try {
      await toggleLiveQuizArchiveStatus(quizId);
      setSuccessMessage('Live quiz archive status updated successfully!');
      fetchLiveQuizzes(); // Re-fetch to update the UI with the new status
    } catch (err) {
      console.error('Error toggling archive status:', err);
      setError('Failed to update archive status.');
    } finally {
      setTogglingArchiveId(null); // Clear the toggling state
    }
  };

  const handleAttendTest = (quizId: string) => {
    navigate(`/student/quiz/${quizId}`); // Navigate to the quiz player route
  };

  if (authLoading) {
    return <div className="text-center text-blue-500 mt-8">Loading authentication...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center text-red-500 mt-8">Access Denied: You must be an administrator to manage live quizzes.</div>;
  }

  if (dataLoading) {
    return <div className="text-center text-blue-500 mt-8">Loading live quizzes...</div>;
  }

  return (
    <div className="p-4 container mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Live Quizzes</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {liveQuizzes.length === 0 ? (
        <p className="text-center text-gray-600">No live quizzes found. Create one in the "Create New Quiz" tab!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveQuizzes.map((quiz) => (
            <div key={quiz.details.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-2 text-indigo-700">{quiz.details.title}</h3>
              <p className="text-gray-600 mb-1"><strong>ID:</strong> {quiz.details.id}</p>
              <p className="text-gray-600 mb-1"><strong>Grade:</strong> {quiz.details.grade}</p>
              <p className="text-gray-600 mb-1"><strong>Time Limit:</strong> {quiz.details.timeLimit} minutes</p>
              <p className="text-gray-600 mb-1"><strong>Questions:</strong> {quiz.questions.length}</p>
              <p className="text-gray-600 mb-1"><strong>Audience:</strong> {quiz.details.targetAudience}</p>
              
              {/* Display Type and Archive Status */}
              <p className="text-gray-600 mb-1">
                <strong>Type:</strong> <span className="font-semibold text-purple-700">{quiz.type.toUpperCase()}</span>
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Status:</strong> 
                <span className={`font-bold ${quiz.archive ? 'text-red-600' : 'text-green-600'}`}>
                  {quiz.archive ? ' Archived' : ' Active'}
                </span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEditLiveQuiz(quiz)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm shadow-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleAttendTest(quiz.details.id)} // Attend button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm shadow-sm"
                >
                  Attend
                </button>
                
                {/* Toggle Archive Status Button */}
                <button
                  onClick={() => handleToggleArchiveStatus(quiz.details.id)}
                  className={`px-4 py-2 rounded-md transition-colors text-sm shadow-sm 
                    ${quiz.archive ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}
                    ${togglingArchiveId === quiz.details.id ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                  disabled={togglingArchiveId === quiz.details.id}
                >
                  {togglingArchiveId === quiz.details.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    quiz.archive ? 'Unarchive' : 'Archive'
                  )}
                </button>

                {/* Delete button (remains) */}
                <button
                  onClick={() => handleDeleteLiveQuiz(quiz.details.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageLiveQuizzes;