import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase'; 
import { Pencil, Trash2, PlusCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BlogForm from './BlogForm';

interface Blog {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  slug: string;
  status: 'published' | 'draft';
  createdAt: any;
  updatedAt?: any;
}

const ManageBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const blogsCollection = collection(db, 'blogs');
      const blogSnapshot = await getDocs(blogsCollection);
      const blogsList = blogSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Blog[];
      setBlogs(blogsList);
    } catch (error) {
      console.error("Error fetching blogs: ", error);
      toast.error('Failed to fetch blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDeleteBlog = async (blogId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteDoc(doc(db, 'blogs', blogId));
        setBlogs(blogs.filter(blog => blog.id !== blogId));
        toast.success('Blog post deleted successfully!');
      } catch (error) {
        console.error("Error deleting blog: ", error);
        toast.error('Failed to delete blog post.');
      }
    }
  };

  const handleOpenFormModal = (blog?: Blog) => {
    setEditingBlog(blog || null);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setEditingBlog(null);
    setShowFormModal(false);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingBlog) {
        // Update existing blog
        const blogRef = doc(db, 'blogs', editingBlog.id);
        await updateDoc(blogRef, { ...formData, updatedAt: serverTimestamp() });
        toast.success('Blog post updated successfully!');
      } else {
        
        await addDoc(collection(db, 'blogs'), { ...formData, author: 'Admin', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast.success('Blog post added successfully!');
      }
      fetchBlogs();
      handleCloseFormModal();
    } catch (error) {
      console.error("Error submitting form: ", error);
      toast.error('Failed to save blog post.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Manage Blogs</h2>
        <button
          onClick={() => handleOpenFormModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Add New Blog
        </button>
      </div>

      {blogs.length === 0 && !loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600 text-lg">No blog posts found. Start by adding a new one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{blog.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {blog.createdAt?.seconds ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenFormModal(blog)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 transition duration-150 ease-in-out"
                      title="Edit Blog"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
                      title="Delete Blog"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                        {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                    </h3>
                    <button onClick={handleCloseFormModal} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <BlogForm
                initialData={editingBlog}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseFormModal}
                isEditing={!!editingBlog}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBlogs;
