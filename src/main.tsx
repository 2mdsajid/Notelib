import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

const AppWithProviders = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider userRole="student"> {/* Default to student, will be updated by context */}
          <App />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);