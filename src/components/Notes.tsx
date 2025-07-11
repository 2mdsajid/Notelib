// import removed: useState, useEffect, useRef (duplicate)
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

// PromotionalCarousel is now imported from its own file
import { FileText, ExternalLink, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const Notes = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const NOTES_PER_SECTION = 4;

  // Filter and process notes data
  const processedNotes = (() => {
    // Find the data array in the JSON structure
    const tableData = notesData.find((item: any) => item.type === 'table' && item.name === 'notes');
    const rawNotes = tableData?.data || [];
    
    return rawNotes
      .filter((item: any) => 
        item.visibility === 'true' && 
        item.chapterName && 
        item.faculty && 
        item.subjectName &&
        item.driveLink
      )
      .map((item: any) => ({
        id: item.id,
        chapter: item.chapter || '',
        chapterName: item.chapterName,
        faculty: item.faculty,
        driveLink: item.driveLink,
        visibility: item.visibility,
        image: item.image,
        subjectName: item.subjectName.trim(),
      }));
  })();

  // Group notes by subject
  const notesBySubject = processedNotes.reduce((acc: { [key: string]: Note[] }, note) => {
    const subject = note.subjectName;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(note);
    return acc;
  }, {});

  // Create sections with mixed subjects for variety
  const createSections = () => {
    const sections: Note[][] = [];
    const subjects = Object.keys(notesBySubject);
    let currentIndex = 0;

    while (currentIndex < processedNotes.length) {
      const section: Note[] = [];
      
      // Mix notes from different subjects for variety
      for (let i = 0; i < NOTES_PER_SECTION && currentIndex < processedNotes.length; i++) {
        const subjectIndex = (currentIndex + i) % subjects.length;
        const subject = subjects[subjectIndex];
        const subjectNotes = notesBySubject[subject];
        const noteIndex = Math.floor((currentIndex + i) / subjects.length) % subjectNotes.length;
        
        if (subjectNotes[noteIndex]) {
          section.push(subjectNotes[noteIndex]);
        }
      }
      
      if (section.length > 0) {
        sections.push(section);
        currentIndex += NOTES_PER_SECTION;
      } else {
        break;
      }
    }
    
    return sections;
  };

  const sections = createSections();
  const totalSections = sections.length;

  // Create slug for routing
  const createSlug = (grade: string, chapterName: string) => {
    const gradeNum = grade.replace(/\D/g, '');
    const slug = chapterName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
      .trim();
    return `class-${gradeNum}-${slug}`;
  };

  // Convert Google Drive link for preview
  const convertDriveLink = (url: string) => {
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return url;
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Function to change section with smooth morphing animation
  const changeSection = (newSection: number) => {
    if (newSection === currentSection || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentSection(newSection);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 800);
  };

  // Navigation functions
  const goToNextSection = () => {
    const nextSection = (currentSection + 1) % totalSections;
    changeSection(nextSection);
  };

  const goToPrevSection = () => {
    const prevSection = currentSection === 0 ? totalSections - 1 : currentSection - 1;
    changeSection(prevSection);
  };



  return (
    <section id="notes" className="py-16 md:py-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Study <span className="text-amber-500">Notes Library</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Comprehensive study materials for Grades 11 & 12. Experience the continuous flow of knowledge!
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full shadow-sm">
              {currentSection + 1} of {totalSections} collections
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevSection}
                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all duration-300 transform hover:scale-110"
                title="Previous collection"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextSection}
                className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all duration-300 transform hover:scale-110"
                title="Next collection"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


        {/* Notes Grid */}
        <div className="relative overflow-hidden">
          {/* Static background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-blue-50/20"></div>
          
          <div className={`transition-all duration-700 ease-in-out transform ${
            isTransitioning ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
              {sections[currentSection]?.map((note, index) => (
                <div
                  key={`${currentSection}-${note.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group transform hover:scale-105"

                >
                  {/* Note Header with Icon */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-blue-400 group-hover:text-blue-600 transition-colors duration-300" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-blue-800 text-xs font-medium rounded-full shadow-sm">
                        {note.faculty.replace('Class ', 'Grade ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Subject Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-300 ${getSubjectColor(note.subjectName)}`}>
                        {note.subjectName}
                      </span>
                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {note.chapter}
                      </span>
                    </div>

                    {/* Chapter Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-all duration-300">
                      {note.chapterName}
                    </h3>

                    {/* Action Buttons */}
                    <div className="flex gap-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                      <Link
                        to={`/testing-notes/${createSlug(note.faculty, note.chapterName)}`}
                        className="flex-1 inline-flex items-center justify-center text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Details
                      </Link>
                      <a
                        href={convertDriveLink(note.driveLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium transform hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View PDF
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browse All Link */}
        <div className="text-center mt-12">
          <Link
            to="/notes"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Browse All Notes ({processedNotes.length} total)
          </Link>
        </div>
      </div>
    </section>
  );

  // Helper function for subject colors
  function getSubjectColor(subject: string) {
    const colors: { [key: string]: string } = {
      'Physics': 'bg-blue-100 text-blue-800',
      'Chemistry': 'bg-green-100 text-green-800',
      'Mathematics': 'bg-purple-100 text-purple-800',
      'Computer': 'bg-orange-100 text-orange-800',
      'Biology': 'bg-emerald-100 text-emerald-800',
      'Account': 'bg-yellow-100 text-yellow-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Result': 'bg-red-100 text-red-800',
    };
    return colors[subject.trim()] || 'bg-gray-100 text-gray-800';
  }
}

export default Notes;