/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { MessageSquare, BookOpen, Users, Settings, Bot, HelpCircle } from 'lucide-react';

interface ClassroomTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole: 'faculty' | 'student';
}

export const ClassroomTabs: React.FC<ClassroomTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  userRole 
}) => {
  const tabs = [
    { id: 'stream', name: 'Stream', icon: MessageSquare },
    { id: 'materials', name: 'Materials', icon: BookOpen },
    { id: 'quizzes', name: 'Quizzes', icon: HelpCircle },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'ai', name: 'AI Assistant', icon: Bot },
  ];

  if (userRole === 'faculty') {
    tabs.push({ id: 'settings', name: 'Settings', icon: Settings });
  }

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide pb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <tab.icon
                  className={`
                    -ml-0.5 mr-2 h-4 w-4 transition-colors duration-200
                    ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
