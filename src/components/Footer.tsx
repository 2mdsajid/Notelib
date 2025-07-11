import React from 'react';
import { BookOpen, Facebook, Twitter, Instagram, Mail, MapPin, Download } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="w-8 h-8 text-amber-500" />
              <span className="text-xl font-bold text-white">Note Library</span>
            </div>
            <p className="mb-6">
              Providing quality education resources for grades 11 & 12. Helping students achieve academic excellence through comprehensive notes and test series.
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <a 
                  href="https://www.facebook.com/notelibrary" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.instagram.com/notelibraryofficial/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="Test-series" className="hover:text-white transition-colors">Test Series</a>
              </li>
              <li>
                <a href="notes" className="hover:text-white transition-colors">Notes</a>
              </li>
              <li>
                <a href="ioe-predictor" className="hover:text-white transition-colors">IOE Predictor</a>
              </li>
              <li>
                <a href="blog" className="hover:text-white transition-colors">Blog</a>
              </li>
              <li>
                <a href="community" className="hover:text-white transition-colors">Community</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-amber-500 flex-shrink-0" />
                <span>Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-amber-500 flex-shrink-0" />
                <span>content.notelibrary@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Note Library. All rights reserved.</p>
          <p className="mt-2">
              Made with ❤️ for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;