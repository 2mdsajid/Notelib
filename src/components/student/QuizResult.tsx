import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Award, Home, Download, ListOrdered, BarChart2 } from 'lucide-react';
import { QuizResult } from './QuizPlayer';
import jsPDF from 'jspdf';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { InlineMath, BlockMath } from 'react-katex';
import QuizLeaderBoardTable from './QuizLeaderBoardTable';

interface QuizResultProps {
  result: QuizResult;
  onBackToQuizzes: () => void;
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
    
    // Convert \\(...\\) to $...$
    .replace(/\\?\\\(/g, '$')
    .replace(/\\?\\\)/g, '$')
    // Convert \\[...\\] to $$...$$
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
    // Convert \\cfrac to \\frac
    .replace(/\\cfrac/g, '\\frac')
    .replace(/\\dfrac/g, '\\frac')
    
    // Convert overset arrows
    .replace(/\\overset\{\{\\rightarrow\s*\}\}/g, '\\vec')
    .replace(/\\overset\{\{\\rightarrow\s*\}\}\{([^}]+)\}/g, '\\vec{$1}')
    
    // Fix spacing issues with dots
    .replace(/\s*\\\s*\.\s*\\\s*/g, ' \\cdot ')
    .replace(/\s*\\,\s*\\,\s*\.\s*\\,\s*\\,\s*/g, ' \\cdot ')
    
    // Convert \\bot to \\perp
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
    // No LaTeX detected, render with superscript conversion and HTML decode
    const htmlDecoded = convertedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—');
    return <span dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(htmlDecoded) }} />;
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
        const htmlDecoded = beforeText
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .replace(/&ldquo;/g, '"')
          .replace(/&rdquo;/g, '"')
          .replace(/&lsquo;/g, "'")
          .replace(/&rsquo;/g, "'")
          .replace(/&ndash;/g, '–')
          .replace(/&mdash;/g, '—');
        parts.push(<span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(htmlDecoded) }} />);
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
      const htmlDecoded = remainingText
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—');
      parts.push(<span key="text-end" dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(htmlDecoded) }} />);
    }
    
    return <>{parts}</>;
    
  } catch (error) {
    console.warn('LaTeX rendering error:', error);
    // Fallback to superscript conversion with HTML decode
    const htmlDecoded = convertedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—');
    return <span dangerouslySetInnerHTML={{ __html: formatTextWithUnicode(htmlDecoded) }} />;
  }
};


interface ScoreObject {
  userId: string
  rank: number
  name: string
  score: number
}

const QuizResultComponent: React.FC<QuizResultProps> = ({
  result,
  onBackToQuizzes
}) => {
  const { quiz, userAnswers, score, totalQuestions, percentage, timeSpent, completedAt } = result;

  const [activeTab, setActiveTab] = useState<'analysis' | 'leaderboard'>('analysis');

  // Format numbers to avoid floating point display issues
  const formatScore = (num: number) => {
    return Number(num.toFixed(2));
  };

  const formatPercentage = (num: number) => {
    return Number(num.toFixed(1));
  };

  // Helper function to convert LaTeX to plain text for PDF
  const latexToPlainText = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove LaTeX commands and keep content
      .replace(/\$\$([^$]+)\$\$/g, '$1') // Block math
      .replace(/\$([^$]+)\$/g, '$1') // Inline math
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)') // Fractions
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)') // Square roots
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1') // Other LaTeX commands
      .replace(/\\[a-zA-Z]+/g, '') // Remove remaining LaTeX commands
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // PDF Generation Function
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Quiz Result Report', pageWidth / 2, 20, { align: 'center' });
    
    // Quiz Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Quiz: ${latexToPlainText(quiz.title)}`, 20, 40);
    doc.text(`Quiz: ${quiz.title}`, 20, 40);
    doc.text(`Grade: ${quiz.grade}`, 20, 50);
    if (quiz.subject) doc.text(`Subject: ${quiz.subject}`, 20, 60);
    doc.text(`Completed: ${completedAt.toLocaleString()}`, 20, 70);
    
    // Results Summary
    doc.setFont('helvetica', 'bold');
    doc.text('Results Summary:', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${formatScore(score)}/${totalQuestions} (${formatPercentage(percentage)}%)`, 20, 100);
    doc.text(`Time Spent: ${formatTime(timeSpent)}`, 20, 110);
    doc.text(`Grade: ${getGradeText(percentage)}`, 20, 120);
    
    // Question Details
    let yPosition = 140;
    
    quiz.questions.forEach((question, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
      const selectedOption = question.options.find(opt => opt.id === userAnswer?.selectedOptionId);
      const correctOption = question.options.find(opt => opt.isCorrect);
      const isCorrect = userAnswer?.isCorrect || false;
      const wasAnswered = !!userAnswer;
      
      // Question header
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${index + 1}:`, 20, yPosition);
      yPosition += 10;
      
      // Question text or image note
      doc.setFont('helvetica', 'normal');
      if (question.imageLink) {
        doc.text('(Image question - see original quiz)', 20, yPosition);
      } else {
        const rawQuestionText = question.questionText || 'Question text not available';
        const questionText = latexToPlainText(rawQuestionText);
        const lines = doc.splitTextToSize(questionText, pageWidth - 40);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5;
      }
      yPosition += 5;
      
      // Answer status
      const statusText = wasAnswered 
        ? (isCorrect ? '✓ Correct' : '✗ Incorrect') 
        : '- Not Answered';
      doc.text(`Status: ${statusText}`, 20, yPosition);
      yPosition += 10;
      
      if (wasAnswered && selectedOption) {
        doc.text(`Your Answer: ${latexToPlainText(selectedOption.text)}`, 20, yPosition);
        doc.text(`Your Answer: ${selectedOption.text}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (correctOption) {
        doc.text(`Correct Answer: ${latexToPlainText(correctOption.text)}`, 20, yPosition);
        doc.text(`Correct Answer: ${correctOption.text}`, 20, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10; // Space between questions
    });
    
    // Save the PDF
    doc.save(`${latexToPlainText(quiz.title).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_result.pdf`);
    doc.save(`${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_result.pdf`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 80) return 'Very Good!';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding performance! You have mastered this topic.';
    if (percentage >= 80) return 'Great job! You have a strong understanding of the material.';
    if (percentage >= 70) return 'Good work! Review the missed questions to improve further.';
    if (percentage >= 60) return 'Fair performance. Consider reviewing the material again.';
    return 'Keep practicing! Review the material and try again.';
  };

  // Console log the complete result
  // console.log('Quiz Result Display:', {
  //   quizTitle: quiz.title,
  //   score: `${score}/${totalQuestions}`,
  //   percentage: `${percentage}%`,
  //   timeSpent: formatTime(timeSpent),
  //   completedAt: completedAt.toLocaleString(),
  //   userAnswers: userAnswers.map(answer => ({
  //     questionId: answer.questionId,
  //     selectedOptionId: answer.selectedOptionId,
  //     isCorrect: answer.isCorrect
  //   }))
  // });


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back to Quizzes Button - Top */}
        <div className="mb-4 flex justify-start">
          <button
            onClick={onBackToQuizzes}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Home size={16} />
            Back to Quizzes
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${getGradeColor(percentage)} mb-4`}>
            <Award size={24} />
            <span className="text-xl font-bold">{getGradeText(percentage)}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600"><LatexRenderer>{quiz.title}</LatexRenderer></p>
          <p className="text-gray-600">{quiz.title}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex justify-center -mb-px">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 py-4 px-6 text-center font-medium border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <BarChart2 size={18} />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 py-4 px-6 text-center font-medium border-b-2 transition-colors ${activeTab === 'leaderboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <ListOrdered size={18} />
              Leaderboard
            </button>
          </div>
        </div>

        {activeTab === 'leaderboard' && (
          <div id="leaderboard-content">
            <QuizLeaderBoardTable quizId={quiz.id} />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div id="analysis-content">

            {/* Score Summary */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">            <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">{formatScore(score)}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
                <div className="text-xs text-gray-500">out of {totalQuestions}</div>
              </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">{formatPercentage(percentage)}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-xs text-gray-500">Percentage</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{formatTime(timeSpent)}</div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{quiz.grade}</div>
                  <div className="text-sm text-gray-600">Grade Level</div>
                  {quiz.subject && <div className="text-xs text-gray-500">{quiz.subject}</div>}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-center text-gray-700">{getPerformanceMessage(percentage)}</p>
              </div>
            </div>

            {/* Quiz Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quiz Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Quiz Title:</span>
                  <span className="font-medium"><LatexRenderer>{quiz.title}</LatexRenderer></span>
                  <span className="font-medium">{quiz.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Completed At:</span>
                  <span className="font-medium">{completedAt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{quiz.timeLimit} minutes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Questions Answered:</span>
                  <span className="font-medium">{userAnswers.filter(ua => ua.selectedOptionId !== null).length} of {totalQuestions}</span>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Question Review</h2>

              <div className="space-y-6">            {quiz.questions.map((question, index) => {

                const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
                const selectedOption = question.options.find(opt => opt.id === userAnswer?.selectedOptionId);
                // Use question.correctOption (string or number) to find the correct option
                // const correctOption = question.options.find(opt => opt.id === question.correctOption || opt.value === question.correctOption || opt.optionNo === question.correctOption);
                const isCorrect = userAnswer?.isCorrect || false;
                const wasAnswered = !!userAnswer;

                // Debug: log the correctOption id/value and all options
                // console.log('Question', index + 1, 'question.correctOption:', question.correctOption, 'options:', question.options);

                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      {wasAnswered ? (
                        isCorrect ? (
                          <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                        ) : (
                          <XCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />
                        )
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">Question {index + 1}</div>

                        {/* Question Image */}
                        {question.imageLink && (
                          <div className="mb-3">
                            <img
                              src={question.imageLink}
                              alt={`Question ${index + 1} image`}
                              className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                console.warn(`Failed to load image: ${question.imageLink}`);
                              }}
                            />
                          </div>
                        )}

                        {/* Question Text */}
                        {question.questionText && (
                          <h3 className="font-semibold text-gray-800 mb-3">
                            <LatexRenderer>{question.questionText}</LatexRenderer>
                          </h3>
                        )}

                        {/* Show note if question has only image */}
                        {question.imageLink && !question.questionText && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            <Clock size={14} className="inline mr-1" />
                            Image-based question
                          </div>
                        )}

                        <div className="space-y-2">
                          {(() => {
                            // Get the correct answer text from question.option{correctOption}
                            const correctOptionKey = `option${question.correctOption}`;
                            const correctOptionText = question[correctOptionKey];
                            return question.options.map((option) => {
                              let optionClass = 'p-3 rounded-lg border ';
                              let rightLabel = null;
                              let leftIcon = null;
                              // Highlight as correct if option.text matches correctOptionText
                              const isCorrectOption = option.text === correctOptionText;
                              if (isCorrectOption) {
                                optionClass += 'border-green-500 bg-green-50 text-green-700';
                                leftIcon = <CheckCircle size={16} className="text-green-600" />;
                                rightLabel = (
                                  <span className="ml-auto text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded">
                                    Correct Answer
                                  </span>
                                );
                              }
                              // If user selected this option and it is not correct, show as 'Your Answer'
                              if (selectedOption?.id === option.id && !isCorrectOption) {
                                optionClass += 'border-red-500 bg-red-50 text-red-700';
                                leftIcon = <XCircle size={16} className="text-red-600" />;
                                rightLabel = (
                                  <span className="ml-auto text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded">
                                    Your Answer
                                  </span>
                                );
                              }
                              // Default style for other options
                              if (!isCorrectOption && selectedOption?.id !== option.id) {
                                optionClass += 'border-gray-200 bg-gray-50 text-gray-700';
                              }
                              return (
                                <div key={option.id} className={optionClass}>
                                  <div className="flex items-center gap-2">
                                    {leftIcon}
                                    <span><LatexRenderer>{option.text}</LatexRenderer></span>
                                    {rightLabel}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {!wasAnswered && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                              <Clock size={16} />
                              <span className="text-sm font-medium">Not Answered</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generatePDF}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download size={18} />
                Download PDF Report
              </button>
              <button
                onClick={onBackToQuizzes}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home size={18} />
                Back to Quizzes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizResultComponent;
