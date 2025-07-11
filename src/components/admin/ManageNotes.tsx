import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';
import NoteFormModal from './NoteFormModal';

interface Note {
  id: string;
  title: string;
  subject: string;
  grade: string;
  driveLink: string;
  createdAt?: any;
  updatedAt?: any;
}

// Main Component
const ManageNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Fetch all notes from Firestore
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const notesCollection = collection(db, 'notes');
      const notesSnapshot = await getDocs(notesCollection);
      const notesList = notesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Note));
      
      // Sort by createdAt desc (newest first)
      notesList.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      setNotes(notesList);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to fetch notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new note
  const handleAddNote = async (noteData: Omit<Note, 'id'>) => {
    try {
      setLoading(true);
      const notesCollection = collection(db, 'notes');
      // Add timestamps
      const noteWithTimestamps = {
        ...noteData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      await addDoc(notesCollection, noteWithTimestamps);
      setIsFormModalOpen(false);
      
      // Refresh notes list
      await fetchNotes();
      setStatusMessage({text: 'Note added successfully!', type: 'success'});
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
      setStatusMessage({text: 'Failed to add note. Please try again.', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  // Handle updating an existing note
  const handleUpdateNote = async (noteData: Omit<Note, 'id'>) => {
    if (!editingNote) return;
    
    try {
      setLoading(true);
      // Update with new timestamp
      const noteWithTimestamp = {
        ...noteData,
        updatedAt: serverTimestamp()
      };
      
      // Update in Firestore
      const noteRef = doc(db, 'notes', editingNote.id);
      await updateDoc(noteRef, noteWithTimestamp);
      
      setIsFormModalOpen(false);
      setEditingNote(null);
      
      // Refresh notes list
      await fetchNotes();
      setStatusMessage({text: 'Note updated successfully!', type: 'success'});
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
      setStatusMessage({text: 'Failed to update note. Please try again.', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  // Handle note form submission (add or edit)
  const handleSubmitNoteForm = (noteData: Omit<Note, 'id'>) => {
    if (editingNote) {
      handleUpdateNote(noteData);
    } else {
      handleAddNote(noteData);
    }
  };

  // Open edit form with note data
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsFormModalOpen(true);
  };

  // Open confirmation dialog for deletion
  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
    setIsConfirmDeleteOpen(true);
  };

  // Delete note from Firestore
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      setLoading(true);
      const noteRef = doc(db, 'notes', noteToDelete.id);
      await deleteDoc(noteRef);
      
      // Update local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete.id));
      setIsConfirmDeleteOpen(false);
      setNoteToDelete(null);
      setStatusMessage({text: 'Note deleted successfully!', type: 'success'});
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
      setStatusMessage({text: 'Failed to delete note. Please try again.', type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Notes</h1>
        <button 
          onClick={() => {
            setEditingNote(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Note
        </button>
      </div>
      
      {statusMessage && (
        <div 
          className={`mb-6 p-4 rounded-md ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {statusMessage.text}
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md" role="alert">
          {error}
        </div>
      )}
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title, subject, or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drive Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-sm text-gray-500">Loading notes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 whitespace-nowrap text-sm text-gray-500 text-center">
                    {searchTerm 
                      ? 'No notes match your search criteria.' 
                      : 'No notes found. Please add a new note.'
                    }
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{note.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{note.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{note.grade}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={note.driveLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        View Note <ExternalLink className="ml-1 w-4 h-4" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-4">
                        <button 
                          onClick={() => handleEdit(note)} 
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(note)} 
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleSubmitNoteForm}
        note={editingNote}
        title={editingNote ? "Edit Note" : "Add New Note"}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setNoteToDelete(null);
        }}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmButtonText="Delete"
      />
    </div>
  );
};

export default ManageNotes;