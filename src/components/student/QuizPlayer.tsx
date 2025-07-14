import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Bookmark, ChevronLeft, ChevronRight, AlertTriangle, BookmarkPlus, HelpCircle, CheckCircle2, LogOut, PlayCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc, collection, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { InlineMath, BlockMath } from 'react-katex';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: string;
  [key: string]: any;
  imageLink?: string;
  marks: number;
}

interface Quiz {
  id: string;
  title: string;
  grade: string;
  subject?: string;
  examType?: string;
  timeLimit: number; 
  questions: QuizQuestion[];
  targetAudience?: 'all' | 'authenticated' | 'non-authenticated';
  details?: {
    startTime?: string;
    endTime?: string;
    targetAudience?: 'all' | 'authenticated' | 'non-authenticated';
  };
}

interface UserAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  isBookmarked: boolean;
  marks: number; 
}


interface FirestoreLeaderboardData {
  userId: string;
  name: string;
  score: number;
}

interface QuizPlayerProps {
  quiz: Quiz;
  onQuizComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export interface QuizResult {
  quiz: Quiz;
  userAnswers: UserAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number; 
  completedAt: Date;
  totalPossibleMarks: number;
}

const PALETTE_ITEMS_PER_PAGE = 20;

// Enhanced helper function to convert LaTeX-like notation to Unicode
const formatTextWithUnicode = (str: string): string => {
  if (!str) return '';
  
  return str
    // Handle electronic configuration patterns first (e.g., 1s^{2}, 2p^{6})
    .replace(/(\d+[a-z])\s*\^\s*\{\s*(\d+)\s*\}/g, (_, base, exp) => {
      const superscriptDigits: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      const convertedExp = exp.split('').map((digit: string) => superscriptDigits[digit] || digit).join('');
      return base + convertedExp;
    })
    
    // Handle x{}^{2} patterns with possible whitespace and line breaks
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\^\s*\{\s*(\d+)\s*\}/g, (_, base, exp) => {
      const superscriptDigits: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      const convertedExp = exp.split('').map((digit: string) => superscriptDigits[digit] || digit).join('');
      return base + convertedExp;
    })
    // Handle exact pattern x{}^{2} without whitespace
    .replace(/([a-zA-Z]+)\{\}\^\{(\d+)\}/g, (_, base, exp) => {
      const superscriptDigits: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      const convertedExp = exp.split('').map((digit: string) => superscriptDigits[digit] || digit).join('');
      return base + convertedExp;
    })
    // Handle Al{}_{2} patterns with possible whitespace
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\_\s*\{\s*(\d+)\s*\}/g, (_, base, sub) => {
      const subscriptDigits: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      };
      const convertedSub = sub.split('').map((digit: string) => subscriptDigits[digit] || digit).join('');
      return base + convertedSub;
    })
    // Handle exact pattern Al{}_{2} without whitespace
    .replace(/([a-zA-Z]+)\{\}\_\{(\d+)\}/g, (_, base, sub) => {
      const subscriptDigits: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      };
      const convertedSub = sub.split('').map((digit: string) => subscriptDigits[digit] || digit).join('');
      return base + convertedSub;
    })
    // Handle x^{2} patterns
    .replace(/([a-zA-Z]+)\^\{(\d+)\}/g, (_, base, exp) => {
      const superscriptDigits: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      const convertedExp = exp.split('').map((digit: string) => superscriptDigits[digit] || digit).join('');
      return base + convertedExp;
    })
    // Handle x_{2} patterns
    .replace(/([a-zA-Z]+)\_\{(\d+)\}/g, (_, base, sub) => {
      const subscriptDigits: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      };
      const convertedSub = sub.split('').map((digit: string) => subscriptDigits[digit] || digit).join('');
      return base + convertedSub;
    })
    // Handle simple ^2 patterns (fallback)
    .replace(/\^(-?\d+)/g, (_, numStr) => {
      const superscriptDigits: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      let isNegative = false;
      let digitsToConvert = numStr;
      if (numStr.startsWith('-')) {
        isNegative = true;
        digitsToConvert = numStr.substring(1);
      }
      const convertedDigits = digitsToConvert.split('').map((digit: string) => superscriptDigits[digit] || digit).join('');
      return isNegative ? `⁻${convertedDigits}` : convertedDigits;
    })
    // Handle the specific problematic pattern that might have line breaks
    .replace(/x\s*\n?\s*x\{\}\^\{2\}/g, 'x²')
    .replace(/x\s*\n?\s*x\s*\{\s*\}\s*\^\s*\{\s*2\s*\}/g, 'x²');
};

// LaTeX rendering component
const LatexRenderer: React.FC<{ children: string }> = ({ children }) => {
  const text = children || '';
  
  // Pre-process step: aggressively convert problematic patterns first
  let preprocessed = text
    // Handle specific electronic configuration patterns like: 1s^{2}{}$ $2s^{2}$2p$^{6}
    .replace(/(\d+[a-z])\^\{(\d+)\}\{\}\$\s*\$(\d+[a-z])\s*\^\{(\d+)\}\$(\d+[a-z])\$\^\{(\d+)\}/g, '$1^{$2} $3^{$4} $5^{$6}')
    .replace(/(\d+[a-z])\^\{(\d+)\}\{\}\$\s*\$(\d+[a-z])\s*\^\{(\d+)\}/g, '$1^{$2} $3^{$4}')
    .replace(/(\d+[a-z])\$\^\{(\d+)\}(\d+[a-z])\^\{([^}]+)\}/g, '$1^{$2} $3^{$4}')
    
    // Clean up broken dollar signs around electron configurations
    .replace(/\$(\d+[a-z])\$/g, '$1')
    .replace(/(\d+[a-z])\s*\{\s*\}\s*/g, '$1 ')
    .replace(/\{\}\$\s*\$/g, ' ')
    
    // Handle the specific problematic x{}^{2} pattern that appears in the quiz
    .replace(/(\w+)\s*\{\s*\}\s*\^\s*\{\s*(\d+)\s*\}/g, '$1^{$2}')
    .replace(/(\w+)\s*\{\s*\}\s*\_\s*\{\s*(\d+)\s*\}/g, '$1_{$2}')
    // Handle patterns with line breaks
    .replace(/(\w+)\s*\n\s*\{\s*\}\s*\^\s*\{\s*(\d+)\s*\}/g, '$1^{$2}')
    .replace(/(\w+)\s*\n\s*\{\s*\}\s*\_\s*\{\s*(\d+)\s*\}/g, '$1_{$2}')
    // Handle the exact pattern from the user's example
    .replace(/x\s*\n?\s*x\{\}\^\{2\}/g, 'x^{2}')
    .replace(/x\s*\n?\s*x\s*\{\s*\}\s*\^\s*\{\s*2\s*\}/g, 'x^{2}');
  
  // Enhanced conversion for HTML-style LaTeX to standard LaTeX
  let convertedText = preprocessed
    // Handle HTML entities first
    .replace(/&ndash;/g, '–')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    
    // Handle complex \text{} patterns with nested braces and chemistry formulas
    .replace(/\\text\{([^{}]*\{[^}]*\}[^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g, (_, content) => {
      // Process nested chemistry formulas like Al{}_{2}O{}_{3}
      return content
        .replace(/([a-zA-Z]+)\{\}\_\{(\d+)\}/g, '$1_{$2}')
        .replace(/([a-zA-Z]+)\{\}\^\{(\d+)\}/g, '$1^{$2}')
        .replace(/([a-zA-Z]+)\{\}\_\{([^}]+)\}/g, '$1_{$2}')
        .replace(/([a-zA-Z]+)\{\}\^\{([^}]+)\}/g, '$1^{$2}');
    })
    .replace(/\\text\{([^{}]+)\}/g, '$1') // Simple \text{content} -> content
    
    // Handle various chemistry and scientific notation patterns
    // First handle the most specific patterns for isolated x{}^{2} or Al{}_{2}
    .replace(/([a-zA-Z]+)\{\}\^\{([^}]+)\}/g, '$1^{$2}') // x{}^{2} -> x^{2}
    .replace(/([a-zA-Z]+)\{\}\_\{(\d+)\}/g, '$1_{$2}') // Al{}_{2} -> Al_{2}
    .replace(/([a-zA-Z]+)\{\}\_\{([^}]+)\}/g, '$1_{$2}') // Complex subscripts
    
    // Handle additional spacing variations for the above
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\^\s*\{\s*([^}]+)\s*\}/g, '$1^{$2}') // x { } ^ { 2 } -> x^{2}
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\_\s*\{\s*(\d+)\s*\}/g, '$1_{$2}') // Al { } _ { 2 } -> Al_{2}
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\_\s*\{\s*([^}]+)\s*\}/g, '$1_{$2}') // Complex with spaces
    
    // Handle specific scientific notation patterns
    .replace(/(\d+\.?\d*)\s*×\s*10\\text\{[^}]*\^\{\s*([+-]?\d+)\s*\}\s*[^}]*\}/g, '$1 \\times 10^{$2}')
    .replace(/(\d+\.?\d*)\s*×\s*10\s*\^\{\s*([+-]?\d+)\s*\}/g, '$1 \\times 10^{$2}')
    .replace(/(\d+\.?\d*)\s*×\s*10\s*\^\s*([+-]?\d+)/g, '$1 \\times 10^{$2}')
    
    // Handle broken LaTeX patterns and malformed syntax
    .replace(/([a-zA-Z]+)\^\{(\d+)\}\s*\}\s*\$([^$]*)\$\s*([a-zA-Z]+)\s*\^\{(\d+)\}/g, '$1^{$2} $3 $4^{$5}')
    .replace(/\$([^$]*)\{[^}]*\}\$([^$]*)\{[^}]*\}\$/g, '$$$1 $2$$') // Fix broken $ wrapping
    
    // Handle specific patterns from the quiz data
    .replace(/([a-zA-Z]+)\s*\-\s*([a-zA-Z]+)\s*\^\s*\{([^}]+)\}\s*\$\+([^$]+)\$\+([^=]+)=([^t]+)t\s*h\s*e\s*n\s*([a-zA-Z]+)\s*i\s*s\s*e\s*q\s*u\s*a\s*l\s*t\s*o\s*:/g, '$1 - $2^{$3} + $4 + $5 = 0, then $7 is equal to:')
    
    // Clean up spacing and empty braces
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*([_^])\s*\{([^}]+)\}/g, '$1$2{$3}') // Clean up spacing in subscripts/superscripts
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*/g, '$1') // Remove empty braces
    
    // Handle Greek letters and special symbols
    .replace(/λ/g, '\\lambda')
    .replace(/μ/g, '\\mu')
    .replace(/α/g, '\\alpha')
    .replace(/β/g, '\\beta')
    .replace(/γ/g, '\\gamma')
    .replace(/δ/g, '\\delta')
    .replace(/ε/g, '\\epsilon')
    .replace(/θ/g, '\\theta')
    .replace(/π/g, '\\pi')
    .replace(/σ/g, '\\sigma')
    .replace(/φ/g, '\\phi')
    .replace(/ω/g, '\\omega')
    .replace(/\\lambda\s*\\lambda/g, '\\lambda') // Remove duplicates
    
    // Convert HTML-style LaTeX delimiters to standard LaTeX
    .replace(/\\?\\\(/g, '$') // \( to $
    .replace(/\\?\\\)/g, '$') // \) to $
    .replace(/\\?\\\[/g, '$$') // \[ to $$
    .replace(/\\?\\\]/g, '$$') // \] to $$
    
    // Handle mathematical symbols
    .replace(/×/g, '\\times')
    .replace(/÷/g, '\\div')
    .replace(/±/g, '\\pm')
    .replace(/∞/g, '\\infty')
    .replace(/≤/g, '\\leq')
    .replace(/≥/g, '\\geq')
    .replace(/≠/g, '\\neq')
    .replace(/≈/g, '\\approx')
    .replace(/∑/g, '\\sum')
    .replace(/∫/g, '\\int')
    .replace(/√/g, '\\sqrt')
    
    // Handle fractions and mathematical functions
    .replace(/\\cfrac/g, '\\frac')
    .replace(/\\dfrac/g, '\\frac')
    
    // Fix double backslashes in LaTeX commands
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    
    // Handle degree symbol
    .replace(/°/g, '^\\circ')
    
    // Clean up multiple spaces and normalize
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check if text contains LaTeX patterns (more comprehensive)
  const hasLatex = /\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\[a-zA-Z]+(\{[^}]*\}|\[[^\]]*\])*|[_^]\{[^}]+\}|\\lambda|\\mu|\\times|\\frac|\w+\^{?\d+}?|\w+_{?\d+}?/.test(convertedText);
  
  if (!hasLatex) {
    // No LaTeX detected, render with Unicode formatting
    return <span dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(convertedText) }} />;
  }
  
  try {
    // Split text into LaTeX and non-LaTeX parts
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Handle block LaTeX ($$...$$)
    const blockLatexRegex = /\$\$([\s\S]*?)\$\$/g;
    let blockMatch;
    const blockMatches: { start: number; end: number; content: string }[] = [];
    
    while ((blockMatch = blockLatexRegex.exec(convertedText)) !== null) {
      blockMatches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        content: blockMatch[1].trim()
      });
    }
    
    // Handle inline LaTeX ($...$)
    const inlineLatexRegex = /\$([^$\n]*?)\$/g;
    let inlineMatch;
    const inlineMatches: { start: number; end: number; content: string }[] = [];
    
    while ((inlineMatch = inlineLatexRegex.exec(convertedText)) !== null) {
      // Check if this match is not inside a block LaTeX
      const isInsideBlock = blockMatches.some(block => 
        inlineMatch!.index >= block.start && inlineMatch!.index < block.end
      );
      
      if (!isInsideBlock) {
        inlineMatches.push({
          start: inlineMatch.index,
          end: inlineMatch.index + inlineMatch[0].length,
          content: inlineMatch[1].trim()
        });
      }
    }
    
    // Combine and sort all matches
    const allMatches = [...blockMatches.map(m => ({ ...m, type: 'block' })), ...inlineMatches.map(m => ({ ...m, type: 'inline' }))]
      .sort((a, b) => a.start - b.start);
    
    allMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        const beforeText = convertedText.slice(lastIndex, match.start);
        parts.push(<span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(beforeText) }} />);
      }
      
      // Add LaTeX content
      if (match.type === 'block') {
        parts.push(<BlockMath key={`block-${index}`} math={match.content} />);
      } else {
        parts.push(<InlineMath key={`inline-${index}`} math={match.content} />);
      }
      
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < convertedText.length) {
      const remainingText = convertedText.slice(lastIndex);
      parts.push(<span key="text-end" dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(remainingText) }} />);
    }
    
    return <>{parts}</>;
    
  } catch (error) {
    console.warn('LaTeX rendering error:', error);
    // Fallback to Unicode formatting
    return <span dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(convertedText) }} />;
  }
};

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onQuizComplete, onExit }) => {
  const { currentUser } = useAuth();
  
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
  
  // Check if this is a live quiz and get its time status
  const isLiveQuiz = quiz.grade === 'LIVE' || (quiz.details?.startTime && quiz.details?.endTime);
  const timeStatus = isLiveQuiz ? getQuizTimeStatus(quiz.details?.startTime, quiz.details?.endTime) : null;
  
  // Check access control
  const hasAccess = useCallback(() => {
    if (!quiz.targetAudience || quiz.targetAudience === 'all') {
      return true;
    }
    
    if (quiz.targetAudience === 'authenticated') {
      return !!currentUser;
    }
    
    if (quiz.targetAudience === 'non-authenticated') {
      return !currentUser;
    }
    
    return false;
  }, [quiz.targetAudience, currentUser]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState((quiz.timeLimit || 0) * 60);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [currentPalettePage, setCurrentPalettePage] = useState(0);
  const [showMobileQuestionNav, setShowMobileQuestionNav] = useState(false);
  const [liveTimeStatus, setLiveTimeStatus] = useState<'upcoming' | 'active' | 'ended' | 'invalid' | null>(timeStatus);

  // Real-time updates for live quiz timing (per second for countdown)
  useEffect(() => {
    if (isLiveQuiz) {
      const updateTimeStatus = () => {
        const newStatus = getQuizTimeStatus(quiz.details?.startTime, quiz.details?.endTime);
        setLiveTimeStatus(newStatus);
      };
      updateTimeStatus();
      const interval = setInterval(updateTimeStatus, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [isLiveQuiz, quiz.details?.startTime, quiz.details?.endTime]);

  useEffect(() => {
    if (!quiz) {
      console.error("QuizPlayer: Quiz object is null or undefined.");
      return;
    }
    if (!quiz.questions) {
      console.error("QuizPlayer: Quiz questions are missing.");
    }
    if (typeof quiz.timeLimit === 'undefined') {
      console.warn("QuizPlayer: Quiz timeLimit is undefined, defaulting to 0.");
      setTimeRemaining(0);
    } else {
      setTimeRemaining(quiz.timeLimit * 60);
    }
  }, [quiz]);

  const getFilteredQuestions = useCallback(() => {
    if (showBookmarkedOnly) {
      return quiz.questions.filter(q => bookmarkedQuestions.has(q.id));
    }
    return quiz.questions;
  }, [quiz.questions, showBookmarkedOnly, bookmarkedQuestions]);

  const getCurrentQuestion = useCallback(() => {
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
      return undefined;
    }
    const filtered = getFilteredQuestions();
    if (currentQuestionIndex >= 0 && currentQuestionIndex < filtered.length) {
      return filtered[currentQuestionIndex];
    }
    return undefined; 
  }, [quiz, currentQuestionIndex, getFilteredQuestions]);

  const currentQuestion = getCurrentQuestion();

  useEffect(() => {
    const filtered = getFilteredQuestions();
    if (currentQuestionIndex >= filtered.length && filtered.length > 0) {
      setCurrentQuestionIndex(filtered.length - 1);
    } else if (filtered.length === 0 && currentQuestionIndex !== 0) {
      setCurrentQuestionIndex(0); 
    }
  }, [showBookmarkedOnly, bookmarkedQuestions, currentQuestionIndex, getFilteredQuestions]);

  const handleStartQuiz = () => {
    // For live quizzes, check time status before allowing start
    if (isLiveQuiz && liveTimeStatus) {
      if (liveTimeStatus === 'upcoming') {
        alert(`This live quiz hasn't started yet. It will begin at ${formatDateTime(quiz.details?.startTime)}`);
        return;
      }
      
      if (liveTimeStatus === 'ended') {
        alert(`This live quiz has ended. It was available until ${formatDateTime(quiz.details?.endTime)}`);
        return;
      }
      
      if (liveTimeStatus === 'invalid') {
        alert('This live quiz has invalid timing configuration.');
        return;
      }
    }
    
    setShowStartConfirm(true);
  };

  const confirmStartQuiz = () => {
    setIsQuizStarted(true);
    setStartTime(new Date());
    setShowStartConfirm(false);
    console.log('Quiz started:', quiz.title);
  };

  const toggleBookmark = useCallback((questionId: string) => {
    setBookmarkedQuestions(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(questionId)) {
        newBookmarks.delete(questionId);
      } else {
        newBookmarks.add(questionId);
      }
      return newBookmarks;
    });
  }, []);

  const getQuestionStatus = useCallback((questionId: string) => {
    const isAnswered = userAnswers.has(questionId);
    const isBookmarked = bookmarkedQuestions.has(questionId);
    return { isAnswered, isBookmarked };
  }, [userAnswers, bookmarkedQuestions]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const handleAnswerSelect = useCallback((questionId: string, optionId: string) => {
    setUserAnswers(prev => new Map(prev).set(questionId, optionId));
  }, []);

  const goToNextQuestion = useCallback(() => {
    const filtered = getFilteredQuestions();
    if (currentQuestionIndex < filtered.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, getFilteredQuestions]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    const filtered = getFilteredQuestions();
    if (index >= 0 && index < filtered.length) {
      setCurrentQuestionIndex(index);
    } else if (filtered.length === 0 && index === 0) {
      setCurrentQuestionIndex(0);
    }
  }, [getFilteredQuestions]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!startTime || !quiz || !quiz.questions || !currentUser) {
      console.error("Cannot submit quiz: missing start time, quiz data, or user.");
      return;
    }
    setShowConfirmSubmit(false);

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - (startTime?.getTime() || endTime.getTime())) / 1000);

    const finalUserAnswers: UserAnswer[] = quiz.questions.map((question) => {
      const selectedOptionId = userAnswers.get(question.id) || null;
      let isCorrect: boolean | null = null;
      let marksObtained: number = 0;

      if (selectedOptionId) {
        const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
        isCorrect = selectedOption ? selectedOption.isCorrect : false;
        if (isCorrect) {
          marksObtained = question.marks;
        } else {
          marksObtained = -0.1; 
        }
      }

      return {
        questionId: question.id,
        selectedOptionId,
        isCorrect,
        isBookmarked: bookmarkedQuestions.has(question.id),
        marks: marksObtained,
      };
    });

    const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
    const score = finalUserAnswers.reduce((total, answer) => total + answer.marks, 0);
    const percentage = totalPossibleMarks > 0 ? Math.round((Math.max(0, score) / totalPossibleMarks) * 100) : 0;

    const resultForCallback: QuizResult = {
      quiz,
      userAnswers: finalUserAnswers,
      score,
      totalQuestions: quiz.questions.length,
      percentage,
      timeSpent,
      completedAt: endTime,
      totalPossibleMarks,
    };

    const firestoreData = {
      userId: currentUser.uid,
      quizId: quiz.id,
      userName: currentUser.displayName,
      completedAt: Timestamp.fromDate(endTime),
      quizDetails: {
        id: quiz.id,
        title: quiz.title,
        grade: quiz.grade,
        subject: quiz.subject || null,
        examType: quiz.examType || null,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          imageLink: q.imageLink || null,
          options: q.options,
          marks: q.marks,
        })),
      },
      userAttempt: {
        answers: finalUserAnswers.map(ua => ({
          questionId: ua.questionId,
          selectedOptionId: ua.selectedOptionId,
          isCorrect: ua.isCorrect,
          isBookmarked: ua.isBookmarked,
          marksObtained: ua.marks,
        })),
        score,
        totalPossibleMarks,
        percentage,
        timeSpent,
        totalQuestions: quiz.questions.length,
      },
    };


    const leaderboardEntry: FirestoreLeaderboardData = {
      userId: currentUser.uid,
      name: firestoreData.userName || 'unknown',
      score: score,
    };

    console.log(leaderboardEntry)

    try {
      // AT least quizId, userid, username, total score 
      const quizDocRef = doc(db, 'quizzes', quiz.id);
      await updateDoc(quizDocRef, {
        leaderboard: arrayUnion(leaderboardEntry)
      });
    } catch (error) {
      console.error("Error saving quiz result to Firestore:", error);
    }

    onQuizComplete(resultForCallback);
  }, [quiz, userAnswers, startTime, onQuizComplete, currentUser, bookmarkedQuestions]);

  // Auto-submit quiz if live quiz time ends while taking the quiz
  useEffect(() => {
    if (isQuizStarted && isLiveQuiz && liveTimeStatus === 'ended') {
      alert('The live quiz time has ended. Your quiz will be submitted automatically.');
      handleSubmitQuiz();
    }
  }, [isQuizStarted, isLiveQuiz, liveTimeStatus, handleSubmitQuiz]);

  const handleShowExitConfirm = () => {
    setShowExitConfirm(true);
  };

  const confirmAndExitQuiz = () => {
    setShowExitConfirm(false);
    onExit();
  };

  const handleToggleBookmarkedFilter = useCallback(() => {
    const newFilterState = !showBookmarkedOnly;
    setShowBookmarkedOnly(newFilterState);
  }, [showBookmarkedOnly]);

  useEffect(() => {
    const filtered = getFilteredQuestions();
    const totalPalettePages = Math.ceil(filtered.length / PALETTE_ITEMS_PER_PAGE);
    if (currentPalettePage >= totalPalettePages && totalPalettePages > 0) {
      setCurrentPalettePage(totalPalettePages - 1);
    } else if (filtered.length === 0) {
      setCurrentPalettePage(0);
    }
  }, [getFilteredQuestions, currentPalettePage]);

  useEffect(() => {
    if (!isQuizStarted || timeRemaining <= 0 || isNaN(timeRemaining)) {
      if (isQuizStarted && timeRemaining <= 0) handleSubmitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isQuizStarted, timeRemaining, handleSubmitQuiz]);

  useEffect(() => {
    if (!isQuizStarted) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showStartConfirm || showConfirmSubmit || showExitConfirm) return;

      if (event.key === 'ArrowRight') goToNextQuestion();
      if (event.key === 'ArrowLeft') goToPreviousQuestion();
      if (event.key === 'b' && currentQuestion) toggleBookmark(currentQuestion.id);
      
      if (currentQuestion && currentQuestion.options.length >= parseInt(event.key) && parseInt(event.key) >= 1 && parseInt(event.key) <= 9) {
        const optionIndex = parseInt(event.key) - 1;
        if (currentQuestion.options[optionIndex]) {
          handleAnswerSelect(currentQuestion.id, currentQuestion.options[optionIndex].id);
        }
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isQuizStarted, currentQuestion, showStartConfirm, showConfirmSubmit, showExitConfirm, bookmarkedQuestions, goToNextQuestion, goToPreviousQuestion, toggleBookmark, handleAnswerSelect]);

  const getAnsweredCount = useCallback(() => {
    return userAnswers.size;
  }, [userAnswers]);

  if (!quiz || !quiz.questions) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white shadow-xl rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-700">Quiz Data Error</h2>
          <p className="mt-2 text-gray-500">There was a problem loading the quiz. Please try again later.</p>
          <button
            onClick={onExit} 
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isQuizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
        <div className="bg-white text-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
          <HelpCircle size={48} className="mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-2"><LatexRenderer>{quiz.title}</LatexRenderer></h1>
          <p className="text-lg text-gray-600 mb-1">Grade: <LatexRenderer>{quiz.grade}</LatexRenderer></p>
          {quiz.subject && <p className="text-md text-gray-500 mb-1">Subject: <LatexRenderer>{quiz.subject}</LatexRenderer></p>}
          {quiz.examType && <p className="text-md text-gray-500 mb-1">Exam Type: <LatexRenderer>{quiz.examType}</LatexRenderer></p>}
          
          {/* Live Quiz Timing Information */}
          {isLiveQuiz && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Live Quiz Schedule</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span className="font-medium">{formatDateTime(quiz.details?.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>End:</span>
                  <span className="font-medium">{formatDateTime(quiz.details?.endTime)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-2 flex justify-center">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  liveTimeStatus === 'active' ? 'bg-green-100 text-green-700' :
                  liveTimeStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                  liveTimeStatus === 'ended' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {liveTimeStatus === 'active' ? '🟢 LIVE NOW' :
                   liveTimeStatus === 'upcoming' ? '🟡 UPCOMING' :
                   liveTimeStatus === 'ended' ? '🔴 ENDED' :
                   '❓ INVALID TIMING'}
                </span>
              </div>

              {/* Digital Countdown Timer */}
              {(() => {
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
                let ms = 0;
                if (liveTimeStatus === 'upcoming' && quiz.details?.startTime) {
                  ms = new Date(quiz.details.startTime).getTime() - Date.now();
                } else if (liveTimeStatus === 'active' && quiz.details?.endTime) {
                  ms = new Date(quiz.details.endTime).getTime() - Date.now();
                }
                if (liveTimeStatus === 'upcoming') {
                  return (
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-xs text-yellow-600 mb-1">⏰ Starts in</span>
                      <div className="flex gap-1 font-mono text-3xl md:text-4xl tracking-widest bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl shadow-inner border border-yellow-200">
                        {formatCountdown(ms).split("").map((char, idx) => (
                          <span key={idx} className={char === ':' ? 'mx-1 text-yellow-400' : 'inline-block min-w-[1ch]'}>{char}</span>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (liveTimeStatus === 'active') {
                  return (
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-xs text-green-600 mb-1">⏱️ Ends in</span>
                      <div className="flex gap-1 font-mono text-3xl md:text-4xl tracking-widest bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-inner border border-green-200">
                        {formatCountdown(ms).split("").map((char, idx) => (
                          <span key={idx} className={char === ':' ? 'mx-1 text-green-400' : 'inline-block min-w-[1ch]'}>{char}</span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
          
          <p className="text-md text-gray-500 mb-6">Time Limit: {quiz.timeLimit} minutes</p>
          
          <button
            onClick={handleStartQuiz}
            disabled={Boolean(isLiveQuiz && liveTimeStatus !== null && (liveTimeStatus === 'upcoming' || liveTimeStatus === 'ended' || liveTimeStatus === 'invalid'))}
            className={`w-full font-semibold py-3 px-6 rounded-lg text-lg transition-transform transform focus:outline-none focus:ring-2 focus:ring-opacity-75 flex items-center justify-center ${
              isLiveQuiz && timeStatus !== null && (timeStatus === 'upcoming' || timeStatus === 'ended' || timeStatus === 'invalid')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105 focus:ring-green-400'
            }`}
          >
            <PlayCircle size={20} className="mr-2" />
            {isLiveQuiz 
              ? liveTimeStatus === 'active' ? 'Start Live Quiz' :
                liveTimeStatus === 'upcoming' ? 'Quiz Not Started' :
                liveTimeStatus === 'ended' ? 'Quiz Ended' :
                'Quiz Unavailable'
              : 'Start Quiz'
            }
          </button>
        </div>

        {showStartConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Start</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to start the quiz "<LatexRenderer>{quiz.title}</LatexRenderer>"?</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStartConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartQuiz}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();
  const currentVisibleQuestion = currentQuestion; 

  const questionDisplayContent = currentVisibleQuestion?.questionText || (currentVisibleQuestion?.imageLink ? "" : (filteredQuestions.length > 0 ? `Question ${filteredQuestions.findIndex(q => q.id === currentVisibleQuestion?.id) + 1} content is missing.` : "No questions to display."));


  return (
    <>
      {/* Access Control Check */}
      {!hasAccess() ? (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                {quiz.targetAudience === 'authenticated' 
                  ? 'This quiz is only available to authenticated users. Please sign in to access this quiz.'
                  : quiz.targetAudience === 'non-authenticated'
                  ? 'This quiz is only available to non-authenticated users. Please sign out to access this quiz.'
                  : 'You do not have permission to access this quiz.'
                }
              </p>
            </div>
            
            <div className="space-y-3">
              {quiz.targetAudience === 'authenticated' && !currentUser && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
              
              <button
                onClick={onExit}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans relative overflow-hidden">
      {/* Mobile Timer Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 p-4 md:hidden shadow-sm">
        <div className="flex justify-between items-center">
          {/* Timer Display */}
          <div className="flex items-center space-x-2 px-4 py-2 rounded-md bg-violet-100 text-violet-700 shadow-sm">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Time Left</span>
            <span className="text-base font-bold">{formatTime(timeRemaining)}</span>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">
              {currentQuestionIndex + 1} / {getFilteredQuestions().length}
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${((currentQuestionIndex + 1) / getFilteredQuestions().length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Time Progress Bar */}
        {quiz.timeLimit > 0 && (
          <div className="mt-3">
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeRemaining <= 300 ? 'bg-red-500' : 
                  timeRemaining <= 600 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ 
                  width: `${(timeRemaining / (quiz.timeLimit * 60)) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Question Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {currentVisibleQuestion ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700">
                Question {filteredQuestions.findIndex(q => q.id === currentVisibleQuestion.id) + 1} of {filteredQuestions.length}
              </h2>
              <button onClick={() => toggleBookmark(currentVisibleQuestion.id)} title="Toggle Bookmark" className={`p-2 rounded-full ${bookmarkedQuestions.has(currentVisibleQuestion.id) ? 'bg-blue-100 text-blue-500' : 'hover:bg-gray-200'}`}>
                {bookmarkedQuestions.has(currentVisibleQuestion.id) ? <BookmarkPlus size={24} /> : <Bookmark size={24} />}
              </button>
            </div>

            {currentVisibleQuestion.imageLink && (
              <div className="flex justify-center my-4">
                <div className="relative w-full max-w-full overflow-auto">
                  <img 
                    src={currentVisibleQuestion.imageLink} 
                    alt={`Question ${filteredQuestions.findIndex(q => q.id === currentVisibleQuestion.id) + 1}`} 
                    className="max-w-full h-auto rounded-md border border-gray-200 object-contain mx-auto" 
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
              </div>
            )}
            
            {questionDisplayContent && (
              <div className="prose max-w-none text-gray-800 mb-6 text-sm sm:text-base break-words overflow-x-auto">
                <LatexRenderer>{questionDisplayContent}</LatexRenderer>
              </div>
            )}

            <div className="space-y-3">
              {currentVisibleQuestion.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(currentVisibleQuestion.id, option.id)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-150
                    ${userAnswers.get(currentVisibleQuestion.id) === option.id 
                      ? 'bg-blue-500 border-blue-600 text-white shadow-md ring-2 ring-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-blue-400 text-gray-700'}`}
                >
                  <div className="flex items-start">
                    <span className="font-medium mr-2 min-w-[20px]">{String.fromCharCode(65 + index)}.</span>
                    <span className="break-words"><LatexRenderer>{option.text}</LatexRenderer></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 rounded-lg shadow-lg">
            <HelpCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">
              {showBookmarkedOnly ? "No bookmarked questions." : "No questions available."}
            </p>
            {showBookmarkedOnly && (
                 <button 
                    onClick={handleToggleBookmarkedFilter}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                 >
                    Show All Questions
                 </button>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 && filteredQuestions.indexOf(currentVisibleQuestion!) === 0}
            className="px-4 sm:px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center"
          >
            <ChevronLeft size={20} className="mr-1" /> <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Mobile Navigation Button */}
          <button
            onClick={() => setShowMobileQuestionNav(!showMobileQuestionNav)}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg md:hidden flex items-center font-medium"
          >
            <ChevronRight size={18} className={`mr-1 transition-transform ${showMobileQuestionNav ? 'rotate-90' : ''}`} /> 
            Questions ({getAnsweredCount()}/{quiz.questions.length})
          </button>
          
          <button
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex >= filteredQuestions.length - 1 && filteredQuestions.indexOf(currentVisibleQuestion!) === filteredQuestions.length -1}
            className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center"
          >
            <span className="hidden sm:inline">Next</span> <ChevronRight size={20} className="ml-1" />
          </button>
        </div>

        {/* Mobile Question Navigation Panel */}
        {showMobileQuestionNav && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg md:hidden">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Question Navigation</h3>
                <button
                  onClick={() => setShowMobileQuestionNav(false)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                >
                  <ChevronRight size={16} className="rotate-90" />
                </button>
              </div>
            
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 mb-3">
              <input
                type="checkbox"
                checked={showBookmarkedOnly}
                onChange={handleToggleBookmarkedFilter}
                className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-400"
              />
              <span>Show Bookmarked Only ({bookmarkedQuestions.size})</span>
            </label>

            {filteredQuestions.length > PALETTE_ITEMS_PER_PAGE && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2 text-center">
                  Showing page {currentPalettePage + 1} of {Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) || 1}
                </p>
                <div className="flex justify-center items-center gap-1 flex-wrap">
                  {/* Previous button for large page counts */}
                  {Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) > 5 && currentPalettePage > 0 && (
                    <button
                      onClick={() => setCurrentPalettePage(currentPalettePage - 1)}
                      className="px-2 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}
                  
                  {/* Page buttons */}
                  {Array.from({ length: Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) }, (_, i) => {
                    // For mobile, show max 5 page buttons around current page
                    const totalPages = Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE);
                    if (totalPages <= 5) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPalettePage(i)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            i === currentPalettePage 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    } else {
                      // Show limited pages around current page
                      const start = Math.max(0, currentPalettePage - 2);
                      const end = Math.min(totalPages - 1, currentPalettePage + 2);
                      if (i >= start && i <= end) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPalettePage(i)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              i === currentPalettePage 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      }
                      return null;
                    }
                  })}
                  
                  {/* Next button for large page counts */}
                  {Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) > 5 && currentPalettePage < Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) - 1 && (
                    <button
                      onClick={() => setCurrentPalettePage(currentPalettePage + 1)}
                      className="px-2 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 mb-4">
              {filteredQuestions
                .slice(currentPalettePage * PALETTE_ITEMS_PER_PAGE, (currentPalettePage + 1) * PALETTE_ITEMS_PER_PAGE)
                .map((q) => {
                  const actualIndex = quiz.questions.findIndex(origQ => origQ.id === q.id);
                  const { isAnswered, isBookmarked } = getQuestionStatus(q.id);
                  const isCurrent = currentVisibleQuestion?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        goToQuestion(filteredQuestions.findIndex(fq => fq.id === q.id));
                        setShowMobileQuestionNav(false);
                      }}
                      title={`Question ${actualIndex + 1}${isAnswered ? ' (Answered)' : ''}${isBookmarked ? ' (Bookmarked)' : ''}`}
                      className={`p-2 rounded-md text-sm font-medium border-2 transition-all duration-150 flex items-center justify-center aspect-square relative
                        ${isCurrent ? 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300' : 
                         isAnswered ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' : 
                         'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}
                        ${isBookmarked ? (isCurrent ? 'ring-offset-1 ring-offset-yellow-300' : 'border-yellow-400') : ''}
                      `}
                    >
                      {isBookmarked && <Bookmark size={8} className={`absolute top-0 right-0 ${isCurrent ? 'text-white': 'text-yellow-500'}`} />}
                      {actualIndex + 1}
                    </button>
                  );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmSubmit(true);
                  setShowMobileQuestionNav(false);
                }}
                className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-colors flex items-center justify-center text-sm"
              >
                <CheckCircle2 size={16} className="mr-1"/> Submit
              </button>
              <button
                onClick={() => {
                  handleShowExitConfirm();
                  setShowMobileQuestionNav(false);
                }}
                className="flex-1 py-2 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors flex items-center justify-center text-sm"
              >
                <LogOut size={16} className="mr-1"/> Exit
              </button>
            </div>
            </div>
          </div>
        )}
      </div> {/* Closing tag for Question Area div */}

      {/* Right Sidebar (Timer, Palette, Submit) - Desktop Only */}
      <div className="hidden md:flex md:w-80 lg:w-96 bg-white shadow-lg md:border-l border-gray-200 flex-col overflow-hidden">
        <div className="p-4 md:p-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Quiz Overview</h3>
            <div className={`flex items-center font-bold px-4 py-2 rounded-lg shadow-sm transition-all duration-300 ${
              timeRemaining <= 300 ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : 
              timeRemaining <= 600 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
              'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              <Clock size={18} className={`mr-2 ${timeRemaining <= 300 ? 'animate-pulse' : ''}`} />
              <span className="font-mono tracking-wider">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          
          {/* Time Progress Bar for Desktop */}
          {quiz.timeLimit > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Time Remaining</span>
                <span className="text-xs text-gray-500">
                  {Math.ceil(timeRemaining / 60)} min left
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    timeRemaining <= 300 ? 'bg-red-500' : 
                    timeRemaining <= 600 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${(timeRemaining / (quiz.timeLimit * 60)) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                      Answered: {getAnsweredCount()} / {quiz.questions.length} | Bookmarked: {bookmarkedQuestions.size}
                  </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 mb-3">
                <input
                  type="checkbox"
                  checked={showBookmarkedOnly}
                  onChange={handleToggleBookmarkedFilter}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-400"
                />
                <span>Show Bookmarked Only</span>
              </label>

            {filteredQuestions.length > PALETTE_ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mb-3 px-1">
                <button
                  onClick={() => setCurrentPalettePage(p => Math.max(0, p - 1))}
                  disabled={currentPalettePage === 0}
                  className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page of questions"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPalettePage + 1} of {Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) || 1}
                </span>
                <button
                  onClick={() => setCurrentPalettePage(p => Math.min(Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) - 1, p + 1))}
                  disabled={currentPalettePage >= Math.ceil(filteredQuestions.length / PALETTE_ITEMS_PER_PAGE) - 1 || filteredQuestions.length === 0}
                  className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page of questions"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-auto overflow-y-auto" 
              style={{maxHeight: 'calc(100vh - 350px)'}}
        >
          {filteredQuestions
            .slice(currentPalettePage * PALETTE_ITEMS_PER_PAGE, (currentPalettePage + 1) * PALETTE_ITEMS_PER_PAGE)
            .map((q) => {
              const actualIndex = quiz.questions.findIndex(origQ => origQ.id === q.id);
              const { isAnswered, isBookmarked } = getQuestionStatus(q.id);
              const isCurrent = currentVisibleQuestion?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(filteredQuestions.findIndex(fq => fq.id === q.id))}
                  title={`Question ${actualIndex + 1}${isAnswered ? ' (Answered)' : ''}${isBookmarked ? ' (Bookmarked)' : ''}`}
                  className={`p-2 rounded-md text-sm font-medium border-2 transition-all duration-150 flex items-center justify-center aspect-square
                    ${isCurrent ? 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300' : 
                     isAnswered ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' : 
                     'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}
                    ${isBookmarked ? (isCurrent ? 'ring-offset-1 ring-offset-yellow-300' : 'border-yellow-400') : ''}
                  `}
                >
                  {isBookmarked && <Bookmark size={12} className={`absolute top-1 right-1 ${isCurrent ? 'text-white': 'text-yellow-500'}`} />}
                  {actualIndex + 1}
                </button>
              );
          })}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-colors flex items-center justify-center"
          >
            <CheckCircle2 size={20} className="mr-2"/> Submit Quiz
          </button>
          <button
            onClick={handleShowExitConfirm}
            className="w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors flex items-center justify-center"
          >
            <LogOut size={20} className="mr-2"/> Exit Quiz
          </button>
        </div>
      </div>
      </div> {/* Closing tag for Right Sidebar div */}

      {/* Submit Confirmation Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your answers? You have answered {getAnsweredCount()} out of {quiz.questions.length} questions.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-md w-full">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">Confirm Exit</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit the quiz? Your progress will be lost.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndExitQuiz}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
};

export default QuizPlayer;