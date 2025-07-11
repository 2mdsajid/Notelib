import React, { useState, ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { saveQuizToFirestore } from '../../services/firestore/quizService'; // Import saveQuizToFirestore
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { InlineMath, BlockMath } from 'react-katex';

export interface QuizQuestion {
  id: string; // Unique ID for the question
  questionNo: string;
  question: string;
  imageLink?: string; // Image link for the question
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: string;
  marks: string;
}

export interface QuizDetails {
  id: string; // Unique ID for the quiz
  title: string;
  grade: string | 'IOE' | 'CEE' | 'None' | ''; // Updated to include IOE and CEE
  timeLimit: number;
  targetAudience: 'all' | 'authenticated' | 'non-authenticated';
  startTime?: string;
  endTime?: string;
}

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

// Helper function to convert HTML-style LaTeX notation to standard LaTeX
const convertHtmlLatexToStandard = (text: string): string => {
  if (!text) return '';
  
  return text
    // Decode HTML entities first
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    
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
    
    // Convert \(...\) to $...$
    .replace(/\\?\\\(/g, '$')
    .replace(/\\?\\\)/g, '$')
    // Convert \[...\] to $$...$$
    .replace(/\\?\\\[/g, '$$')
    .replace(/\\?\\\]/g, '$$')
    
    // Handle various chemistry and scientific notation patterns
    // First handle the most specific patterns
    .replace(/([a-zA-Z]+)\{\}\_\{(\d+)\}/g, '$1_{$2}') // Al{}_{2} -> Al_{2}
    .replace(/([a-zA-Z]+)\{\}\^\{(\d+)\}/g, '$1^{$2}') // x{}^{2} -> x^{2}
    .replace(/([a-zA-Z]+)\{\}\_\{([^}]+)\}/g, '$1_{$2}') // Complex subscripts
    .replace(/([a-zA-Z]+)\{\}\^\{([^}]+)\}/g, '$1^{$2}') // Complex superscripts
    
    // Handle additional spacing variations
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\_\s*\{\s*(\d+)\s*\}/g, '$1_{$2}') // Al { } _ { 2 } -> Al_{2}
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\^\s*\{\s*(\d+)\s*\}/g, '$1^{$2}') // x { } ^ { 2 } -> x^{2}
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\_\s*\{\s*([^}]+)\s*\}/g, '$1_{$2}') // Complex with spaces
    .replace(/([a-zA-Z]+)\s*\{\s*\}\s*\^\s*\{\s*([^}]+)\s*\}/g, '$1^{$2}') // Complex with spaces
    
    // Handle specific scientific notation patterns
    .replace(/(\d+\.?\d*)\s*×\s*10\\text\{[^}]*\^\{\s*([+-]?\d+)\s*\}\s*[^}]*\}/g, '$1 \\times 10^{$2}')
    .replace(/(\d+\.?\d*)\s*×\s*10\s*\^\{\s*([+-]?\d+)\s*\}/g, '$1 \\times 10^{$2}')
    .replace(/(\d+\.?\d*)\s*×\s*10\s*\^\s*([+-]?\d+)/g, '$1 \\times 10^{$2}')
    
    // Handle broken LaTeX patterns and malformed syntax
    .replace(/([a-zA-Z]+)\^\{(\d+)\}\s*\}\s*\$([^$]*)\$\s*([a-zA-Z]+)\s*\^\{(\d+)\}/g, '$1^{$2} $3 $4^{$5}')
    .replace(/\$([^$]*)\{[^}]*\}\$([^$]*)\{[^}]*\}\$/g, '$$$1 $2$$') // Fix broken $ wrapping
    
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
    
    // Convert displaystyle expressions
    .replace(/\\displaystyle\s*/g, '')
    // Convert \cfrac to \frac
    .replace(/\\cfrac/g, '\\frac')
    .replace(/\\dfrac/g, '\\frac')
    
    // Convert overset arrows
    .replace(/\\overset\{\{\\rightarrow\s*\}\}/g, '\\vec')
    .replace(/\\overset\{\{\\rightarrow\s*\}\}\{([^}]+)\}/g, '\\vec{$1}')
    
    // Fix spacing issues with dots
    .replace(/\s*\\\s*\.\s*\\\s*/g, ' \\cdot ')
    .replace(/\s*\\,\s*\\,\s*\.\s*\\,\s*\\,\s*/g, ' \\cdot ')
    
    // Convert \bot to \perp
    .replace(/\\bot/g, '\\perp')
    
    // Handle degree symbols
    .replace(/\^\{o\}/g, '^\\circ')
    .replace(/\^\{0\}/g, '^\\circ')
    .replace(/°/g, '^\\circ')
    
    // Handle union and intersection symbols
    .replace(/\\cup/g, '\\cup')
    .replace(/\\cap/g, '\\cap')
    
    // Handle square root
    .replace(/\\sqrt\{([^}]+)\}/g, '\\sqrt{$1}')
    
    // Handle limits
    .replace(/\\lim\s*\\limits/g, '\\lim')
    .replace(/\\lim\\limits/g, '\\lim')
    
    // Handle fractions with spaces
    .replace(/\\\s*frac\s*\{/g, '\\frac{')
    
    // Handle integration symbols
    .replace(/\\int\s*_\s*\{([^}]+)\}\s*\^\s*\{([^}]+)\}/g, '\\int_{$1}^{$2}')
    
    // Fix double backslashes in LaTeX commands
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
    
    // Clean up multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
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
    // Handle mixed electron config patterns
    .replace(/(\d+)\s*\n?\s*([a-z])\s*\n?\s*(\d+[a-z])\^\{(\d+)\}/g, '$1$2 $3^{$4}');
  
  // First convert HTML-style LaTeX to standard LaTeX
  const convertedText = convertHtmlLatexToStandard(preprocessed);
  
  // Check if text contains LaTeX patterns (including HTML-style)
  const hasLatex = /\$\$[\s\S]*?\$\$|\$[^$\n]*?\$|\\[a-zA-Z]+(\{[^}]*\}|\[[^\]]*\])*|\\\(|\\\[|\\cfrac|\\displaystyle|\\frac|\\sqrt|\\int|\\lim|\\sum|\\prod|_{|^{|\^|_|\{\}[_^]\{[^}]+\}/.test(convertedText);
  
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

const TestingQuizzes: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [quiz, setQuiz] = useState<{ data: QuizQuestion[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null); // Stores the ID of the question being edited
  const [editedQuestionData, setEditedQuestionData] = useState<QuizQuestion | null>(null);  const [quizDetails, setQuizDetails] = useState<QuizDetails>({
    id: uuidv4(), // Initialize with a unique ID
    title: '',
    grade: '', // Grade now includes IOE/CEE
    timeLimit: 30,
    targetAudience: 'all',
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // For loading state during submission
  const { currentUser } = useAuth(); // Get currentUser from AuthContext
  
  const handleQuizDetailsChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuizDetails(prevDetails => {
      const newDetails = {
        ...prevDetails,
        [name]: name === 'timeLimit' ? parseInt(value, 10) : value,
      };
      
      return newDetails;
    });
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setError(null);
  };

  // Function to clean the JSON input before parsing
  const cleanJsonInput = (input: string) => {
    try {
      // Replace any special characters that might cause issues
      let cleaned = input
        .replace(/[\u0000-\u001F]+/g, '') // Remove control characters
        .replace(/\\r\\n/g, '\\n')        // Normalize line breaks
        .trim();
      
      return cleaned;
    } catch (err) {
      return input;
    }
  };

  // Function to load sample data
  const loadSampleData = () => { // Removed async
    try {
      setLoading(true);
      setError(null);
      
      const sampleJson = `[
  {
    "questionNo":"1",
    "question":"If x = log\\(_{b}\\)a, y = log\\(_{c}\\)b, and z=log\\(_{a}\\)c then xyz =",
    "imageLink": null,
    "option1":"0",
    "option2":"1",
    "option3":"2",
    "option4":"\\( \\cfrac{1}{2} \\)",
    "correctOption":"2",
    "question":"What is the capital of France?",
    "imageLink": null,
    "option1":"Berlin",
    "option2":"Madrid",
    "option3":"Paris",
    "option4":"Rome",
    "correctOption":"3",
    "marks":"1"
  },
  {
    "questionNo":"2",
    "question":"In the expansion of (1 + x)\\(^{10}\\), the coefficient of (4r + 5)\\(^{th }\\)term is equal to the coeff. of (2r + 1)\\(^{th}\\) term. Then, r",
    "imageLink": null,
    "option1":"7",
    "option2":"5",
    "option3":"4",
    "option4":"1",
    "correctOption":"4",
    "marks":"1"
  },
  {
    "questionNo":"3",
    "question":"The sum of the binomial coefficients in the expansion of (1 + x)\\(^{n}\\) is",
    "imageLink": null,
    "option1":"\\(2^{n}\\)\\(^{ - }\\)\\(^{1}\\)",
    "option2":"2n",
    "option3":"\\(2^{n}\\) \\( - 1\\)",
    "option4":"\\(2^{n}\\)",
    "correctOption":"4",
    "marks":"1"
  },
  {
    "questionNo":"4",
    "question":"\\(\\displaystyle \\lim_{x \\to 0} \\cfrac{log_{e}\\left(1 + x\\right)}{x} \\)",
    "imageLink": null,
    "option1":"1",
    "option2":"0",
    "option3":"-1",
    "option4":"\\(\\infty \\)",
    "correctOption":"1",
    "marks":"1"
  },
  {
    "questionNo":"5",
    "question":"The angle between the vectors \\( \\left(2\\overset{{\\rightarrow }}{i} - \\overset{{\\rightarrow }}{j} + \\overset{{\\rightarrow }}{k}\\right) \\) and \\( \\left(\\overset{{\\rightarrow }}{i} - 3\\overset{{\\rightarrow }}{j} - 5\\overset{{\\rightarrow }}{k}\\right) \\) is",
    "imageLink": null,
    "option1":"\\(120^{o}\\)",
    "option2":"\\(90^{0}\\)",
    "option3":"\\(45^{o}\\)",
    "option4":"0",
    "correctOption":"2",
    "marks":"1"
  },
  {
    "questionNo":"6",
    "question":"If a, b, c are non-zero vectors such that \\(a\\, \\, .\\, \\, b=a\\, \\, .\\, \\, c,\\) then which statement is true",
    "imageLink": null,
    "option1":"b = c",
    "option2":"\\(a\\, \\bot \\, (b-c)\\)",
    "option3":"\\(b=c\\) or \\(a\\, \\bot \\, (b-c)\\)",
    "option4":"None of these",
    "question":"Example with x^2 and y^3. What is 2+2?",
    "imageLink": null,
    "option1":"3",
    "option2":"4",
    "option3":"5",
    "option4":"Option with ^4",
    "correctOption":"2",
    "marks":"2"
  },
  {
    "questionNo":"3",
    "question":"",
    "imageLink":"/questionImages/example-image.jpg",
    "option1":"Option 1",
    "option2":"Option 2",
    "option3":"Option 3",
    "option4":"Option 4",
    "correctOption":"3",
    "marks":"1"
  }
]`;
      setJsonInput(sampleJson);
      console.log("Sample data loaded directly into input.");

    } catch (err) { // Should not happen with direct string assignment, but good for robustness
      console.error('Error setting sample data:', err);
      setError(`Failed to load sample data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const parseQuiz = () => {
    try {
      setLoading(true);
      setError(null);
      setEditingQuestionId(null); // Reset editing state
      setEditedQuestionData(null);
      
      let jsonStringToParse = cleanJsonInput(jsonInput); // Basic cleaning

      // Attempt to fix common input format: list of objects not wrapped in an array
      if (jsonStringToParse && jsonStringToParse.trim() !== '') {
        const trimmedContent = jsonStringToParse.trim();
        if (!trimmedContent.startsWith('[')) {
          // Content doesn't start with an array bracket.
          // Assume it's a single object or a comma-separated list of objects.
          let coreContent = trimmedContent;
          // Remove a potential trailing comma from the end of the entire sequence
          if (coreContent.endsWith(',')) {
            coreContent = coreContent.slice(0, -1); 
          }
          // Wrap the core content in array brackets
          jsonStringToParse = `[${coreContent}]`;
        } else {
          // Content already starts with '[', check for trailing comma before the final ']'
          // e.g., "[{...},{...},]"
          const lastCharBeforeClosingBracket = trimmedContent.charAt(trimmedContent.length - 2);
          if (lastCharBeforeClosingBracket === ',' && trimmedContent.endsWith(']')) {
            jsonStringToParse = trimmedContent.slice(0, trimmedContent.length - 2) + ']';
          }
        }
      }
      
      const parsedData = JSON.parse(jsonStringToParse);
      
      let rawQuizData: any[] = [];
      
      if (Array.isArray(parsedData)) {
        // Check if it's an array of objects with expected keys (basic validation for robustness)
        // This check assumes that if it's an array, it's the new direct format.
        // An empty array is also valid.
        if (parsedData.length === 0 || (parsedData.length > 0 && typeof parsedData[0] === 'object' && parsedData[0] !== null)) {
            rawQuizData = parsedData;
        } else {
            // It's an array, but not of objects, which is not the expected format.
            setError('Invalid quiz format. Expected a direct array of question objects.');
            setLoading(false);
            return;
        }
      } else {
        setError('Invalid quiz format. Expected an array of questions.');
        setLoading(false);
        return;
      }
      // Assign unique IDs and validate
      const validatedQuizData: QuizQuestion[] = rawQuizData.map((q, index) => {
        // Allow empty questions if they have an image, otherwise all fields are required
        if (!q.questionNo || 
            ((!q.question || q.question.trim() === '') && (!q.imageLink || q.imageLink.trim().toLowerCase() === 'null' || q.imageLink.trim() === '')) || 
            !q.option1 || !q.option2 || !q.option3 || !q.option4 || 
            !q.correctOption || !q.marks) {
          throw new Error(`Question at index ${index} is missing required fields.`);
        }
        // Ensure correctOption is a valid value (1-4)
        let validatedCorrectOption = q.correctOption;
        if (q.correctOption === "0" || !["1", "2", "3", "4"].includes(q.correctOption)) {
          console.warn(`Question ${index+1} has invalid correctOption value "${q.correctOption}". Setting to "1" as default.`);
          validatedCorrectOption = "1";
        }
          // Handle image link
        let finalImageLink: string | null = null; // Default to null
        if (q.imageLink && typeof q.imageLink === 'string' && q.imageLink.trim() !== '' && q.imageLink.trim().toLowerCase() !== 'null') {
          finalImageLink = q.imageLink.trim();
        }

        // Log warning for questions with no text but with an image
        if ((!q.question || q.question.trim() === '') && finalImageLink) {
          console.warn(`Question ${index+1} has no text but includes an image: ${finalImageLink}`);
        }
        
        return {
          ...q,
          imageLink: finalImageLink, // Use the new variable that can be null
          correctOption: validatedCorrectOption,
          id: uuidv4(), // Assign a unique ID to each question
        };
      });
      
      setQuiz({ data: validatedQuizData });
      // Count questions with images
      const questionsWithImages = validatedQuizData.filter(q => 
        q.imageLink && q.imageLink !== 'null' && q.imageLink !== ''
      ).length;
      
      console.log(
        'Successfully parsed quiz with', 
        validatedQuizData.length, 
        'questions', 
        questionsWithImages > 0 ? `(${questionsWithImages} with images)` : ''
      );
    } catch (err) {
      setError(err instanceof Error ? `Error parsing quiz: ${err.message}` : 'Invalid JSON format. Please check your input.');
      console.error('Error parsing quiz JSON:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (question: QuizQuestion) => {
    setEditingQuestionId(question.id); // Use question ID
    setEditedQuestionData({ ...question });
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (editedQuestionData) {
      setEditedQuestionData({
        ...editedQuestionData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSaveEdit = () => {
    if (quiz && editedQuestionData) {
      const updatedQuizData = quiz.data.map(q =>
        q.id === editedQuestionData.id ? editedQuestionData : q // Compare by ID
      );
      setQuiz({ data: updatedQuizData });
      setEditingQuestionId(null);
      setEditedQuestionData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditedQuestionData(null);
  };

  const handleSubmitQuiz = async () => {
    // Initial checks are now primarily handled by the button's disabled state,
    // but kept here as a final safeguard.
    if (!quizDetails.title.trim()) {
      alert("Quiz Title is required.");
      return;
    }
    if (!quizDetails.grade) {
      alert("Quiz Grade is required.");
      return;
    }
    if (!quiz || quiz.data.length === 0) {
      alert("Please parse or add questions to the quiz.");
      return;
    }

    const userId = currentUser?.uid;
    if (!userId) {
        alert("User not authenticated. Cannot submit quiz.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const completeQuizData = {
      details: quizDetails, 
      questions: quiz.data, 
    };

    try {
      console.log("Submitting Quiz Data to Firestore:", JSON.stringify(completeQuizData, null, 2));
      await saveQuizToFirestore(completeQuizData, userId);
      alert("Quiz submitted successfully to Firestore!");
      
      // Optionally, reset form or navigate away
      setQuiz(null);
      setJsonInput('');
      setQuizDetails({ id: uuidv4(), title: '', grade: '', timeLimit: 30, targetAudience: 'all' });

    } catch (err) {
      console.error("Error submitting quiz to Firestore:", err);
      setError(err instanceof Error ? `Error submitting quiz: ${err.message}` : "An unknown error occurred during submission.");
      alert("Failed to submit quiz to Firestore. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate if the form is ready for submission for the button's disabled state
  const canSubmit = 
    quizDetails.title.trim() !== '' &&
    quizDetails.grade !== '' &&
    quiz !== null &&
    quiz.data.length > 0 &&
    !!currentUser?.uid && // Ensures currentUser and uid exist
    !isSubmitting;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Testing Quizzes / Create Quiz
      </h2>

      {/* Quiz Details Section */}
      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Quiz Details</h3>
        {/* Quiz ID display - useful for debugging */}
        <p className="text-xs text-gray-500 mb-2">Quiz ID: {quizDetails.id}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Quiz Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              id="title"
              value={quizDetails.title}
              onChange={handleQuizDetailsChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Grade / Exam Type <span className="text-red-500">*</span></label>
            <select
              name="grade"
              id="grade"
              value={quizDetails.grade}
              onChange={handleQuizDetailsChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select Grade / Exam Type</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
              <option value="IOE">IOE</option>
              <option value="CEE">CEE</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes) <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="timeLimit"
              id="timeLimit"
              value={quizDetails.timeLimit}
              onChange={handleQuizDetailsChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <div className="mt-2 space-y-2 md:space-y-0 md:flex md:space-x-4">
              <div className="flex items-center">
                <input
                  id="all"
                  name="targetAudience"
                  type="radio"
                  value="all"
                  checked={quizDetails.targetAudience === 'all'}
                  onChange={handleQuizDetailsChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="all" className="ml-2 block text-sm text-gray-900">All Users</label>
              </div>
              <div className="flex items-center">
                <input
                  id="authenticated"
                  name="targetAudience"
                  type="radio"
                  value="authenticated"
                  checked={quizDetails.targetAudience === 'authenticated'}
                  onChange={handleQuizDetailsChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="authenticated" className="ml-2 block text-sm text-gray-900">Authenticated Users Only</label>
              </div>
              <div className="flex items-center">
                <input
                  id="non-authenticated"
                  name="targetAudience"
                  type="radio"
                  value="non-authenticated"
                  checked={quizDetails.targetAudience === 'non-authenticated'}
                  onChange={handleQuizDetailsChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="non-authenticated" className="ml-2 block text-sm text-gray-900">Non-Authenticated Users Only</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">
          Enter Quiz JSON
        </h3>
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">LaTeX Support</h4>
          <p className="text-sm text-blue-700 mb-2">You can use LaTeX mathematical expressions in questions and options:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Inline math: <code>{'$x^2 + y^2 = z^2$'}</code></li>
            <li>• Block math: <code>{'$$\\int_0^1 x^2 dx$$'}</code></li>
            <li>• Fractions: <code>{'$\\frac{a}{b}$'}</code></li>
            <li>• Square roots: <code>{'$\\sqrt{x}$'}</code></li>
            <li>• Greek letters: <code>{'$\\alpha, \\beta, \\gamma$'}</code></li>
            <li>• Superscripts/Subscripts: <code>{'$x^2, H_2O$'}</code></li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">Note: Use double backslashes (\\\\) in JSON for LaTeX commands.</p>
        </div>
        <textarea
          className="w-full h-64 p-3 border border-gray-300 rounded-md mb-4 font-mono text-sm"
          value={jsonInput}
          onChange={handleJsonChange}
          placeholder={`[
  {
    "questionNo":"1",
    "question":"If x = log\\(_{b}\\)a, y = log\\(_{c}\\)b, and z=log\\(_{a}\\)c then xyz =",
    "imageLink": null,
    "option1":"0",
    "option2":"1",
    "option3":"2",
    "option4":"\\( \\cfrac{1}{2} \\)",
    "correctOption":"2",
    "question":"What is the capital of France?",
    "imageLink": null,
    "option1":"Berlin",
    "option2":"Madrid",
    "option3":"Paris",
    "option4":"Rome",
    "correctOption":"3",
    "marks":"1"
  },
  {
    "questionNo":"2",
    "question":"\\(\\displaystyle \\lim_{x \\to 0} \\cfrac{e^x-e^{-x}}{\\sin x} = \\)",
    "imageLink": null,
    "option1":"1",
    "option2":"-1",
    "option3":"3",
    "option4":"2",
    "correctOption":"4",
    "marks":"1"
  },
  {
    "questionNo":"3",
    "question":"The equation of the hyperbola with focus at (-7,0) and the eccentricity \\( \\cfrac{7}{4} \\) is",
    "imageLink": null,
    "option1":"\\( \\cfrac{x^{2}}{16}\\) - \\( \\cfrac{y^{2}}{33}\\) = 1",
    "option2":"\\( \\cfrac{x^{2}}{24}\\) - \\( \\cfrac{y^{2}}{16}\\) = 1",
    "option3":"\\( \\cfrac{x^{2}}{25}\\) - \\( \\cfrac{y^{2}}{16}\\) = 1",
    "option4":"\\( \\cfrac{x^{2}}{12}\\) - \\( \\cfrac{y^{2}}{4}\\) = 1",
    "correctOption":"1",
    "marks":"1"
  }
]

Tips for LaTeX:
- Use \\(...\\) for inline math: \\(x^2\\)
- Use \\displaystyle for display math: \\(\\displaystyle \\lim_{x \\to 0}\\)
- Use \\cfrac for fractions: \\(\\cfrac{a}{b}\\)
- Subscripts: \\(_{subscript}\\), Superscripts: \\(^{superscript}\\)
- Greek letters: \\alpha, \\beta, \\theta, etc.
- Special symbols: \\infty, \\pm, \\cdot, \\perp, etc.`}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
          onClick={parseQuiz}
          disabled={loading || isSubmitting} // Keep existing disabled logic for this button
        >
          Parse Quiz
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
          onClick={loadSampleData}
          disabled={loading || isSubmitting}
        >
          {loading ? 'Loading...' : 'Load Sample Data'}
        </button>
        <button
          className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSubmitQuiz}
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'} 
        </button>        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">Error:</p>
            <pre className="text-red-600 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>

      {quiz && (
        <div className="bg-white shadow-md rounded-md p-6">          <h3 className="text-lg font-semibold mb-3">
            Quiz Preview
          </h3>          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <p><strong>Questions:</strong> {quiz.data.length}</p>
            <p><strong>Grade/Exam:</strong> {quizDetails.grade || 'Not specified'}</p>
          </div>
          <div className="mt-4">
            {quiz.data.map((question) => (
              <div key={question.id} className="mb-4 p-3 border border-gray-200 rounded-md"> {/* Use question.id as key */}
                {editingQuestionId === question.id && editedQuestionData ? ( // Compare with question.id
                  // Edit Mode
                  <div>
                     <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Question ID (auto-generated):</label>
                      <input
                        type="text"
                        name="id"
                        value={editedQuestionData.id}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                        disabled
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Question No:</label>
                      <input
                        type="text"
                        name="questionNo"
                        value={editedQuestionData.questionNo}
                        onChange={handleEditChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled // Usually questionNo is not editable, but can be enabled if needed
                      />
                    </div>                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Question:</label>
                      <textarea
                        name="question"
                        value={editedQuestionData.question}
                        onChange={handleEditChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Image Link (leave empty if none):</label>
                      <input
                        type="text"
                        name="imageLink"
                        value={editedQuestionData.imageLink || ""}
                        onChange={handleEditChange}
                        placeholder="/questionImages/example.jpg"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {editedQuestionData.imageLink && editedQuestionData.imageLink !== 'null' && editedQuestionData.imageLink !== '' && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                          <img 
                            src={editedQuestionData.imageLink.startsWith('/') ? editedQuestionData.imageLink : `/${editedQuestionData.imageLink}`} 
                            alt="Question image preview" 
                            className="max-w-full h-auto max-h-40 rounded border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/a.png'; // Fallback image
                              console.log('Failed to load image preview');
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {['option1', 'option2', 'option3', 'option4'].map((opt, index) => (
                      <div className="mb-2" key={opt}>
                        <label className="block text-sm font-medium text-gray-700">Option {index + 1}:</label>
                        <input
                          type="text"
                          name={opt}
                          value={editedQuestionData[opt as keyof QuizQuestion]}
                          onChange={handleEditChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    ))}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Correct Option (1-4):</label>
                      <select
                        name="correctOption"
                        value={editedQuestionData.correctOption}
                        onChange={handleEditChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Marks:</label>
                      <input
                        type="text"
                        name="marks"
                        value={editedQuestionData.marks}
                        onChange={handleEditChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <p className="font-semibold mb-1">
                      Q{formatTextWithUnicode(question.questionNo)}{question.question && question.question.trim() !== '' ? `: ` : ''}
                      {question.question && question.question.trim() !== '' && <LatexRenderer>{question.question}</LatexRenderer>}
                    </p>                    {question.imageLink && question.imageLink !== 'null' && question.imageLink !== '' && (
                      <div className="mb-2">
                        <img 
                          src={question.imageLink.startsWith('/') ? question.imageLink : `/${question.imageLink}`} 
                          alt={`Question ${question.questionNo} image`} 
                          className="max-w-full h-auto rounded-md shadow-sm border border-gray-200" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/a.png'; // Fallback image
                            console.warn(`Failed to load image for question ${question.questionNo}: ${question.imageLink}`);
                          }}
                        />
                        {!question.question || question.question.trim() === '' ? 
                          <p className="text-xs text-gray-500 mt-1">This question is image-only</p> : null}
                      </div>
                    )}
                    <ul className="list-disc list-inside ml-4 mb-1">
                      <li>Option 1: <LatexRenderer>{question.option1}</LatexRenderer></li>
                      <li>Option 2: <LatexRenderer>{question.option2}</LatexRenderer></li>
                      <li>Option 3: <LatexRenderer>{question.option3}</LatexRenderer></li>
                      <li>Option 4: <LatexRenderer>{question.option4}</LatexRenderer></li>
                    </ul>                    <p className="text-sm text-green-600 mb-1">
                      Correct Option: {question.correctOption && question.correctOption !== "0" ? `Option ${question.correctOption}` : "Not set"}
                    </p>
                    <p className="text-sm text-blue-600 mb-2">
                      Marks: <LatexRenderer>{question.marks}</LatexRenderer>
                    </p>
                    {/* Display Question ID in view mode - useful for debugging */}
                    <p className="text-xs text-gray-400 mb-2">ID: {question.id}</p> 
                    <button
                      onClick={() => handleEditClick(question)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingQuizzes;
