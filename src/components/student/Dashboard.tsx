import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Moon, Sun, Menu, X } from 'lucide-react'; 
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; 
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmDialog from '../ConfirmDialog';
import StudentSidebar from './StudentSidebar';

const StudentDashboard = () => {
  const { logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
    setIsLogoutConfirmOpen(false);
  };

  return (
    <>
      {/* Normal dashboard layout */}
      <div className="flex w-full min-h-screen" style={{ margin: 0, padding: 0 }}>
          {/* Sidebar */}
          <StudentSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
          
          {/* Main Content Area */}
          <div className="flex flex-col min-h-screen w-full transition-all duration-300 md:ml-64">
            {/* Header */}
            <nav className={`${theme === 'dark' ? 'bg-gray-800 shadow-md' : 'bg-white shadow-md'} sticky top-0 z-10 w-full`}>
              <div className="w-full px-4">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    {/* Mobile Menu Button in Header */}
                    <button
                      onClick={toggleMobileMenu}
                      className={`md:hidden p-2 rounded-md mr-2 ${
                        theme === 'dark' 
                          ? 'text-white hover:bg-gray-700' 
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-label="Toggle menu"
                    >
                      {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <h1 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {(() => {
                        const path = location.pathname.split('/').pop() || 'dashboard';
                        return path.charAt(0).toUpperCase() + path.slice(1);
                      })()}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleTheme('student')}
                      className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-colors`}
                      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hidden sm:block`}>
                      {currentUser?.email}
                    </span>
                    <button
                      onClick={handleLogoutClick}
                      className={`flex items-center px-4 py-2 text-sm font-medium ${
                        theme === 'dark'
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-red-600 hover:text-red-800'
                      }`}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span className="hidden sm:block">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-0 overflow-y-auto mt-0 w-full">
              <div className="w-full pt-0">
                <Outlet />
              </div>
            </main>
          </div>
        </div>

      {/* Logout Confirm Dialog */}
      {isLogoutConfirmOpen && (
        <ConfirmDialog
          isOpen={isLogoutConfirmOpen}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onClose={() => setIsLogoutConfirmOpen(false)}
        />
      )}
    </>
  );
};

export { StudentDashboard };
export default StudentDashboard;