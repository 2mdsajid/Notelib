import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">
                {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Admin Panel</h2>
            {/* Add your admin dashboard content here */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;