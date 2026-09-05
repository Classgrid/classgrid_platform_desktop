/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React, { useState } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { useClassroomContent } from '../queries/useClassroomContent';
import { EmptyState } from './EmptyState';
import { Spinner } from '@/components/marketing_ui/spinner';
import { Button } from '@/components/marketing_ui/button';
import { ClassroomContent } from '../types/classroom.types';

interface QuizzesTabProps {
  classroomId: string | undefined;
  userRole: 'faculty' | 'student';
}

export const QuizzesTab: React.FC<QuizzesTabProps> = ({ classroomId, userRole }) => {
  const { data, isLoading } = useClassroomContent(classroomId, 'quiz');
  const quizzes: ClassroomContent[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Top Action Bar */}
      {userRole === 'faculty' && (
        <div className="flex justify-end mb-6">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            Create Quiz
          </Button>
        </div>
      )}

      {/* Content Area */}
      {quizzes.length === 0 ? (
        <EmptyState 
          icon={HelpCircle}
          title="No quizzes yet"
          description="Assignments, tests, and quizzes will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id || quiz._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-2">{quiz.title || 'Untitled Quiz'}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-medium text-gray-400">
                  {new Date(quiz.created_at || new Date()).toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm">
                  {userRole === 'faculty' ? 'View Results' : 'Take Quiz'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
