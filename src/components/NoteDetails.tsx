import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExternalLink, Clock, Tag, GraduationCap, Book, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  description: string;
  driveLink: string;
  tags: string[];
  slug: string;
  grade: string;
  subject: string;
  createdAt: any;
}

const NoteDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const notesQuery = query(collection(db, 'notes'), where('slug', '==', slug));
        const snapshot = await getDocs(notesQuery);
        
        if (!snapshot.empty) {
          const noteData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          } as Note;
          setNote(noteData);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note Not Found</h2>
          <p className="text-gray-600">The note you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(note.createdAt.seconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Convert Google Drive link to direct PDF URL
  const pdfUrl = note.driveLink.replace('/view?usp=sharing', '/preview');

  return (
    <>
      <Helmet>
        <title>{`${note.title} | Note Library`}</title>
        <meta name="description" content={note.description} />
        <meta name="keywords" content={`Grade ${note.grade}, ${note.subject}${note.tags && Array.isArray(note.tags) && note.tags.length > 0 ? ', ' + note.tags.join(', ') : ''}, NEB notes, IOE entrance, CEE entrance`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    Grade {note.grade}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    <Book className="w-4 h-4 mr-1" />
                    {note.subject}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Clock className="w-4 h-4 mr-1" />
                    {formattedDate}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {note.title}
                  </h1>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Share note"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>

                <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: note.description }} />

                <div className="flex items-center gap-2 mb-8">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {note.tags && Array.isArray(note.tags) && note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <a
                    href={note.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open in Google Drive
                  </a>
                </div>

                <div className="border rounded-lg overflow-hidden h-[800px]">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoteDetails;