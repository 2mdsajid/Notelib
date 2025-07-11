import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase'; // Adjust path as needed
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
// Removed Link import as we are no longer navigating to a separate page for blog details
// import { Link } from 'react-router-dom'; 

interface Blog {
  id: string;
  title: string;
  slug: string; // To link to the blog post details page
  content: string; // Full content from Firestore
  excerpt: string; // A short summary of the blog
  imageUrl?: string; // Optional cover image
  authorName: string;
  publishedAt: Timestamp;
  // Add other blog fields as necessary (e.g., tags, category)
}

// Function to generate an excerpt from HTML content
const createExcerpt = (htmlContent: string, maxLength: number = 100): string => {
  if (!htmlContent) return 'No summary available.';
  // Strip HTML tags
  const textContent = htmlContent.replace(/<[^>]+>/g, '');
  if (textContent.length <= maxLength) {
    return textContent;
  }
  return textContent.substring(0, maxLength).trim() + '...';
};

const StudentBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null); // State for selected blog

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const blogsCollectionRef = collection(db, 'blogs');
        // Fetch without server-side ordering first to check if data is retrieved
        const q = query(blogsCollectionRef); 
        
        const querySnapshot = await getDocs(q);
        const fetchedBlogs: Blog[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure publishedAt is a Timestamp, otherwise provide a default or handle error
          let publishedAtTimestamp = data.publishedAt;
          if (!(data.publishedAt instanceof Timestamp)) {
            // If it's not a Timestamp (e.g., undefined or wrong type),
            // you might want to log this or use a default.
            // For sorting, documents without a valid publishedAt might be problematic.
            console.warn(`Document ${doc.id} has invalid or missing publishedAt. Using current time as fallback.`);
            publishedAtTimestamp = Timestamp.now(); 
          }

          fetchedBlogs.push({
            id: doc.id,
            title: data.title || 'Untitled Blog',
            slug: data.slug || doc.id,
            content: data.content || '', // Store full content
            excerpt: createExcerpt(data.content), // Generate excerpt from content
            imageUrl: data.imageUrl,
            authorName: data.authorName || 'Note Library',
            publishedAt: publishedAtTimestamp,
          } as Blog);
        });
        
        // Client-side sorting
        fetchedBlogs.sort((a, b) => {
          if (a.publishedAt && b.publishedAt) {
            return b.publishedAt.toMillis() - a.publishedAt.toMillis(); // Newest first
          }
          return 0; // Keep order if timestamps are problematic
        });
        
        setBlogs(fetchedBlogs);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("Failed to load blogs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []); // No dependency on currentUser if blogs are public

  const handleBlogSelect = (blog: Blog) => {
    setSelectedBlog(blog);
  };

  const handleBackToList = () => {
    setSelectedBlog(null);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading blogs...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (selectedBlog) {
    // Display selected blog details
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
          <button 
            onClick={handleBackToList} 
            className="mb-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
          >
            &larr; Back to Blogs
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{selectedBlog.title}</h1>
          {selectedBlog.imageUrl && (
            <img src={selectedBlog.imageUrl} alt={selectedBlog.title} className="w-full h-auto max-h-96 object-cover rounded-lg mb-6 shadow-lg" />
          )}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span>By {selectedBlog.authorName}</span>
            <span className="mx-2">|</span>
            <span>{selectedBlog.publishedAt?.toDate().toLocaleDateString()}</span>
          </div>
          {/* Render HTML content safely */}
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
          />
        </div>
      </div>
    );
  }

  // Display list of blogs
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Explore Our Blogs</h1>
          <p className="mt-2 text-lg text-gray-600">Stay updated with the latest articles and insights.</p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12 bg-white shadow-lg rounded-xl">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No blogs published yet</h3>
            <p className="mt-2 text-md text-gray-500">
              Check back soon for interesting articles and updates!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              // Changed Link to div with onClick handler
              <div 
                key={blog.id} 
                onClick={() => handleBlogSelect(blog)} 
                className="group bg-white shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                {blog.imageUrl && (
                  <div className="h-48 w-full overflow-hidden">
                    <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-purple-700 mb-3 group-hover:text-purple-800 transition-colors duration-200">{blog.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed h-20 overflow-hidden text-ellipsis">{blog.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {blog.authorName}</span>
                    <span>{blog.publishedAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBlogs;
