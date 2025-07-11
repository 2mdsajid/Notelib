// src/components/admin/AddQuizForm.tsx
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Toaster, toast } from 'react-hot-toast';
import { saveQuizToFirestore } from '../../services/firestore/quizService'; // Updated import
import { QuizClient as QuizDataForEditing } from './ManageQuizzes'; // Import type for editing
import { useAuth } from '../../contexts/AuthContext'; // Added import
import { v4 as uuidv4 } from 'uuid'; // Added import
import { QuizDetails as TestingQuizDetails, QuizQuestion as TestingQuizQuestion } from '../../components/admin/TestingQuizzes'; // Added import for payload types

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string; // Keep this for client-side keying and mapping if needed
  questionText?: string;
  options: QuizOption[];
  questionTextError?: string;
  optionsErrors?: string[];
  correctAnswerError?: string;
}

export interface Quiz {
  quizId: string;
  title: string;
  grade: string;
  subject?: string;
  audience: 'auth' | 'non-auth' | 'both';
  timeLimit: number;
  questions: Array<Omit<QuizQuestion, 'questionTextError' | 'optionsErrors' | 'correctAnswerError'>>;
}

const ثابتOptions: QuizOption[] = [
  { id: 'opt1', text: '', isCorrect: false },
  { id: 'opt2', text: '', isCorrect: false },
  { id: 'opt3', text: '', isCorrect: false },
  { id: 'opt4', text: '', isCorrect: false },
];

const initialQuestionState: QuizQuestion = {
  id: Date.now().toString(),
  questionText: '',
  options: JSON.parse(JSON.stringify(ثابتOptions)),
  questionTextError: '',
  optionsErrors: Array(4).fill(''),
  correctAnswerError: '',
};

// Simplified Quill modules for superscript and subscript
const quillModules = {
  toolbar: [
    [{ 'script': 'sub'}, { 'script': 'super' }], // Subscript and Superscript
    ['bold', 'italic', 'underline'], // Basic formatting
    ['clean']
  ],
};

const quillFormats = [
  'script',
  'bold', 'italic', 'underline',
];

const GRADE_OPTIONS = ["Grade 11", "Grade 12", "CEE", "IOE", "Other"];
const SUBJECTS_BY_GRADE: { [key: string]: string[] } = {
  "Grade 11": ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Nepali', 'Social Studies'],
  "Grade 12": ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Nepali', 'Social Studies'],
};

interface FormErrors {
  quizTitle?: string;
  grade?: string;
  subject?: string; // Added subject error
  timeLimit?: string;
  // Individual question errors will be stored within the question objects
}

interface AddQuizFormProps {
  initialData?: QuizDataForEditing | null;
  onSaveSuccess: () => void;
  onClose: () => void; // To handle closing the form, e.g., from ManageQuizzes
}

const AddQuizForm: React.FC<AddQuizFormProps> = ({ initialData, onSaveSuccess, onClose }) => {
  const { currentUser } = useAuth(); // Added useAuth hook
  const [quizIdToEdit, setQuizIdToEdit] = useState<string | null>(null); // To store the ID of the quiz being edited
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [subject, setSubject] = useState<string>(''); // Added subject state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]); // For dynamic subject dropdown
  const [audience, setAudience] = useState<'auth' | 'non-auth' | 'both'>('both');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ ...initialQuestionState, id: `q_${Date.now()}` }]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for Firestore submission state

  useEffect(() => {
    if (initialData) {
      setQuizIdToEdit(initialData.id); // Store the quiz ID for update
      setQuizTitle(initialData.title);
      setGrade(initialData.grade);
      setSubject(initialData.subject || '');
      setAudience(initialData.audience);
      setTimeLimit(initialData.timeLimit);
      // Map questions from initialData to the form's question state
      // Ensure IDs are preserved for options if they exist and are used for keying
      const questionsFromData = initialData.questions.map(q => ({
        id: q.id || `q_${Date.now()}_${Math.random()}`, // Use existing ID or generate one
        questionText: q.questionText || '',
        options: q.options.map(opt => ({
          id: opt.id || `opt_${Date.now()}_${Math.random()}`, // Use existing ID or generate one
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        questionTextError: '',
        optionsErrors: Array(q.options.length > 0 ? q.options.length : 4).fill(''),
        correctAnswerError: '',
      }));
      setQuestions(questionsFromData);
    } else {
      // Reset form to initial state if no initialData (i.e., for creating a new quiz)
      setQuizIdToEdit(null);
      setQuizTitle('');
      setGrade('');
      setSubject('');
      setAudience('both');
      setTimeLimit(30);
      setQuestions([{ ...initialQuestionState, id: `q_${Date.now()}` }]);
      setFormErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (grade && (grade === "Grade 11" || grade === "Grade 12")) {
      setAvailableSubjects(SUBJECTS_BY_GRADE[grade] || []);
      // Reset subject if grade changes and current subject is not valid for new grade
      if (subject && !(SUBJECTS_BY_GRADE[grade] || []).includes(subject)) {
        setSubject('');
      }
    } else {
      setAvailableSubjects([]);
      setSubject(''); // Clear subject if grade doesn't require it
    }
  }, [grade, subject]); // Added subject to dependency array

  const handleGradeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    setGrade(newGrade);
    if (hasAttemptedSubmit) {
        setFormErrors(prev => ({...prev, grade: newGrade ? '' : 'Grade is required.'}));
        // Validate subject as well if grade changes
        if (newGrade === "Grade 11" || newGrade === "Grade 12") {
            if (!subject) {
                setFormErrors(prev => ({...prev, subject: 'Subject is required for this grade.'}));
            } else {
                setFormErrors(prev => ({...prev, subject: ''}));
            }
        } else {
            setFormErrors(prev => ({...prev, subject: ''})); // Clear subject error if not applicable
        }
    }
  };

  const handleSubjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    if (hasAttemptedSubmit) {
        setFormErrors(prev => ({...prev, subject: newSubject ? '' : 'Subject is required.'}));
    }
  };

  const handleQuestionTextChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = value;
    if (hasAttemptedSubmit) {
        newQuestions[index].questionTextError = (!value || value === '<p><br></p>') ? 'Question text is required.' : '';
    }
    setQuestions(newQuestions);
  };
  
  const handleOptionTextChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = value;
    if (hasAttemptedSubmit) {
        newQuestions[qIndex].optionsErrors = newQuestions[qIndex].optionsErrors ? [...newQuestions[qIndex].optionsErrors!] : Array(4).fill('');
        newQuestions[qIndex].optionsErrors![oIndex] = (!value || value === '<p><br></p>') ? 'Option text is required.' : '';
    }
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.forEach((option, idx) => {
      option.isCorrect = idx === oIndex;
    });
    if (hasAttemptedSubmit) {
        newQuestions[qIndex].correctAnswerError = ''; // Clear error when a selection is made
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { ...initialQuestionState, id: `q_${Date.now()}_${questions.length}`, options: JSON.parse(JSON.stringify(ثابتOptions)), optionsErrors: Array(4).fill('') }]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const errors: FormErrors = {};
    if (!quizTitle.trim()) {
      errors.quizTitle = 'Quiz title is required.';
      isValid = false;
    }
    if (!grade) {
      errors.grade = 'Grade is required.';
      isValid = false;
    }
    if ((grade === "Grade 11" || grade === "Grade 12") && !subject) {
      errors.subject = 'Subject is required for this grade.';
      isValid = false;
    }
    if (timeLimit <= 0) {
        errors.timeLimit = 'Time limit must be a positive number.';
        isValid = false;
    }

    const updatedQuestions = questions.map(q => {
      let questionTextError = '';
      let correctAnswerError = '';
      const optionsErrors = q.options.map(opt => (!opt.text || opt.text === '<p><br></p>') ? 'Option text is required.' : '');

      if (!q.questionText || q.questionText === '<p><br></p>') {
        questionTextError = 'Question text is required.';
        isValid = false;
      }
      if (optionsErrors.some(e => e !== '')) {
        isValid = false;
      }
      if (!q.options.some(opt => opt.isCorrect)) {
        correctAnswerError = 'Please mark one option as correct.';
        isValid = false;
      }
      return { ...q, questionTextError, optionsErrors, correctAnswerError };
    });

    setQuestions(updatedQuestions);
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    setIsSubmitting(true); // Start submission process

    if (!validateForm()) {
      toast.error('Please correct the errors in the form before submitting.');
      setIsSubmitting(false); // Ensure isSubmitting is reset here
      return;
    }
    
    setIsSubmitting(true); // Start submission process only after validation passes

    const userId = currentUser?.uid;
    if (!userId) {
      toast.error("You must be logged in to save a quiz.");
      setIsSubmitting(false);
      return;
    }

    const submitToastId = toast.loading(quizIdToEdit ? 'Updating quiz data...' : 'Processing quiz data...');

    const processedQuestions = questions.map(q => {
      const { questionTextError, optionsErrors, correctAnswerError, ...restOfQuestion } = q;
      return { 
        ...restOfQuestion,
        options: q.options.map(opt => ({id: opt.id, text: opt.text, isCorrect: opt.isCorrect}))
      };
    });
    
    const currentQuizId = quizIdToEdit || uuidv4();

    let mappedAudience: TestingQuizDetails['targetAudience'];
    switch (audience) {
      case 'auth':
        mappedAudience = 'authenticated';
        break;
      case 'non-auth':
        mappedAudience = 'non-authenticated';
        break;
      case 'both':
      default:
        mappedAudience = 'all';
        break;
    }

    const quizDetailsPayload: TestingQuizDetails = {
      id: currentQuizId,
      title: quizTitle,
      grade: grade,
      timeLimit: timeLimit,
      targetAudience: mappedAudience, // Use mapped value
      // subject: (grade === "Grade 11" || grade === "Grade 12") ? subject : undefined, // subject is not in TestingQuizDetails
      // description: "" // Optional: Add if form includes description
    };

    const questionsPayload: TestingQuizQuestion[] = processedQuestions.map((q, index) => {
      const correctOptionIndex = q.options.findIndex(opt => opt.isCorrect);
      const correctOptionString = correctOptionIndex !== -1 ? (correctOptionIndex + 1).toString() : "";

      return {
        id: q.id || uuidv4(),
        questionNo: (index + 1).toString(),
        question: q.questionText || "",
        option1: q.options[0]?.text || "",
        option2: q.options[1]?.text || "",
        option3: q.options[2]?.text || "",
        option4: q.options[3]?.text || "",
        correctOption: correctOptionString,
        marks: "1", // Default marks to "1" as a string
      };
    });

    const completeQuizData = {
      details: quizDetailsPayload,
      questions: questionsPayload,
    };

    try {
      await saveQuizToFirestore(completeQuizData, userId);
      
      const successMessage = quizIdToEdit ? `Quiz successfully updated!` : `Quiz successfully saved!`;
      toast.success(successMessage, { id: submitToastId, duration: 4000 });
      
      onSaveSuccess();
      // Reset form if it remains visible
      // ... (reset logic if needed)

    } catch (error) {
      console.error("Error during Firestore submission: ", error);
      toast.error('An unexpected error occurred while saving the quiz.', { id: submitToastId });
    } finally {
      setIsSubmitting(false); // End submission process
    }
  };

  return (
    <> {/* Added Fragment to wrap Toaster and form */}
      <Toaster position="top-center" reverseOrder={false} /> {/* Added Toaster */}
      <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-slate-50 shadow-xl rounded-xl max-w-4xl mx-auto my-8">
      <div className="border-b border-slate-300 pb-6 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{initialData ? 'Edit Quiz' : 'Create New Quiz'}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {initialData ? 'Modify the details below to update the quiz.' : 'Fill in the details below to create a new quiz.'}
          </p>
        </div>
        <button
            type="button"
            onClick={onClose} // Use onClose prop to close the form
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close form"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Quiz Title */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <label htmlFor="quizTitle" className="block text-sm font-semibold text-slate-700 mb-1">Quiz Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="quizTitle"
          value={quizTitle}
          onChange={(e) => {
            setQuizTitle(e.target.value);
            if (hasAttemptedSubmit) setFormErrors(prev => ({...prev, quizTitle: e.target.value.trim() ? '' : 'Quiz title is required.'}));
          }}
          className={`mt-1 block w-full px-4 py-2.5 border ${formErrors.quizTitle ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${formErrors.quizTitle ? 'focus:ring-red-500' : 'focus:ring-sky-500'} focus:border-transparent sm:text-sm transition-colors`}
        />
        {formErrors.quizTitle && <p className="text-xs text-red-600 mt-1">{formErrors.quizTitle}</p>}
      </div>

      {/* Grade, Subject and Time Limit in a grid */}
      <div className={`grid grid-cols-1 ${(grade === "Grade 11" || grade === "Grade 12") ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 bg-white p-6 rounded-lg shadow-md`}>
        <div>
          <label htmlFor="grade" className="block text-sm font-semibold text-slate-700 mb-1">Grade <span className="text-red-500">*</span></label>
          <select
            id="grade"
            value={grade}
            onChange={handleGradeChange}
            className={`mt-1 block w-full px-4 py-2.5 border ${formErrors.grade ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${formErrors.grade ? 'focus:ring-red-500' : 'focus:ring-sky-500'} focus:border-transparent sm:text-sm transition-colors`}
          >
            <option value="" disabled>Select Grade</option>
            {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            {/* Removed "Other" from here as it's in GRADE_OPTIONS now */}
          </select>
          {formErrors.grade && <p className="text-xs text-red-600 mt-1">{formErrors.grade}</p>}
        </div>

        { (grade === "Grade 11" || grade === "Grade 12") && (
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
            <select
              id="subject"
              value={subject}
              onChange={handleSubjectChange}
              className={`mt-1 block w-full px-4 py-2.5 border ${formErrors.subject ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${formErrors.subject ? 'focus:ring-red-500' : 'focus:ring-sky-500'} focus:border-transparent sm:text-sm transition-colors`}
              disabled={availableSubjects.length === 0}
            >
              <option value="" disabled>Select Subject</option>
              {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {formErrors.subject && <p className="text-xs text-red-600 mt-1">{formErrors.subject}</p>}
          </div>
        )}

        <div className={`${(grade === "Grade 11" || grade === "Grade 12") ? '' : 'md:col-start-2'}`}> {/* Adjusted class for positioning */}
          <label htmlFor="timeLimit" className="block text-sm font-semibold text-slate-700 mb-1">Time Limit (minutes) <span className="text-red-500">*</span></label>
          <input
            type="number"
            id="timeLimit"
            value={timeLimit}
            onChange={(e) => {
                setTimeLimit(parseInt(e.target.value, 10) || 0);
                if (hasAttemptedSubmit) setFormErrors(prev => ({...prev, timeLimit: (parseInt(e.target.value, 10) || 0) > 0 ? '' : 'Time limit must be a positive number.'}));
            }}
            className={`mt-1 block w-full px-4 py-2.5 border ${formErrors.timeLimit ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${formErrors.timeLimit ? 'focus:ring-red-500' : 'focus:ring-sky-500'} focus:border-transparent sm:text-sm transition-colors`}
            min="1"
          />
          {formErrors.timeLimit && <p className="text-xs text-red-600 mt-1">{formErrors.timeLimit}</p>}
        </div>
      </div>

      {/* Target Audience */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
        <div className="mt-2 space-y-3 md:space-y-0 md:flex md:space-x-6">
          {(['both', 'auth', 'non-auth'] as const).map(aud => (
            <label key={aud} className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="audience"
                value={aud}
                checked={audience === aud}
                onChange={(e) => setAudience(e.target.value as 'auth' | 'non-auth' | 'both')}
                className="form-radio h-4 w-4 text-sky-600 transition duration-150 ease-in-out border-slate-400 focus:ring-sky-500"
              />
              <span className="ml-2.5 text-sm text-slate-700">
                {aud === 'both' ? 'All Users' : aud === 'auth' ? 'Authenticated Users Only' : 'Non-Authenticated Users Only'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Questions Section */}
      {questions.map((question, qIndex) => (
        <div key={question.id} className="p-6 border border-slate-200 rounded-xl space-y-6 bg-white shadow-lg mt-8">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <h3 className="text-xl font-semibold text-slate-700">Question {qIndex + 1}</h3> {/* Removed imageUploading indicator */}
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors p-2 rounded-md hover:bg-red-50"
              >
                Remove Question
              </button>
            )}
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Question Text <span className="text-red-500">*</span> {/* Always required now */}
            </label>
            <div className="mt-1 quill-container rounded-md shadow-sm border border-slate-300 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
              <ReactQuill
                theme="snow"
                value={question.questionText}
                onChange={(content) => handleQuestionTextChange(qIndex, content)}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white rounded-md editor-sm"
              />
            </div>
            {question.questionTextError && <p className="text-xs text-red-600 mt-1">{question.questionTextError}</p>}
          </div>

          {/* Options */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-md font-semibold text-slate-700">Options (Select one correct answer <span className="text-red-500">*</span>):</h4>
            {question.options.map((option, oIndex) => (
              <div key={option.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name={`correctOption-${qIndex}`}
                    checked={option.isCorrect}
                    onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                    className="form-radio h-5 w-5 text-sky-600 mt-2.5 flex-shrink-0 border-slate-400 focus:ring-sky-500 cursor-pointer"
                    id={`correctOption-${qIndex}-${oIndex}`}
                  />
                  <div className="flex-grow quill-container-option rounded-md border border-slate-300 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                    <ReactQuill
                      theme="snow"
                      value={option.text}
                      onChange={(content) => handleOptionTextChange(qIndex, oIndex, content)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="bg-white rounded-md editor-xs"
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                </div>
                {question.optionsErrors && question.optionsErrors[oIndex] && <p className="text-xs text-red-600 mt-1 pl-8">{question.optionsErrors[oIndex]}</p>}
              </div>
            ))}
            {question.correctAnswerError && <p className="text-xs text-red-600 mt-2">{question.correctAnswerError}</p>}
          </div>
        </div>
      ))}

      {/* Add Question Button */}
      <div className="flex justify-start pt-4">
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center px-5 py-2.5 border border-dashed border-slate-400 text-sm font-medium rounded-md text-sky-700 bg-sky-50 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
        >
          + Add Another Question
        </button>
      </div>

      {/* Submit Button */}
      <div className="pt-8 border-t border-slate-300 mt-8">
        <button
          type="submit"
          disabled={isSubmitting} // Simplified disabled condition
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (initialData ? 'Updating Quiz...' : 'Saving Quiz...') : (initialData ? 'Save Changes' : 'Create Quiz')} {/* Simplified button text */}
        </button>
      </div>
    </form>
  </>
  );
};

export default AddQuizForm;

// Add some basic styling for Quill editors if needed, or rely on Tailwind utility classes
// For example, to make Quill editors smaller:
// .editor-sm .ql-editor { font-size: 0.875rem; min-height: 80px; }
// .editor-xs .ql-editor { font-size: 0.875rem; min-height: 60px; padding: 8px; }
// .quill-container .ql-toolbar.ql-snow { border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; border-color: inherit; }
// .quill-container .ql-container.ql-snow { border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem; border-color: inherit; }
// .quill-container-option .ql-toolbar.ql-snow { border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; border-color: inherit; }
// .quill-container-option .ql-container.ql-snow { border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem; border-color: inherit; }
