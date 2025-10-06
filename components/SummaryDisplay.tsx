import React from 'react';
import { DocumentTextIcon } from './Icons';

interface SummaryDisplayProps {
  summary: string;
  onCraftResume: () => void;
}

// A more robust parser for markdown-like text from Gemini
const SummaryRenderer: React.FC<{ text: string }> = ({ text }) => {
  const parseLine = (line: string, key: string | number): React.ReactNode => {
    // Regex to capture **bold**, `code`, and [links](url)
    const regex = /(\*\*(?:[^*]+?|\*[^*])*?\*\*|`(?:[^`]+?)`|\[(?:[^\]]+?)\]\((?:[^)]+?)\))/g;
    const parts = line.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          if (!part) return null;

          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${key}-${i}`} className="font-semibold text-gray-200">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={`${key}-${i}`} className="bg-gray-700/50 text-purple-300 rounded px-1.5 py-1 font-mono text-sm">{part.slice(1, -1)}</code>;
          }
          if (part.startsWith('[') && part.endsWith(')')) {
            const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
              const linkText = linkMatch[1];
              const url = linkMatch[2];
              return (
                <a key={`${key}-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                  {linkText}
                </a>
              );
            }
          }
          return <span key={`${key}-${i}`}>{part}</span>;
        })}
      </>
    );
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 pl-4">
          {listItems.map((item, index) => (
            <li key={`li-${index}`}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-2xl font-semibold text-purple-300 mt-6 mb-3">
          {parseLine(trimmedLine.replace('### ', ''), index)}
        </h3>
      );
    } else if (trimmedLine.startsWith('* ')) {
      const content = trimmedLine.substring(2); // remove '* '
      listItems.push(parseLine(content, index));
    } else if (trimmedLine) {
      flushList();
      elements.push(
        <p key={index} className="text-gray-300 leading-relaxed">
          {parseLine(trimmedLine, index)}
        </p>
      );
    } else {
        // Empty line signifies a break, so flush any list.
        flushList();
    }
  });

  flushList(); // Add any remaining list items

  return <div className="space-y-4">{elements}</div>;
};


export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, onCraftResume }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-700 space-y-6">
      <SummaryRenderer text={summary} />
       <div className="pt-4 border-t border-gray-700">
          <button
              onClick={onCraftResume}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900 transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Craft Resume from this Analysis</span>
          </button>
      </div>
    </div>
  );
};