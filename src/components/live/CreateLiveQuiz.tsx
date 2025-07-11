import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saveLiveQuizToFirestore } from '../../services/firestore/liveQuizServices';
import { QuizDetails, QuizQuestion } from '../admin/TestingQuizzes';
import { LiveQuizData } from '../../services/firestore/liveQuizServices';

interface CreateLiveQuizProps {
  editQuiz?: LiveQuizData | null;
  onEditDone?: () => void;
}

// If QuizDetails and QuizQuestion are in a separate types file, adjust the import path:
// import { QuizDetails, QuizQuestion } from '../../types/quizTypes'; // Example path

const CreateLiveQuiz: React.FC<CreateLiveQuizProps> = ({ editQuiz, onEditDone }) => {
  const { currentUser, loading: authLoading } = useAuth(); // Get currentUser and auth loading state
  const [quizDetails, setQuizDetails] = useState<QuizDetails>({
    id: '',
    title: '',
    grade: '',
    timeLimit: 0,
    targetAudience: 'authenticated',
    startTime: '',
    endTime: '',
  });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  // Populate form if editing
  useEffect(() => {
    if (editQuiz) {
      setQuizDetails({ ...editQuiz.details });
      setQuizQuestions(editQuiz.questions);
    }
  }, [editQuiz]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(`Reading file: ${file.name}, Size: ${file.size} bytes`);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileContent = e.target?.result as string;
          console.log(`File content length: ${fileContent.length} characters`);
          
          const data = JSON.parse(fileContent);
          console.log(`Parsed JSON array length: ${Array.isArray(data) ? data.length : 'Not an array'}`);
          
          // Validate the JSON structure to match the expected format
          if (Array.isArray(data) && data.length > 0) {
            // Check if all items have required properties
            const invalidItems = data.filter((item, index) => {
              const hasRequiredProps = 'questionNo' in item && 
                'question' in item && 
                'option1' in item && 
                'option2' in item && 
                'option3' in item && 
                'option4' in item && 
                'correctOption' in item && 
                'marks' in item;
              
              if (!hasRequiredProps) {
                console.log(`Invalid item at index ${index}:`, item);
              }
              return !hasRequiredProps;
            });

            if (invalidItems.length === 0) {
              // Transform ALL questions from the data array
              const transformedQuestions: QuizQuestion[] = data.map((item, index) => {
                const question: any = {
                  id: item.questionNo || `q-${index + 1}`, // Use questionNo as id, fallback to index
                  questionNo: item.questionNo,
                  question: item.question,
                  option1: item.option1,
                  option2: item.option2,
                  option3: item.option3,
                  option4: item.option4,
                  correctOption: `option${item.correctOption}`, // Convert "1" to "option1"
                  marks: item.marks,
                  // Always include imageLink - use the value from JSON or default to "null"
                  imageLink: item.imageLink !== undefined ? item.imageLink : "null",
                };
                
                return question as QuizQuestion;
              });
              
              console.log(`Successfully transformed ${transformedQuestions.length} questions`);
              setQuizQuestions(transformedQuestions);
              setFileError(null);
            } else {
              setFileError(`Found ${invalidItems.length} invalid questions. All questions must have: questionNo, question, option1-4, correctOption, marks.`);
              setQuizQuestions([]);
            }
          } else {
            setFileError('Invalid JSON format. Expected a non-empty array of quiz questions.');
            setQuizQuestions([]);
          }
        } catch (err) {
          console.error('JSON parsing error:', err);
          setFileError(`Invalid JSON file: ${(err as Error).message}`);
          setQuizQuestions([]);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setFileError('Error reading file. Please try again.');
      };
      
      reader.readAsText(file);
    } else {
      setQuizQuestions([]);
      setFileError(null);
    }
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuizDetails(prevDetails => ({
      ...prevDetails,
      [name]: name === 'timeLimit' ? parseInt(value) : value, // Convert timeLimit to number
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (authLoading || !currentUser) {
      setFormError("Authentication not loaded or user not logged in.");
      return;
    }

    if (!quizDetails.title || !quizDetails.grade || quizDetails.timeLimit <= 0 || !quizDetails.startTime || !quizDetails.endTime) {
      setFormError("Please fill in all quiz details (Title, Grade, Time Limit, Start Time, End Time).");
      return;
    }

    // Validate that end time is after start time
    const startTime = new Date(quizDetails.startTime);
    const endTime = new Date(quizDetails.endTime);
    
    if (endTime <= startTime) {
      setFormError("End time must be after start time.");
      return;
    }

    if (quizQuestions.length === 0) {
      setFormError("Please upload a JSON file with quiz questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      let quizId = quizDetails.id;
      let isEdit = false;
      let createdAt = new Date();
      if (editQuiz) {
        // Editing existing quiz
        isEdit = true;
        quizId = editQuiz.details.id;
        createdAt = editQuiz.createdAt instanceof Date ? editQuiz.createdAt : (editQuiz.createdAt?.toDate ? editQuiz.createdAt.toDate() : new Date());
      } else {
        // Creating new quiz
        quizId = `quiz_${Date.now()}`;
        createdAt = new Date();
      }

      const cleanQuizDetails = {
        id: quizId,
        title: quizDetails.title,
        grade: quizDetails.grade,
        timeLimit: quizDetails.timeLimit,
        targetAudience: quizDetails.targetAudience,
        startTime: quizDetails.startTime,
        endTime: quizDetails.endTime,
      };

      const finalQuizData = {
        details: cleanQuizDetails,
        questions: quizQuestions,
        type: 'live',
        archive: editQuiz ? editQuiz.archive : false,
        createdAt,
      };

      const savedQuizId = await saveLiveQuizToFirestore(finalQuizData, currentUser.uid);
      setSuccessMessage(`Quiz "${quizDetails.title}" ${isEdit ? 'updated' : 'added'} successfully with ID: ${savedQuizId}. Total questions: ${quizQuestions.length}`);

      // Optionally reset the form after successful submission
      setQuizDetails({
        id: '',
        title: '',
        grade: '',
        timeLimit: 0,
        targetAudience: 'authenticated',
        startTime: '',
        endTime: '',
      });
      setQuizQuestions([]);
      if (onEditDone) onEditDone();
      // You might want to clear the file input as well, tricky with React state
      // For now, the user can just re-select.

    } catch (error) {
      console.error("Error saving quiz:", error);
      setFormError(`Failed to save quiz: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-3">Create New Quiz</h1>

      {authLoading && <div className="text-center text-blue-500 mb-4">Loading authentication...</div>}
      {!currentUser && !authLoading && <div className="text-center text-red-500 mb-4">You must be logged in to create a quiz.</div>}

      {/* Quiz Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-md shadow-inner">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quiz Details</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Quiz Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={quizDetails.title}
              onChange={handleDetailsChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade/Category:</label>
            <select
              id="grade"
              name="grade"
              value={quizDetails.grade}
              onChange={handleDetailsChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Grade/Category</option>
              <option value="IOE">IOE</option>
              <option value="CEE">CEE</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
              <option value="None">None</option>
            </select>
          </div>

          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">Time Limit (minutes):</label>
            <input
              type="number"
              id="timeLimit"
              name="timeLimit"
              value={quizDetails.timeLimit}
              onChange={handleDetailsChange}
              required
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">Target Audience:</label>
            <select
              id="targetAudience"
              name="targetAudience"
              value={quizDetails.targetAudience}
              onChange={handleDetailsChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="authenticated">Authenticated Users Only</option>
              <option value="all">All Users (Authenticated & Non-Authenticated)</option>
              <option value="non-authenticated">Non-Authenticated Users Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time:</label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={quizDetails.startTime}
              onChange={handleDetailsChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time:</label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={quizDetails.endTime}
              onChange={handleDetailsChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* JSON Upload Section */}
        <div className="bg-gray-50 p-6 rounded-md shadow-inner">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Upload Quiz Questions (JSON)</h2>
          
          {/* Format guidance */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Expected JSON Format:</h4>
            <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
              <pre>{`[
  {
    "questionNo": "1",
    "question": "Your question text here",
    "imageLink": "null",
    "option1": "First option",
    "option2": "Second option", 
    "option3": "Third option",
    "option4": "Fourth option",
    "correctOption": "1",
    "marks": "1"
  }
]`}</pre>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              • correctOption should be "1", "2", "3", or "4" (not "option1", etc.)<br/>
              • imageLink can be "null" as string or actual URL<br/>
              • All fields are required for each question
            </p>
          </div>
          
          <div className="mb-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {fileError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {fileError}
            </div>
          )}

          {quizQuestions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                ✅ Successfully Parsed {quizQuestions.length} Questions
              </h3>
              <div className="bg-green-50 border border-green-200 p-3 rounded mb-3">
                <p className="text-sm text-green-700">
                  <strong>Total Questions Loaded:</strong> {quizQuestions.length}<br/>
                  <strong>Question IDs:</strong> {quizQuestions.slice(0, 10).map(q => q.questionNo || q.id).join(', ')}
                  {quizQuestions.length > 10 && ` ...and ${quizQuestions.length - 10} more`}
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto bg-gray-100 p-3 rounded text-sm text-gray-700">
                <h4 className="font-medium mb-2">Preview (First 3 Questions):</h4>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(quizQuestions.slice(0, 3), null, 2)}
                  {quizQuestions.length > 3 && (
                    <p className="text-center text-gray-500 mt-2">...and {quizQuestions.length - 3} more questions</p>
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Submission Feedback */}
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || authLoading || !currentUser || quizQuestions.length === 0 || !quizDetails.title || quizDetails.timeLimit <= 0 || !quizDetails.startTime || !quizDetails.endTime}
          className={`w-full py-3 px-6 rounded-md text-lg font-semibold transition duration-300
            ${isSubmitting || !currentUser || quizQuestions.length === 0 || !quizDetails.title || quizDetails.timeLimit <= 0 || !quizDetails.startTime || !quizDetails.endTime
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
        >
          {isSubmitting ? 'Submitting Quiz...' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
};

export default CreateLiveQuiz;