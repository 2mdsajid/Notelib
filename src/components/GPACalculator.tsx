import React, { useState, useEffect, useRef } from "react";
import { SUBJECT_DATA, GRADES, SubjectDetail } from "../data/data";
import { calculateGPA, getGPADivision, getGPAColor, GradeInput } from "../utils/gpaUtils";
import SubjectSelector from "./SubjectSelector";
import { Plus, Trash2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface GPACalculatorProps {
  variant?: "simple" | "detailed";
}

const GPACalculator: React.FC<GPACalculatorProps> = ({ 
  variant = "detailed"
}) => {
  // Fixed to grade 12 as requested
  const [grade] = useState<"11" | "12">("12");  
  const [stream, setStream] = useState<"science" | "management" | "other">("science");
  const [scienceGroup, setScienceGroup] = useState<"physical" | "biology">("physical");
  const [subjects, setSubjects] = useState<SubjectDetail[]>([]);
  const [theoryGrades, setTheoryGrades] = useState<Record<string, string>>({});
  const [practicalGrades, setPracticalGrades] = useState<Record<string, string>>({});  const [gpa, setGpa] = useState<number>(0);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Ref for PDF export
  const resultRef = useRef<HTMLDivElement>(null);  // Get compulsory subjects based on the selected stream
  const getCompulsorySubjects = () => {
    const compulsory = SUBJECT_DATA[grade].compulsory;
    
    // For science stream, exclude social studies & life skill subjects
    if (stream === "science") {
      return compulsory.filter(subject => {
        const lowerCaseName = subject.name.toLowerCase();
        // Explicitly exclude "Social Studies & Life Skill" and any other subject containing "social"
        return !(
          lowerCaseName.includes("social") ||
          lowerCaseName.includes("life skill") ||
          lowerCaseName === "com.social studies & life skill"
        );
      });
    }
    
    // For other streams, keep all compulsory subjects
    return compulsory;
  };
  
  // Get optional subjects based on the selected stream and group
  const getOptionalSubjects = () => {
    const allOptional = SUBJECT_DATA[grade].optional;
    
    if (stream === "science") {
      // For science stream, we need exactly 3 optional subjects to make a total of 6 
      // (since we have 3 compulsory ones after removing Social Studies)
      if (scienceGroup === "physical") {
        // Return subjects for Physical Science - specifically Physics, Chemistry, and Computer
        return allOptional.filter(subject => 
          subject.name.toLowerCase().includes("computer") || 
          subject.name.toLowerCase().includes("physics") || 
          subject.name.toLowerCase().includes("chemistry") && 
          !subject.name.toLowerCase().includes("social") &&
          !subject.name.toLowerCase().includes("biology")
        ).slice(0, 3);
      } else {
        // Return subjects for Biology Group - specifically Physics, Chemistry, and Biology
        return allOptional.filter(subject => 
          subject.name.toLowerCase().includes("biology") || 
          subject.name.toLowerCase().includes("physics") || 
          subject.name.toLowerCase().includes("chemistry") && 
          !subject.name.toLowerCase().includes("social") &&
          !subject.name.toLowerCase().includes("computer")
        ).slice(0, 3);
      }
    } else if (stream === "management") {
      // Return subjects relevant for Management
      return allOptional.filter(subject => 
        subject.name.toLowerCase().includes("account") || 
        subject.name.toLowerCase().includes("economics") || 
        subject.name.toLowerCase().includes("business") ||
        subject.name.toLowerCase().includes("marketing")
      ).slice(0, 4);
    } else {
      // For other streams, don't include any optional subjects by default
      // The user will add these manually
      return [];
    }
  };
  // Load subjects based on selected stream and group
  useEffect(() => {
    setLoading(true);
    const compulsorySubjects = getCompulsorySubjects();
    const optionalSubjects = getOptionalSubjects();
    
    let allSubjects = [...compulsorySubjects, ...optionalSubjects];
    
    // For science stream, ensure we have exactly 6 subjects
    if (stream === "science") {
      // If we don't have enough subjects, add more from optional
      const moreOptionalSubjects = SUBJECT_DATA[grade].optional.filter(
        subject => !allSubjects.some(s => s.code === subject.code)
      );
      
      while (allSubjects.length < 6 && moreOptionalSubjects.length > 0) {
        allSubjects.push(moreOptionalSubjects.shift()!);
      }
      
      // If we have too many subjects, trim to 6
      if (allSubjects.length > 6) {
        allSubjects = allSubjects.slice(0, 6);
      }
    }
    
    setSubjects(allSubjects);
    
    // Reset grades when changing stream/group
    const initialTheoryGrades: Record<string, string> = {};
    const initialPracticalGrades: Record<string, string> = {};
      allSubjects.forEach(subject => {
      initialTheoryGrades[subject.code] = "Please select"; // Default prompt instead of "NG"
      initialPracticalGrades[subject.code] = "Please select"; // Default prompt for practical
    });
    
    setTheoryGrades(initialTheoryGrades);
    setPracticalGrades(initialPracticalGrades);
    setIsCalculated(false);
    setLoading(false);
  }, [grade, stream, scienceGroup]);

  const handleTheoryGradeChange = (subjectCode: string, newGrade: string) => {
    setTheoryGrades(prev => ({
      ...prev,
      [subjectCode]: newGrade
    }));
    setIsCalculated(false);
  };

  const handlePracticalGradeChange = (subjectCode: string, newGrade: string) => {
    setPracticalGrades(prev => ({
      ...prev,
      [subjectCode]: newGrade
    }));
    setIsCalculated(false);
  };

  const handleAddSubject = () => {
    // Allow adding subjects for Management and Other streams
    if (stream === "management" || stream === "other") {
      setShowSubjectSelector(true);
    }
  };
    const handleSelectSubject = (subject: SubjectDetail) => {
    setSubjects([...subjects, subject]);
    setTheoryGrades(prev => ({
      ...prev,
      [subject.code]: "Please select"
    }));
    setPracticalGrades(prev => ({
      ...prev,
      [subject.code]: "Please select"
    }));
    setShowSubjectSelector(false);
    setIsCalculated(false);
  };

  const handleRemoveSubject = (subjectCode: string) => {
    // Don't allow removing compulsory subjects
    if (SUBJECT_DATA[grade].compulsory.some(s => s.code === subjectCode)) {
      return;
    }
    
    setSubjects(subjects.filter(s => s.code !== subjectCode));
    setTheoryGrades(prev => {
      const updated = { ...prev };
      delete updated[subjectCode];
      return updated;
    });
    setPracticalGrades(prev => {
      const updated = { ...prev };
      delete updated[subjectCode];
      return updated;
    });
    setIsCalculated(false);
  };  // State for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calculateCurrentGPA = () => {
    // Check if any theory grade is not selected
    const hasUnselectedGrades = subjects.some(subject => 
      theoryGrades[subject.code] === "Please select" || 
      theoryGrades[subject.code] === "NG"
    );
      if (hasUnselectedGrades) {
      setErrorMessage("Please select grades for all subjects before calculating GPA.");
      // Clear error message after 4 seconds
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    
    // Clear any previous error message
    setErrorMessage(null);
    
    const gradeInputs: GradeInput[] = subjects
      .map(subject => ({
        subject,
        theoryGrade: theoryGrades[subject.code],
        practicalGrade: practicalGrades[subject.code]
      }));
    
    // Calculate GPA and ensure it doesn't exceed 4.0 (the maximum in NEB grading system)
    let calculatedGPA = calculateGPA(gradeInputs);
    calculatedGPA = Math.min(calculatedGPA, 4.0);
    
    setGpa(calculatedGPA);
    setIsCalculated(true);  };

  // Function to generate and download PDF
  const downloadPDF = () => {
    if (!resultRef.current || !isCalculated) return;
    
    // Set a loading state if needed
    setLoading(true);
    
    html2canvas(resultRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add some basic info to the PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const title = `${stream.toUpperCase()} GPA Calculation`;
        // Add title with a simple color scheme (dark blue instead of purple)
      pdf.setFontSize(18);
      pdf.setTextColor(25, 40, 85); // Dark blue
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(70, 80, 90); // Slate gray
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Add the GPA result image
      const imgWidth = 150;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 40, imgWidth, imgHeight);
      
      // Add student info and subject details
      pdf.setFontSize(12);
      let yPosition = 40 + imgHeight + 10;
      
      pdf.text(`Stream: ${stream.charAt(0).toUpperCase() + stream.slice(1)}`, 20, yPosition);
      yPosition += 10;
      
      if (stream === "science") {
        pdf.text(`Group: ${scienceGroup === "physical" ? "Physical (with Computer)" : "Biology"}`, 20, yPosition);
        yPosition += 10;
      }
      
      pdf.text("Subject Details:", 20, yPosition);
      yPosition += 8;
      
      // Add subject table headers
      pdf.setFontSize(10);
      pdf.text("Subject", 20, yPosition);
      pdf.text("Theory Grade", 110, yPosition);
      pdf.text("Practical Grade", 150, yPosition);
      yPosition += 5;
      
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 5;        // Add each subject
      subjects.forEach(subject => {
        if (theoryGrades[subject.code] !== "NG" && theoryGrades[subject.code] !== "Please select") {
          pdf.text(subject.name, 20, yPosition);
          pdf.text(theoryGrades[subject.code], 110, yPosition);
          pdf.text(practicalGrades[subject.code] !== "Please select" ? practicalGrades[subject.code] : "N/A", 150, yPosition);
          yPosition += 6;
          
          // Add a new page if we're near the bottom
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
        }
      });

      // Add spacing
      yPosition += 10;
      
      // Add Grade Point Values Chart
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Grade Point Values", 20, yPosition);
      yPosition += 8;

      // Set up table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text("Grade", 30, yPosition);
      pdf.text("Point Value", 60, yPosition);
      pdf.text("Percentage Range", 100, yPosition);
      yPosition += 5;
      
      // Draw a line after the header
      pdf.line(20, yPosition, 170, yPosition);
      yPosition += 5;

      // Set up grade data
      const gradeData = [
        { grade: "A+", point: "4.0", range: "90-100%" },
        { grade: "A", point: "3.6", range: "80-89%" },
        { grade: "B+", point: "3.2", range: "70-79%" },
        { grade: "B", point: "2.8", range: "60-69%" },
        { grade: "C+", point: "2.4", range: "50-59%" },
        { grade: "C", point: "2.0", range: "40-49%" },
        { grade: "D+", point: "1.6", range: "30-39%" },
        { grade: "D", point: "1.2", range: "20-29%" },
        { grade: "E", point: "0.8", range: "0-19%" }
      ];

      // Add each grade row
      let rowIsShaded = false;
      gradeData.forEach((item, index) => {
        // Add shading to alternate rows (similar to the HTML table)
        if (rowIsShaded) {
          pdf.setFillColor(245, 245, 245); // Light gray similar to bg-gray-50
          pdf.rect(20, yPosition - 3, 150, 6, 'F');
        }
        
        pdf.text(item.grade, 30, yPosition);
        pdf.text(item.point, 60, yPosition);
        pdf.text(item.range, 100, yPosition);
        yPosition += 6;
        rowIsShaded = !rowIsShaded;
        
        // Add a new page if we're near the bottom
        if (index < gradeData.length - 1 && yPosition > pageHeight - 10) {
          pdf.addPage();
          yPosition = 20;
          rowIsShaded = false;
        }
      });
      
      // Add disclaimer at the bottom
      yPosition += 5;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text("Disclaimer: This GPA is calculated based on student-provided marks using the NEB grading scale.", 20, pageHeight - 15);
      pdf.text("It is for informational purposes only and not an official NEB document.", 20, pageHeight - 10);
      
      // Save the PDF - use a more descriptive filename
      pdf.save(`NEB_Grade12_${stream}_GPA_${gpa.toFixed(2)}.pdf`);
      setLoading(false);
    });
  };

  // Simple version just shows GPA without ability to add/remove subjects
  if (variant === "simple") {
    if (loading) {
      return (
        <div className="p-12 bg-white rounded-lg shadow-md flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-4 text-center text-purple-700">NEB GPA Calculator</h3>
        
        <div className="flex flex-col gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Course Stream:</label>
            <select 
              value={stream} 
              onChange={(e) => setStream(e.target.value as "science" | "management" | "other")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="science">Science</option>
              <option value="management">Management</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {stream === "science" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Group:</label>
              <select 
                value={scienceGroup} 
                onChange={(e) => setScienceGroup(e.target.value as "physical" | "biology")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="physical">Physical (with Computer)</option>
                <option value="biology">Biology</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 mb-6">
          {subjects.map(subject => (
            <div key={subject.code} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-gray-800">{subject.name}</div>
              <select
                value={theoryGrades[subject.code]}
                onChange={(e) => handleTheoryGradeChange(subject.code, e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                {GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
          <div className="flex flex-col gap-3">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-md text-center text-sm">
              {errorMessage}
            </div>
          )}
          
          <button 
            onClick={calculateCurrentGPA}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition shadow-sm"
          >
            Calculate GPA
          </button>
          
          {isCalculated && (
            <button 
              onClick={downloadPDF}
              className="w-full bg-purple-600 text-white py-2.5 rounded-md hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileDown size={18} /> Download PDF
            </button>
          )}
        </div>
        
        {isCalculated && (
          <div ref={resultRef} className="mt-6 p-5 bg-gray-50 rounded-lg text-center shadow-inner">
            <h4 className="text-lg font-semibold mb-2">Your GPA</h4>            <div className="text-4xl font-bold mb-2" style={{ color: gpa >= 3.6 ? '#22c55e' : gpa >= 3.2 ? '#3b82f6' : gpa >= 2.8 ? '#0ea5e9' : gpa >= 1.6 ? '#f97316' : '#ef4444' }}>
              {gpa.toFixed(2)}
            </div>
            <div className="text-md font-medium">Division: {getGPADivision(gpa)}</div>
            <div className="mt-3 text-xs text-gray-500">
              Based on {subjects.filter(s => theoryGrades[s.code] !== "NG").length} subjects
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Detailed version with full functionality
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-purple-700">NEB GPA Calculator</h2>
      <p className="text-center text-gray-600 mb-6">
        Calculate your Grade Point Average (GPA) based on the NEB grading system. Select your course stream, add your subjects, and see your results instantly.
      </p>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <label htmlFor="stream-select" className="block text-sm font-medium mb-2 text-gray-700">Course Stream:</label>
            <select 
              id="stream-select"
              value={stream} 
              onChange={(e) => setStream(e.target.value as "science" | "management" | "other")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="science">Science</option>
              <option value="management">Management</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {stream === "science" && (
            <div className="w-full md:w-1/3">
              <label htmlFor="group-select" className="block text-sm font-medium mb-2 text-gray-700">Group:</label>
              <select 
                id="group-select"
                value={scienceGroup} 
                onChange={(e) => setScienceGroup(e.target.value as "physical" | "biology")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="physical">Physical (with Computer)</option>
                <option value="biology">Biology</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Theory</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Practical</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((subject, index) => {
                const isCompulsory = SUBJECT_DATA[grade].compulsory.some(s => s.code === subject.code);
                const theoryCredit = subject.theory_credit;
                const practicalCredit = subject.internal_credit;
                
                return (
                  <tr key={subject.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {subject.name}
                          {isCompulsory && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">(Compulsory)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      <div>
                        <div className="font-medium">{subject.total_credits}</div>
                        <div className="text-xs text-gray-500">
                          T: {theoryCredit} | P: {practicalCredit}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <select
                        value={theoryGrades[subject.code]}
                        onChange={(e) => handleTheoryGradeChange(subject.code, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      >
                        {GRADES.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <select
                        value={practicalGrades[subject.code]}
                        onChange={(e) => handlePracticalGradeChange(subject.code, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      >
                        {GRADES.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {!isCompulsory && stream !== "science" && (
                        <button 
                          onClick={() => handleRemoveSubject(subject.code)}
                          className="text-red-600 hover:text-red-900 text-sm flex items-center gap-1 justify-center hover:bg-red-50 p-1 rounded transition"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>          {errorMessage && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-center">
              {errorMessage}
            </div>
          )}
          
          <div className="mt-6 flex flex-col md:flex-row md:justify-between md:space-x-2 space-y-2 md:space-y-0">
          {(stream === "management" || stream === "other") && (
            <button 
              onClick={handleAddSubject}
              className="px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2 justify-center shadow"
            >
              <Plus size={18} /> Add Subject
            </button>
          )}
          
          <div className={`flex flex-col md:flex-row gap-2 ${(stream === "management" || stream === "other") ? "" : "md:ml-auto"}`}>
            <button 
              onClick={downloadPDF}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center gap-2 justify-center shadow-sm"
              disabled={!isCalculated}
            >
              <FileDown size={18} /> Download PDF
            </button>
            
            <button 
              onClick={calculateCurrentGPA}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm"
            >
              Calculate GPA
            </button>
          </div>
        </div>
      </div>
      
      {isCalculated && (
        <div className="border-t pt-8">
          <div ref={resultRef} className="bg-gray-50 p-8 rounded-lg text-center shadow-inner">
            <h3 className="text-2xl font-semibold mb-3">Your GPA</h3>
            <div className="text-6xl font-bold mb-3" style={{ color: getGPAColor(gpa) }}>
              {gpa.toFixed(2)}
            </div>
            <div className="text-xl">
              Division: <span className="font-medium">{getGPADivision(gpa)}</span>
            </div>
            <div className="mt-5 text-sm text-gray-500">
              GPA calculated based on {subjects.filter(s => theoryGrades[s.code] !== "NG" && theoryGrades[s.code] !== "Please select").length} subjects
            </div>
          </div>
        </div>
      )}
      
      {(showSubjectSelector && (stream === "management" || stream === "other")) && (
        <SubjectSelector
          grade={grade}
          currentSubjects={subjects}
          onSelectSubject={handleSelectSubject}
          onCancel={() => setShowSubjectSelector(false)}
        />
      )}
    </div>
  );
};

export default GPACalculator;
