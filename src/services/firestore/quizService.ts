// src/services/firestore/quizService.ts
import { collection, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore'; // Removed addDoc
import { db } from '../../lib/firebase';
import { QuizDetails as TestingQuizDetails, QuizQuestion as TestingQuizQuestion } from '../../components/admin/TestingQuizzes'; 

// Interface for the data structure that will be stored in Firestore
export interface StoredQuizData {
  details: TestingQuizDetails; // This should include the id for the quiz
  questions: TestingQuizQuestion[]; // This should be an array of questions, each with an id
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
  createdBy: string; // User ID of the admin who created/updated the quiz
  // Add any other fields you expect at the top level of the quiz document
}

const quizzesCollectionRef = collection(db, 'quizzes');

// Function to add or update a quiz in Firestore
// It uses setDoc with merge:true, so it can be used for both creating and updating.
// However, for clarity, specific add and update functions are often preferred.
export const saveQuizToFirestore = async (quizData: { details: TestingQuizDetails; questions: TestingQuizQuestion[] }, userId: string): Promise<string> => {
  if (!quizData.details.id) {
    throw new Error("Quiz ID is missing in details. Cannot save quiz.");
  }
  const quizDocRef = doc(quizzesCollectionRef, quizData.details.id);

  const dataToStore: StoredQuizData = {
    details: quizData.details,
    questions: quizData.questions,
    createdAt: serverTimestamp(), // This will only be set on creation if using setDoc without merge
    updatedAt: serverTimestamp(),
    createdBy: userId,
  };

  // Check if the document exists to handle createdAt appropriately
  const docSnap = await getDoc(quizDocRef);
  if (docSnap.exists()) {
    // Document exists, update it (updatedAt will be overwritten, createdAt remains)
    await updateDoc(quizDocRef, {
      details: quizData.details,
      questions: quizData.questions,
      updatedAt: serverTimestamp(),
      createdBy: userId, // Or update only if it's a different admin, based on requirements
    });
  } else {
    // Document doesn't exist, create it (createdAt and updatedAt will be set)
    await setDoc(quizDocRef, dataToStore);
  }
  
  console.log(`Quiz ${docSnap.exists() ? 'updated' : 'added'} with ID: ${quizData.details.id}`);
  return quizData.details.id; // Return the quiz ID
};

// Function to get a single quiz by its ID
export const getQuizFromFirestore = async (quizId: string): Promise<StoredQuizData | null> => {
  const quizDocRef = doc(quizzesCollectionRef, quizId);
  const docSnap = await getDoc(quizDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as StoredQuizData;
  }
  console.log(`Quiz with ID ${quizId} not found.`);
  return null;
};

// Function to delete a quiz
export const deleteQuizFromFirestore = async (quizId: string): Promise<void> => {
  const quizDocRef = doc(quizzesCollectionRef, quizId);
  await deleteDoc(quizDocRef);
  console.log(`Quiz with ID ${quizId} deleted.`);
};

// Function to get all quizzes (consider pagination for large datasets for admin panels)
export const getAllQuizzesFromFirestore = async (): Promise<StoredQuizData[]> => {
  try {
    const querySnapshot = await getDocs(quizzesCollectionRef);
    return querySnapshot.docs.map(doc => {
      // Make sure to include the document ID in the returned object
      const data = doc.data() as Omit<StoredQuizData, 'details'> & { details: { id?: string } }; // Temporary type to check id
      return {
        ...data,
        details: { ...data.details, id: doc.id }, // Ensure the quiz ID from the document is used
      } as StoredQuizData;
    });
  } catch (error) {
    console.error("Error fetching all quizzes: ", error);
    return [];
  }
};

// Example: Get quizzes created by a specific user (if needed for admin views)
export const getQuizzesByCreatorFromFirestore = async (userId: string): Promise<StoredQuizData[]> => {
  try {
    const q = query(quizzesCollectionRef, where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<StoredQuizData, 'details'> & { details: { id?: string } };
      return {
        ...data,
        details: { ...data.details, id: doc.id },
      } as StoredQuizData;
    });
  } catch (error) {
    console.error(`Error fetching quizzes for user ${userId}: `, error);
    return [];
  }
};


export interface QuizAttempt {
  userId: string;
  quizId: string;
  score: number;
  answers: Array<{ questionId: string; selectedOptionId?: string; isCorrect: boolean }>;
  attemptedAt: any; 
  timeTaken?: number; 
}

export const recordQuizAttempt = async (attemptData: Omit<QuizAttempt, 'attemptedAt'>): Promise<boolean> => {
  try {
    const attemptDocRef = doc(db, 'quizAttempts', `${attemptData.userId}_${attemptData.quizId}`);
    await setDoc(attemptDocRef, {
      ...attemptData,
      attemptedAt: serverTimestamp(),
    });
    console.log(`Attempt recorded for user ${attemptData.userId} on quiz ${attemptData.quizId}`);
    return true;
  } catch (error) {
    console.error('Error recording quiz attempt: ', error);
    return false;
  }
};

export const getUserQuizAttempt = async (userId: string, quizId: string): Promise<QuizAttempt | null> => {
  try {
    const attemptDocRef = doc(db, 'quizAttempts', `${userId}_${quizId}`);
    const docSnap = await getDoc(attemptDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as QuizAttempt;
    }
    return null;
  } catch (error) {
    console.error('Error fetching quiz attempt: ', error);
    return null;
  }
};
