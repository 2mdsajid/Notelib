import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Clock, Tag, GraduationCap, Book, Share2, ArrowLeft, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
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

const TestingNoteDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);  // Scroll to top when component mounts or slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  useEffect(() => {
    const fetchNote = async () => {
      try {
        // Clean the slug by removing any extra suffixes like '/preview'
        const cleanSlug = slug?.split('/')[0] || '';
        console.log('Original slug:', slug);
        console.log('Clean slug:', cleanSlug);
        
        // Find the notes data array from the JSON structure
        const notesArray = notesData.find(item => item.type === 'table' && item.name === 'notes')?.data || [];
        
        // Filter only visible notes and find by slug
        const visibleNotes = notesArray.filter((note: any) => note.visibility === 'true') as Note[];
        
        // Find note by slug (format: class-11-chapter-name or class-12-chapter-name)
        const foundNote = visibleNotes.find(note => {
          const noteSlug = createSlug(note.faculty, note.chapterName);
          console.log('Comparing:', noteSlug, 'vs', cleanSlug);
          return noteSlug === cleanSlug;
        });
        
        if (foundNote) {
          console.log('Found note:', foundNote);
          setNote(foundNote);
        } else {
          console.log('No note found for slug:', cleanSlug);
          console.log('Available slugs:', visibleNotes.map(note => createSlug(note.faculty, note.chapterName)));
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  // Create slug function to match the format
  const createSlug = (faculty: string, chapterName: string) => {
    const gradeNumber = faculty.toLowerCase().includes('11') ? '11' : '12';
    return `class-${gradeNumber}-${chapterName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleViewNote = () => {
    if (note) {
      // Convert Google Drive view link to direct view link
      const fileId = note.driveLink.match(/\/d\/(.+?)\//)?.[1];
      if (fileId) {
        const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
        window.open(viewLink, '_blank');
      }
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Physics': 'bg-blue-100 text-blue-800',
      'Chemistry': 'bg-green-100 text-green-800',
      'Mathematics': 'bg-purple-100 text-purple-800',
      'Computer': 'bg-orange-100 text-orange-800',
      'Biology': 'bg-emerald-100 text-emerald-800',
    };
    return colors[subject.trim()] || 'bg-gray-100 text-gray-800';
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading note details...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note Not Found</h2>
          <p className="text-gray-600 mb-4">The note you're looking for doesn't exist.</p>
          <button                onClick={() => navigate('/notes')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </button>
        </div>
      </div>
    );
  }
  // Convert Google Drive link to direct PDF URL for iframe
  const pdfUrl = note.driveLink
    .replace('/view?usp=sharing', '/preview')
    .replace('/view', '/preview')
    .replace('/edit?usp=sharing', '/preview')
    .replace('/edit', '/preview');

  return (
    <>
      <Helmet>
        <title>{`${note.chapterName} - ${note.subjectName} | Testing Note Library`}</title>
        <meta name="description" content={`Study notes for ${note.chapterName} in ${note.subjectName} for ${note.faculty}`} />
        <meta name="keywords" content={`${note.faculty}, ${note.subjectName}, ${note.chapterName}, study notes, education`} />
      </Helmet>      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <button                onClick={() => navigate('/notes')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Notes
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {note.faculty.trim()}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(note.subjectName)}`}>
                    <Book className="w-4 h-4 mr-1" />
                    {note.subjectName.trim()}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    <Tag className="w-4 h-4 mr-1" />
                    {note.chapter.trim()}
                  </span>
                </div>

                {/* Title and Actions */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {note.chapterName.trim()}
                    </h1>
                    <p className="text-lg text-gray-600">
                      {note.subjectName.trim()} • {note.faculty.trim()}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Share note"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                    
                    <button
                      onClick={handleViewNote}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open in Drive
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    Comprehensive study notes for <strong>{note.chapterName.trim()}</strong> in {note.subjectName.trim()}. 
                    These notes are designed for {note.faculty.trim()} students and cover all essential topics and concepts.
                  </p>
                </div>

                {/* PDF Viewer */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Note Preview</span>
                    </div>
                    <a
                      href={note.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                  
                  <div className="h-[800px] bg-gray-100">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full"
                      allow="autoplay"
                      title={`${note.chapterName} - ${note.subjectName}`}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">About This Note</h3>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p><strong>Subject:</strong> {note.subjectName.trim()}</p>
                    <p><strong>Chapter:</strong> {note.chapter.trim()} - {note.chapterName.trim()}</p>
                    <p><strong>Grade:</strong> {note.faculty.trim()}</p>
                    <p><strong>Format:</strong> PDF Document</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestingNoteDetail;
