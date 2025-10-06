import React, { useState, useCallback, useMemo } from 'react';
import { createResumeFromAnalysis } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { SparklesIcon, ClipboardIcon, PrinterIcon } from './Icons';

interface ResumeCreatorProps {
  analysisText: string;
  onBack: () => void;
}

interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    website: string;
}

// Helper function to parse the resume markdown from Gemini into a structured object
const parseResumeMarkdown = (text: string) => {
    if (!text || typeof text !== 'string') return null;

    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return null;

    const header = {
        name: lines.shift()?.replace('# ', '').trim() || '',
        contact: lines.shift()?.trim().split(/\s*\|\s*/) || [],
    };

    const sections: { title: string; content?: any; jobs?: any[]; skills?: any[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            currentSection = {
                title: line.replace('## ', '').trim(),
                content: [],
            };
            sections.push(currentSection);
        } else if (currentSection) {
            currentSection.content.push(line);
        }
    }

    // Post-process sections for specific formatting like Work Experience and Skills
    const processedSections = sections.map(section => {
        if (section.title === 'Work Experience') {
            const jobs: { title: string; company: string; date: string; description: string[] }[] = [];
            let currentJob: { title: string; company: string; date: string; description: string[] } | null = null;
            
            for (const line of section.content) {
                const titleCompanyMatch = line.match(/^\*\*(.*)\*\* \| (.*)/);
                const dateMatch = line.match(/^\*(.*)\*/);
                const bulletMatch = line.match(/^\* (.*)/);

                if (titleCompanyMatch) {
                    if (currentJob) jobs.push(currentJob);
                    currentJob = {
                        title: titleCompanyMatch[1].trim(),
                        company: titleCompanyMatch[2].trim(),
                        date: '',
                        description: [],
                    };
                } else if (currentJob && dateMatch) {
                    currentJob.date = dateMatch[1].trim();
                } else if (currentJob && bulletMatch) {
                    currentJob.description.push(bulletMatch[1].trim());
                }
            }
            if (currentJob) jobs.push(currentJob);
            return { ...section, jobs };
        }
        if (section.title === 'Skills') {
             const skills = section.content.map(line => {
                const skillMatch = line.match(/^\* \*\*(.*):\*\* (.*)/);
                if (skillMatch) {
                    return {
                        category: skillMatch[1].trim(),
                        items: skillMatch[2].trim(),
                    };
                }
                return { category: null, items: line.replace(/^\* /, '').trim() };
            });
            return { ...section, skills };
        }
        return { ...section, content: section.content.join('\n') };
    });

    return { header, sections: processedSections };
};


// Refactored Renderer using TailwindCSS
const ResumeRenderer: React.FC<{ markdownText: string }> = ({ markdownText }) => {
    const resumeData = useMemo(() => parseResumeMarkdown(markdownText), [markdownText]);

    if (!resumeData) {
        return <div className="text-center p-8 text-gray-500 bg-gray-800/90 rounded-lg">Could not parse resume data.</div>;
    }
    
    return (
      <div className="bg-gray-800/90 p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl font-serif text-gray-300 animate-fade-in transition-all duration-500">
        <header className="text-center mb-6 sm:mb-8 border-b border-gray-600 pb-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 tracking-tight">{resumeData.header.name}</h1>
          {resumeData.header.contact.length > 0 && (
              <p className="text-gray-400 mt-2 text-xs sm:text-sm flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
                  {resumeData.header.contact.map((item, index) => (
                      <React.Fragment key={index}>
                          <span>{item}</span>
                          {index < resumeData.header.contact.length - 1 && <span className="hidden sm:inline text-gray-500">&bull;</span>}
                      </React.Fragment>
                  ))}
              </p>
          )}
        </header>
  
        <main className="space-y-6">
          {resumeData.sections.map((section, index) => (
            <section key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <h2 className="text-xl sm:text-2xl font-bold text-purple-300 border-b-2 border-purple-400/50 pb-2 mb-4 tracking-wide font-sans">
                {section.title}
              </h2>
              
              {section.title === 'Professional Summary' && (
                <p className="text-gray-300 leading-relaxed text-base">{section.content as string}</p>
              )}

              {section.title === 'Skills' && section.skills && (
                  <div className="space-y-2">
                      {section.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex flex-col sm:flex-row text-base">
                              {skill.category && <p className="font-semibold text-gray-200 w-full sm:w-1/4 flex-shrink-0">{skill.category}:</p>}
                              <p className={`text-gray-300 ${skill.category ? 'sm:w-3/4' : 'w-full'}`}>{skill.items}</p>
                          </div>
                      ))}
                  </div>
              )}

              {section.title === 'Work Experience' && section.jobs && (
                <div className="space-y-6">
                  {section.jobs.map((job, jobIndex) => (
                    <div key={jobIndex}>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-100">
                          {job.title} | <span className="font-semibold text-gray-200">{job.company}</span>
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base italic flex-shrink-0 mt-1 sm:mt-0">{job.date}</p>
                      </div>
                      <ul className="list-disc list-outside ml-5 mt-2 space-y-2 text-gray-300 leading-relaxed text-base">
                        {job.description.map((desc, descIndex) => (
                          <li key={descIndex}>{desc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

            </section>
          ))}
        </main>
      </div>
    );
};


export const ResumeCreator: React.FC<ResumeCreatorProps> = ({ analysisText, onBack }) => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ name: '', email: '', phone: '', website: '' });
  const [resume, setResume] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateResume = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResume(null);
    try {
      const result = await createResumeFromAnalysis(analysisText, personalInfo);
      setResume(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate resume. ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [analysisText, personalInfo]);

  const handleCopyToClipboard = () => {
    if (!resume) return;
    navigator.clipboard.writeText(resume).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
        setCopySuccess('Failed to copy');
        console.error('Could not copy text: ', err);
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Resume</title>');
        printWindow.document.write('<style>body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; color: #111827; padding: 2rem; } h1 { font-size: 2.5rem; text-align: center; margin-bottom: 0.5rem; } .contact { text-align: center; margin-bottom: 2rem; } h2 { font-size: 1.5rem; border-bottom: 1px solid #d1d5db; padding-bottom: 0.5rem; margin-top: 1.5rem; } ul { padding-left: 20px; } li { margin-bottom: 0.5rem; } .job-header{ display: flex; justify-content: space-between; align-items: center; } .job-header h3 { margin: 0; font-size: 1.2rem;} .job-header em { font-size: 1rem; color: #4b5563; } .skills-grid { display: grid; grid-template-columns: 1fr 3fr; gap: 0.5rem; } </style>');
        printWindow.document.write('</head><body>');
        
        // Basic markdown to HTML for printing, mirrors new structure
        const htmlResume = resume
            ?.replace(/^# (.*$)/m, '<h1>$1</h1>')
            .replace(/^(.* \| .*)$/m, '<div class="contact">$1</div>')
            .replace(/^## (.*$)/m, '<h2>$1</h2>')
            .replace(/^\*\*(.*)\*\* \| (.*$)\n^\*(.*)\*/gm, '<div class="job-header"><h3><strong>$1</strong> | $2</h3><em>$3</em></div><ul>')
            .replace(/^\* \*\*(.*):\*\* (.*$)/gm, '<div class="skills-grid"><strong>$1:</strong><span>$2</span></div>')
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/<\/ul>\s*<div class="job-header"/g, '</ul><div class="job-header"'); // Fix spacing
            
        printWindow.document.write(htmlResume || '');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        // Timeout to allow styles to load
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-700 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-purple-300">Resume Creator</h2>
        <button onClick={onBack} className="text-sm text-purple-400 hover:text-purple-300">&larr; Back to Analysis</button>
      </div>

      {!resume && !isLoading && (
         <div className="space-y-4">
            <p className="text-gray-400">First, add your personal details. They will be placed at the top of your resume.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Full Name" value={personalInfo.name} onChange={handleInputChange} className="input-field" />
                <input type="email" name="email" placeholder="Email Address" value={personalInfo.email} onChange={handleInputChange} className="input-field" />
                <input type="tel" name="phone" placeholder="Phone Number" value={personalInfo.phone} onChange={handleInputChange} className="input-field" />
                <input type="url" name="website" placeholder="Portfolio/Website URL" value={personalInfo.website} onChange={handleInputChange} className="input-field" />
            </div>
            <button
                onClick={handleGenerateResume}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 transition-all duration-200 transform hover:scale-105 shadow-md"
            >
                <SparklesIcon className="h-5 w-5" />
                <span>Generate Resume</span>
            </button>
         </div>
      )}

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {resume && (
        <div className="space-y-4">
             <div className="flex items-center gap-4">
                <button onClick={handleCopyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <ClipboardIcon className="h-5 w-5" />
                    <span>{copySuccess || 'Copy Markdown'}</span>
                </button>
                <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <PrinterIcon className="h-5 w-5" />
                    <span>Print</span>
                </button>
             </div>
             <div className="border border-gray-700 rounded-lg overflow-hidden">
                <ResumeRenderer markdownText={resume} />
             </div>
        </div>
      )}
      <style>{`
        .input-field {
            background-color: #1f2937;
            border: 1px solid #4b5563;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            color: white;
            width: 100%;
        }
        .input-field:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0; /* Start hidden */
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
