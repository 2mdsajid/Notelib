import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { LiveQuizData, getAllUnarchivedLiveQuizzesFromFirestore } from '../../services/firestore/liveQuizServices';
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';


interface PaymentRequest {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhotoURL?: string | null;
  seriesPurchased: 'IOE' | 'CEE' | 'LIVE';
  paymentProofFileName: string;
  paymentProofCpanelUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
}

const LiveTest: React.FC = () => {

  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<LiveQuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSeries, setPurchaseSeries] = useState<'IOE' | 'CEE' | 'LIVE' |  null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [showQRZoom, setShowQRZoom] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Replace localStorage with Firestore user permissions
  const [userAccess, setUserAccess] = useState<{ ioeAccess: boolean; ceeAccess: boolean; liveAccess:boolean }>({
    ioeAccess: false,
    ceeAccess: false,
    liveAccess:false,
  });


  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedQuizzes = await getAllUnarchivedLiveQuizzesFromFirestore();
        // Optionally sort them, e.g., by creation date
        fetchedQuizzes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setQuizzes(fetchedQuizzes);
        if (fetchedQuizzes.length === 0) {
          setError('No active live tests are currently available.');
        }
      } catch (err) {
        console.error("Error fetching live tests:", err);
        setError("Failed to load live tests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []); // Empty dependency array means this runs once on component mount

    // Fetch user access permissions from Firestore
    useEffect(() => {
      const fetchUserAccess = async () => {
        if (!currentUser) {
          setUserAccess({ ioeAccess: false, ceeAccess: false, liveAccess:false });
          return;
        }
  
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserAccess({
              ioeAccess: userData.ioeAccess || false,
              ceeAccess: userData.ceeAccess || false,
              liveAccess: true,
            });
          } else {
            setUserAccess({ ioeAccess: false, ceeAccess: false,liveAccess:false });
          }
        } catch (error) {
          console.error('Error fetching user access:', error);
          setUserAccess({ ioeAccess: false, ceeAccess: false,liveAccess:false });
        }
      };
  
      fetchUserAccess();
    }, [currentUser]);
  

  const handleAttendTest = (quizId: string) => {
    navigate(`/student/quiz/${quizId}`); // Navigate to the quiz player route
  };

  const handlePurchaseSeries = (series: 'IOE' | 'CEE' | 'LIVE') => {
    setPurchaseSeries(series);
    setShowPurchaseModal(true);
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchaseSeries(null);
    setPaymentProof(null);
    setPaymentProofPreview(null);
    setShowQRZoom(false);
  };

  const handleShowQRZoom = () => {
    setShowQRZoom(true);
  };

  const handleCloseQRZoom = () => {
    setShowQRZoom(false);
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentProofPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmitPayment = async () => {
    if (!paymentProof) {
      console.error('Please upload payment proof before submitting.');
      return;
    }
    if (!purchaseSeries) {
        console.error('No series selected for purchase.');
        return;
    }
    if (!currentUser || !currentUser.uid) {
        console.error('User not logged in. Cannot submit payment request.');
        return;
    }
    if (!db) {
        console.error('Firestore not initialized.');
        return;
    }


    setIsSubmittingPayment(true);
    setError(null); // Clear previous errors
    try {
      // Step 1: Upload image to cPanel via uploadpay.php
      const formData = new FormData();
      formData.append('image', paymentProof);

      // Using a placeholder URL for uploadpay.php, replace with your actual endpoint
      const uploadResponse = await fetch('https://notelibraryapp.com/uploadpay.php', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed with status: ' + uploadResponse.status }));
        throw new Error(errorData.error || 'Failed to upload payment proof.');
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success || !uploadResult.url || !uploadResult.filename) {
        throw new Error(uploadResult.error || 'Payment proof upload was not successful or did not return expected data.');
      }

      const paymentProofCpanelUrl = uploadResult.url;
      const paymentProofUniqueFileName = uploadResult.filename;

      // Step 2: Create payment request in Firestore
      const newPaymentRequest: PaymentRequest = {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        userPhotoURL: currentUser.photoURL,
        seriesPurchased: purchaseSeries,
        paymentProofFileName: paymentProofUniqueFileName,
        paymentProofCpanelUrl: paymentProofCpanelUrl,
        status: 'pending',
        requestedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'paymentRequests'), newPaymentRequest);

      console.log(`Payment information submitted successfully! Your request for the ${purchaseSeries} test series is pending admin approval. You will be notified once it's processed.`);

      handleClosePurchaseModal(); // Close modal on success
    } catch (err) {
      console.error("Error submitting payment request:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to submit payment information: ${errorMessage}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-blue-600">Loading live tests...</p>
      </div>
    );
  }

  if (error && quizzes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) { // Specific message if no quizzes found after loading
    return (
      <div className="flex justify-center items-center h-64 p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No Tests:</strong>
          <span className="block sm:inline ml-2">No active live tests available at the moment. Please check back later!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 text-center">Available Live Tests</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.details.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden border border-blue-200 hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-3">{quiz.details.title}</h2>
              <p className="text-gray-700 mb-2">
                <strong>Grade:</strong> <span className="font-semibold">{quiz.details.grade}</span>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Time Limit:</strong> <span className="font-semibold">{quiz.details.timeLimit} minutes</span>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Questions:</strong> <span className="font-semibold">{quiz.questions.length}</span>
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Audience:</strong> <span className="font-semibold">{quiz.details.targetAudience.charAt(0).toUpperCase() + quiz.details.targetAudience.slice(1)}</span>
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleAttendTest(quiz.details.id)}
                  className={`flex-1 bg-green-900 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    !userAccess.liveAccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                  }`}
                  disabled={!userAccess.liveAccess}
                >
                  {userAccess.liveAccess ? 'Attend Test' : '🔒 Attend Test'}
                </button>
                {!userAccess.liveAccess && (
                  <button
                    onClick={() => handlePurchaseSeries('LIVE')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    💳 Purchase
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Purchase {purchaseSeries} Test Series
                </h2>
                <button
                  onClick={handleClosePurchaseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Instructions */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Payment Instructions
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Scan the QR code below to pay via eSewa
                    </p>
                    {/* Placeholder image for QR code */}
                    <img
                      src="/a.jpeg"
                      alt="eSewa QR Code"
                      className="mx-auto w-32 h-32 object-contain border rounded-lg mb-3"
                    />
                    <button
                      onClick={handleShowQRZoom}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      🔍 Show QR Code (Zoom)
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Contact for Support</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">
                      📱 WhatsApp: <span className="font-mono">+977 986-8711643</span>
                    </p>
                    <p className="text-blue-700">
                      👤 Contact Person: <span className="font-medium">Jayant Bista</span>
                    </p>
                  </div>
                  <a
                    href="https://wa.me/9779868711643"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    💬 Contact on WhatsApp
                  </a>
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Upload Payment Proof</h4>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {paymentProofPreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full max-w-xs mx-auto border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleClosePurchaseModal}
                    className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={isSubmittingPayment || !paymentProof} // Disable if no proof or submitting
                  >
                    {isSubmittingPayment ? 'Submitting...' : 'Submit Payment Info'}
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  After payment verification, your test series will be activated. This may take up to 24 hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Zoom Modal */}
      {showQRZoom && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">eSewa QR Code</h3>
              <button
                onClick={handleCloseQRZoom}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your eSewa app to make payment
              </p>
              {/* Placeholder image for zoomed QR code */}
              <img
                src="/a.jpeg"
                alt="eSewa QR Code - Zoomed"
                className="mx-auto w-80 h-80 object-contain border-2 border-gray-300 rounded-lg shadow-lg"
              />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Tip: Hold your phone steady and ensure good lighting for best scanning results
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseQRZoom}
              className="w-full mt-4 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTest;