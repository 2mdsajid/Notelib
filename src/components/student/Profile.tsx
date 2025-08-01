import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { User, Mail, Calendar, Shield, Loader2, Edit, Save, X } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  providerId: string;
  createdAt: any;
  lastLogin: any;
  isNewUser: boolean;
  examType: 'IOE' | 'CEE' | 'none';
  currentStandard: '10' | '11' | '12' | 'Passout';
  ioeAccess: boolean;
  ceeAccess: boolean;
  liveTestAccess: boolean;
  college: string;
  district: string;
  province: string;
  phoneNumber: string;
}

const Profile: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    examType: 'IOE' as 'IOE' | 'CEE' | 'none',
    currentStandard: '12' as '10' | '11' | '12' | 'Passout'
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      setLoading(false);
      return;
    }

    fetchUserData();
  }, [currentUser, authLoading]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData;
        // Only set examType if it's IOE or CEE, otherwise set to null
        setUserData(data);
        setForm({
          displayName: data.displayName || '',
          email: data.email || '',
          examType: data.examType,
          currentStandard: data.currentStandard
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser || !userData) return;

    if (!form.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      setSaving(true);
      
      // Update Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: form.displayName.trim()
      });

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: form.displayName.trim()
      });

      // Update local state
      setUserData(prev => prev ? { ...prev, displayName: form.displayName.trim() } : null);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setForm({
        displayName: userData.displayName || '',
        email: userData.email || '',
        examType: userData.examType || null,
        currentClass: userData.currentClass || null
      });
    }
    setIsEditing(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case 'google.com':
        return 'Google';
      case 'password':
        return 'Email/Password';
      default:
        return providerId;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!currentUser || !userData) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No user data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold text-white">
                {getInitials(userData.displayName)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {userData.displayName || 'User'}
                </h1>
                <p className="text-indigo-100 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  {userData.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Shield className="h-4 w-4 mr-1" />
                {userData.role || 'Student'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={form.displayName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser) return;
                            try {
                              setSaving(true);
                              const userDocRef = doc(db, 'users', currentUser.uid);
                              await updateDoc(userDocRef, {
                                examType: 'IOE'
                              });
                              setForm(prev => ({ ...prev, examType: 'IOE' }));
                              setUserData(prev => prev ? { ...prev, examType: 'IOE' } : null);
                              toast.success('Exam type updated to IOE');
                            } catch (error) {
                              console.error('Error updating exam type:', error);
                              toast.error('Failed to update exam type');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            form.examType === 'IOE'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="font-semibold">IOE</div>
                          <div className="text-sm text-gray-600">Institute of Engineering</div>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser) return;
                            try {
                              setSaving(true);
                              const userDocRef = doc(db, 'users', currentUser.uid);
                              await updateDoc(userDocRef, {
                                examType: 'CEE'
                              });
                              setForm(prev => ({ ...prev, examType: 'CEE' }));
                              setUserData(prev => prev ? { ...prev, examType: 'CEE' } : null);
                              toast.success('Exam type updated to CEE');
                            } catch (error) {
                              console.error('Error updating exam type:', error);
                              toast.error('Failed to update exam type');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            form.examType === 'CEE'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="font-semibold">CEE</div>
                          <div className="text-sm text-gray-600">Common Entrance Examination</div>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser) return;
                            try {
                              setSaving(true);
                              const userDocRef = doc(db, 'users', currentUser.uid);
                              await updateDoc(userDocRef, {
                                examType: 'none'
                              });
                              setForm(prev => ({ ...prev, examType: 'none' }));
                              setUserData(prev => prev ? { ...prev, examType: 'none' } : null);
                              toast.success('Exam type updated to None');
                            } catch (error) {
                              console.error('Error updating exam type:', error);
                              toast.error('Failed to update exam type');
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            form.examType === 'none'
                              ? 'border-gray-500 bg-gray-50 text-gray-700'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="font-semibold">None</div>
                          <div className="text-sm text-gray-600">No Exam Type</div>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Choose your exam type to see relevant live tests and content
                      </p>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Standard
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['11', '12', 'Passout'] as const).map((standard) => (
                          <button
                            key={standard}
                            type="button"
                            onClick={async () => {
                              if (!currentUser) return;
                              try {
                                setSaving(true);
                                const userDocRef = doc(db, 'users', currentUser.uid);
                                await updateDoc(userDocRef, {
                                  currentStandard: standard
                                });
                                setForm(prev => ({ ...prev, currentStandard: standard }));
                                setUserData(prev => prev ? { ...prev, currentStandard: standard } : null);
                                toast.success(`Standard updated to Class ${standard}`);
                              } catch (error) {
                                console.error('Error updating standard:', error);
                                toast.error('Failed to update standard');
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              form.currentStandard === standard
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-300 hover:border-gray-400'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-semibold">Class {standard}</div>
                            <div className="text-sm text-gray-600">
                              {standard === '12' ? '😊' : 
                               standard === '11' ? '😁' : 
                               standard === 'Passout' ? '🎓' : '😎'}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select your current standard to see relevant content
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Display Name</p>
                          <p className="text-sm text-gray-600">{userData.displayName || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{userData.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Exam Type</p>
                          <div>
                            {userData.examType ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userData.examType === 'IOE' 
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {userData.examType === 'IOE' ? 'Institute of Engineering' : 'CEE'}
                              </span>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">None</p>
                                <p className="text-xs text-gray-500 mt-1">Select an exam type to access relevant content</p>
                              </>
                            )}
                          </div>
                        </div>                    </div>
                  </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Standard</p>
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Class {userData.currentStandard}
                              {userData.currentStandard === '12' ? ' 😊' : 
                               userData.currentStandard === '11' ? ' 😁' : 
                               userData.currentStandard === 'Passout' ? ' 🎓' : ' 😎'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Account Role</p>
                        <p className="text-sm text-gray-600 capitalize">{userData.role || 'Student'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sign-in Method</p>
                        <p className="text-sm text-gray-600">{getProviderName(userData.providerId)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Member Since</p>
                        <p className="text-sm text-gray-600">{formatDate(userData.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Login</p>
                        <p className="text-sm text-gray-600">{formatDate(userData.lastLogin)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">User ID</p>
                        <p className="text-sm text-gray-600 font-mono">{userData.uid}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;