'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function NavBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <span className="mr-2 text-primary dark:text-primary-dark">🕋</span> 
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:from-primary-dark dark:to-primary-dark/80">Tafweej Hajj</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-1">
            <Link 
              href="/map" 
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === '/map' 
                  ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark font-medium' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-700'
              }`}
            >
              Map
            </Link>
            <Link 
              href="/routes" 
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === '/routes' 
                  ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark font-medium' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-700'
              }`}
            >
              Routes
            </Link>
            <Link 
              href="/alerts" 
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === '/alerts' 
                  ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-dark font-medium' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-700'
              }`}
            >
              Alerts
            </Link>
          </div>
          
          <button
            aria-label="Toggle Dark Mode"
            type="button"
            className="w-10 h-10 p-2 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center transition-all duration-300 hover:bg-slate-200 dark:hover:bg-gray-600 shadow-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && (
              <>
                {theme === 'dark' ? (
                  // Sun icon for light mode
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-yellow-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                ) : (
                  // Moon icon for dark mode
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-slate-700" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </>
            )}
          </button>
          
          {/* Mobile menu button - visible on small screens */}
          <button 
            className="md:hidden rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
            onClick={() => {
              // Toggle mobile menu if needed (for future implementation)
              alert('Mobile menu would open here. Not implemented in this prototype.');
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 