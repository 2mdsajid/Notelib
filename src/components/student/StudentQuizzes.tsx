import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase'; // Adjust path as needed
import { collection, query, getDocs, Timestamp, orderBy, where, doc, getDoc, addDoc } from 'firebase/firestore'; // Added where back
import { useAuth } from '../../contexts/AuthContext';
import QuizPlayer, { QuizResult } from './QuizPlayer';
import QuizResultComponent from './QuizResult';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  imageLink?: string;
  marks: number;
  correctOption: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

interface QuizDetails { // Added QuizDetails interface
  targetAudience: 'all' | 'authenticated' | 'non-authenticated';
  startTime?: string;
  endTime?: string;
  // Add other details if they exist under a 'details' sub-collection or map
}

interface PaymentRequest {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhotoURL?: string | null;
  seriesPurchased: 'IOE' | 'CEE' | 'LIVE'; // The series type being purchased
  paymentProofFileName: string;
  paymentProofCpanelUrl?: string; // To be updated by backend after cPanel upload
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  // Additional metadata for better tracking
  paymentAmount?: number; // Store the amount paid
  paymentMethod?: string; // e.g., 'eSewa', 'Khalti', etc.
  submissionSource?: string; // e.g., 'web', 'mobile'
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  numberOfQuestions?: number;
  grade: string;
  subject?: string;
  timeLimit: number;
  questions: QuizQuestion[];
  createdAt: Timestamp;
  details: QuizDetails; // Added details field
}

const StudentQuizzes: React.FC = () => {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'series' | 'quiz' | 'result'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<'IOE' | 'CEE' | 'LIVE' | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSeries, setPurchaseSeries] = useState<'IOE' | 'CEE' | 'LIVE' |  null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [showQRZoom, setShowQRZoom] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Replace localStorage with Firestore user permissions
  const [userAccess, setUserAccess] = useState<{ 
    ioeAccess: boolean; 
    ceeAccess: boolean; 
    liveTestAccess: boolean;
    examType?: 'IOE' | 'CEE' | null;
  }>({
    ioeAccess: false,
    ceeAccess: false,
    liveTestAccess: false,
    examType: null,
  });

  // Filter states for test series
  const [filterType, setFilterType] = useState<'all' | 'set' | 'capsule'>('all');

  // Helper function to extract number from quiz title for sorting
  const extractNumberFromTitle = (title: string): number => {
    if (!title) return 0;
    
    // Try to find numbers in various patterns
    const patterns = [
      /(?:set|capsule|cap|daily\s*(?:capsule|dose))\s*[-_]?\s*(\d+)/i,
      /(\d+)\s*(?:set|capsule|cap)/i,
      /[sc]\s*[-_]?\s*(\d+)/i,
      /(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return parseInt(match[1], 10) || 0;
      }
    }
    
    return 0;
  };

  // Helper function to sort quizzes by number in title
  const sortQuizzesByNumber = (quizzes: Quiz[]): Quiz[] => {
    return [...quizzes].sort((a, b) => {
      const numA = extractNumberFromTitle(a.title);
      const numB = extractNumberFromTitle(b.title);
      
      // If numbers are different, sort by number
      if (numA !== numB) {
        return numA - numB;
      }
      
      // If numbers are same or both are 0, sort by creation date (oldest first)
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    });
  };

  // Helper function to standardize quiz titles and determine type
  const normalizeQuizTitle = (title: string): { normalizedTitle: string; type: 'set' | 'capsule' | 'other' } => {
    if (!title) return { normalizedTitle: title, type: 'other' };
    
    // Check for Set patterns
    const setPatterns = [
      /set\s*[-_]?\s*(\d+)/i,
      /set\s*(\d+)/i,
      /(\d+)\s*set/i,
      /s\s*[-_]?\s*(\d+)/i
    ];
    
    for (const pattern of setPatterns) {
      const match = title.match(pattern);
      if (match) {
        const number = match[1] || match[2];
        return { 
          normalizedTitle: `Set-${number}`, 
          type: 'set' 
        };
      }
    }
    
    // Check for Capsule patterns
    const capsulePatterns = [
      /capsule\s*[-_]?\s*(\d+)/i,
      /cap\s*[-_]?\s*(\d+)/i,
      /(\d+)\s*capsule/i,
      /(\d+)\s*cap/i,
      /c\s*[-_]?\s*(\d+)/i,
      /daily\s*capsule\s*[-_]?\s*(\d+)/i,
      /daily\s*dose\s*[-_]?\s*(\d+)/i
    ];
    
    for (const pattern of capsulePatterns) {
      const match = title.match(pattern);
      if (match) {
        const number = match[1] || match[2];
        return { 
          normalizedTitle: `Capsule-${number}`, 
          type: 'capsule' 
        };
      }
    }
    
    return { normalizedTitle: title, type: 'other' };
  };

  // Helper function to filter quizzes based on selected filter
  const getFilteredSeriesQuizzes = (seriesQuizzes: Quiz[]) => {
    if (filterType === 'all') return seriesQuizzes;
    
    const filtered = seriesQuizzes.filter(quiz => {
      const { type } = normalizeQuizTitle(quiz.title);
      return type === filterType;
    });
    
    // Apply sorting to filtered results as well
    return sortQuizzesByNumber(filtered);
  };

  // Helper function to get quiz count by type
  const getQuizCountByType = (seriesQuizzes: Quiz[], type: 'set' | 'capsule') => {
    return seriesQuizzes.filter(quiz => {
      const { type: quizType } = normalizeQuizTitle(quiz.title);
      return quizType === type;
    }).length;
  };

  // Helper functions for live quiz time management
  const getQuizTimeStatus = (startTime?: string, endTime?: string): 'upcoming' | 'active' | 'ended' | 'invalid' => {
    if (!startTime || !endTime) return 'invalid';
    
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  const formatDateTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return 'Not specified';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeRemaining = (targetTime?: string): string => {
    if (!targetTime) return '';
    
    try {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;
      
      if (difference <= 0) return '';
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const quizzesCollectionRef = collection(db, 'quizzes');        const gradesToShow = ['IOE', 'CEE']; // Only IOE and CEE test series for regular quizzes

        // Fetch regular quizzes (IOE and CEE) matching the specified grades, ordered by creation date (ascending for 1,2,3... numbering)
        // Exclude live type quizzes from regular test series
        const q = query(
          quizzesCollectionRef,
          where('details.grade', 'in', gradesToShow),
          orderBy('createdAt', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedQuizzes: Quiz[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure 'details' and 'details.targetAudience' exist and are of the correct type
          // Also exclude quizzes with type = 'live' from IOE and CEE test series
          if (data.details && typeof data.details.targetAudience === 'string' && data.type !== 'live') {
            // Explicit mapping to ensure the structure matches the Quiz interface
            const quizEntry: Quiz = {
              id: doc.id,
              title: data.details.title || 'Untitled Quiz', // Sourced from data.details
              description: data.description, // Assuming root level
              numberOfQuestions: Array.isArray(data.questions) ? data.questions.length : undefined, // Derived from questions array
              grade: data.details.grade || 'N/A', // Sourced from data.details
              subject: data.subject, // Assuming root level
              timeLimit: typeof data.details.timeLimit === 'number' ? data.details.timeLimit : 0, // Sourced from data.details
              questions: Array.isArray(data.questions) ? data.questions.map((q: any, index: number): QuizQuestion => { // Added return type QuizQuestion
                const options: QuizOption[] = [];
                if (q.option1) options.push({ id: `${q.id}-opt-1`, text: q.option1, isCorrect: q.correctOption === q.option1 });
                if (q.option2) options.push({ id: `${q.id}-opt-2`, text: q.option2, isCorrect: q.correctOption === q.option2 });
                if (q.option3) options.push({ id: `${q.id}-opt-3`, text: q.option3, isCorrect: q.correctOption === q.option3});
                if (q.option4) options.push({ id: `${q.id}-opt-4`, text: q.option4, isCorrect: q.correctOption === q.option4 });
                // Add more options if q.option5, q.option6 etc. can exist

                const imageLinkFromDB = q.imageLink;
                const questionTextFromDB = q.question;

                const processedImageLink = imageLinkFromDB && typeof imageLinkFromDB === 'string' && imageLinkFromDB.toLowerCase() !== 'null' && imageLinkFromDB.trim() !== ''
                    ? imageLinkFromDB
                    : undefined;

                return {
                  id: q.id || `q-${index}`, // Default ID if missing
                  questionText: processedImageLink
                      ? '' // If image exists, questionText is empty
                      : (questionTextFromDB || `Question ${index + 1} text missing`),
                  options: options,
                  imageLink: processedImageLink,
                  marks: parseInt(q.marks, 10) || 1, // Added marks, default to 1 if NaN or missing
                  correctOption: q.correctOption, // Pass correctOption from Firestore
                  option1: q.option1,
                  option2: q.option2,
                  option3: q.option3,
                  option4: q.option4,
                };
              }) : [],
              createdAt: data.createdAt, // Assuming this is a Firestore Timestamp and exists
              details: data.details, // Assigns the whole Firestore details map to quiz.details
            };
            fetchedQuizzes.push(quizEntry);
          } else {
            // This case should ideally not happen if data is consistent
            console.warn(`Quiz with id ${doc.id} is missing details.targetAudience or it's not a string.`);
          }
        });
        
        setQuizzes(fetchedQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        if (err instanceof Error && (err as any).code === 'permission-denied') {
          setError("You don't have permission to view these quizzes. This might be a configuration issue.");
        } else {
          setError("Failed to load quizzes. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveQuizzes = async () => {
      try {
        const quizzesCollectionRef = collection(db, 'quizzes');
        
        // Fetch live quizzes based on type field only first, then filter by archive in JS
        const liveQuery = query(
          quizzesCollectionRef,
          where('type', '==', 'live'),
          orderBy('createdAt', 'asc')
        );
        
        const liveSnapshot = await getDocs(liveQuery);
        
        const fetchedLiveQuizzes: Quiz[] = [];
        
        liveSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Filter out archived quizzes in JavaScript
          if (data.archive === true) {
            return;
          }
          
          // For live quizzes, the structure is different
          const liveQuizEntry: Quiz = {
            id: doc.id,
            title: data.details?.title || data.title || 'Untitled Live Quiz',
            description: data.description,
            numberOfQuestions: Array.isArray(data.questions) ? data.questions.length : undefined,
            grade: data.details?.grade || data.grade || 'LIVE', // Use details.grade first, then data.grade, fallback to 'LIVE'
            subject: data.subject || data.examType || data.details?.examType, // Include examType as subject
            timeLimit: typeof data.details?.timeLimit === 'number' ? data.details.timeLimit : (typeof data.timeLimit === 'number' ? data.timeLimit : 0),
            questions: Array.isArray(data.questions) ? data.questions.map((q: any, index: number): QuizQuestion => {
              const options: QuizOption[] = [];
              if (q.option1) options.push({ id: `${q.id}-opt-1`, text: q.option1, isCorrect: q.correctOption === 'option1' });
              if (q.option2) options.push({ id: `${q.id}-opt-2`, text: q.option2, isCorrect: q.correctOption === 'option2' });
              if (q.option3) options.push({ id: `${q.id}-opt-3`, text: q.option3, isCorrect: q.correctOption === 'option3' });
              if (q.option4) options.push({ id: `${q.id}-opt-4`, text: q.option4, isCorrect: q.correctOption === 'option4' });

              const imageLinkFromDB = q.imageLink;
              const questionTextFromDB = q.question;

              const processedImageLink = imageLinkFromDB && typeof imageLinkFromDB === 'string' && imageLinkFromDB.toLowerCase() !== 'null' && imageLinkFromDB.trim() !== ''
                  ? imageLinkFromDB
                  : undefined;

              return {
                id: q.id || `q-${index}`,
                questionText: processedImageLink
                    ? '' // If image exists, questionText is empty
                    : (questionTextFromDB || `Question ${index + 1} text missing`),
                options: options,
                correctOption: q.correctOption, // Pass correctOption from Firestore
                option1: q.option1,
                option2: q.option2,
                option3: q.option3,
                option4: q.option4,
              imageLink: processedImageLink,
                marks: parseInt(q.marks, 10) || 1,
              };
            }) : [],
            createdAt: data.createdAt,
            details: {
              targetAudience: data.details?.targetAudience || data.targetAudience || 'authenticated',
              startTime: data.details?.startTime,
              endTime: data.details?.endTime,
            },
          };
          fetchedLiveQuizzes.push(liveQuizEntry);
        });
        
        setLiveQuizzes(fetchedLiveQuizzes);
      } catch (err) {
        console.error("❌ Error fetching live quizzes:", err);
        // Don't show error for live quizzes fetch failure, just log it
      }
    };

    fetchQuizzes();
    fetchLiveQuizzes();
  }, []); // Dependency array is empty, assuming gradesToShow is static
  // Fetch user access permissions from Firestore
  useEffect(() => {
    const fetchUserAccess = async () => {
      if (!currentUser) {
        setUserAccess({ 
          ioeAccess: false, 
          ceeAccess: false, 
          liveTestAccess: false,
          examType: null,
        });
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserAccess({
            ioeAccess: userData.ioeAccess || false,
            ceeAccess: userData.ceeAccess || false,
            liveTestAccess: userData.liveTestAccess || false,
            examType: userData.examType || null,
          });
        } else {
          setUserAccess({ 
            ioeAccess: false, 
            ceeAccess: false, 
            liveTestAccess: false,
            examType: null,
          });
        }
      } catch (error) {
        console.error('Error fetching user access:', error);
        setUserAccess({ 
          ioeAccess: false, 
          ceeAccess: false, 
          liveTestAccess: false,
          examType: null,
        });
      }
    };

    fetchUserAccess();
  }, [currentUser]);

  // Real-time updates for live quiz timing (per second for countdown)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (selectedSeries === 'LIVE' && liveQuizzes.length > 0) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [selectedSeries, liveQuizzes.length]);

  const handleStartQuiz = (quiz: Quiz) => {
    // For live quizzes, check time status
    if (quiz.grade === 'LIVE') {
      const timeStatus = getQuizTimeStatus(quiz.details.startTime, quiz.details.endTime);
      
      if (timeStatus === 'upcoming') {
        alert(`This live quiz hasn't started yet. It will begin at ${formatDateTime(quiz.details.startTime)}`);
        return;
      }
      
      if (timeStatus === 'ended') {
        alert(`This live quiz has ended. It was available until ${formatDateTime(quiz.details.endTime)}`);
        return;
      }
      
      if (timeStatus === 'invalid') {
        alert('This live quiz has invalid timing configuration.');
        return;
      }
    }
    
    setSelectedQuiz(quiz);
    setCurrentView('quiz');
    console.log('Starting quiz:', quiz);
  };  
  const handleSelectSeries = (series: 'IOE' | 'CEE' | 'LIVE') => {
    // Check if user has access to the series
    const hasAccess = series === 'IOE' ? userAccess.ioeAccess : 
                     series === 'CEE' ? userAccess.ceeAccess : 
                     userAccess.liveTestAccess;
    
    if (hasAccess) {
      setSelectedSeries(series);
      setFilterType('all'); // Reset filter when changing series
      setCurrentView('series');
    } else {
      // Don't allow access if user doesn't have permission
      alert(`You need to purchase the ${series} test series to access the tests.`);
    }
  };
  const handleBackToSeriesList = () => {
    setSelectedSeries(null);
    setFilterType('all'); // Reset filter when going back to series list
    setCurrentView('list');
  };

  const handlePurchaseSeries = (series: 'IOE' | 'CEE' | 'LIVE') => {
    setPurchaseSeries(series);
    setShowPurchaseModal(true);
  };
  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchaseSeries(null);
    setPaymentProof(null);
    setPaymentProofPreview(null);
    setShowQRZoom(false);
  };

  const handleShowQRZoom = () => {
    setShowQRZoom(true);
  };

  const handleCloseQRZoom = () => {
    setShowQRZoom(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentProofPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };  const handleSubmitPayment = async () => {
    if (paymentProof && purchaseSeries && currentUser) {
      // Validate series type
      if (!['IOE', 'CEE', 'LIVE'].includes(purchaseSeries)) {
        alert('Invalid series type selected. Please try again.');
        return;
      }

      setIsSubmittingPayment(true);
      setError(null);
      try {
        // Step 1: Upload image to cPanel via uploadpay.php
        const formData = new FormData();
        formData.append('image', paymentProof);

        // Use the full URL to your uploadpay.php script
        const uploadResponse = await fetch('https://notelibraryapp.com/uploadpay.php', { // MODIFIED
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed with status: ' + uploadResponse.status }));
          throw new Error(errorData.error || 'Failed to upload payment proof.');
        }

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success || !uploadResult.url || !uploadResult.filename) {
          throw new Error(uploadResult.error || 'Payment proof upload was not successful or did not return expected data.');
        }

        const paymentProofCpanelUrl = uploadResult.url;
        const paymentProofUniqueFileName = uploadResult.filename;

        // Step 2: Create payment request in Firestore with detailed information
        const paymentAmount = purchaseSeries === 'IOE' ? 100 : purchaseSeries === 'CEE' ? 100 : 50; // Based on the prices shown in UI
        
        const newPaymentRequest: PaymentRequest = {
          userId: currentUser.uid,
          userName: currentUser.displayName,
          userEmail: currentUser.email,
          userPhotoURL: currentUser.photoURL,
          seriesPurchased: purchaseSeries, // IOE, CEE, or LIVE
          paymentProofFileName: paymentProofUniqueFileName, // Use unique name from PHP
          paymentProofCpanelUrl: paymentProofCpanelUrl,    // Use URL from PHP
          status: 'pending',
          requestedAt: Timestamp.now(),
          // Additional metadata
          paymentAmount: paymentAmount,
          paymentMethod: 'eSewa', // Currently only eSewa is supported
          submissionSource: 'web', // Since this is the web interface
        };

        // Add detailed logging for payment submission
        console.log('Submitting payment request:', {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          seriesType: purchaseSeries,
          paymentAmount: paymentAmount,
          timestamp: new Date().toISOString(),
          paymentProofFileName: paymentProofUniqueFileName
        });

        // Store payment request in Firestore with series type information
        // This will store IOE, CEE, or LIVE in the seriesPurchased field for admin processing
        const docRef = await addDoc(collection(db, 'paymentRequests'), newPaymentRequest);
        
        console.log(`Payment request stored in Firestore with ID: ${docRef.id} for series: ${purchaseSeries} (Amount: Rs ${paymentAmount})`);

        alert(`Payment information submitted successfully! Your request for the ${purchaseSeries} test series (Rs ${paymentAmount}) is pending admin approval. You will be notified once it's processed.`);
        
        handleClosePurchaseModal();
      } catch (err) {
        console.error("Error submitting payment request:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to submit payment information: ${errorMessage}`);
        alert(`Failed to submit payment information: ${errorMessage}`);
      } finally {
        setIsSubmittingPayment(false);
      }
    } else {
      alert('Please upload payment proof and ensure you are logged in before submitting.');
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setCurrentView('result');
    console.log('Quiz completed with result:', result);
  };

  const handleBackToQuizList = () => {
    setSelectedQuiz(null);
    setQuizResult(null);
    if (selectedSeries) {
      setCurrentView('series');
    } else {
      setCurrentView('list');
    }
  };
  // Show quiz player if currently taking a quiz
  if (currentView === 'quiz' && selectedQuiz) {
    return (
      <QuizPlayer
        quiz={selectedQuiz}
        onQuizComplete={handleQuizComplete}
        onExit={handleBackToQuizList}
      />
    );
  }

  // Show quiz result if quiz is completed
  if (currentView === 'result' && quizResult) {
    return (
      <QuizResultComponent
        result={quizResult}
        onBackToQuizzes={handleBackToQuizList}
      />
    );
  }

  // Show individual series quizzes
  if (currentView === 'series' && selectedSeries) {
    let seriesQuizzes: Quiz[];
    
    if (selectedSeries === 'LIVE') {
      // Filter live quizzes based on user's exam type preference
      let filteredLiveQuizzes = liveQuizzes;
      
      if (userAccess.examType) {
        // If user has chosen an exam type (IOE or CEE), show only those live quizzes
        filteredLiveQuizzes = liveQuizzes.filter(quiz => {
          // Check if the quiz has an examType field, subject field, or grade field that matches
          const quizExamType = quiz.subject || quiz.grade;
          const quizGrade = quiz.grade;
          
          return quizExamType === userAccess.examType || 
                 quizGrade === userAccess.examType ||
                 (userAccess.examType === 'IOE' && (
                   quizExamType?.toUpperCase().includes('IOE') ||
                   quizGrade?.toUpperCase().includes('IOE')
                 )) ||
                 (userAccess.examType === 'CEE' && (
                   quizExamType?.toUpperCase().includes('CEE') ||
                   quizGrade?.toUpperCase().includes('CEE')
                 ));
        });
      }
      
      seriesQuizzes = sortQuizzesByNumber(filteredLiveQuizzes);
    } else {
      seriesQuizzes = sortQuizzesByNumber(quizzes.filter(quiz => quiz.grade === selectedSeries));
    }
    
    const filteredQuizzes = getFilteredSeriesQuizzes(seriesQuizzes);
    
    const setCount = getQuizCountByType(seriesQuizzes, 'set');
    const capsuleCount = getQuizCountByType(seriesQuizzes, 'capsule');
    
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBackToSeriesList}
            className="mr-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
          >
            ← Back to Test Series
          </button>
          <div>
            <h1 className="text-3xl font-bold text-sky-700">{selectedSeries} Test Series</h1>
            {selectedSeries === 'LIVE' && userAccess.examType && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {userAccess.examType} live tests only
              </p>
            )}
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Type</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filterType === 'all' 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tests ({seriesQuizzes.length})
            </button>
            
            {setCount > 0 && (
              <button
                onClick={() => setFilterType('set')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filterType === 'set' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sets ({setCount})
              </button>
            )}
            
            {capsuleCount > 0 && (
              <button
                onClick={() => setFilterType('capsule')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filterType === 'capsule' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Capsules ({capsuleCount})
              </button>
            )}
          </div>
          
          {filterType !== 'all' && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredQuizzes.length} {filterType === 'set' ? 'sets' : 'capsules'} out of {seriesQuizzes.length} total tests
            </div>
          )}
        </div>
        
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {selectedSeries === 'LIVE' && userAccess.examType ? 
                `No ${userAccess.examType} live tests found` :
                selectedSeries === 'LIVE' && !userAccess.examType ?
                `No exam type selected` :
                `No ${filterType === 'all' ? 'quizzes' : filterType === 'set' ? 'sets' : 'capsules'} found`
              }
            </h3>
            <p className="text-gray-500">
              {selectedSeries === 'LIVE' && !userAccess.examType ? 
                `Please select your exam type (IOE or CEE) in your profile to see relevant live tests.` :
                filterType === 'all' 
                  ? `No quizzes available for ${selectedSeries} at the moment.`
                  : `No ${filterType === 'set' ? 'sets' : 'capsules'} available. Try selecting a different filter.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const { normalizedTitle, type } = normalizeQuizTitle(quiz.title);
              
              // For live quizzes, get time status and additional info
              const isLiveQuiz = quiz.grade === 'LIVE';
              let timeStatus = null;
              let timeToStart = 0;
              let timeToEnd = 0;
              if (isLiveQuiz) {
                const now = currentTime;
                const start = quiz.details.startTime ? new Date(quiz.details.startTime).getTime() : null;
                const end = quiz.details.endTime ? new Date(quiz.details.endTime).getTime() : null;
                if (!start || !end) {
                  timeStatus = 'invalid';
                } else if (now < start) {
                  timeStatus = 'upcoming';
                  timeToStart = Math.max(0, start - now);
                } else if (now >= start && now <= end) {
                  timeStatus = 'active';
                  timeToEnd = Math.max(0, end - now);
                } else {
                  timeStatus = 'ended';
                }
              }

              // Helper to format countdown as hh:mm:ss with leading zeros
              const formatCountdown = (ms: number) => {
                if (ms <= 0) return '00:00:00';
                const totalSeconds = Math.floor(ms / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes
                  .toString()
                  .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              };

              return (
                <div key={quiz.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold text-sky-600">
                        {isLiveQuiz ? quiz.title : normalizedTitle}
                      </h2>
                      {!isLiveQuiz && type !== 'other' && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type === 'set' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {type.toUpperCase()}
                        </span>
                      )}
                      {isLiveQuiz && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          timeStatus === 'active' ? 'bg-green-100 text-green-700' :
                          timeStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                          timeStatus === 'ended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {timeStatus === 'active' ? '🟢 LIVE' :
                           timeStatus === 'upcoming' ? '🟡 UPCOMING' :
                           timeStatus === 'ended' ? '🔴 ENDED' :
                           '❓ INVALID'}
                        </span>
                      )}
                    </div>

                    {/* Live Quiz Timing Information */}
                    {isLiveQuiz && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-md">
                        <div className="text-xs text-gray-600 mb-1">
                          <div className="flex justify-between">
                            <span>Start:</span>
                            <span className="font-medium">{formatDateTime(quiz.details.startTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>End:</span>
                            <span className="font-medium">{formatDateTime(quiz.details.endTime)}</span>
                          </div>
                        </div>

                        {timeStatus === 'upcoming' && (
                          <div className="flex flex-col items-center mt-2">
                            <span className="text-xs text-yellow-600 mb-1">⏰ Starts in</span>
                            <div className="flex gap-1 font-mono text-3xl md:text-4xl tracking-widest bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl shadow-inner border border-yellow-200">
                              {formatCountdown(timeToStart).split("").map((char, idx) => (
                                <span key={idx} className={char === ':' ? 'mx-1 text-yellow-400' : 'inline-block min-w-[1ch]'}>{char}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {timeStatus === 'active' && (
                          <div className="flex flex-col items-center mt-2">
                            <span className="text-xs text-green-600 mb-1">⏱️ Ends in</span>
                            <div className="flex gap-1 font-mono text-3xl md:text-4xl tracking-widest bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-inner border border-green-200">
                              {formatCountdown(timeToEnd).split("").map((char, idx) => (
                                <span key={idx} className={char === ':' ? 'mx-1 text-green-400' : 'inline-block min-w-[1ch]'}>{char}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {quiz.description && <p className="text-sm text-gray-500 mb-3">{quiz.description}</p>}
                    {quiz.subject && <p className="text-sm text-gray-700 mb-1">Subject: <span className="font-medium">{quiz.subject}</span></p>}
                    {isLiveQuiz && quiz.grade && quiz.grade !== 'LIVE' && (
                      <p className="text-sm text-gray-700 mb-1">Exam Type: <span className="font-medium">{quiz.grade}</span></p>
                    )}
                    <p className="text-sm text-gray-700 mb-1">Time Limit: <span className="font-medium">{quiz.timeLimit} minutes</span></p>
                    <p className="text-sm text-gray-700 mb-3">Questions: <span className="font-medium">{quiz.questions?.length || 'N/A'}</span></p>
                  </div>
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    disabled={isLiveQuiz && (timeStatus === 'upcoming' || timeStatus === 'ended' || timeStatus === 'invalid')}
                    className={`w-full mt-4 font-semibold py-2 px-4 rounded-md transition-colors duration-300 ${
                      isLiveQuiz && (timeStatus === 'upcoming' || timeStatus === 'ended' || timeStatus === 'invalid')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    {isLiveQuiz 
                      ? timeStatus === 'active' ? 'Start Live Quiz' :
                        timeStatus === 'upcoming' ? 'Quiz Not Started' :
                        timeStatus === 'ended' ? 'Quiz Ended' :
                        'Quiz Unavailable'
                      : 'Start Quiz'
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading available quizzes...</p> {/* Updated text */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }  
  
  const ioeQuizzes = quizzes.filter(quiz => quiz.grade === 'IOE');
  const ceeQuizzes = quizzes.filter(quiz => quiz.grade === 'CEE');
  
  // Filter live quizzes based on user's exam type preference for display count
  const getFilteredLiveQuizzes = () => {
    if (!userAccess.examType) return liveQuizzes;
    
    return liveQuizzes.filter(quiz => {
      const quizExamType = quiz.subject || quiz.grade;
      const quizGrade = quiz.grade;
      
      return quizExamType === userAccess.examType || 
             quizGrade === userAccess.examType ||
             (userAccess.examType === 'IOE' && (
               quizExamType?.toUpperCase().includes('IOE') ||
               quizGrade?.toUpperCase().includes('IOE')
             )) ||
             (userAccess.examType === 'CEE' && (
               quizExamType?.toUpperCase().includes('CEE') ||
               quizGrade?.toUpperCase().includes('CEE')
             ));
    });
  };
  
  const filteredLiveQuizzes = getFilteredLiveQuizzes();

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Premium Test Series</h1>
          <p className="text-lg text-gray-600">Choose your entrance exam preparation path</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* IOE Test Series Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">IOE Test Series</h2>
                  <p className="text-blue-100">Institute of Engineering</p>
                </div>
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">📐</span>
                </div>
              </div>
            </div>              <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">📊</span>
                    Total Tests
                  </span>
                  <span className="font-bold text-blue-600 text-lg">{ioeQuizzes.length}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">🎯</span>
                    Exam Type
                  </span>
                  <span className="font-medium text-gray-700">Engineering Entrance</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">⭐</span>
                    Difficulty
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Advanced</span>
                </div>
                
                {userAccess.ioeAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">✅</span>
                      Access Status
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Premium Access</span>
                  </div>
                )}
                
                {!userAccess.ioeAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">💰</span>
                      Price
                    </span>
                    <span className="font-bold text-orange-600 text-xl">Rs 100</span>
                  </div>
                )}
              </div>              <div className="space-y-3">
                {userAccess.ioeAccess ? (
                  // Show full access button if user has access
                  <button
                    onClick={() => handleSelectSeries('IOE')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🎯 Start Test Series
                  </button>
                ) : (
                  // Show purchase option and lock if no access
                  <>
                    <button
                      onClick={() => handlePurchaseSeries('IOE')}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🛒 Purchase Test Series
                    </button>
                    
                    <div className="w-full bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl flex items-center justify-center cursor-not-allowed">
                      � Series Locked
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CEE Test Series Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">CEE Test Series</h2>
                  <p className="text-green-100">Common Entrance Examination</p>
                </div>
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">🎓</span>
                </div>
              </div>
            </div>              <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">📊</span>
                    Total Tests
                  </span>
                  <span className="font-bold text-green-600 text-lg">{ceeQuizzes.length}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">🎯</span>
                    Exam Type
                  </span>
                  <span className="font-medium text-gray-700">Medical Entrance</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">⭐</span>
                    Difficulty
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Expert</span>
                </div>
                
                {userAccess.ceeAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">✅</span>
                      Access Status
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Premium Access</span>
                  </div>
                )}
                
                {!userAccess.ceeAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">💰</span>
                      Price
                    </span>
                    <span className="font-bold text-orange-600 text-xl">Rs 100</span>
                  </div>
                )}
              </div><div className="space-y-3">
                {userAccess.ceeAccess ? (
                  // Show full access button if user has access
                  <button
                    onClick={() => handleSelectSeries('CEE')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🎯 Start Test Series
                  </button>
                ) : (                  // Show purchase option if no access
                  <>
                    <button
                      onClick={() => handlePurchaseSeries('CEE')}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🛒 Purchase Test Series
                    </button>
                    
                    <div className="w-full bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl flex items-center justify-center cursor-not-allowed">
                      � Series Locked
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* LIVE Test Series Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Live Test Series</h2>
                  <p className="text-blue-100">Real-time Competitive Exams</p>
                </div>
                <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">⏱️</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">📊</span>
                    Total Tests
                  </span>
                  <span className="font-bold text-blue-600 text-lg">{filteredLiveQuizzes.length}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">🎯</span>
                    Exam Type
                  </span>
                  <span className="font-medium text-gray-700">
                    {userAccess.examType ? `${userAccess.examType} Live Tests` : 'Live Competitive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 flex items-center">
                    <span className="mr-2">⭐</span>
                    Difficulty
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Challenging</span>
                </div>
                
                {userAccess.liveTestAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">✅</span>
                      Access Status
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Premium Access</span>
                  </div>
                )}
                
                {!userAccess.liveTestAccess && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-gray-600 flex items-center">
                      <span className="mr-2">💰</span>
                      Price
                    </span>
                    <span className="font-bold text-orange-600 text-xl">Rs 10</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                
                { userAccess.liveTestAccess  ? (
                  // Show full access button if user has access
                  <button
                    onClick={() => handleSelectSeries('LIVE')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🎯 Start Live Test
                  </button>
                ) : (
                  // Show purchase option and lock if no access
                  <>
                    <button
                      onClick={() => handlePurchaseSeries('LIVE')}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🛒 Purchase Test Series
                    </button>
                    
                    <div className="w-full bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl flex items-center justify-center cursor-not-allowed">
                      � Series Locked
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>



        </div>

        {quizzes.length === 0 && liveQuizzes.length === 0 && !loading && (
          <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Test Series Available</h3>
            <p className="text-gray-500">Test series will be available soon. Stay tuned!</p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Purchase {purchaseSeries} Test Series
                </h2>
                <button
                  onClick={handleClosePurchaseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Instructions */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Payment Instructions
                  </h3>                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Scan the QR code below to pay via eSewa
                    </p>
                    <img 
                      src="/a.jpeg" 
                      alt="eSewa QR Code" 
                      className="mx-auto w-32 h-32 object-contain border rounded-lg mb-3"
                    />
                    <button
                      onClick={handleShowQRZoom}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      🔍 Show QR Code (Zoom)
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Contact for Support</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">
                      📱 WhatsApp: <span className="font-mono">+977 986-8711643</span>
                    </p>
                    <p className="text-blue-700">
                      👤 Contact Person: <span className="font-medium">Jayant Bista</span>
                    </p>
                  </div>
                  <a 
                    href="https://wa.me/9779868711643" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    💬 Contact on WhatsApp
                  </a>
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Upload Payment Proof</h4>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {paymentProofPreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img 
                          src={paymentProofPreview} 
                          alt="Payment proof preview" 
                          className="w-full max-w-xs mx-auto border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleClosePurchaseModal}
                    className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={isSubmittingPayment}
                  >
                    {isSubmittingPayment ? 'Submitting...' : 'Submit Payment Info'}
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  After payment verification, your test series will be activated. This may take up to 24 hours.
                </div>
              </div>
            </div>          </div>
        </div>
      )}

      {/* QR Code Zoom Modal */}
      {showQRZoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">eSewa QR Code</h3>
              <button
                onClick={handleCloseQRZoom}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your eSewa app to make payment
              </p>
              <img 
                src="/a.jpeg" 
                alt="eSewa QR Code - Zoomed" 
                className="mx-auto w-80 h-80 object-contain border-2 border-gray-300 rounded-lg shadow-lg"
              />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Tip: Hold your phone steady and ensure good lighting for best scanning results
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCloseQRZoom}
              className="w-full mt-4 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
