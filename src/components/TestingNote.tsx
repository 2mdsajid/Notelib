import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, Search, Eye, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import notesData from '../notes.json';

interface Note {
  id: string;
  chapter: string;
  chapterName: string;
  faculty: string;
  driveLink: string;
  visibility: string;
  image: string;
  subjectName: string;
}

const TestingNote: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Create slug function to match the format used in detail component
  const createSlug = (faculty: string, chapterName: string) => {
    const gradeNumber = faculty.toLowerCase().includes('11') ? '11' : '12';
    return `class-${gradeNumber}-${chapterName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}`;
  };

  // Extract notes data from the imported JSON
  useEffect(() => {
    try {
      // Find the notes data array from the JSON structure
      const notesArray = notesData.find(item => item.type === 'table' && item.name === 'notes')?.data || [];
      
      // Filter only visible notes and cast to Note type
      const visibleNotes = notesArray.filter((note: any) => note.visibility === 'true') as Note[];
      
      setNotes(visibleNotes);
      setFilteredNotes(visibleNotes);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading notes:', error);
      setIsLoading(false);
    }
  }, []);  // Get unique subjects and grades for stats
  const subjects = ['All', ...Array.from(new Set(notes.map(note => note.subjectName.trim())))];
  const grades = ['All', ...Array.from(new Set(notes.map(note => note.faculty.trim())))];

  // Organize notes by grade and subject
  const organizedNotes = React.useMemo(() => {
    const organization: { [grade: string]: { [subject: string]: Note[] } } = {};
    
    filteredNotes.forEach(note => {
      const grade = note.faculty.trim();
      const subject = note.subjectName.trim();
      
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
    // Instead of toggling, we're replacing the entire set
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
  };  // Filter notes based on search term
  useEffect(() => {
    let filtered = [...notes];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.chapterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  }, [notes, searchTerm]);
  const handleNoteClick = (driveLink: string) => {
    // Convert Google Drive view link to direct download link
    const fileId = driveLink.match(/\/d\/(.+?)\//)?.[1];
    if (fileId) {
      const downloadLink = `https://drive.google.com/file/d/${fileId}/view`;
      window.open(downloadLink, '_blank');
    }
  };
  const handleViewDetail = (note: Note) => {
    const slug = createSlug(note.faculty, note.chapterName);
    console.log('Generated slug:', slug);
    console.log('Note data:', { faculty: note.faculty, chapterName: note.chapterName });
    navigate(`/testing-notes/${slug}`);
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Physics': 'bg-blue-100 text-blue-800 border-blue-200',
      'Chemistry': 'bg-green-100 text-green-800 border-green-200',
      'Mathematics': 'bg-purple-100 text-purple-800 border-purple-200',
      'Computer': 'bg-orange-100 text-orange-800 border-orange-200',
      'Biology': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[subject.trim()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading notes...</p>
        </div>
      </div>
    );
  }
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Testing Note Library
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore comprehensive study notes for Class 11 & 12 across multiple subjects. 
            Access high-quality educational content to excel in your studies.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
            <div className="text-sm text-gray-600">Total Notes</div>
          </div>          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{subjects.length - 1}</div>
            <div className="text-sm text-gray-600">Subjects</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{grades.length - 1}</div>
            <div className="text-sm text-gray-600">Grades</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{filteredNotes.length}</div>
            <div className="text-sm text-gray-600">Search Results</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes by chapter, subject..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>        {/* Content Area */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {Object.entries(organizedNotes).map(([grade, subjects]) => (
              <div key={grade} className="border-b last:border-b-0">
                {/* Grade Folder */}
                <div
                  onClick={() => toggleGrade(grade)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
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
                    <h3 className="text-lg font-semibold text-gray-900">{grade}</h3>
                    <p className="text-sm text-gray-500">
                      {Object.keys(subjects).length} subjects • {
                        Object.values(subjects).reduce((total, notes) => total + notes.length, 0)
                      } notes
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
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
                          className="flex items-center gap-3 p-3 ml-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
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
                            <h4 className="text-md font-medium text-gray-800">{subject}</h4>
                            <p className="text-xs text-gray-500">{notes.length} notes available</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(subject)}`}>
                            {notes.length}
                          </span>
                        </div>

                        {/* Notes in Subject */}
                        {expandedSubjects.has(`${grade}-${subject}`) && (
                          <div className="ml-12 space-y-2 pb-3">
                            {notes.map((note) => (
                              <div
                                key={note.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {note.chapterName.trim()}
                                  </h5>
                                  <p className="text-xs text-gray-500">
                                    Chapter {note.chapter.trim()}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetail(note);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                                    title="View detailed note page"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Detail
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNoteClick(note.driveLink);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                                    title="Open note in Google Drive"
                                  >
                                    <Download className="w-3 h-3" />
                                    Open
                                  </button>
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
          </div>        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Displaying {filteredNotes.length} of {notes.length} available notes</p>
        </div>
      </div>
    </div>
  );
};

export default TestingNote;
