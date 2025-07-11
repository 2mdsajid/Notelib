import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill'; // Added
import 'react-quill/dist/quill.snow.css'; // Added

interface Note {
  id: string;
  title: string;
  subject: string;
  grade: string;
  driveLink: string;
  description: string; // Added
  tags: string; // Added (will be comma-separated string)
  slug: string; // Added
  createdAt?: any;
  updatedAt?: any;
}

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: Omit<Note, 'id'>) => void;
  note?: Note | null;
  title: string;
}

const NoteFormModal: React.FC<NoteFormModalProps> = ({ isOpen, onClose, onSubmit, note, title }) => {
  const [formData, setFormData] = useState<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    subject: '',
    grade: '',
    driveLink: '',
    description: '', // Added
    tags: '', // Added
    slug: '' // Added
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customSubjectVisible, setCustomSubjectVisible] = useState(false);

  // ReactQuill modules and formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link'
  ];

  // Grade options
  const gradeOptions = ['11', '12', 'IOE', 'CEE'];
  
  // Subject options based on grade
  const gradeSubjects: Record<string, string[]> = {
    '11': [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'Nepali',
      'Social Studies'
    ],
    '12': [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'Nepali',
      'Social Studies'
    ],
    'IOE': ['Custom'],
    'CEE': ['Custom']
  };

  // Reset form when note changes or modal opens/closes
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        subject: note.subject,
        grade: note.grade,
        driveLink: note.driveLink,
        description: note.description || '', // Added
        tags: note.tags || '', // Added
        slug: note.slug || '' // Added
      });
      
      // Check if we need to show custom subject field
      if (note.grade === 'IOE' || note.grade === 'CEE') {
        setCustomSubjectVisible(true);
      } else {
        setCustomSubjectVisible(false);
      }
    } else {
      setFormData({
        title: '',
        subject: '',
        grade: '',
        driveLink: '',
        description: '', // Added
        tags: '', // Added
        slug: '' // Added
      });
      setCustomSubjectVisible(false);
    }
    setErrors({});
  }, [note, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for grade changes to update subject options
    if (name === 'grade') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Reset subject when grade changes
        subject: ''
      }));
      
      // Determine if we should show custom subject field
      setCustomSubjectVisible(value === 'IOE' || value === 'CEE');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      description: content
    }));
    // Clear error when field is edited
    if (errors.description) {
      setErrors(prev => ({
        ...prev,
        description: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.description.trim()) { // Added
      newErrors.description = 'Description is required';
    }

    if (!formData.tags.trim()) { // Added
      newErrors.tags = 'Tags are required';
    }

    if (!formData.slug.trim()) { // Added
      newErrors.slug = 'URL Slug is required';
    }
    
    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }
    
    if (!formData.driveLink.trim()) {
      newErrors.driveLink = 'Drive Link is required';
    } else if (!formData.driveLink.startsWith('https://')) {
      newErrors.driveLink = 'Please enter a valid URL starting with https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"> {/* Increased max-width here */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
              <button
                type="button"
                className="rounded-md p-1 hover:bg-gray-200 transition-colors"
                onClick={onClose}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6"> {/* Increased space-y here */}
                {/* Title Field */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>
                
                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    modules={modules}
                    formats={formats}
                    className={`mt-1 h-38 ${errors.description ? 'ql-error' : ''}`} // Changed h-64 to h-52
                    placeholder="Enter a description for the note"
                  />
                  {/* Basic styling for error state on ReactQuill */}
                  <style>{`.ql-error .ql-toolbar, .ql-error .ql-container { border-color: red !important; }`}</style>
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>

                {/* Grade and Subject Fields - Side by Side */}
                <div className="flex space-x-4">
                  {/* Grade Selection Field */}
                  <div className="w-1/2">
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
                    <select
                      name="grade"
                      id="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.grade ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select grade</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
                  </div>
                  
                  {/* Subject Field */}
                  <div className="w-1/2">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    {!customSubjectVisible ? (
                      // Dropdown for grades 11 and 12
                      <select
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={!formData.grade}
                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.subject ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select subject</option>
                        {formData.grade && 
                          gradeSubjects[formData.grade]?.map(subject => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))
                        }
                      </select>
                    ) : (
                      // Text input for IOE and CEE
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Enter subject name"
                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.subject ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                  </div>
                </div>
                
                {/* Tags Field */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.tags ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., NEB, Physics, Mechanics"
                  />
                  {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
                </div>

                {/* URL Slug Field */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">URL Slug</label>
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., grade-12-physics-mechanics"
                  />
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>
                
                {/* Drive Link Field */}
                <div>
                  <label htmlFor="driveLink" className="block text-sm font-medium text-gray-700">Drive Link</label>
                  <input
                    type="url"
                    name="driveLink"
                    id="driveLink"
                    value={formData.driveLink}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.driveLink ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://drive.google.com/..."
                  />
                  {errors.driveLink && <p className="mt-1 text-sm text-red-600">{errors.driveLink}</p>}
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteFormModal;
