import { Dispatch, SetStateAction } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Trophy, 
  User, 
  Settings, 
  GraduationCap,
  PenTool,
  Users
} from 'lucide-react';

interface StudentSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const StudentSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }: StudentSidebarProps) => {
  const { theme } = useTheme();
  const location = useLocation();
  const menuItems = [
    { 
      path: '/student/dashboard', 
      label: 'Dashboard', 
      icon: Home 
    },
    { 
      path: '/student/notes', 
      label: 'Notes', 
      icon: BookOpen 
    },
    { 
      path: '/student/quizzes', 
      label: 'Quizzes', 
      icon: PenTool 
    },
    { 
      path: '/student/blogs', 
      label: 'Blogs', 
      icon: FileText 
    },
    { 
      path: '/student/community', 
      label: 'Community', 
      icon: Users 
    },
    { 
      path: '/student/profile', 
      label: 'Profile', 
      icon: User 
    },
  ];
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path || 
           (path === '/student/dashboard' && location.pathname === '/student');
  };

  return (
    <>      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}{/* Sidebar */}      <aside
        className={`fixed md:fixed left-0 z-40 w-64 h-screen md:h-screen transform transition-transform duration-300 ease-in-out md:transform-none overflow-hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } border-r shadow-lg md:shadow-none`}
        style={{ marginRight: 0 }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-900'
            }`}>
              Note Library
            </h2>
          </div>          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-blue-900 text-blue-100'
                        : 'bg-blue-100 text-blue-900'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Student Dashboard v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
