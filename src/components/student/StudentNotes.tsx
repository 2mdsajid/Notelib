import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase'; // Still needed for user profile
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Added doc, getDoc. Timestamp for interface.
import { useAuth } from '../../contexts/AuthContext';
import notesDataJson from '../../notes.json'; // Import notes.json
import { ExternalLink, Tag, GraduationCap, Book, ArrowLeft, Folder, FolderOpen, ChevronRight, BookOpen } from 'lucide-react'; 
import { Toaster } from 'react-hot-toast'; 

interface Note {
  id: string;
  title: string;
  content: string;
  driveLink?: string;
  grade?: string;
  subject?: string;
  createdAt?: Timestamp; // Made optional
  tags?: string;         // Made optional
}

const StudentNotes: React.FC = () => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNotesAndUserData = async () => {
      setLoading(true);
      setError(null);
      setNotes([]); // Clear previous notes

      if (!currentUser || !currentUser.uid) {
        setError("Please log in to view notes.");
        setLoading(false);
        return;
      }

      let userStandard: string | undefined;
      let userExamType: string | undefined;

      try {
        console.log("Fetching user profile for UID:", currentUser.uid);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userStandard = userData.currentStandard;
          userExamType = userData.examType;
          console.log("User profile fetched:", { userStandard, userExamType });
        } else {
          setError("User profile not found. Please complete your profile.");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(`Failed to load user profile: ${err.message}`);
        setLoading(false);
        return;
      }

      if (!userStandard) {
        setError("Your 'current standard' is not set in your profile. Cannot filter notes.");
        setLoading(false);
        return;
      }
      
      // Load notes from JSON
      // The actual notes array is nested in the JSON structure
      const notesTable = notesDataJson.find(item => typeof item === 'object' && item !== null && (item as any).type === "table" && (item as any).name === "notes");
      const rawNotes = notesTable && Array.isArray((notesTable as any).data) ? (notesTable as any).data : [];

      if (!rawNotes.length) {
          console.error("Notes data is not in expected format or is empty:", notesDataJson);
          setError("Failed to load notes data: Invalid format or empty.");
          setLoading(false);
          return;
      }
      
      console.log(`Loaded ${rawNotes.length} raw notes from JSON.`);

      let processedNotes: Note[] = rawNotes.map((n: any, index: number) => ({
        id: n.id || `note-${index}-${Date.now()}`, // Ensure unique ID
        title: n.chapterName || n.chapter || 'Untitled Note',
        content: n.chapterName || '', 
        driveLink: n.driveLink,
        grade: n.faculty ? String(n.faculty).trim() : undefined,
        subject: n.subjectName ? String(n.subjectName).trim() : undefined,
      }));      
      // Filter notes to show BOTH regular class notes (based on user standard) AND competitive exam notes (based on exam type)
      let finalFilteredNotes: Note[] = [];
      
      // Step 1: Add regular class notes based on user's current standard
      if (userStandard === "11") {
        const classNotes = processedNotes.filter(note => note.grade === "Class 11");
        finalFilteredNotes.push(...classNotes);
        console.log(`Added ${classNotes.length} Class 11 notes for standard '${userStandard}'`);
      } else if (userStandard === "12") {
        const classNotes = processedNotes.filter(note => note.grade === "Class 12");
        finalFilteredNotes.push(...classNotes);
        console.log(`Added ${classNotes.length} Class 12 notes for standard '${userStandard}'`);
      } else if (userStandard === "Pass out") {
        const allClassNotes = processedNotes.filter(note => 
          note.grade === "Class 11" || note.grade === "Class 12"
        );
        finalFilteredNotes.push(...allClassNotes);
        console.log(`Added ${allClassNotes.length} Class 11/12 notes for 'Pass out' standard`);
      }

      // Step 2: Add competitive exam notes based on user's exam type
      if (userExamType === "IOE") {
        const ioeNotes = processedNotes.filter(note => note.grade === "IOE");
        finalFilteredNotes.push(...ioeNotes);
        console.log(`Added ${ioeNotes.length} IOE notes for exam type '${userExamType}'`);
      } else if (userExamType === "CEE") {
        const ceeNotes = processedNotes.filter(note => note.grade === "CEE");
        finalFilteredNotes.push(...ceeNotes);
        console.log(`Added ${ceeNotes.length} CEE notes for exam type '${userExamType}'`);
      }

      console.log(`Total filtered notes (standard: '${userStandard}', exam: '${userExamType}'): ${finalFilteredNotes.length}`);
      
      setNotes(finalFilteredNotes);
      setLoading(false);
      console.log("Finished loading and filtering notes from JSON.");
    };

    loadNotesAndUserData();
  }, [currentUser]); // db is stable, currentUser is the main trigger

  const filteredNotes = notes.filter(note => {
    const searchTermLower = searchTerm.toLowerCase();
    // Ensure note fields are strings before calling toLowerCase
    const titleMatch = (note.title || '').toLowerCase().includes(searchTermLower);
    const subjectMatch = (note.subject || '').toLowerCase().includes(searchTermLower);
    const gradeMatch = (note.grade || '').toLowerCase().includes(searchTermLower);
    const tagsMatch = String(note.tags || '').toLowerCase().includes(searchTermLower); // Ensure tags is a string
    return titleMatch || subjectMatch || gradeMatch || tagsMatch;
  });

  // Organize notes by grade and subject
  const organizedNotes = React.useMemo(() => {
    const organization: { [grade: string]: { [subject: string]: Note[] } } = {};
    
    filteredNotes.forEach(note => {
      const grade = note.grade?.trim() || 'Unknown Grade';
      const subject = note.subject?.trim() || 'Unknown Subject';
      
      if (!organization[grade]) {
        organization[grade] = {};
      }
      if (!organization[grade][subject]) {
        organization[grade][subject] = [];
      }
      organization[grade][subject].push(note);
    });
    
    return organization;
  }, [filteredNotes]);

  const toggleGrade = (grade: string) => {
    if (expandedGrades.has(grade)) {
      // If clicking on already open grade, close it
      const newExpanded = new Set<string>();
      setExpandedGrades(newExpanded);
      
      // Also collapse all subjects in this grade
      const subjectsToCollapse = Object.keys(organizedNotes[grade] || {});
      const newExpandedSubjects = new Set(expandedSubjects);
      subjectsToCollapse.forEach(subject => {
        newExpandedSubjects.delete(`${grade}-${subject}`);
      });
      setExpandedSubjects(newExpandedSubjects);
    } else {
      // Close all other grades and open only this one
      const newExpanded = new Set<string>([grade]);
      setExpandedGrades(newExpanded);
      
      // Close all subjects from other grades
      const allGrades = Object.keys(organizedNotes);
      const newExpandedSubjects = new Set(expandedSubjects);
      
      allGrades.forEach(g => {
        if (g !== grade) {
          const subjectsToCollapse = Object.keys(organizedNotes[g] || {});
          subjectsToCollapse.forEach(subject => {
            newExpandedSubjects.delete(`${g}-${subject}`);
          });
        }
      });
      
      setExpandedSubjects(newExpandedSubjects);
    }
  };

  const toggleSubject = (grade: string, subject: string) => {
    const key = `${grade}-${subject}`;
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubjects(newExpanded);
  };
  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Physics': 'bg-blue-100 text-blue-800 border-blue-200',
      'Chemistry': 'bg-green-100 text-green-800 border-green-200',
      'Mathematics': 'bg-purple-100 text-purple-800 border-purple-200',
      'Computer': 'bg-orange-100 text-orange-800 border-orange-200',
      'Biology': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Zoology': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Botany': 'bg-green-100 text-green-800 border-green-200',
      'Nepali': 'bg-red-100 text-red-800 border-red-200',
      'English': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Social': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Account': 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[subject.trim()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedNote(null); // Clear selected note when searching
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
  };

  const handleBackToList = () => {
    setSelectedNote(null);
  };
  // Note sharing functionality removed as requested

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading your notes...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  // Display error more prominently if it occurs
  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Notes</h2>
        <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>
        <p className="mt-4 text-sm text-gray-600">Please check the console for more details and try refreshing the page.</p>
      </div>
    );
  }
  // Display Selected Note Details (similar to NoteDetails.tsx)
  if (selectedNote) {
    // Date formatting removed as requested
    const pdfUrl = selectedNote.driveLink ? selectedNote.driveLink.replace('/view?usp=sharing', '/preview').replace('/view','/preview') : '';

    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="p-6 md:p-8">
              <button 
                onClick={handleBackToList} 
                className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Notes
              </button>

              <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">                {selectedNote.grade && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-100 text-blue-800">
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Grade {selectedNote.grade}
                  </span>
                )}
                {selectedNote.subject && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-amber-100 text-amber-800">
                    <Book className="w-4 h-4 mr-1.5" />
                    {selectedNote.subject}
                  </span>
                )}
              </div>              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-0">
                  {selectedNote.title}
                </h1>
              </div>

              <div className="prose prose-sm sm:prose-base max-w-none mb-6 md:mb-8 text-gray-700" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />

              {selectedNote.tags && (
                <div className="flex items-center gap-2 mb-6 md:mb-8">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs md:text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNote.driveLink && (
                <div className="mb-6 md:mb-8">
                  <a
                    href={selectedNote.driveLink.replace('/preview', '/view')} // Ensure this link is for direct access if needed
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium"
                  >
                    <ExternalLink className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Open in Google Drive
                  </a>
                </div>
              )}
              
              {pdfUrl && (
                <div className="border rounded-lg overflow-hidden h-[600px] md:h-[800px] bg-gray-200">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    allow="autoplay"
                    title={`${selectedNote.title} PDF Preview`}
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Display Notes List with Search
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Available Notes</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{notes.length}</div>
              <div className="text-sm text-gray-600">Total Notes</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {Array.from(new Set(notes.map(note => note.subject).filter(Boolean))).length}
              </div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Array.from(new Set(notes.map(note => note.grade).filter(Boolean))).length}
              </div>
              <div className="text-sm text-gray-600">Grades</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">{filteredNotes.length}</div>
              <div className="text-sm text-gray-600">Filtered Results</div>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by title, subject, grade, or tags..."
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>          {filteredNotes.length === 0 && !loading ? ( 
            <div className="text-center py-10 bg-white shadow-md rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {searchTerm ? 'No notes match your search' : (notes.length === 0 && !error ? 'No notes match your current filter criteria' : (error ? 'Error loading notes' : 'No notes found'))}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : (notes.length === 0 && !error ? 'Please check your profile settings for grade/exam type or try different search terms.' : (error ? error : 'Please check your search or filter criteria.'))}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {Object.entries(organizedNotes).map(([grade, subjects]) => (
                <div key={grade} className="border-b last:border-b-0">
                  {/* Grade Folder */}
                  <div
                    onClick={() => toggleGrade(grade)}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedGrades.has(grade) ? 'rotate-90' : ''
                      }`} 
                    />
                    {expandedGrades.has(grade) ? (
                      <FolderOpen className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Folder className="w-6 h-6 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{grade}</h3>
                      <p className="text-sm text-gray-500">
                        {Object.keys(subjects).length} subjects • {
                          Object.values(subjects).reduce((total, notes) => total + notes.length, 0)
                        } notes
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {Object.values(subjects).reduce((total, notes) => total + notes.length, 0)}
                    </span>
                  </div>

                  {/* Subjects in Grade */}
                  {expandedGrades.has(grade) && (
                    <div className="pl-8 pb-2">
                      {Object.entries(subjects).map(([subject, notes]) => (
                        <div key={`${grade}-${subject}`} className="border-l-2 border-gray-200 ml-2">
                          {/* Subject Folder */}
                          <div
                            onClick={() => toggleSubject(grade, subject)}
                            className="flex items-center gap-4 p-4 ml-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
                          >
                            <ChevronRight 
                              className={`w-4 h-4 text-gray-500 transition-transform ${
                                expandedSubjects.has(`${grade}-${subject}`) ? 'rotate-90' : ''
                              }`} 
                            />
                            {expandedSubjects.has(`${grade}-${subject}`) ? (
                              <FolderOpen className="w-5 h-5 text-green-600" />
                            ) : (
                              <Folder className="w-5 h-5 text-green-600" />
                            )}
                            <div className="flex-1">
                              <h4 className="text-md font-medium text-gray-800 mb-1">{subject}</h4>
                              <p className="text-xs text-gray-500">{notes.length} notes available</p>
                            </div>
                            <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getSubjectColor(subject)}`}>
                              {notes.length}
                            </span>
                          </div>

                          {/* Notes in Subject */}
                          {expandedSubjects.has(`${grade}-${subject}`) && (
                            <div className="ml-12 space-y-2 pb-3">
                              {notes.map((note) => (
                                <div
                                  key={note.id}
                                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 truncate mb-1">
                                      {note.title || 'Untitled Note'}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {note.subject} • {note.grade}
                                    </p>
                                  </div>
                                  <div className="flex gap-3 flex-shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNoteSelect(note);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                                      title="View detailed note page"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Detail
                                    </button>
                                    {note.driveLink && (
                                      <a
                                        href={note.driveLink.replace('/preview', '/view')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                                        title="Open note in Google Drive"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Open
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentNotes;
