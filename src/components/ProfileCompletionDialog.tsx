import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface ProfileCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileCompletionDialog: React.FC<ProfileCompletionDialogProps> = ({ isOpen, onClose }) => {
  const { currentUser, markUserAsOld } = useAuth();
  const [formData, setFormData] = useState({
    currentStandard: '11',
    examType: 'None',
    phoneNumber: '',
    province: 'Province 1',
    district: '',
    college: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const provinces = [
    'Province 1',
    'Madhesh',
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Karnali',
    'Sudurpashchim',
  ];

  const standards = ['11', '12', 'Pass out'];
  const examTypes = ['IOE', 'CEE', 'None'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Client-side validation
    if (
      !formData.currentStandard ||
      !formData.examType ||
      !formData.phoneNumber ||
      !formData.province ||
      !formData.district ||
      !formData.college
    ) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...formData,
        isNewUser: false, // Mark as not new after profile completion
      });
      await markUserAsOld(); // Update context state
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Complete Your Profile</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please provide a few more details to personalize your experience.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentStandard" className="block text-sm font-medium text-gray-700">
              Current Standard/Grade
            </label>
            <select
              id="currentStandard"
              name="currentStandard"
              value={formData.currentStandard}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              {standards.map((standard) => (
                <option key={standard} value={standard}>
                  {standard}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="examType" className="block text-sm font-medium text-gray-700">
              Competitive Exam Preparing For
            </label>
            <select
              id="examType"
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 98XXXXXXXX"
              required
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700">
              District
            </label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Kathmandu"
              required
            />
          </div>

          <div>
            <label htmlFor="college" className="block text-sm font-medium text-gray-700">
              College Name
            </label>
            <input
              type="text"
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., St. Xavier's College"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionDialog;
