// src/components/admin/AdminSidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiClipboard, FiBookOpen, FiMessageSquare, FiChevronLeft, FiChevronRight, FiMenu, FiCreditCard } from 'react-icons/fi'; // Added FiMessageSquare

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/admin', icon: FiHome, label: 'Dashboard' },
  { to: '/admin/notes', icon: FiFileText, label: 'Manage Notes' },
  { to: '/admin/users', icon: FiUsers, label: 'Manage Users' },
  { to: '/admin/quizzes', icon: FiClipboard, label: 'Manage Quizzes' },
  { to: '/admin/live', icon: FiClipboard, label: 'Manage Live Quizzes' },
  { to: '/admin/testing-quizzes', icon: FiClipboard, label: 'Testing Quizzes' },
  { to: '/admin/blogs', icon: FiBookOpen, label: 'Manage Blogs' },
  { to: '/admin/community', icon: FiMessageSquare, label: 'Community' },
  { to: '/admin/messages', icon: FiMessageSquare, label: 'Messages' },
  { to: '/admin/payment-details', icon: FiCreditCard, label: 'Payment Details' }
];

const AdminSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const baseItemClass = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150";
  const activeItemClass = "bg-gray-700 text-white";
  const itemLabelClass = `ml-3 transition-opacity duration-200 ${isCollapsed && !isMobileOpen ? 'opacity-0 delay-0' : 'opacity-100 delay-100'}`;
  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleMobileSidebar} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        aria-label="Open sidebar"
      >
        <FiMenu size={24} />
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative inset-y-0 left-0 z-40 bg-gray-800 text-white ${sidebarWidthClass} transition-all duration-300 ease-in-out transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          <span className={`font-bold text-xl ${isCollapsed && !isMobileOpen ? 'hidden' : 'block'}`}>Admin</span>
          <button onClick={toggleSidebar} className="hidden lg:block p-1 rounded-md hover:bg-gray-700">
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-grow mt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={() => isMobileOpen && setIsMobileOpen(false)}
                  className={`${baseItemClass} ${location.pathname === item.to ? activeItemClass : ''}`}
                  title={item.label}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span className={itemLabelClass}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          {/* You can add a footer or user info here */}
          <p className={`text-xs text-gray-400 ${isCollapsed && !isMobileOpen ? 'hidden' : 'block'}`}>© 2024 Admin Panel</p>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden" 
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default AdminSidebar;
