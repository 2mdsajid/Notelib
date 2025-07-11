import { GRADES_DATA, SubjectDetail } from "../data/data";

export interface GradeInput {
  subject: SubjectDetail;
  theoryGrade: string;
  practicalGrade?: string; // Optional since not all subjects may have practical components
}

/**
 * Calculate GPA based on subject grades
 * @param gradeInputs Array of subjects with their grades
 * @returns Calculated GPA
 */
export const calculateGPA = (gradeInputs: GradeInput[]): number => {
  if (!gradeInputs || gradeInputs.length === 0) {
    return 0;
  }

  let totalWeightedGradePoints = 0;
  let totalEffectiveCredits = 0;

  gradeInputs.forEach((input) => {
    const { subject, theoryGrade, practicalGrade } = input;

    // Directly use as numbers, assuming data.ts provides them as such.
    const theoryCredits = subject.theory_credit;
    const practicalCredits = subject.internal_credit;

    // --- Process Theory Component ---
    // Only process if a theory grade is provided, it's not "Please select",
    // and theory credits are a valid positive number.
    if (theoryGrade && theoryGrade !== "Please select" && typeof theoryCredits === 'number' && theoryCredits > 0) {
      const gradeInfo = GRADES_DATA.find((g) => g.grade === theoryGrade);
      // Ensure the grade is found in GRADES_DATA and has a numeric gradePoint.
      if (gradeInfo && typeof gradeInfo.gradePoint === 'number') {
        totalWeightedGradePoints += gradeInfo.gradePoint * theoryCredits;
        totalEffectiveCredits += theoryCredits; // Add credits only if a valid grade point is applied.
      }
    }

    // --- Process Practical Component ---
    // Only process if a practical grade is provided, it's not "Please select",
    // and practical credits are a valid positive number.
    if (practicalGrade && practicalGrade !== "Please select" && typeof practicalCredits === 'number' && practicalCredits > 0) {
      const gradeInfo = GRADES_DATA.find((g) => g.grade === practicalGrade);
      // Ensure the grade is found in GRADES_DATA and has a numeric gradePoint.
      if (gradeInfo && typeof gradeInfo.gradePoint === 'number') {
        totalWeightedGradePoints += gradeInfo.gradePoint * practicalCredits;
        totalEffectiveCredits += practicalCredits; // Add credits only if a valid grade point is applied.
      }
    }
  });

  if (totalEffectiveCredits === 0) {
    return 0; // Avoid division by zero; returns 0 if no components were validly graded.
  }

  const gpa = totalWeightedGradePoints / totalEffectiveCredits;

  // Return GPA rounded to two decimal places, consistent with previous behavior.
  return parseFloat(gpa.toFixed(2));
};

/**
 * Get GPA class/division based on GPA value
 * @param gpa GPA value
 * @returns The division/class as a string
 */
export const getGPADivision = (gpa: number): string => {
  if (gpa >= 3.6) return "Distinction";
  if (gpa >= 3.2) return "First Division";
  if (gpa >= 2.8) return "Second Division";
  if (gpa >= 1.6) return "Third Division";
  return "Fail";
};

/**
 * Get color code for GPA visualization
 * @param gpa GPA value
 * @returns Color hex code
 */
export const getGPAColor = (gpa: number): string => {
  if (gpa >= 3.6) return "#4CAF50"; // Green for Distinction
  if (gpa >= 3.2) return "#8BC34A"; // Light green for First Division
  if (gpa >= 2.8) return "#FFC107"; // Amber for Second Division
  if (gpa >= 1.6) return "#FF9800"; // Orange for Third Division
  return "#F44336"; // Red for Fail
};
