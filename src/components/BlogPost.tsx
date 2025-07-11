import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, Tag, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

interface Blog {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  tags: string[];
  createdAt: any;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const blogsQuery = query(
          collection(db, 'blogs'),
          where('slug', '==', slug),
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(blogsQuery);
        
        if (!snapshot.empty) {
          const blogData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          } as Blog;
          setBlog(blogData);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
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

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog Post Not Found</h2>
          <p className="text-gray-600">The blog post you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${blog.title} | Note Library Blog`}</title>
        <meta name="description" content={blog.content.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-24">
        <article className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-[400px] object-cover"
              />
              
              <div className="p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-5 h-5 mr-2" />
                    {new Date(blog.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Share blog post"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {blog.title}
                </h1>

                <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: blog.content }} />

                <div className="flex items-center gap-2 pt-6 border-t">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;