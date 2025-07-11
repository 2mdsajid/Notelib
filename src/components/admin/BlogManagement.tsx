import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash, Search, Filter } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import BlogForm from './BlogForm';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  slug: string;
  status: string;
  createdAt: any;
  updatedAt: any;
}

const BlogManagement = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(blogsQuery);
      const blogsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Blog[];
      setBlogs(blogsList);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'blogs', isEditing), formData);
        toast.success('Blog updated successfully');
      } else {
        await addDoc(collection(db, 'blogs'), formData);
        toast.success('Blog created successfully');
      }

      setIsCreating(false);
      setIsEditing(null);
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteDoc(doc(db, 'blogs', id));
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        console.error('Error deleting blog:', error);
        toast.error('Failed to delete blog');
      }
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setIsEditing(blog.id);
    setIsCreating(true);
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Blog Posts</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {isCreating ? 'Cancel' : 'Create Blog Post'}
        </button>
      </div>

      {isCreating && (
        <BlogForm
          initialData={editingBlog}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsCreating(false);
            setIsEditing(null);
            setEditingBlog(null);
          }}
          isEditing={!!isEditing}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ml-2 w-full px-3 py-2 border-none focus:ring-0"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No blog posts found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                    <div className="text-sm text-gray-500">{blog.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      blog.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(blog.createdAt.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Edit blog"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete blog"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;