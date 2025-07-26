import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
}

interface QuestionBarProps {
  question: Question;
  progress: number;
  isProcessing: boolean;
  validationQueueLength: number;
}

export const QuestionBar: React.FC<QuestionBarProps> = ({
  question,
  progress,
  isProcessing,
  validationQueueLength
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-60 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm animate-slide-in-down">
      <div className="container mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Question {question.id} of 14</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Current Question */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {question.text}
          </h2>
          
          {/* Question Context */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className={`px-2 py-1 rounded-full text-xs ${
              question.required ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
            }`}>
              {question.required ? 'Required' : 'Optional'}
            </span>
            
            {isProcessing && (
              <div className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
            
            {validationQueueLength > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>{validationQueueLength} pending validation</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};