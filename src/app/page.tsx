'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) return null;

  return (
    <>
      <NavBar />
      <main className="flex min-h-screen flex-col items-center px-4 py-12 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <span className="text-5xl">🕋</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent dark:from-primary-dark dark:to-primary-dark/80">Tafweej</span> Hajj
          </h1>
          <p className="text-xl max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
            Real-time crowd management and navigation for Hajj pilgrims
          </p>
        </div>
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
            <Link href="/map" className="group">
              <div className="card h-full border border-slate-200 hover:border-primary/30 dark:border-gray-700 dark:hover:border-primary-dark/30 flex flex-col items-center justify-center py-10 hover:-translate-y-1">
                <div className="text-5xl mb-6 transform transition-transform group-hover:scale-110">🗺️</div>
                <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">Crowd Density Map</h2>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-xs">
                  View real-time crowd density information across all Hajj sites
                </p>
                <div className="mt-4 inline-flex items-center text-primary dark:text-primary-dark text-sm font-medium">
                  <span>Explore Map</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </Link>
            <Link href="/alerts" className="group">
              <div className="card h-full border border-slate-200 hover:border-primary/30 dark:border-gray-700 dark:hover:border-primary-dark/30 flex flex-col items-center justify-center py-10 hover:-translate-y-1">
                <div className="text-5xl mb-6 transform transition-transform group-hover:scale-110">⚠️</div>
                <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">Safety Alerts</h2>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-xs">
                  Receive important safety notifications and guidance
                </p>
                <div className="mt-4 inline-flex items-center text-primary dark:text-primary-dark text-sm font-medium">
                  <span>View Alerts</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="mt-16 text-center">
          <p className="mb-6 text-slate-600 dark:text-slate-400 max-w-2xl">
            Bringing the latest technology to enhance safety and comfort during Hajj
          </p>
          <a 
            href="#" 
            className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            onClick={(e) => {
              e.preventDefault();
              alert('This is a prototype. In the full version, this would launch the demo.');
            }}
          >
            <span>View Interactive Demo</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </main>
    </>
  );
} 