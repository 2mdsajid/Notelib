import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  slug: string;
  createdAt: any;
}

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const blogsQuery = query(
          collection(db, 'blogs'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(blogsQuery);
        const blogsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Blog[];
        setBlogs(blogsList);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog | Note Library</title>
        <meta name="description" content="Read our latest articles about education, study tips, and exam preparation." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
              Latest from Our <span className="text-amber-500">Blog</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Insights, tips, and strategies to help you excel in your academic journey.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/blogs/${blog.slug}`}>
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(blog.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <Link to={`/blogs/${blog.slug}`}>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/blogs/${blog.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Blogs;