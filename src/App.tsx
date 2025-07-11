import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Notes from './components/Notes';
import Blogs from './components/Blogs';
import BlogPost from './components/BlogPost';
import Testimonials from './components/Testimonials';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';
import IOEPredictor from './components/student/IOEPredictor';
import LoginOverlay from './components/LoginOverlay';
import AdminDashboard from './components/admin/Dashboard';
import ManageNotes from './components/admin/ManageNotes'; // Added
import ManageUsers from './components/admin/ManageUsers'; // Added
import ManageBlogs from './components/admin/ManageBlogs'; // Added
import ManageQuizzes from './components/admin/ManageQuizzes'; // Added
import TestingQuizzes from './components/admin/TestingQuizzes'; // Added
import StudentDashboard from './components/student/Dashboard';
import NoteDetails from './components/NoteDetails';
import PromotionalCarousel from './components/PromotionalCarousel';
import PrivateRoute from './components/PrivateRoute';
import AllNotes from './components/AllNotes';
import CommunityApp from './components/community'; // Ensure this import is present and correct
import StudentNotes from './components/student/StudentNotes';
import StudentQuizzes from './components/student/StudentQuizzes';
import StudentBlogs from './components/student/StudentBlogs';
import QuizDemo from './components/student/QuizDemo';
import TestingNote from './components/TestingNote';
import TestingNoteDetail from './components/TestingNoteDetail';
import AdminPaymentDetail from './components/admin/AdminPaymentDetail'; // Added AdminPaymentDetail
import GPACalculator from './components/GPACalculator';
import StdDashboard from './components/student/StdDashboard';
import Profile from './components/student/Profile';
import SubscriptionInfo from './components/student/SubscriptionInfo';
import ProfileCompletionDialog from './components/ProfileCompletionDialog'; // Import the dialog
import { doc, onSnapshot } from 'firebase/firestore'; // Added onSnapshot
import AdminMessages from './components/admin/AdminMessages'; // Import the AdminMessages component
import { db } from './lib/firebase'; // Added db import
import LiveTest from './components/live/LiveTest';
import LiveQuizManagementDashboard from './components/live/LiveQuizManagementDashboard';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { currentUser, isAdmin, logout } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.providerData.some(p => p.providerId === 'google.com')) {
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Use onSnapshot to listen for real-time changes to the user document
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Check isNewUser from Firestore doc AND profile fields
          if (data.isNewUser === true &&
            (!data.currentStandard || !data.examType || !data.phoneNumber || !data.province || !data.district || !data.college)
          ) {
            setShowProfileDialog(true);
          } else {
            // If isNewUser is false, or profile is complete, ensure dialog is hidden
            setShowProfileDialog(false);
          }
        } else {
          // Document doesn't exist. For a Google sign-in, we expect a doc.
          // If it's missing, it might be a very new user and signInWithGoogle's setDoc isn't visible yet.
          // Conservatively, hide the dialog if the doc is missing to prevent showing it based on incomplete data.
          setShowProfileDialog(false);
        }
      }, (error) => {
        console.error("Error listening to user document for profile completion:", error);
        setShowProfileDialog(false); // Hide on error
      });

      // Cleanup listener when component unmounts or currentUser changes
      return () => {
        unsubscribeFirestore();
      };
    } else {
      // No current user or not a Google user, ensure dialog is hidden
      setShowProfileDialog(false);
    }
  }, [currentUser]); // Depend only on currentUser for this effect

  // Handler for when unverified users close the login overlay
  const handleUnverifiedUserClose = async () => {
    try {
      await logout();
      setIsLoginOpen(false);
    } catch (error) {
      console.error('Error logging out unverified user:', error);
      setIsLoginOpen(false);
    }
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <ProfileCompletionDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
        />
        <Routes>
          <Route path="/" element={
            currentUser ? (
              // Check if user is verified before redirecting
              currentUser.providerData[0]?.providerId === 'password' &&
                !currentUser.emailVerified &&
                currentUser.email !== 'note@admin.notelibrary.com' ? (
                // Show home page with login overlay for unverified users
                <>
                  <Header onLoginClick={() => setIsLoginOpen(true)} />
                  <main>
                    <Hero />
                    <Features />
                    <Notes />
                    <PromotionalCarousel />
                    <Testimonials />
                    <GPACalculator />
                    <ContactUs />
                  </main>
                  <Footer />
                  <LoginOverlay
                    isOpen={true}
                    onClose={handleUnverifiedUserClose}
                    forceEmailVerification={true}
                  />
                </>
              ) : (
                <Navigate to={isAdmin ? "/admin" : "/student"} replace />
              )
            ) : (
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <main>
                  <Hero />
                  <Features />
                  <Notes />
                  <PromotionalCarousel />
                  <Testimonials />
                  <GPACalculator />
                  <ContactUs />
                </main>
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            )
          } />

          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          >
            {/* Nested routes for admin section */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<div>Admin Dashboard Overview</div>} />
            <Route path="notes" element={<ManageNotes />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="blogs" element={<ManageBlogs />} />
            <Route path="live" element={<LiveQuizManagementDashboard />} />
            <Route path="quizzes" element={<ManageQuizzes />} />
            <Route path="testing-quizzes" element={<TestingQuizzes />} />
            <Route path="community" element={<CommunityApp />} />
            <Route path="payment-details" element={<AdminPaymentDetail />} />
            <Route path="messages" element={<AdminMessages />} />
            {/* Added payment details route */}
            {/* Uncommented admin community route */}
          </Route>

          <Route
            path="/student" // Ensures student dashboard is at /student
            element={
              <PrivateRoute requireAdmin={false}>
                <StudentDashboard />
              </PrivateRoute>
            }
          >
            {/* Nested routes for student section */}
            <Route index element={<Navigate to="dashboard" replace />} /> {/* This makes /student navigate to /student/dashboard */}
            <Route path="dashboard" element={<StdDashboard />} />
            <Route path="notes" element={<StudentNotes />} />
            <Route path="quizzes" element={<StudentQuizzes />} />
            <Route path="live" element={<LiveTest />} />
            <Route path="blogs" element={<StudentBlogs />} />
            <Route path="community" element={<CommunityApp />} />
            <Route path="profile" element={<Profile />} />
            <Route path="quiz-demo" element={<QuizDemo />} /> {/* Added quiz demo route for testing */}
            {/* Add other student-specific routes here e.g. notes, tests */}

          </Route>

          <Route
            path="/notes"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <AllNotes />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />


          <Route
            path="/ioe-predictor"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <IOEPredictor />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />
          <Route
            path="/testing-notes"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <TestingNote />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />

          <Route
            path="/testing-notes/:slug"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <TestingNoteDetail />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />
          <Route
            path="/Test-series"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <SubscriptionInfo />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />
          <Route
            path="/notes/:slug"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <NoteDetails />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />

          <Route
            path="/blogs"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <Blogs />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />
          <Route
            path="/community"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <CommunityApp standalone={true} />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />


          <Route
            path="/blogs/:slug"
            element={
              <>
                <Header onLoginClick={() => setIsLoginOpen(true)} />
                <BlogPost />
                <Footer />
                <LoginOverlay isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
              </>
            }
          />
        </Routes>
      </div>
    </HelmetProvider>
  );
}

export default App;