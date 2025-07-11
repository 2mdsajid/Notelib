import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom'; // Import Outlet
import AdminSidebar from './AdminSidebar';
// Removed CommunityApp import, it will be rendered via Outlet

const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
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

        <main className="flex-1 p-6 overflow-auto">
          <Outlet /> {/* Render child routes here */}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;