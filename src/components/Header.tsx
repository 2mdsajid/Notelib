import React, { useState, useEffect } from 'react';
import { BookOpen, Menu, X, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Ioe-predictor', href: '/ioe-predictor' },
    { name: 'Notes', href: '/notes' },
    { name: 'Blog', href: '/blogs' },
    { name: 'Community', href: '/community' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-blue-800" />
            <span className="text-xl font-bold text-blue-900">Note Library</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.href}
                className={`text-gray-700 hover:text-blue-800 font-medium transition-colors ${
                  (location.pathname === link.href || 
                   (link.href.startsWith('/#') && location.pathname === '/' && location.hash === link.href.substring(1))) 
                    ? 'text-blue-800' 
                    : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center">
            <button 
              onClick={onLoginClick}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 py-4 px-4">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.href}
                className={`text-gray-700 hover:text-blue-800 font-medium transition-colors ${
                  (location.pathname === link.href || 
                   (link.href.startsWith('/#') && location.pathname === '/' && location.hash === link.href.substring(1))) 
                    ? 'text-blue-800' 
                    : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                onLoginClick();
              }}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-full font-medium transition-colors w-full justify-center"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;