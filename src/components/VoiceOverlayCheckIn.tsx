import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QuestionBar } from './QuestionBar';
import { VoiceFloatingControls } from './VoiceFloatingControls';
import { FormFieldHighlight } from './FormFieldHighlight';

interface VoiceOverlayProps {
  isActive: boolean;
  onClose: () => void;
  setValue: UseFormSetValue<any>;
  formErrors: Record<string, any>;
}

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

const questions: Question[] = [
  { id: '1', text: "What is your full name?", field: 'fullName', type: 'text', required: true },
  { id: '2', text: "What is your age?", field: 'age', type: 'number', required: true },
  { id: '3', text: "What is your gender?", field: 'gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
  { id: '4', text: "What is your phone number?", field: 'phone', type: 'text', required: true },
  { id: '5', text: "What is your insurance number?", field: 'insuranceNumber', type: 'text', required: false },
  { id: '6', text: "What is your preferred language?", field: 'preferredLanguage', type: 'text', required: false },
  { id: '7', text: "Who is your emergency contact?", field: 'emergencyContactName', type: 'text', required: true },
  { id: '8', text: "What is your emergency contact's phone number?", field: 'emergencyContactPhone', type: 'text', required: true },
  { id: '9', text: "What is your relationship to your emergency contact?", field: 'emergencyContactRelation', type: 'text', required: true },
  { id: '10', text: "What medications are you currently taking?", field: 'currentMedications', type: 'text', required: false },
  { id: '11', text: "Do you have any known allergies?", field: 'allergies', type: 'text', required: false },
  { id: '12', text: "Do you have any chronic conditions?", field: 'chronicConditions', type: 'text', required: false },
  { id: '13', text: "Have you had any past surgeries?", field: 'pastSurgeries', type: 'text', required: false },
  { id: '14', text: "What is your main concern or chief complaint today?", field: 'chiefComplaint', type: 'text', required: true },
];

const validationPatterns = {
  fullName: /^[a-zA-Z\s]{2,}$/,
  age: /^([1-9]|[1-9][0-9]|1[0-1][0-9]|120)$/,
  phone: /^(\+33|0)[1-9](\d{8})$/,
};

export const VoiceOverlayCheckIn: React.FC<VoiceOverlayProps> = ({
  isActive,
  onClose,
  setValue,
  formErrors
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationQueue, setValidationQueue] = useState<string[]>([]);
  const [quickMode, setQuickMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentFieldId, setCurrentFieldId] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Local storage backup
  useEffect(() => {
    if (Object.keys(answers).length > 0 && Object.keys(answers).length % 2 === 0) {
      localStorage.setItem('voiceCheckInBackup', JSON.stringify(answers));
    }
  }, [answers]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isActive) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence;
          setConfidenceLevel(confidence);
          processAnswer(transcript, confidence);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Voice recognition failed. Please try again.');
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isActive]);

  // Auto-scroll to current field
  useEffect(() => {
    if (currentQuestion?.field) {
      setCurrentFieldId(currentQuestion.field);
      const element = document.getElementById(currentQuestion.field);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentQuestion]);

  // Smart mapping and validation
  const validateLocally = (text: string, field: string): boolean => {
    const pattern = validationPatterns[field as keyof typeof validationPatterns];
    return pattern ? pattern.test(text) : true;
  };

  const smartMapping = (text: string, field: string): string => {
    if (field === 'gender') {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('male') || lowerText.includes('man') || lowerText.includes('homme')) {
        return 'Male';
      }
      if (lowerText.includes('female') || lowerText.includes('woman') || lowerText.includes('femme')) {
        return 'Female';
      }
      if (lowerText.includes('other') || lowerText.includes('autre')) {
        return 'Other';
      }
    }
    
    if (field === 'phone') {
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `+33 ${cleaned.substring(1, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`;
      }
    }

    return text;
  };

  const processAnswer = async (transcript: string, confidence: number) => {
    if (!currentQuestion || isPaused) return;

    const mappedValue = smartMapping(transcript, currentQuestion.field);
    const isValid = quickMode || validateLocally(mappedValue, currentQuestion.field);

    // Update answers
    setAnswers(prev => ({ ...prev, [currentQuestion.field]: mappedValue }));
    
    // Update form
    setValue(currentQuestion.field, currentQuestion.type === 'number' ? parseInt(mappedValue) : mappedValue);

    if (isValid || confidence > 0.8) {
      // Auto-advance to next question
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          speakQuestion(questions[currentQuestionIndex + 1]);
        } else {
          completeCheckIn();
        }
      }, 1500);
    } else {
      // Queue for batch validation
      setValidationQueue(prev => [...prev, currentQuestion.field]);
    }
  };

  // Batch validation
  const processBatchValidation = useCallback(async () => {
    if (validationQueue.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-voice-batch', {
        body: { answers: validationQueue.map(field => ({ field, value: answers[field] })) }
      });

      if (!error && data) {
        // Apply validated results
        data.forEach(({ field, validatedValue }: any) => {
          setValue(field, validatedValue);
          setAnswers(prev => ({ ...prev, [field]: validatedValue }));
        });
      }
    } catch (error) {
      console.error('Batch validation error:', error);
    } finally {
      setIsProcessing(false);
      setValidationQueue([]);
    }
  }, [validationQueue, answers, setValue]);

  // Auto-process batch validation
  useEffect(() => {
    if (validationQueue.length >= 3) {
      processBatchValidation();
    }
  }, [validationQueue, processBatchValidation]);

  const speakQuestion = (question: Question) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      synthRef.current.speak(utterance);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && !isPaused) {
      setIsRecording(true);
      recognitionRef.current.start();
      
      // Auto-pause detection
      silenceTimerRef.current = setTimeout(() => {
        if (isRecording) {
          setIsPaused(true);
          setIsRecording(false);
          toast.info("Auto-paused due to silence. Continue voice check-in?");
        }
      }, 5000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }
  };

  const resumeVoice = () => {
    setIsPaused(false);
    speakQuestion(currentQuestion);
  };

  const skipQuestion = () => {
    if (!currentQuestion.required) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        speakQuestion(questions[currentQuestionIndex + 1]);
      } else {
        completeCheckIn();
      }
    }
  };

  const completeCheckIn = () => {
    toast.success("Voice check-in completed! Please review the form.");
    onClose();
  };

  const handleManualEdit = (field: string) => {
    setIsPaused(true);
    setIsRecording(false);
    toast.info("Voice paused - manual edit detected");
  };

  if (!isActive) return null;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50">
      {/* Question Bar */}
      <QuestionBar
        question={currentQuestion}
        progress={progress}
        isProcessing={isProcessing}
        validationQueueLength={validationQueue.length}
      />

      {/* Form Field Highlights */}
      <FormFieldHighlight
        currentFieldId={currentFieldId}
        answers={answers}
        formErrors={formErrors}
      />

      {/* Floating Controls */}
      <VoiceFloatingControls
        isRecording={isRecording}
        isPaused={isPaused}
        quickMode={quickMode}
        confidenceLevel={confidenceLevel}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onResume={resumeVoice}
        onSkip={skipQuestion}
        onToggleQuickMode={() => setQuickMode(!quickMode)}
        onClose={onClose}
        onFinishManually={completeCheckIn}
        canSkip={!currentQuestion?.required}
      />

      {/* Resume Prompt */}
      {isPaused && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Continue voice check-in?</h3>
          <div className="flex gap-3">
            <button
              onClick={resumeVoice}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Continue
            </button>
            <button
              onClick={completeCheckIn}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Finish Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
};