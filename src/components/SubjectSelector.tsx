import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowUpDown, Check } from 'lucide-react';
import { SUBJECT_DATA, SubjectDetail } from '../data/data';

interface SubjectSelectorProps {
  grade: "11" | "12";
  currentSubjects: SubjectDetail[];
  onSelectSubject: (subject: SubjectDetail) => void;
  onCancel: () => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  grade,
  currentSubjects,
  onSelectSubject,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDetail[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'credits'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    // Filter out subjects that are already selected
    const subjects = SUBJECT_DATA[grade].optional.filter(subject => 
      !currentSubjects.some(s => s.code === subject.code)
    );
    setAvailableSubjects(subjects);
  }, [grade, currentSubjects]);
    const sortedSubjects = useMemo(() => {
    return [...availableSubjects].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'code') {
        return sortDirection === 'asc' 
          ? a.code.localeCompare(b.code) 
          : b.code.localeCompare(a.code);
      } else {
        // Sort by credits
        const creditsA = parseFloat(a.total_credits);
        const creditsB = parseFloat(b.total_credits);
        return sortDirection === 'asc' 
          ? creditsA - creditsB 
          : creditsB - creditsA;
      }
    });
  }, [availableSubjects, sortBy, sortDirection]);
  
  const filteredSubjects = searchTerm.trim() === '' 
    ? sortedSubjects 
    : sortedSubjects.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.includes(searchTerm)
      );
      
  const toggleSort = (column: 'name' | 'code' | 'credits') => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">Add Optional Subject</h3>
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2 border rounded-md"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>
        
        <div className="p-3 border-b bg-gray-50">
          <div className="flex text-xs font-semibold text-gray-500">
            <button 
              onClick={() => toggleSort('name')}
              className="flex-1 flex items-center justify-start px-2 py-1 hover:bg-gray-200 rounded-md"
            >
              <span>Subject</span>
              {sortBy === 'name' && (
                <ArrowUpDown className="w-3 h-3 ml-1" />
              )}
            </button>
            <button 
              onClick={() => toggleSort('code')}
              className="w-20 flex items-center justify-center px-2 py-1 hover:bg-gray-200 rounded-md"
            >
              <span>Code</span>
              {sortBy === 'code' && (
                <ArrowUpDown className="w-3 h-3 ml-1" />
              )}
            </button>
            <button 
              onClick={() => toggleSort('credits')}
              className="w-20 flex items-center justify-center px-2 py-1 hover:bg-gray-200 rounded-md"
            >
              <span>Credits</span>
              {sortBy === 'credits' && (
                <ArrowUpDown className="w-3 h-3 ml-1" />
              )}
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredSubjects.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No matching subjects found
            </div>
          ) : (
            <ul className="divide-y">
              {filteredSubjects.map(subject => (
                <li 
                  key={subject.code}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => onSelectSubject(subject)}
                >
                  <div className="p-4 flex items-center">
                    <div className="flex-1">
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-sm text-gray-500">
                        <span>Code: {subject.code}</span>
                      </div>
                    </div>
                    <div className="w-16 text-center text-sm">
                      {subject.total_credits}
                    </div>
                    <div className="w-8 flex justify-center">
                      <Check className="w-5 h-5 text-green-500 opacity-0 hover:opacity-50" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectSelector;
