import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, onSnapshot, getDoc, increment, Timestamp, getDocs, QueryDocumentSnapshot, writeBatch, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Share2, TrendingUp, Plus, Pin, Trash2, Crown, Bell, Search, Eye, EyeOff, Send, MessageSquare, X, CheckCircle, AlertCircle, Loader, Copy, Mail, MessageCircle } from 'lucide-react';
import ImageUpload from './ImageUpload';

// Helper function for relative time formatting
export function formatRelativeTime(timestamp: any): string {
  if (!timestamp || !timestamp.toDate) {
    return 'Just now';
  }
  const date = timestamp.toDate();
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);

  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return `${weeks} weeks ago`;
}

interface PostAuthor {
  uid: string;
  name: string;
  avatar: string; // Will store the first letter of the name
  role: string;
}

// Define the Post interface
interface Post {
  id: string;
  title: string;
  content: string;
  author: PostAuthor;
  comments: number; // This will be the count of comments
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  category: string;
  isPinned: boolean;
  isHidden: boolean;
  images?: string[]; // Array of image URLs
}

// Define the Comment interface
interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  text: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEditing?: boolean; // For UI state
  images?: string[]; // Array of image URLs
}

// Define the Notification interface
interface Notification {
  id: string;
  userId: string; // User to whom the notification belongs
  message: string;
  type: 'comment' | 'vote' | 'announcement' | 'mention' | 'reply';
  relatedPostId?: string;
  relatedCommentId?: string;
  isRead: boolean;
  createdAt: Timestamp;
  fromUser?: { // Optional: Information about the user who triggered the notification
    uid: string;
    name: string;
    avatar: string;  };
}

// Helper function to delete image from server
const deleteImageFromServer = async (imageUrl: string) => {
  try {
    const response = await fetch('https://notelibraryapp.com/delete.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('Image deleted from server successfully');
      } else {
        console.error('Failed to delete image from server:', result.error);
      }
    } else {
      console.error('Failed to delete image from server');
    }
  } catch (error) {
    console.error('Error deleting image from server:', error);
  }
};

// Move CreatePostForm outside to prevent re-creation on every render
const CreatePostForm = React.memo(({ 
  newPostData, 
  setNewPostData, 
  formErrors, 
  setFormErrors, 
  postCreationError, 
  setPostCreationError, 
  postCreationSuccess, 
  isCreatingPost, 
  handleCreatePost, 
  setShowNewPostForm, 
  setActiveTab,
  userName, 
  userRole, 
  categories,
  theme
}: {
  newPostData: { title: string; content: string; category: string; images: string[] };
  setNewPostData: React.Dispatch<React.SetStateAction<{ title: string; content: string; category: string; images: string[] }>>;
  formErrors: { title: string; content: string };
  setFormErrors: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  postCreationError: string | null;
  setPostCreationError: React.Dispatch<React.SetStateAction<string | null>>;
  postCreationSuccess: boolean;
  isCreatingPost: boolean;
  handleCreatePost: () => Promise<void>;
  setShowNewPostForm: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  userName: string;
  userRole: string;
  categories: string[];
  theme: 'light' | 'dark';
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const draftLoadedRef = useRef(false);
  // Auto-save draft functionality
  useEffect(() => {
    // Don't auto-save immediately after loading draft
    if (!draftLoadedRef.current) return;
    
    const saveDraft = () => {
      if (newPostData.title.trim() || newPostData.content.trim()) {
        localStorage.setItem('postDraft', JSON.stringify(newPostData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    };

    const timer = setTimeout(saveDraft, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timer);
  }, [newPostData]);
  // Load draft on component mount (only once)
  useEffect(() => {
    if (!draftLoadedRef.current) {
      const savedDraft = localStorage.getItem('postDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setNewPostData(draft);
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
      draftLoadedRef.current = true;
    }
  }, []); // Run only once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPostData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general errors
    if (postCreationError) {
      setPostCreationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreatePost();
  };
  const handleCancel = () => {
    // Ask user if they want to save draft before canceling
    if (newPostData.title.trim() || newPostData.content.trim() || newPostData.images.length > 0) {
      const shouldSaveDraft = window.confirm("Do you want to save your draft before leaving?");
      if (!shouldSaveDraft) {
        localStorage.removeItem('postDraft');
      }    }
    
    setNewPostData({ title: '', content: '', category: 'General', images: [] });
    setFormErrors({ title: '', content: '' });
    setPostCreationError(null);
    setShowNewPostForm(false);
    setActiveTab('home');
  };  // Image upload handlers
  const handleImageUploaded = (imageUrl: string) => {
    setNewPostData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
  };

  const handleImageRemoved = async (imageUrl: string) => {
    // Delete from server
    await deleteImageFromServer(imageUrl);
    
    // Remove from frontend state
    setNewPostData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const titleLength = newPostData.title.length;
  const contentLength = newPostData.content.length;
  const maxTitleLength = 100;
  const maxContentLength = 5000;
  return (
    <div className={`${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } rounded-xl shadow-lg border overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Create New Post</h3>
              <p className="text-sm md:text-base text-blue-100">Share your knowledge with the community</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Success Message */}
      {postCreationSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 m-6 mb-0 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 font-medium">Post created successfully! Redirecting...</p>
          </div>
        </div>
      )}      {/* Error Message */}
      {postCreationError && (
        <div className={`${
          theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-400'
        } border-l-4 p-4 m-6 mb-0 rounded-lg`}>
          <div className="flex items-center">
            <AlertCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'} mr-3`} />
            <p className={`${theme === 'dark' ? 'text-red-300' : 'text-red-700'} font-medium`}>{postCreationError}</p>
          </div>
        </div>
      )}

      {/* Draft saved indicator */}
      {isDraftSaved && (
        <div className={`${
          theme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-400'
        } border-l-4 p-2 m-6 mb-0 rounded-lg`}>
          <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} text-sm`}>Draft saved automatically</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6">
        <div className="space-y-6">          {/* Category Selection */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Category
            </label>
            <div className="relative">
              <select
                name="category"
                value={newPostData.category}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Title <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${titleLength > maxTitleLength ? 'text-red-500' : titleLength > maxTitleLength * 0.8 ? 'text-yellow-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                {titleLength}/{maxTitleLength}
              </span>
            </div>            <input
              type="text"
              name="title"
              placeholder="Enter an engaging title for your post..."
              value={newPostData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                formErrors.title 
                  ? theme === 'dark' ? 'border-red-500 bg-red-900/20' : 'border-red-300 bg-red-50'
                  : theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              maxLength={maxTitleLength}
            />
            {formErrors.title && (
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} flex items-center`}>
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.title}
              </p>
            )}
          </div>
            <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Content <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <span className={`text-xs ${contentLength > maxContentLength ? 'text-red-500' : contentLength > maxContentLength * 0.8 ? 'text-yellow-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                  {contentLength}/{maxContentLength}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium`}
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>
            
            {showPreview ? (
              <div className={`w-full min-h-[120px] px-4 py-3 border rounded-lg ${
                theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap">
                  {newPostData.content || <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} italic`}>Preview will appear here...</span>}
                </div>
              </div>
            ) : (
              <textarea
                name="content"
                placeholder="Share your thoughts, knowledge, or questions with the community..."
                rows={6}
                value={newPostData.content}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                  formErrors.content 
                    ? theme === 'dark' ? 'border-red-500 bg-red-900/20' : 'border-red-300 bg-red-50'
                    : theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                }`}
                maxLength={maxContentLength}
              />
            )}
              {formErrors.content && (
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} flex items-center`}>
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.content}
              </p>
            )}
          </div>

          {/* Image Upload Section */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Images (Optional)
            </label>
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              uploadedImages={newPostData.images}
              maxImages={3}
              theme={theme}
              className="w-full"
            />
          </div>
        </div>{/* Action Buttons */}
        <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Posting as <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{userName}</span>
            </span>
            {userRole === 'admin' && (
              <div className="flex items-center space-x-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-yellow-600 font-medium">Admin</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCreatingPost}
              className={`px-6 py-2.5 font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark' 
                  ? 'text-gray-300 border-gray-600 hover:bg-gray-700 focus:ring-gray-500' 
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isCreatingPost || !newPostData.title.trim() || !newPostData.content.trim()}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
            >
              {isCreatingPost ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </>
              )}
            </button>
          </div>        </div>
      </form>
    </div>
  );
});

interface CommunityAppProps {
  standalone?: boolean;
}

const CommunityApp: React.FC<CommunityAppProps> = ({ standalone }) => {
  const { currentUser } = useAuth(); // Get current user from AuthContext
  const { theme } = useTheme(); // Get theme context

  const [userRole, setUserRole] = useState('student'); // Default to student, updated from currentUser
  const [userName, setUserName] = useState('Guest');
  const [userAvatar, setUserAvatar] = useState('G'); // Default avatar

  type TabType = 'home' | 'create' | 'notifications';
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [posts, setPosts] = useState<Post[]>([]); // Use Post interface
  const [isLoadingPostsState, setIsLoadingPostsState] = useState(true); // Renamed to avoid conflict if 'isLoadingPosts' is used elsewhere or intended for a different purpose
  const [newPostData, setNewPostData] = useState({ title: '', content: '', category: 'General', images: [] as string[] });
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postCreationError, setPostCreationError] = useState<string | null>(null);
  const [postCreationSuccess, setPostCreationSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({ title: '', content: '' });
  const [filterTerm, setFilterTerm] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const categories = ['General', 'Study Tips', 'Announcements', 'Study Groups', 'Q&A', 'Resources'];

  // Function to handle tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Function to handle navigation to home
  const navigateToHome = () => {
    handleTabChange('home');
  };

  // Function to handle navigation to create
  const navigateToCreate = () => {
    if (currentUser) {
      handleTabChange('create');
      setShowNewPostForm(true);
    } else {
      handleTabChange('home');
    }
  };

  // Function to handle navigation to notifications
  const navigateToNotifications = () => {
    handleTabChange('notifications');
    markNotificationsAsRead();
  };

  // Function to mark notifications as read
  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.uid),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Function to check if a tab is restricted
  const isRestrictedTab = (tab: TabType): boolean => {
    return tab === 'create' || tab === 'notifications';
  };

  // Update the useEffect to use the type guard
  useEffect(() => {
    if (isRestrictedTab(activeTab as TabType) && !currentUser) {
      setShowNewPostForm(false);
      navigateToHome();
    }
  }, [activeTab, currentUser]);

  // Update the success handler to use the new navigation function
  const handlePostSuccess = () => {
    setPostCreationSuccess(false);
    setShowNewPostForm(false);
    navigateToHome();
  };

  // Function to validate form data
  const validatePostData = useCallback(() => {
    const errors = { title: '', content: '' };
    let isValid = true;

    if (!newPostData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (newPostData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
      isValid = false;
    } else if (newPostData.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    if (!newPostData.content.trim()) {
      errors.content = 'Content is required';
      isValid = false;
    } else if (newPostData.content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters long';
      isValid = false;
    } else if (newPostData.content.trim().length > 5000) {
      errors.content = 'Content must be less than 5000 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;  }, [newPostData.title, newPostData.content]);

  // Function to create a new post
  const handleCreatePost = useCallback(async () => {
    if (!currentUser) {
      setPostCreationError("You must be logged in to create a post.");
      return;
    }

    // Clear previous states
    setPostCreationError(null);
    setPostCreationSuccess(false);

    // Validate form
    if (!validatePostData()) {
      return;
    }

    setIsCreatingPost(true);

    const author: PostAuthor = {
      uid: currentUser.uid,
      name: userName,
      avatar: userAvatar,
      role: userRole,
    };

    try {
      await addDoc(collection(db, 'communityPosts'), {
        ...newPostData,
        author,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPinned: false,
        isHidden: false,
        images: newPostData.images.length > 0 ? newPostData.images : undefined, // Only include images if there are any
      });

      // Success handling
      setNewPostData({ title: '', content: '', category: 'General', images: [] });
      setFormErrors({ title: '', content: '' });
      setPostCreationSuccess(true);
      
      // Clear draft from localStorage
      localStorage.removeItem('postDraft');
      
      // Auto-hide success message and redirect
      setTimeout(handlePostSuccess, 2000);
      
    } catch (error) {
      console.error("Error creating post: ", error);
      setPostCreationError("Failed to create post. Please try again.");
    } finally {
      setIsCreatingPost(false);
    }
  }, [currentUser, userName, userAvatar, userRole, newPostData, validatePostData]);

  // Admin functions
  const togglePin = async (postId: string) => {
    if (userRole !== 'admin') return;
    const postRef = doc(db, 'communityPosts', postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;
    try {
      await updateDoc(postRef, { 
        isPinned: !currentPost.isPinned,
        updatedAt: serverTimestamp() // Ensure server timestamp is sent
      });
    } catch (error) {
      console.error("Error toggling pin status: ", error);
    }
  };

  const toggleHide = async (postId: string) => {
    if (userRole !== 'admin') return;
    const postRef = doc(db, 'communityPosts', postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;
    try {
      await updateDoc(postRef, { 
        isHidden: !currentPost.isHidden,
        updatedAt: serverTimestamp() // Ensure server timestamp is sent
      });
    } catch (error) {
      console.error("Error toggling hide status: ", error);
    }
  };
  const deletePost = async (postId: string) => {
    if (userRole !== 'admin') return;
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    try {
      // First, get the post data to access images
      const postRef = doc(db, 'communityPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const postData = postDoc.data();
        
        // Delete images from server if they exist
        if (postData.images && postData.images.length > 0) {
          for (const imageUrl of postData.images) {
            await deleteImageFromServer(imageUrl);
          }
        }
        
        // Get and delete comment images as well
        const commentsQuery = query(collection(db, "communityPosts", postId, "comments"));
        const commentsSnap = await getDocs(commentsQuery);
        
        for (const commentDoc of commentsSnap.docs) {
          const commentData = commentDoc.data();
          if (commentData.images && commentData.images.length > 0) {
            for (const imageUrl of commentData.images) {
              await deleteImageFromServer(imageUrl);
            }
          }
        }
        
        // Delete comments (for better cleanup)
        const batch = writeBatch(db);
        commentsSnap.forEach(commentDoc => batch.delete(commentDoc.ref));
        await batch.commit();
      }
      
      // Finally, delete the post document
      await deleteDoc(postRef);
      
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };
  useEffect(() => {
    if (currentUser) {
      const name = currentUser.displayName || 'User';
      setUserName(name); 
      setUserAvatar(name.charAt(0).toUpperCase() || 'U');

      const userDocRef = doc(db, 'users', currentUser.uid);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role || 'student'); 
            // If admin, set userName to 'Admin'
            if (userData.role === 'admin') {
              setUserName('Admin');
            }
          } else {
            console.log("No such user document! Using default role.");
            setUserRole('student'); 
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setUserRole('student');
        });
    } else {
      setUserName('Guest');
      setUserAvatar('G');
      setUserRole('student');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'create' && !showNewPostForm && currentUser) {
      // No need to set activeTab here as it's handled by specific useEffects
    }
    if (showNewPostForm && activeTab !== 'create') {
      setShowNewPostForm(false);
    }
  }, [activeTab, showNewPostForm, currentUser]);

  useEffect(() => {
    if (activeTab === 'create' && !currentUser) {
      setShowNewPostForm(false);
      setActiveTab('home' as TabType);
    }
  }, [activeTab, currentUser]);

  // Fetch posts from Firestore
  useEffect(() => {
    setIsLoadingPostsState(true);
    const q = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => { // Added type for doc
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setIsLoadingPostsState(false);
    }, (error) => {
      console.error("Error fetching posts: ", error);
      setIsLoadingPostsState(false);
    });

    return () => unsubscribe(); 
  }, []);

  // Fetch notifications for the current user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    const notificationsRef = collection(db, 'userNotifications', currentUser.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: Notification[] = [];
      let unreadCount = 0;
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        const notif = { id: doc.id, ...doc.data() } as Notification;
        fetchedNotifications.push(notif);
        if (!notif.isRead) {
          unreadCount++;
        }
      });
      setNotifications(fetchedNotifications);
      setUnreadNotificationCount(unreadCount);
      setIsLoadingNotifications(false);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
      setIsLoadingNotifications(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Function to fetch comments for a post
  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    const commentsColRef = collection(db, 'communityPosts', postId, 'comments');
    const q = query(commentsColRef, orderBy('createdAt', 'asc'));
    // Removed 'as any' and used getDocs directly
    const querySnapshot = await getDocs(q);
    const commentsData: Comment[] = [];
    querySnapshot.forEach((doc: QueryDocumentSnapshot) => { // Added type for doc
        commentsData.push({ id: doc.id, ...doc.data(), isEditing: false } as Comment);
    });
    return commentsData;
  }, []); // Added useCallback with empty dependency array as it doesn't depend on component state directly  // Function to add a comment
  const submitComment = async (postId: string, text: string, postAuthorUid: string, images: string[] = []) => {
    if (!currentUser || (!text.trim() && images.length === 0)) return false;

    const commentAuthor: PostAuthor = {
        uid: currentUser.uid,
        name: userName, 
        avatar: userAvatar, 
        role: userRole, 
    };

    try {
        const commentsColRef = collection(db, 'communityPosts', postId, 'comments');        const commentData: any = {
            postId: postId,
            author: commentAuthor,
            text: text.trim() || '', // Allow empty text if there are images
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        // Only include images if there are any
        if (images.length > 0) {
            commentData.images = images;
        }
        
        const newCommentRef = await addDoc(commentsColRef, commentData);

        const postRef = doc(db, 'communityPosts', postId);
        await updateDoc(postRef, {
            comments: increment(1),
            updatedAt: serverTimestamp(),
        });

        // Basic notification for the post author (if not self-commenting)
        if (currentUser.uid !== postAuthorUid) {
          const notificationMessage = `${userName} commented on your post.`;
          const userNotifRef = collection(db, 'userNotifications', postAuthorUid, 'notifications');
          await addDoc(userNotifRef, {
            userId: postAuthorUid,
            message: notificationMessage,
            type: 'comment', // or 'reply' if it's a reply to another comment
            relatedPostId: postId,
            relatedCommentId: newCommentRef.id,
            isRead: false,
            createdAt: serverTimestamp(),
            fromUser: {
              uid: currentUser.uid,
              name: userName,
              avatar: userAvatar,
            }
          } as Omit<Notification, 'id'>);
        }

        return true; 
    } catch (error) {
        console.error("Error submitting comment: ", error);
        return false;
    }
  };
  // Function to delete a comment
  const deleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    // Add permission check if needed (e.g., only author or admin can delete)
    try {
      // First, get the comment data to access images
      const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (commentDoc.exists()) {
        const commentData = commentDoc.data();
        
        // Delete images from server if they exist
        if (commentData.images && commentData.images.length > 0) {
          for (const imageUrl of commentData.images) {
            await deleteImageFromServer(imageUrl);
          }
        }
      }
      
      // Delete the comment document
      await deleteDoc(commentRef);

      // Update post comment count
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        comments: increment(-1),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting comment: ", error);
      return false;
    }
  };
  // Function to update a comment
  const updateComment = async (postId: string, commentId: string, newText: string) => {
    if (!currentUser) return false;
    try {
      const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        text: newText.trim() || '', // Allow empty text
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating comment: ", error);
      return false;
    }
  };
  const handleShare = async (post: Post) => {
    setSharePost(post);
    setShowShareModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy link');
    }
  };

  const shareToEmail = (post: Post) => {
    const shareUrl = window.location.href.split('?')[0].split('#')[0] + `#post-${post.id}`;
    const subject = encodeURIComponent(`Check out this post: ${post.title}`);
    const body = encodeURIComponent(`${post.title}\n\nCheck out this post on Note Library!\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareToWhatsApp = (post: Post) => {
    const shareUrl = window.location.href.split('?')[0].split('#')[0] + `#post-${post.id}`;
    const text = encodeURIComponent(`${post.title}\n\nCheck out this post on Note Library!\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareToMessenger = (post: Post) => {
    const shareUrl = window.location.href.split('?')[0].split('#')[0] + `#post-${post.id}`;
    const text = encodeURIComponent(`${post.title} - Check out this post on Note Library!`);
    window.open(`https://www.messenger.com/new/?link=${encodeURIComponent(shareUrl)}&text=${text}`);
  };

  const shareToTwitter = (post: Post) => {
    const shareUrl = window.location.href.split('?')[0].split('#')[0] + `#post-${post.id}`;
    const text = encodeURIComponent(`${post.title} - Check out this post on Note Library! ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  const shareToLinkedIn = (post: Post) => {
    const shareUrl = window.location.href.split('?')[0].split('#')[0] + `#post-${post.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
  };

  const filteredPosts = posts
    .filter(post => {
      if (userRole !== 'admin' && post.isHidden) return false; 
      if (filterTerm === 'pinned') return post.isPinned;
      if (filterTerm === 'hidden' && userRole === 'admin') return post.isHidden;
      if (filterTerm === 'my-posts' && currentUser) return post.author.uid === currentUser.uid;
      return true; 
    })
    .filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Pinned posts always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // If both are pinned or both are not pinned, sort by creation date (newest first)
      if (a.createdAt?.toDate && b.createdAt?.toDate) {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
      // Fallback if timestamps are missing (should not happen with serverTimestamp)
      return 0; 
    });
  const Sidebar = () => (
    <div className={`w-64 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r h-screen sticky top-0 overflow-y-auto hidden md:block`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Note Library</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Learn Together</p>
          </div>
        </div>
        {currentUser && (
          <div className="mb-6">
            <div className={`flex items-center space-x-3 p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-semibold">
                {userAvatar} 
              </div>
              <div className="flex-1">
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userRole === 'admin' ? 'Admin' : userName}</p>
                <div className="flex items-center space-x-2">
                  {userRole === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{userRole}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="space-y-2">
          {[
            { id: 'home' as TabType, label: 'Home', icon: TrendingUp, action: navigateToHome },
            // Only show Create Post if user is authenticated
            ...(currentUser ? [{ 
              id: 'create' as TabType, 
              label: 'Create Post', 
              icon: Plus, 
              action: navigateToCreate,
              isSpecial: true
            }] : []),
            { 
              id: 'notifications' as TabType, 
              label: 'Notifications', 
              icon: Bell, 
              badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined, 
              action: navigateToNotifications
            }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => item.action()}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 relative ${
                item.isSpecial 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md' 
                  : activeTab === item.id 
                    ? theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.isSpecial ? 'text-white' : ''}`} />
              <span className={`font-medium ${item.isSpecial ? 'text-white' : ''}`}>{item.label}</span>
              {item.badge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-8">
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide mb-3`}>Categories</h3>
          <div className="space-y-1">
            {categories.map(category => {
              const categoryCount = posts.filter(post => post.category === category && (!post.isHidden || userRole === 'admin')).length;
              return (
                <button
                  key={category}
                  onClick={() => { /* Implement category filtering if needed */ }}
                  className={`flex items-center justify-between w-full text-left text-sm ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  } px-2 py-1 rounded transition-colors group`}
                >
                  <span>{category}</span>
                  <span className={`text-xs ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-400 group-hover:bg-blue-900 group-hover:text-blue-300' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                  } px-1.5 py-0.5 rounded-full transition-colors`}>
                    {categoryCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
  const PostCard = ({ post, deleteImageFromServer }: { post: Post; deleteImageFromServer: (imageUrl: string) => Promise<void> }) => {
    const authorAvatarDisplay = post.author.name ? post.author.name.charAt(0).toUpperCase() : (post.author.avatar || 'U');
    
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [newCommentImages, setNewCommentImages] = useState<string[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [errorComments, setErrorComments] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');
    const [editingCommentImages, setEditingCommentImages] = useState<string[]>([]);

    const handleToggleComments = async () => {
      setShowComments(!showComments);
      if (!showComments && commentsList.length === 0) { // Fetch only if opening and comments not loaded
        setIsLoadingComments(true);
        setErrorComments(null);
        try {
          const fetchedComments = await fetchComments(post.id);
          setCommentsList(fetchedComments);
        } catch (err) {
          console.error("Error fetching comments for post card: ", err);
          setErrorComments('Failed to load comments.');
        } finally {
          setIsLoadingComments(false);
        }
      }    };    const handlePostComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!newCommentText.trim() && newCommentImages.length === 0) || !currentUser) return;
      
      const success = await submitComment(post.id, newCommentText, post.author.uid, newCommentImages);
      if (success) {
        setNewCommentText('');
        setNewCommentImages([]);
        // Optimistically add comment or re-fetch
        // For simplicity, we can re-fetch if comments are already shown
        if (showComments) {
          setIsLoadingComments(true);
          try {
            const fetchedComments = await fetchComments(post.id);
            setCommentsList(fetchedComments);
          } catch (err) {
            console.error("Error re-fetching comments: ", err);
          } finally {
            setIsLoadingComments(false);
          }
        }
      }
    };

    const handleDeleteComment = async (commentId: string) => {
      if (!window.confirm("Are you sure you want to delete this comment?")) return;
      const success = await deleteComment(post.id, commentId);
      if (success && showComments) {
        setCommentsList(prev => prev.filter(c => c.id !== commentId));
      }
    };

    const handleEditComment = (comment: Comment) => {
      setEditingCommentId(comment.id);
      setEditingCommentText(comment.text);
    };    const handleSaveEditComment = async (commentId: string) => {
      // Allow saving if there's text or if the original comment had images (since we don't support editing images yet)
      const originalComment = commentsList.find(c => c.id === commentId);
      if (!editingCommentText.trim() && (!originalComment?.images || originalComment.images.length === 0)) return;
      
      const success = await updateComment(post.id, commentId, editingCommentText);
      if (success) {
        setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, text: editingCommentText, isEditing: false } : c));
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    };    const handleCancelEditComment = () => {
      setEditingCommentId(null);
      setEditingCommentText('');
    };

    // Comment image upload handlers
    const handleCommentImageUploaded = (imageUrl: string) => {
      setNewCommentImages(prev => [...prev, imageUrl]);
    };    const handleCommentImageRemoved = async (imageUrl: string) => {
      // Delete from server
      await deleteImageFromServer(imageUrl);
      
      // Remove from frontend state
      setNewCommentImages(prev => prev.filter(img => img !== imageUrl));
    };return (
      <div id={`post-${post.id}`} className={`${
        theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
      } rounded-lg border transition-all duration-200 ${post.isPinned ? 'ring-2 ring-blue-200' : ''} ${
        post.isHidden && userRole === 'admin' ? 'opacity-60' : ''
      }`}>
        {post.isPinned && (
          <div className={`${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'} px-3 md:px-4 py-2 flex items-center space-x-2 rounded-t-lg`}>
            <Pin className="w-4 h-4 text-blue-600" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Pinned Post</span>
          </div>
        )}
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xl font-semibold">
                {authorAvatarDisplay}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{post.author.role === 'admin' ? 'Admin' : post.author.name}</p>
                  {post.author.role === 'admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {post.author.role}
                  </span>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatRelativeTime(post.createdAt)} • {post.category}
                </p>
              </div>
            </div>
            
            {userRole === 'admin' && (
              <div className="flex items-center space-x-2 mt-3 md:mt-0">
                <button
                  onClick={() => togglePin(post.id)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${post.isPinned ? 'text-blue-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  title={post.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleHide(post.id)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${post.isHidden ? 'text-red-600' : theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  title={post.isHidden ? 'Unhide' : 'Hide'}
                >
                  {post.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} hover:text-red-600`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <h2 className={`text-lg md:text-xl font-bold ${
            theme === 'dark' ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
          } mb-3 cursor-pointer`}>
            {post.title}
          </h2>          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          } mb-4 leading-relaxed whitespace-pre-wrap text-sm md:text-base`}>{post.content}</p>
          
          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className={`mt-4 grid gap-4 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-w-16 aspect-h-9">
                  <img 
                    src={image} 
                    alt={`Post image ${index + 1}`} 
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                    onClick={() => window.open(image, '_blank')}
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleToggleComments}
                className={`flex items-center space-x-2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'
                } cursor-pointer transition-colors p-1 rounded`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">{post.comments} Comments</span>
              </button>
              
              <button 
                onClick={() => handleShare(post)} 
                className={`flex items-center space-x-2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-600'
                } cursor-pointer transition-colors p-1 rounded`}
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>
            
            {post.isHidden && userRole === 'admin' && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Hidden</span>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className={`border-t px-4 md:px-6 py-4 ${
            theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <h4 className={`text-md font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Comments ({commentsList.length})</h4>
            {isLoadingComments && <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading comments...</p>}
            {errorComments && <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errorComments}</p>}
            {!isLoadingComments && !errorComments && commentsList.length === 0 && (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No comments yet. Be the first to comment!</p>
            )}
            <div className="space-y-4 mb-4">
              {commentsList.map(comment => {
                // Extracted conditions for clarity and to help parser
                const isUserCommentAuthor = currentUser && currentUser.uid === comment.author.uid;
                const isAdmin = userRole === 'admin';
                const canManageComment = (isUserCommentAuthor || isAdmin) && editingCommentId !== comment.id;
                
                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                      {comment.author.name ? comment.author.name.charAt(0).toUpperCase() : (comment.author.avatar || 'U')}
                    </div>                    <div className={`flex-1 p-3 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{comment.author.name}</p>
                          {comment.author.role === 'admin' && <Crown className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatRelativeTime(comment.createdAt)}
                          {comment.updatedAt && comment.createdAt.seconds !== comment.updatedAt.seconds && ' (edited)'}
                        </span>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div>                          <textarea 
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className={`w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                              theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            rows={2}
                          />
                          <div className="flex items-center space-x-2 mt-1.5">
                            <button onClick={() => handleSaveEditComment(comment.id)} className="px-2.5 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Save</button>
                            <button onClick={handleCancelEditComment} className={`px-2.5 py-1 text-xs rounded ${
                              theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}>Cancel</button>
                          </div>
                        </div>                      ) : (
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>{comment.text}</p>
                          
                          {/* Display Comment Images */}
                          {comment.images && comment.images.length > 0 && (
                            <div className="mt-2">
                              <div className={`grid gap-2 ${comment.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {comment.images.map((imageUrl, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={imageUrl}
                                      alt={`Comment image ${index + 1}`}
                                      className="max-w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded flex items-center justify-center">
                                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Refactored conditional rendering for Edit/Delete buttons */}                      {canManageComment && (
                        <div className="flex items-center space-x-2 mt-1.5">
                          {isUserCommentAuthor && (
                           <button onClick={() => handleEditComment(comment)} className={`text-xs ${
                             theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                           } hover:underline`}>Edit</button>
                          )}
                          {/* Admin can delete any comment, author can delete their own */}
                          {(isUserCommentAuthor || isAdmin) && (
                              <button onClick={() => handleDeleteComment(comment.id)} className={`text-xs ${
                                theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                              } hover:underline`}>Delete</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {currentUser && (
              <form onSubmit={handlePostComment} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                  {userAvatar}
                </div>
                <div className="flex-1">                  <textarea 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className={`w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm ${
                      theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    rows={2}
                  />
                  
                  {/* Comment Image Upload */}
                  <div className="mt-2">
                    <ImageUpload
                      onImageUploaded={handleCommentImageUploaded}
                      onImageRemoved={handleCommentImageRemoved}
                      uploadedImages={newCommentImages}
                      maxImages={2}
                      theme={theme}
                      className="w-full"
                      showPreview={true}
                    />
                  </div>
                    <button 
                    type="submit"
                    disabled={!newCommentText.trim() && newCommentImages.length === 0}
                    className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5"/>
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>
            )}
            {!currentUser && <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Please log in to comment.</p>}</div>
        )}
      </div>
    );
  };
  const FilterBar = () => (
    <div className={`${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } rounded-lg border p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">          <div className="relative">
            <Search className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 ${
                theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="all">All Posts</option>
            <option value="pinned">Pinned</option>
            {currentUser && <option value="my-posts">My Posts</option>}
            {userRole === 'admin' && <option value="hidden">Hidden Posts</option>}
          </select>
        </div>
      </div>
    </div>
  );

  // Add Mobile Navigation
  const MobileNav = () => (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t z-50`}>
      <div className="flex items-center justify-around p-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-2 rounded-lg ${
            activeTab === 'home' 
              ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        {/* Only show Create for authenticated users */}
        {currentUser && (
          <button
            onClick={() => { setShowNewPostForm(true); setActiveTab('create'); }}
            className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs mt-1">Create</span>
          </button>
        )}
        <button
          onClick={() => { setActiveTab('notifications'); markNotificationsAsRead(); }}
          className={`flex flex-col items-center p-2 rounded-lg relative ${
            activeTab === 'notifications' 
              ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          <Bell className="w-6 h-6" />
          <span className="text-xs mt-1">Notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadNotificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  if (!currentUser && activeTab !== 'home') {
    // If not logged in and trying to access a restricted tab, redirect to home or show login prompt
    // This is a simple client-side guard; actual security is via Firestore rules
    // This logic is now partially handled by the useEffect above for the 'create' tab.
    // Consider if other tabs need similar protection or if a more generic approach is needed.
    if (activeTab !== 'home') { // Avoid infinite loop if already home
        setActiveTab('home' as TabType); // Fix type error by explicitly casting to TabType
    }
  }
  return (
    <div className={`flex ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen ${standalone ? 'mt-20' : ''}`}>
      <Sidebar />
      
      <div className={`flex-1 overflow-y-auto pb-20 md:pb-0 pt-8`}>
        <div className="max-w-4xl mx-auto p-4 md:p-6"> {/* Adjusted padding for mobile */}
          { activeTab === 'create' && showNewPostForm && !currentUser && 
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h3>
                <p className="text-yellow-700 mb-4">
                  You need to be logged in to create and share posts with the community. 
                  Please sign in to continue.
                </p>
                <button
                  onClick={() => setActiveTab('home' as TabType)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        }          <div className="mb-8">            
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
              {activeTab === 'home' && 'Community Feed'}
              {activeTab === 'create' && showNewPostForm && 'Create New Post'}
              {activeTab === 'notifications' && 'Notifications'}
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {activeTab === 'home' && 'Stay connected with your learning community'}
              {activeTab === 'create' && showNewPostForm && 'Share your knowledge and experiences with the community'}
              {activeTab === 'notifications' && 'Stay updated with the latest activity'}
            </p>
          </div>

          {/* Share Modal */}
          {showShareModal && sharePost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Share Post</h3>
                  <button onClick={() => setShowShareModal(false)} className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Share this link:</p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={window.location.href.split('?')[0].split('#')[0] + `#post-${sharePost.id}`} 
                      className={`flex-grow px-3 py-2 border rounded-md text-sm ${
                        theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-700'
                      }`}
                    />
                    <button 
                      onClick={() => copyToClipboard(window.location.href.split('?')[0].split('#')[0] + `#post-${sharePost.id}`)}
                      title="Copy link"
                      className={`p-2 rounded-md ${
                        theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Or share via:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button onClick={() => shareToEmail(sharePost)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                  <button onClick={() => shareToWhatsApp(sharePost)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <MessageCircle className="w-4 h-4" /> {/* Using MessageCircle for WhatsApp */}
                    <span>WhatsApp</span>
                  </button>
                  <button onClick={() => shareToTwitter(sharePost)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span>Twitter/X</span>
                  </button>
                  <button onClick={() => shareToLinkedIn(sharePost)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.75c0-1.4-.975-2.5-2.25-2.5S11.5 12.85 11.5 14.25V19h-3v-9h2.9v1.35C11.8 10.475 12.975 9.5 14.5 9.5c2.75 0 4.5 1.75 4.5 5.25z" /></svg>
                    <span>LinkedIn</span>
                  </button>
                  {/* Add Messenger if needed, though direct app linking is complex and might require SDKs */}
                  {/* <button onClick={() => shareToMessenger(sharePost)} className="flex items-center space-x-2 ...">...</button> */}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'home' && (
            <>
              <FilterBar />
              {isLoadingPostsState ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(index => (
                    <div key={index} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 animate-pulse`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`}></div>
                        <div className="flex-1">
                          <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-1/4 mb-2`}></div>
                          <div className={`h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-1/3`}></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className={`h-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-3/4`}></div>
                        <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-full`}></div>
                        <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-5/6`}></div>
                      </div>
                      <div className="flex items-center space-x-6 mt-4">
                        <div className={`h-8 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-20`}></div>
                        <div className={`h-8 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-24`}></div>
                        <div className={`h-8 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded w-16`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} deleteImageFromServer={deleteImageFromServer} />
                  ))}
                  {filteredPosts.length === 0 && !isLoadingPostsState && (
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-100 to-purple-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                          <MessageSquare className={`w-12 h-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                        </div>
                        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No posts found</h3>
                        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} text-lg mb-6`}>
                          {searchTerm || filterTerm !== 'all' 
                            ? "No posts match your current filters. Try adjusting your search or filter criteria."
                            : "Be the first to start a conversation in this community!"
                          }
                        </p>
                        {currentUser && (
                          <button 
                            onClick={() => {setShowNewPostForm(true); setActiveTab('create')}} 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Create First Post</span>
                          </button>
                        )}
                        {!currentUser && (
                          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 mt-4`}>
                            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                              <span className="font-medium">Ready to join the conversation?</span><br/>
                              Log in to create posts and engage with the community.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'create' && showNewPostForm && currentUser && (
            <CreatePostForm 
              newPostData={newPostData}
              setNewPostData={setNewPostData}
              formErrors={formErrors}
              setFormErrors={setFormErrors}
              postCreationError={postCreationError}
              setPostCreationError={setPostCreationError}
              postCreationSuccess={postCreationSuccess}
              isCreatingPost={isCreatingPost}
              handleCreatePost={handleCreatePost}
              setShowNewPostForm={setShowNewPostForm}
              setActiveTab={setActiveTab}              userName={userName}
              userRole={userRole}
              categories={categories}
              theme={theme}
            />          )}
          
          {/* Message for trying to access create tab features without login is handled by redirecting or showing the alert above */}
          {/* The useEffect for (activeTab === 'create' && !currentUser) handles redirection */}

          {activeTab === 'notifications' && (
            <div className={`${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-lg border p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                {notifications.length > 0 && unreadNotificationCount > 0 && (
                  <button 
                    onClick={markNotificationsAsRead}
                    className={`text-sm ${
                      theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    } hover:underline`}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {isLoadingNotifications ? (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No new notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? `hover:bg-gray-700 ${!notif.isRead ? 'bg-gray-700' : 'bg-gray-800'}`
                          : `hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50' : 'bg-white'}`
                      }`}
                    >
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                      {notif.fromUser?.avatar && (
                        <div className={`w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${notif.isRead ? 'ml-2.5' : ''}`}>
                          {notif.fromUser.avatar.charAt(0).toUpperCase()}
                        </div>
                      )}                      <div className="flex-1">
                        <p className={`text-sm ${
                          !notif.isRead 
                            ? theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-900'
                            : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {notif.message}
                        </p>
                        <p className={`text-xs ${
                          !notif.isRead 
                            ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                      {/* Optional: Link to post/comment if relatedPostId exists */}
                      {notif.relatedPostId && (
                        <button 
                          onClick={() => {
                            // Navigate to post, potentially highlight comment
                            // This requires more complex navigation logic, for now, just log
                            console.log(`Navigate to post: ${notif.relatedPostId}, comment: ${notif.relatedCommentId}`);
                            setActiveTab('home'); // Basic navigation to feed
                          }}
                          className={`text-xs ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                          } hover:underline self-center ml-auto`}
                        >
                          View Post
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default CommunityApp;