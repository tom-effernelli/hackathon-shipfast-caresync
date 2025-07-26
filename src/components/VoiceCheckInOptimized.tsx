/// <reference types="@types/dom-speech-recognition" />
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  X,
  Camera,
  MessageSquare,
  AlertTriangle,
  Square,
  Zap,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onProgressUpdate?: (data: any) => void;
}

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
  category?: 'basic' | 'emergency' | 'medical' | 'complaint';
}

// Smart validation patterns for instant local validation
const validationPatterns = {
  fullName: /^[a-zA-Z\s]{2,50}$/,
  age: /^[0-9]{1,3}$/,
  phone: /^[\d\s\-\+\(\)]{10,15}$/,
  gender: /^(male|female|other|man|woman|m|f|o)$/i
};

const questions: Question[] = [
  // Basic info - high priority for quick processing
  { id: '1', text: "What is your full name?", field: "fullName", type: 'text', required: true, category: 'basic' },
  { id: '2', text: "What is your age?", field: "age", type: 'number', required: true, category: 'basic' },
  { id: '3', text: "What is your gender? Say male, female, or other.", field: "gender", type: 'select', options: ['Male', 'Female', 'Other'], required: true, category: 'basic' },
  { id: '4', text: "What is your phone number?", field: "phone", type: 'text', required: true, category: 'basic' },
  
  // Emergency contacts - batch validation
  { id: '5', text: "Emergency contact name?", field: "emergencyContactName", type: 'text', required: true, category: 'emergency' },
  { id: '6', text: "Emergency contact phone?", field: "emergencyContactPhone", type: 'text', required: true, category: 'emergency' },
  { id: '7', text: "Relationship to emergency contact?", field: "emergencyContactRelation", type: 'text', required: true, category: 'emergency' },
  
  // Medical history - optional, quick skip
  { id: '8', text: "Current medications? Say none if none.", field: "currentMedications", type: 'text', required: false, category: 'medical' },
  { id: '9', text: "Known allergies? Say none if none.", field: "allergies", type: 'text', required: false, category: 'medical' },
  { id: '10', text: "Chronic conditions? Say none if none.", field: "chronicConditions", type: 'text', required: false, category: 'medical' },
  { id: '11', text: "Previous surgeries? Say none if none.", field: "pastSurgeries", type: 'text', required: false, category: 'medical' },
  
  // Main complaint - important
  { id: '12', text: "What brings you here today?", field: "chiefComplaint", type: 'text', required: true, category: 'complaint' },
];

export const VoiceCheckInOptimized = ({ isOpen, onClose, onComplete, onProgressUpdate }: VoiceCheckInProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [validationState, setValidationState] = useState<'none' | 'validating' | 'valid' | 'invalid'>('none');
  const [validationMessage, setValidationMessage] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [quickMode, setQuickMode] = useState(false);
  const [batchValidationQueue, setBatchValidationQueue] = useState<Array<{question: Question, answer: string, index: number}>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Smart local validation for instant feedback
  const validateLocally = (field: string, value: string): { isValid: boolean; confidence: number; processedValue?: string } => {
    const pattern = validationPatterns[field as keyof typeof validationPatterns];
    
    if (!pattern) return { isValid: true, confidence: 0.6 };
    
    if (field === 'gender') {
      const normalizedValue = value.toLowerCase().trim();
      if (normalizedValue.includes('male') || normalizedValue === 'm' || normalizedValue === 'man') {
        return { isValid: true, confidence: 0.95, processedValue: 'Male' };
      }
      if (normalizedValue.includes('female') || normalizedValue === 'f' || normalizedValue === 'woman') {
        return { isValid: true, confidence: 0.95, processedValue: 'Female' };
      }
      if (normalizedValue.includes('other') || normalizedValue === 'o') {
        return { isValid: true, confidence: 0.95, processedValue: 'Other' };
      }
    }
    
    if (field === 'age') {
      const age = parseInt(value);
      if (age >= 0 && age <= 120) {
        return { isValid: true, confidence: 0.95, processedValue: age.toString() };
      }
    }
    
    const isValid = pattern.test(value);
    return { isValid, confidence: isValid ? 0.9 : 0.3 };
  };

  // Batch validation for efficiency
  const processBatchValidation = async () => {
    if (batchValidationQueue.length === 0) return;
    
    console.log('Processing batch validation for', batchValidationQueue.length, 'items');
    setIsProcessing(true);
    
    try {
      // Process multiple answers in one API call
      const { data, error } = await supabase.functions.invoke('process-voice-batch', {
        body: {
          questionAnswerPairs: batchValidationQueue.map(item => ({
            question: item.question,
            answer: item.answer,
            questionIndex: item.index
          })),
          context: { allAnswers: { ...answers, ...pendingAnswers } }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Apply all validated answers
      const validatedAnswers: Record<string, string> = {};
      if (data && data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any, idx: number) => {
          if (result && result.isValid && batchValidationQueue[idx]) {
            const item = batchValidationQueue[idx];
            validatedAnswers[item.question.field] = result.processedAnswer || item.answer;
          }
        });
      }

      console.log('Validated answers from batch:', validatedAnswers);
      setAnswers(prev => {
        const updated = { ...prev, ...validatedAnswers };
        onProgressUpdate?.(updated); // Sync to manual form
        return updated;
      });
      setBatchValidationQueue([]);
      setPendingAnswers({});
      
      if (Object.keys(validatedAnswers).length > 0) {
        toast.success(`${Object.keys(validatedAnswers).length} answers validated!`);
      }
      
    } catch (error) {
      console.error('Batch validation error:', error);
      // Fallback to local validation for robustness
      const localAnswers: Record<string, string> = {};
      batchValidationQueue.forEach(item => {
        const local = validateLocally(item.question.field, item.answer);
        localAnswers[item.question.field] = local.processedValue || item.answer;
      });
      
      console.log('Using local validation fallback:', localAnswers);
      setAnswers(prev => {
        const updated = { ...prev, ...localAnswers };
        onProgressUpdate?.(updated); // Sync to manual form
        return updated;
      });
      setBatchValidationQueue([]);
      setPendingAnswers({});
      
      toast.info("Using local validation (AI unavailable)");
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize media with pre-loading
  useEffect(() => {
    if (isOpen) {
      initializeMedia();
      // Pre-load speech synthesis voices
      speechSynthesis.getVoices();
    }
    return cleanup;
  }, [isOpen]);

  // Auto-advance with no delays
  useEffect(() => {
    if (hasAudioPermission && currentQuestion && !isProcessing && !isPlaying) {
      // Immediate question asking
      speakQuestion(currentQuestion.text);
    }
  }, [currentQuestionIndex, hasAudioPermission]);

  // Batch validation timer
  useEffect(() => {
    if (batchValidationQueue.length >= 3 || (batchValidationQueue.length > 0 && currentQuestionIndex >= questions.length - 1)) {
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
      processBatchValidation();
    } else if (batchValidationQueue.length > 0) {
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = setTimeout(processBatchValidation, 2000);
    }
  }, [batchValidationQueue]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: { 
          sampleRate: 16000, // Lower sample rate for faster processing
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasVideoPermission(true);
      setHasAudioPermission(true);

      // Initialize speech recognition with optimized settings
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionClass();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false; // Disable interim for speed
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const confidenceScore = event.results[0][0].confidence || 0;
          setCurrentTranscript(transcript);
          setConfidence(confidenceScore * 100);
          
          // Immediate processing
          processAnswerOptimized(transcript);
        };

        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
      }

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error("Unable to access camera or microphone");
    }
  };

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
  };

  const processAnswerOptimized = async (transcript: string) => {
    if (!transcript.trim()) return;

    setValidationState('validating');
    
    // Try local validation first for instant feedback
    const localValidation = validateLocally(currentQuestion.field, transcript);
    
    if (localValidation.isValid && localValidation.confidence > 0.85) {
      // High confidence local validation - instant advance
      const finalAnswer = localValidation.processedValue || transcript;
      setAnswers(prev => {
        const updated = { ...prev, [currentQuestion.field]: finalAnswer };
        onProgressUpdate?.(updated); // Sync to manual form
        return updated;
      });
      setValidationState('valid');
      setValidationMessage("Perfect! Moving on...");
      
      toast.success("Answer confirmed!");
      
      // Instant advance
      setTimeout(() => {
        setCurrentTranscript("");
        setValidationState('none');
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          completeCheckIn();
        }
      }, 200); // Minimal delay for UX
      
    } else if (quickMode) {
      // Quick mode: use only local validation, no batch processing
      const finalAnswer = localValidation.processedValue || transcript;
      setAnswers(prev => {
        const updated = { ...prev, [currentQuestion.field]: finalAnswer };
        onProgressUpdate?.(updated); // Sync to manual form
        return updated;
      });
      setValidationState('valid');
      setValidationMessage("Quick validation - moving on...");
      
      toast.success("Answer accepted (quick mode)!");
      
      setTimeout(() => {
        setCurrentTranscript("");
        setValidationState('none');
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          completeCheckIn();
        }
      }, 200);
      
    } else {
      // Add to batch validation queue for AI processing
      setPendingAnswers(prev => ({ ...prev, [currentQuestion.field]: transcript }));
      setBatchValidationQueue(prev => [...prev, {
        question: currentQuestion,
        answer: transcript,
        index: currentQuestionIndex
      }]);
      
      setValidationState('valid');
      setValidationMessage("Added to processing queue");
      
      // Continue to next question without waiting
      setTimeout(() => {
        setCurrentTranscript("");
        setValidationState('none');
        advanceToNext();
      }, 300);
    }
  };

  const advanceToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Ensure any pending batch validation completes before finishing
      if (batchValidationQueue.length > 0) {
        processBatchValidation().then(() => completeCheckIn());
      } else {
        completeCheckIn();
      }
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Slightly faster speech
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        // Auto-start recording immediately
        setTimeout(startRecording, 50);
      };
      
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;
    
    setIsRecording(true);
    setCurrentTranscript("");
    setConfidence(0);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const skipQuestion = () => {
    if (!currentQuestion?.required) {
      setAnswers(prev => {
        const updated = { ...prev, [currentQuestion.field]: "" };
        onProgressUpdate?.(updated); // Sync to manual form
        return updated;
      });
      advanceToNext();
    }
  };

  const completeCheckIn = async () => {
    console.log('Starting completeCheckIn...');
    
    // Wait for any pending batch validation to complete
    if (batchValidationQueue.length > 0) {
      console.log('Processing remaining batch validation...');
      setIsProcessing(true);
      await processBatchValidation();
    }
    
    // Merge all answers (confirmed + pending + local fallbacks)
    const allAnswers = { ...answers, ...pendingAnswers };
    console.log('All answers collected:', allAnswers);
    
    // Validate required fields and provide fallbacks
    const requiredFields = questions.filter(q => q.required);
    const missingFields = requiredFields.filter(q => !allAnswers[q.field] || allAnswers[q.field].trim() === '');
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields.map(f => f.field));
      toast.error(`Missing required fields: ${missingFields.map(f => f.field).join(', ')}`);
      return;
    }
    
    const formattedData = {
      fullName: allAnswers.fullName || "",
      age: parseInt(allAnswers.age) || 18,
      gender: (allAnswers.gender as "Male" | "Female" | "Other") || "Other",
      phone: allAnswers.phone || "",
      emergencyContactName: allAnswers.emergencyContactName || "",
      emergencyContactPhone: allAnswers.emergencyContactPhone || "",
      emergencyContactRelation: allAnswers.emergencyContactRelation || "",
      currentMedications: allAnswers.currentMedications || "None",
      allergies: allAnswers.allergies || "None",
      chronicConditions: allAnswers.chronicConditions || "None",
      pastSurgeries: allAnswers.pastSurgeries || "None",
      chiefComplaint: allAnswers.chiefComplaint || "",
    };

    console.log('Formatted data for completion:', formattedData);
    
    try {
      onComplete(formattedData);
      onClose();
      toast.success("Voice check-in completed successfully!");
    } catch (error) {
      console.error('Error completing check-in:', error);
      toast.error("Error completing check-in. Please try again.");
    }
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleQuickMode = () => {
    const newQuickMode = !quickMode;
    setQuickMode(newQuickMode);
    
    if (newQuickMode) {
      toast.info("Quick mode enabled - local validation only");
      // In quick mode, process pending batch immediately with local validation
      if (batchValidationQueue.length > 0) {
        const localAnswers: Record<string, string> = {};
        batchValidationQueue.forEach(item => {
          const local = validateLocally(item.question.field, item.answer);
          localAnswers[item.question.field] = local.processedValue || item.answer;
        });
         setAnswers(prev => {
           const updated = { ...prev, ...localAnswers };
           onProgressUpdate?.(updated); // Sync to manual form
           return updated;
         });
         setBatchValidationQueue([]);
         setPendingAnswers({});
      }
    } else {
      toast.info("Standard mode enabled - AI validation");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden border-0 bg-background/95 backdrop-blur-sm">
        <div className="flex h-full rounded-lg overflow-hidden">
          {/* Left side - Video and controls */}
          <div className="flex-1 bg-gradient-to-br from-black via-gray-900 to-black relative flex flex-col">
            <div className="flex-1 relative overflow-hidden rounded-l-lg">
              {videoEnabled && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isRecording ? 'ring-4 ring-red-500/50' : ''
                  }`}
                />
              )}
              
              {!videoEnabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background/20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]"></div>
                </div>
              )}
              
              {/* Overlay content */}
              <div className="absolute inset-0 flex flex-col">
                {/* Top overlay */}
                <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Mic className="h-6 w-6" />
                        {isRecording && (
                          <div className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping"></div>
                        )}
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Voice Check-in</span>
                        <p className="text-sm text-white/70">
                          {quickMode ? "🚀 Quick Mode" : "🎯 Standard Mode"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleQuickMode}
                        className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/10"
                      >
                        {quickMode ? <Zap className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVideo}
                        className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/10"
                      >
                        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Center overlay for status */}
                <div className="flex-1 flex items-center justify-center">
                  {!hasVideoPermission && !hasAudioPermission && (
                    <div className="text-center text-white animate-fade-in">
                      <Camera className="h-20 w-20 mx-auto mb-6 opacity-60" />
                      <p className="text-xl font-medium mb-2">Setting up your experience</p>
                      <p className="text-white/70">Accessing camera and microphone...</p>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="text-center text-white animate-fade-in">
                      <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
                      <p className="text-xl font-medium mb-2">Processing batch validation</p>
                      <p className="text-white/70">Optimizing your responses...</p>
                    </div>
                  )}
                </div>

                {/* Bottom overlay - Recording controls */}
                <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-6">
                    {hasAudioPermission && !isProcessing && (
                      <>
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isPlaying}
                          size="lg"
                          className={`
                            rounded-full w-20 h-20 transition-all duration-200 transform hover:scale-105
                            ${isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-white text-black hover:bg-gray-100'
                            }
                          `}
                        >
                          {isRecording ? (
                            <Square className="h-8 w-8" />
                          ) : (
                            <Mic className="h-8 w-8" />
                          )}
                        </Button>
                        
                        {!currentQuestion?.required && (
                          <Button
                            onClick={skipQuestion}
                            variant="outline"
                            className="text-white border-white/30 hover:bg-white/10"
                          >
                            Skip Optional
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Questions and progress */}
          <div className="w-[28rem] border-l border-border/50 bg-gradient-to-br from-background to-muted/20 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Voice Check-in</h2>
                  <p className="text-sm text-muted-foreground">
                    {quickMode ? "⚡ Optimized for speed" : "🎯 Standard validation"}
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-muted border border-border/50"
                />
              </div>
            </div>

            {/* Current Question */}
            <div className="flex-1 p-6 overflow-y-auto">
              {hasAudioPermission && (
                <div className="space-y-6">
                  <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/2 to-primary/5 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary-foreground">
                            {currentQuestionIndex + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-3 leading-relaxed">
                            {currentQuestion?.text}
                          </h3>
                          <div className="flex items-center gap-2">
                            {currentQuestion?.required ? (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Optional
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {currentQuestion?.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current answer display */}
                  {currentTranscript && (
                    <Card className="border-border/50 bg-muted/30">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-foreground">Your response:</p>
                              {confidence > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    confidence >= 80 ? 'bg-green-500' : 
                                    confidence >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                  }`} />
                                  <span className={`text-xs font-medium ${
                                    confidence >= 80 ? 'text-green-700' : 
                                    confidence >= 50 ? 'text-orange-700' : 'text-red-700'
                                  }`}>
                                    {confidence >= 80 ? 'High confidence' : 
                                     confidence >= 50 ? 'Medium confidence' : 'Low confidence'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed bg-background/50 p-3 rounded-md border border-border/30">
                              "{currentTranscript}"
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Validation result */}
                  {validationState !== 'none' && validationMessage && (
                    <Card className={`border-2 transition-all duration-300 ${
                      validationState === 'valid' 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                        : validationState === 'validating'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-full p-1 ${
                            validationState === 'valid' ? 'bg-green-500' : 
                            validationState === 'validating' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}>
                            {validationState === 'valid' ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : validationState === 'validating' ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1 ${
                              validationState === 'valid' 
                                ? 'text-green-800 dark:text-green-200' 
                                : validationState === 'validating'
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {validationState === 'valid' && '✨ Validated!'}
                              {validationState === 'validating' && '🔄 Processing...'}
                              {validationState === 'invalid' && '🤔 Let\'s clarify'}
                            </p>
                            <p className={`text-sm leading-relaxed ${
                              validationState === 'valid' 
                                ? 'text-green-700 dark:text-green-300' 
                                : validationState === 'validating'
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {validationMessage}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Batch queue status */}
                  {batchValidationQueue.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="animate-pulse h-4 w-4 bg-blue-500 rounded-full"></div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {batchValidationQueue.length} answers queued for batch validation
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};