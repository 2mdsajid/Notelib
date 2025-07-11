import React, { useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill'; // Import Quill
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css'; // Import custom Quill editor styles
// @ts-ignore
import Table from 'quill/modules/table'; // Import table module

// Register table module with Quill
Quill.register({
  'modules/table': Table,
});

import { Save, X } from 'lucide-react';
import { slugify } from '../../utils/helpers';

interface BlogFormProps {
  initialData?: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const BlogForm: React.FC<BlogFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: '',
    slug: '',
    status: 'published'
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        excerpt: initialData.excerpt || '',
        coverImage: initialData.coverImage || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        slug: initialData.slug || '',
        status: initialData.status || 'published'
      });
    }
  }, [initialData, isEditing]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      ['table'] // Add table button to toolbar
    ],
    table: true, // Re-enable default table module
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'title') {
        newData.slug = slugify(value);
      }
      return newData;
    });
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: isEditing ? initialData.createdAt : new Date(),
      updatedAt: new Date()
    };
    onSubmit(processedData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image URL
          </label>
          <input
            type="url"
            name="coverImage"
            value={formData.coverImage}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="h-96">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              modules={modules}
              className="h-72"
            />
          </div>
        </div>

        <div className="mt-20">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Education, Tips, Study"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isEditing ? 'Update Blog Post' : 'Publish Blog Post'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;