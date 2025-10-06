import React, { useState, useCallback } from 'react';
import { summarizeLinkedInProfile } from './services/geminiService';
import { LinkedInIcon, SparklesIcon } from './components/Icons';
import { SummaryDisplay } from './components/SummaryDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ResumeCreator } from './components/ResumeCreator';

const App: React.FC = () => {
  const [profileText, setProfileText] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'summary' | 'resume'>('form');

  const handleAnalyze = useCallback(async () => {
    if (!profileText.trim()) {
      setError('Please paste your LinkedIn profile text.');
      return;
    }
    setIsLoading(true);
    setSummary(null);
    setError(null);
    setView('form');
    try {
      const result = await summarizeLinkedInProfile(profileText);
      setSummary(result);
      setView('summary');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate summary. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [profileText]);
  
  const handleReset = () => {
    setProfileText('');
    setSummary(null);
    setError(null);
    setView('form');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8 animate-fade-in-down">
          <div className="flex justify-center items-center gap-4 mb-2">
            <LinkedInIcon className="h-12 w-12 text-purple-400" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
              LinkedIn Profile Analyzer
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Let Gemini AI craft a professional summary & resume from your LinkedIn profile.
          </p>
        </header>

        <main className="space-y-8">
          {view === 'form' && (
             <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                <div className="flex flex-col gap-4">
                   <textarea
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    placeholder="Paste your LinkedIn profile text here...&#10;(Tip: Go to your profile > More > Save to PDF, then copy the text)"
                    className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-200 min-h-[200px]"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !profileText.trim()}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>{isLoading ? 'Analyzing...' : 'Analyze Profile'}</span>
                  </button>
                </div>
              </div>
          )}
          
          <div className="min-h-[300px]">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            {view === 'summary' && summary && (
              <div className="animate-fade-in-up">
                 <SummaryDisplay 
                   summary={summary}
                   onCraftResume={() => setView('resume')}
                  />
              </div>
            )}
            
            {view === 'resume' && summary && (
              <div className="animate-fade-in-up">
                 <ResumeCreator
                    analysisText={summary}
                    onBack={() => setView('summary')}
                  />
              </div>
            )}

             {view === 'form' && !isLoading && !error && !summary && (
                <div className="text-center text-gray-500 pt-16">
                    <p>Your professional analysis will appear here.</p>
                </div>
            )}
          </div>
          
          {view !== 'form' && !isLoading && (
            <div className="text-center">
              <button onClick={handleReset} className="text-purple-400 hover:text-purple-300 transition-colors">
                Start Over
              </button>
            </div>
          )}

        </main>
      </div>
       <footer className="text-center mt-auto pt-8 text-gray-600 text-sm">
        <p>Powered by Gemini API. Analyzes the text you provide.</p>
      </footer>
    </div>
  );
};

export default App;