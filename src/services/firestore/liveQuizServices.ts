// src/services/firestore/quizService.ts
import { collection, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { QuizDetails as TestingQuizDetails, QuizQuestion as TestingQuizQuestion } from '../../components/admin/TestingQuizzes'; 


export interface LiveQuizData {
  details: TestingQuizDetails;
  questions: TestingQuizQuestion[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  type: 'live';
  archive:boolean;
}

const quizzesCollectionRef = collection(db, 'quizzes');


export const saveLiveQuizToFirestore = async (
  quizData: { details: TestingQuizDetails; questions: TestingQuizQuestion[] },
  userId: string
): Promise<string> => {
  if (!quizData.details.id) {
    throw new Error("Quiz ID is missing in details. Cannot save live quiz to 'liveQuizzes' collection.");
  }
  const quizDocRef = doc(quizzesCollectionRef, quizData.details.id);

  const dataToStore: LiveQuizData = {
    details: quizData.details,
    questions: quizData.questions,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    type: 'live',
    archive: false,
  };

  console.log("Saving to 'liveQuizzes' collection:", dataToStore);

  const docSnap = await getDoc(quizDocRef);
  if (docSnap.exists()) {
    await updateDoc(quizDocRef, {
      details: quizData.details,
      questions: quizData.questions,
      updatedAt: serverTimestamp(),
      createdBy: userId,
      type: 'live',
    });
  } else {
    await setDoc(quizDocRef, dataToStore);
  }
  
  console.log(`Live Quiz ${docSnap.exists() ? 'updated' : 'added'} in 'liveQuizzes' collection with ID: ${quizData.details.id}`);
  return quizData.details.id;
};

export const getLiveQuizFromFirestore = async (quizId: string): Promise<LiveQuizData | null> => {
  const quizDocRef = doc(quizzesCollectionRef, quizId);
  const docSnap = await getDoc(quizDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as LiveQuizData;
  }
  console.log(`Live Quiz with ID ${quizId} not found in 'liveQuizzes' collection.`);
  return null;
};

export const deleteLiveQuizFromFirestore = async (quizId: string): Promise<void> => {
  const quizDocRef = doc(quizzesCollectionRef, quizId);
  await deleteDoc(quizDocRef);
  console.log(`Live Quiz with ID ${quizId} deleted from 'liveQuizzes' collection.`);
};

export const getAllLiveQuizzesFromFirestore = async (): Promise<LiveQuizData[]> => {
  try {
    const q = query(quizzesCollectionRef, where('type', '==', 'live'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<LiveQuizData, 'details'> & { details: { id?: string } }; 
      return {
        ...data,
        details: { ...data.details, id: doc.id },
      } as LiveQuizData;
    });
  } catch (error) {
    console.error("Error fetching all live quizzes from 'liveQuizzes' collection: ", error);
    return [];
  }

};

export const getAllUnarchivedLiveQuizzesFromFirestore = async (): Promise<LiveQuizData[]> => {
  try {
    const q = query(
      quizzesCollectionRef,
      where('type', '==', 'live'), // First filter by type = live
      where('archive', '==', false) // Then filter by isArchived = false
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<LiveQuizData, 'details'> & { details: { id?: string } }; 
      return {
        ...data,
        details: { ...data.details, id: doc.id }, // Ensure the quiz ID from the document is used
      } as LiveQuizData;
    });
  } catch (error) {
    console.error("Error fetching all unarchived live quizzes: ", error);
    return [];
  }
};

export const toggleLiveQuizArchiveStatus = async (quizId: string): Promise<void> => {
  const quizDocRef = doc(quizzesCollectionRef, quizId);
  
  // First get the current archive status
  const docSnap = await getDoc(quizDocRef);
  if (!docSnap.exists()) {
    throw new Error(`Live Quiz with ID ${quizId} not found`);
  }
  
  const currentData = docSnap.data() as LiveQuizData;
  console.log('current data', currentData)
  const newArchiveStatus = !currentData.archive;
  
  // Update the archive status
  await updateDoc(quizDocRef, {
    'archive': newArchiveStatus,
    updatedAt: serverTimestamp()
  });
  
  console.log(`Live Quiz ${quizId} archive status toggled to ${newArchiveStatus}`);
};


export const getFirstUnarchivedLiveQuizFromFirestore = async (): Promise<LiveQuizData | null> => {
  try {
    // Create a query to find the first unarchived live quiz
    const q = query(quizzesCollectionRef, where('archive', '==', false));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      const data = firstDoc.data() as Omit<LiveQuizData, 'details'> & { details: { id?: string } };
      return {
        ...data,
        details: { ...data.details, id: firstDoc.id },
      } as LiveQuizData;
    }
    
    console.log('No unarchived live quizzes found.');
    return null;
  } catch (error) {
    console.error('Error fetching first unarchived live quiz: ', error);
    return null;
  }
};
