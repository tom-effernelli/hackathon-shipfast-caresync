import React, { useEffect, useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface FormFieldHighlightProps {
  currentFieldId: string;
  answers: Record<string, string>;
  formErrors: Record<string, any>;
}

export const FormFieldHighlight: React.FC<FormFieldHighlightProps> = ({
  currentFieldId,
  answers,
  formErrors
}) => {
  const [highlightedField, setHighlightedField] = useState<string>('');
  const [typingField, setTypingField] = useState<string>('');
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());

  // Highlight current field
  useEffect(() => {
    if (currentFieldId) {
      setHighlightedField(currentFieldId);
      
      // Remove highlight after animation
      const timer = setTimeout(() => {
        setHighlightedField('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentFieldId]);

  // Typing effect when answer is provided
  useEffect(() => {
    if (currentFieldId && answers[currentFieldId]) {
      setTypingField(currentFieldId);
      
      // Show checkmark after typing
      const timer = setTimeout(() => {
        setTypingField('');
        setValidatedFields(prev => new Set([...prev, currentFieldId]));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentFieldId, answers]);

  useEffect(() => {
    // Apply field highlighting styles
    const applyFieldStyles = () => {
      const allInputs = document.querySelectorAll('input, textarea, select');
      
      allInputs.forEach((element) => {
        const fieldId = element.id;
        element.classList.remove(
          'voice-field-active',
          'voice-field-typing',
          'voice-field-validated',
          'voice-field-error'
        );

        if (fieldId === highlightedField) {
          element.classList.add('voice-field-active');
        }
        
        if (fieldId === typingField) {
          element.classList.add('voice-field-typing');
        }
        
        if (validatedFields.has(fieldId)) {
          element.classList.add('voice-field-validated');
        }
        
        if (formErrors[fieldId]) {
          element.classList.add('voice-field-error');
        }
      });
    };

    applyFieldStyles();

    // Add dynamic styles to document head
    const styleId = 'voice-field-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .voice-field-active {
          border: 2px solid hsl(var(--primary)) !important;
          background: hsl(var(--primary) / 0.05) !important;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1) !important;
          animation: voice-field-pulse 2s ease-in-out;
        }
        
        .voice-field-typing {
          border: 2px solid hsl(var(--accent)) !important;
          background: hsl(var(--accent) / 0.1) !important;
          animation: voice-typing-effect 0.5s ease-in-out;
        }
        
        .voice-field-validated {
          border: 2px solid hsl(var(--success)) !important;
          background: hsl(var(--success) / 0.05) !important;
        }
        
        .voice-field-error {
          border: 2px solid hsl(var(--destructive)) !important;
          background: hsl(var(--destructive) / 0.05) !important;
          animation: voice-error-shake 0.5s ease-in-out;
        }
        
        @keyframes voice-field-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes voice-typing-effect {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes voice-error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup styles when component unmounts
      const cleanupInputs = document.querySelectorAll('input, textarea, select');
      cleanupInputs.forEach((element) => {
        element.classList.remove(
          'voice-field-active',
          'voice-field-typing',
          'voice-field-validated',
          'voice-field-error'
        );
      });
    };
  }, [highlightedField, typingField, validatedFields, formErrors]);

  // Render field status indicators
  return (
    <>
      {Array.from(validatedFields).map((fieldId) => {
        const element = document.getElementById(fieldId);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        
        return (
          <div
            key={fieldId}
            className="fixed z-50 pointer-events-none animate-scale-in"
            style={{
              top: rect.top - 10,
              right: window.innerWidth - rect.right + 10,
            }}
          >
            <div className="bg-success text-success-foreground rounded-full p-1 shadow-lg">
              <Check className="w-4 h-4" />
            </div>
          </div>
        );
      })}

      {Object.keys(formErrors).map((fieldId) => {
        const element = document.getElementById(fieldId);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        
        return (
          <div
            key={fieldId}
            className="fixed z-50 pointer-events-none animate-scale-in"
            style={{
              top: rect.top - 10,
              right: window.innerWidth - rect.right + 10,
            }}
          >
            <div className="bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </>
  );
};