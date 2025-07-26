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
  RotateCcw,
  ArrowRight,
  X,
  Camera,
  Timer,
  Edit3,
  Check,
  SkipForward,
  MessageSquare,
  AlertTriangle,
  Square,
  Circle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

const questions: Question[] = [
  { id: '1', text: "What is your full name?", field: "fullName", type: 'text', required: true },
  { id: '2', text: "What is your age?", field: "age", type: 'number', required: true },
  { id: '3', text: "What is your gender? Please say male, female, or other.", field: "gender", type: 'select', options: ['Male', 'Female', 'Other'], required: true },
  { id: '4', text: "What is your phone number?", field: "phone", type: 'text', required: true },
  { id: '5', text: "Who should we contact in case of emergency? Please provide their full name.", field: "emergencyContactName", type: 'text', required: true },
  { id: '6', text: "What is your emergency contact's phone number?", field: "emergencyContactPhone", type: 'text', required: true },
  { id: '7', text: "What is your relationship to your emergency contact?", field: "emergencyContactRelation", type: 'text', required: true },
  { id: '8', text: "Are you currently taking any medications? If yes, please list them.", field: "currentMedications", type: 'text', required: false },
  { id: '9', text: "Do you have any known allergies? Please describe them.", field: "allergies", type: 'text', required: false },
  { id: '10', text: "Do you have any chronic medical conditions?", field: "chronicConditions", type: 'text', required: false },
  { id: '11', text: "Have you had any previous surgeries? If yes, please describe them.", field: "pastSurgeries", type: 'text', required: false },
  { id: '12', text: "What brings you to the hospital today? Please describe your main concern.", field: "chiefComplaint", type: 'text', required: true },
];

export const VoiceCheckIn = ({ isOpen, onClose, onComplete }: VoiceCheckInProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'none' | 'validating' | 'valid' | 'invalid'>('none');
  const [validationMessage, setValidationMessage] = useState("");
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(0);
  const [confidence, setConfidence] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Initialize camera and microphone
  useEffect(() => {
    if (isOpen) {
      initializeMedia();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Auto-ask question when moving to next - immediate start
  useEffect(() => {
    if (hasAudioPermission && currentQuestion && !isProcessing) {
      // Pre-initialize speech recognition to eliminate startup delay
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Clear any ongoing recognition
      }
      // Start immediately, no artificial delay
      speakQuestion(currentQuestion.text);
    }
  }, [currentQuestionIndex, hasAudioPermission]);

  const initializeMedia = async () => {
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasVideoPermission(true);
      setHasAudioPermission(true);

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionClass();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let transcript = '';
          let confidenceScore = 0;
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            confidenceScore = Math.max(confidenceScore, event.results[i][0].confidence || 0);
          }
          setCurrentTranscript(transcript);
          setConfidence(confidenceScore * 100);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          if (currentTranscript.trim()) {
            // Automatically validate with Claude
            processAnswerWithAutoValidation(currentTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast.error("Speech recognition error. Please try again.");
        };
      }

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error("Unable to access camera or microphone. Please check permissions.");
    }
  };

  const cleanup = () => {
    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    // Stop speech synthesis
    speechSynthesis.cancel();

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Clear timers
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
    }
  };

  const startAutoAdvanceTimer = () => {
    setTimeRemaining(10);
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (showConfirmation) {
            skipToNext();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setAutoAdvanceTimer(timer);
  };

  const playPositiveFeedback = () => {
    // Audio feedback removed for faster demo flow
    // Keep only visual feedback via toasts and messages
  };

  const handleConfirmAnswer = async () => {
    if (currentTranscript.trim()) {
      let finalAnswer = currentTranscript.trim();
      
      // Visual feedback only - no audio to speed up demo
      // playPositiveFeedback(); // Removed for faster flow
      
      // Special handling for gender field with Claude API
      if (currentQuestion.field === 'gender') {
        try {
          setIsProcessing(true);
          const { data, error } = await supabase.functions.invoke('classify-gender', {
            body: { transcribedText: currentTranscript.trim() }
          });
          
          if (!error && data?.classification) {
            finalAnswer = data.classification;
            toast.success(`Gender classified as: ${data.classification}`);
          }
        } catch (error) {
          console.error('Error classifying gender:', error);
          // Use original answer if classification fails
        } finally {
          setIsProcessing(false);
        }
      }
      
      // Save the answer
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.field]: finalAnswer
      }));
      
      toast.success("Answer confirmed successfully!");
      
      // Clear current transcript and confidence
      setCurrentTranscript("");
      setConfidence(0);
      
      // Move to next question immediately - no delays
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        completeCheckIn();
      }
    }
  };

  const confirmAnswer = () => {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setShowConfirmation(false);
    processAnswer(currentTranscript);
  };

  const skipToNext = () => {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setShowConfirmation(false);
    setCurrentTranscript("");
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeCheckIn();
    }
  };

  const retryAnswer = () => {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setShowConfirmation(false);
    setCurrentTranscript("");
    startRecording();
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhotos(prev => [...prev, photoDataUrl]);
        toast.success("Photo captured successfully!");
      }
    }
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        // Auto-start recording immediately after question is spoken - no delay
        setTimeout(() => startRecording(), 100); // Minimal delay for smooth transition
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

  const processAnswerWithAutoValidation = async (transcript: string) => {
    if (!transcript.trim()) return;

    setValidationState('validating');
    setValidationMessage("Checking your answer...");
    setIsProcessing(true);
    
    try {
      // Send to Claude for processing and validation
      const { data, error } = await supabase.functions.invoke('process-voice-answer', {
        body: {
          question: currentQuestion,
          answer: transcript,
          context: { questionIndex: currentQuestionIndex, previousAnswers: answers }
        }
      });

      if (error) throw error;

      const processedAnswer = data.processedAnswer;
      const isValid = data.isValid;
      const confidence = data.confidence || 0;
      const suggestions = data.suggestions;

      if (isValid && confidence > 0.8) {
        // High confidence auto-advance
        setValidationState('valid');
        setValidationMessage("Great! Moving to next question...");
        
        // Save the answer
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.field]: processedAnswer
        }));

        toast.success("Answer recorded successfully!");

        // Immediate advance for high confidence answers - no delay
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          completeCheckIn();
        }
        setValidationState('none');
        setCurrentTranscript("");
        setConfidence(0);
      } else if (isValid && confidence > 0.5) {
        // Medium confidence - show confirmation
        setValidationState('valid');
        setValidationMessage("Please confirm this answer");
        setShowConfirmation(true);
        startAutoAdvanceTimer();
      } else {
        // Low confidence or invalid - ask for clarification
        setValidationState('invalid');
        setValidationMessage(suggestions || 'Could not understand the answer clearly');
        toast.error(`Please clarify: ${suggestions || 'Could not understand the answer'}`);
        // Immediate retry, no delay
        speakQuestion(`I didn't quite understand. ${suggestions || 'Could you please repeat your answer?'}`);
        setTimeout(() => setValidationState('none'), 1000);
      }
      
    } catch (error) {
      console.error('Error processing answer:', error);
      setValidationState('invalid');
      setValidationMessage("Error processing your answer");
      toast.error("Error processing your answer. Please try again.");
      setTimeout(() => {
        setValidationState('none');
      }, 1000); // Reduced delay
    } finally {
      setIsProcessing(false);
    }
  };

  const processAnswer = async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    
    try {
      // Send to Claude for processing and validation
      const { data, error } = await supabase.functions.invoke('process-voice-answer', {
        body: {
          question: currentQuestion,
          answer: transcript,
          context: { questionIndex: currentQuestionIndex, previousAnswers: answers }
        }
      });

      if (error) throw error;

      const processedAnswer = data.processedAnswer;
      const isValid = data.isValid;
      const suggestions = data.suggestions;

      if (isValid) {
        // Save the answer
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.field]: processedAnswer
        }));

        toast.success("Answer recorded successfully!");

        // Move to next question immediately
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          completeCheckIn();
        }
      } else {
        toast.error(`Please clarify: ${suggestions || 'Could not understand the answer'}`);
        speakQuestion(`I didn't quite understand. ${suggestions || 'Could you please repeat your answer?'}`);
      }
      
    } catch (error) {
      console.error('Error processing answer:', error);
      toast.error("Error processing your answer. Please try again.");
    } finally {
      setIsProcessing(false);
      setCurrentTranscript("");
    }
  };

  const retryQuestion = () => {
    setCurrentTranscript("");
    speakQuestion(currentQuestion.text);
  };

  const skipQuestion = () => {
    if (!currentQuestion.required) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.field]: ""
      }));
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        completeCheckIn();
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeCheckIn = () => {
    // Convert answers to the expected format
    const formattedData = {
      fullName: answers.fullName || "",
      age: parseInt(answers.age) || 0,
      gender: answers.gender as "Male" | "Female" | "Other",
      phone: answers.phone || "",
      emergencyContactName: answers.emergencyContactName || "",
      emergencyContactPhone: answers.emergencyContactPhone || "",
      emergencyContactRelation: answers.emergencyContactRelation || "",
      currentMedications: answers.currentMedications || "",
      allergies: answers.allergies || "",
      chronicConditions: answers.chronicConditions || "",
      pastSurgeries: answers.pastSurgeries || "",
      chiefComplaint: answers.chiefComplaint || "",
    };

    onComplete(formattedData);
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden border-0 bg-background/95 backdrop-blur-sm">
        <div className="flex h-full rounded-lg overflow-hidden">
          {/* Left side - Video and controls */}
          <div className="flex-1 bg-gradient-to-br from-black via-gray-900 to-black relative flex flex-col">
            {/* Video container */}
            <div className="flex-1 relative overflow-hidden rounded-l-lg">
              {videoEnabled && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isRecording ? 'ring-4 ring-red-500/50 ring-offset-4 ring-offset-black' : ''
                  }`}
                />
              )}
              
              {/* Animated background when video is off */}
              {!videoEnabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background/20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]"></div>
                </div>
              )}
              
              {/* Overlay content */}
              <div className="absolute inset-0 flex flex-col">
                {/* Top overlay with glass effect */}
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
                        <p className="text-sm text-white/70">AI-Powered Patient Intake</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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

                {/* Center overlay for status messages */}
                <div className="flex-1 flex items-center justify-center">
                  {!hasVideoPermission && !hasAudioPermission && (
                    <div className="text-center text-white animate-fade-in">
                      <div className="relative mb-6">
                        <Camera className="h-20 w-20 mx-auto opacity-60" />
                        <div className="absolute inset-0 animate-pulse">
                          <Camera className="h-20 w-20 mx-auto opacity-20" />
                        </div>
                      </div>
                      <p className="text-xl font-medium mb-2">Setting up your experience</p>
                      <p className="text-white/70">Accessing camera and microphone...</p>
                    </div>
                  )}
                  
                  {!hasVideoPermission && hasAudioPermission && (
                    <div className="text-center text-white animate-fade-in">
                      <AlertCircle className="h-20 w-20 mx-auto mb-6 text-red-400" />
                      <p className="text-xl font-medium mb-2">Camera Access Required</p>
                      <p className="text-white/70 max-w-sm">Please allow camera access for the best experience</p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center text-white animate-fade-in">
                      <div className="relative mb-6">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto"></div>
                        <div className="absolute inset-0 rounded-full bg-white/5 animate-pulse"></div>
                      </div>
                      <p className="text-xl font-medium mb-2">Processing your response</p>
                      <p className="text-white/70">Our AI is analyzing your answer...</p>
                    </div>
                  )}

                  {validationState === 'validating' && (
                    <div className="text-center text-white animate-fade-in">
                      <div className="relative mb-6">
                        <div className="animate-pulse h-20 w-20 bg-primary/30 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm border border-primary/50">
                          <CheckCircle className="h-10 w-10 text-primary" />
                        </div>
                      </div>
                      <p className="text-xl font-medium mb-2">Validating answer</p>
                      <p className="text-white/70">Ensuring accuracy and completeness...</p>
                    </div>
                  )}
                </div>

                {/* Bottom overlay - Recording controls with enhanced design */}
                <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-6">
                    {hasAudioPermission && !isProcessing && validationState !== 'validating' && (
                      <>
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isProcessing || isPlaying || showConfirmation}
                          size="lg"
                          className={`
                            rounded-full w-24 h-24 transition-all duration-300 transform hover:scale-105 border-4
                            ${isRecording 
                              ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse shadow-lg shadow-red-500/50' 
                              : 'bg-white text-black hover:bg-gray-100 border-white/20 shadow-lg shadow-white/20'
                            }
                          `}
                        >
                          {isRecording ? (
                            <Square className="h-10 w-10" />
                          ) : (
                            <Mic className="h-10 w-10" />
                          )}
                        </Button>
                        
                        {isRecording && (
                          <div className="flex items-center gap-4 text-white animate-fade-in">
                            <div className="flex gap-1 items-end">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 bg-gradient-to-t from-white to-white/60 rounded-full transition-all duration-75"
                                  style={{
                                    height: `${8 + Math.random() * 24}px`,
                                    animationDelay: `${i * 50}ms`
                                  }}
                                />
                              ))}
                            </div>
                            <div>
                              <span className="text-lg font-medium">Recording</span>
                              <p className="text-sm text-white/70">Speak clearly and naturally</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Questions and progress with enhanced design */}
          <div className="w-[28rem] border-l border-border/50 bg-gradient-to-br from-background to-muted/20 flex flex-col">
            {/* Enhanced Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Patient Check-in</h2>
                  <p className="text-sm text-muted-foreground">Complete your medical intake</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>
              
              {/* Enhanced Progress bar */}
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

            {/* Current Question with enhanced styling */}
            <div className="flex-1 p-6 overflow-y-auto">
              {hasAudioPermission && (
                <div className="space-y-6">
                  {/* Enhanced Question card */}
                  <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/2 to-primary/5 shadow-lg shadow-primary/5 animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-sm font-bold text-primary-foreground">
                            {currentQuestionIndex + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-3 leading-relaxed">
                            {currentQuestion?.text}
                          </h3>
                          <div className="flex items-center gap-2">
                            {currentQuestion?.required && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {currentQuestion?.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Current answer display */}
                  {currentTranscript && validationState === 'none' && (
                    <Card className="border-border/50 bg-muted/30 animate-fade-in">
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

                  {/* Enhanced Validation result */}
                  {validationState !== 'none' && validationState !== 'validating' && validationMessage && (
                    <Card className={`border-2 transition-all duration-500 animate-scale-in shadow-lg ${
                      validationState === 'valid' 
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:border-green-800 dark:bg-gradient-to-br dark:from-green-950 dark:to-green-900/30' 
                        : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:border-yellow-800 dark:bg-gradient-to-br dark:from-yellow-950 dark:to-yellow-900/30'
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-full p-1 ${
                            validationState === 'valid' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}>
                            {validationState === 'valid' ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1 ${
                              validationState === 'valid' 
                                ? 'text-green-800 dark:text-green-200' 
                                : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {validationState === 'valid' ? '✨ Perfect!' : '🤔 Let\'s clarify'}
                            </p>
                            <p className={`text-sm leading-relaxed ${
                              validationState === 'valid' 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {validationMessage}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Confirmation Interface */}
                  {showConfirmation && currentTranscript && (
                    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100/50 dark:border-green-800 dark:bg-gradient-to-r dark:from-green-950 dark:to-green-900/30 animate-fade-in">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-green-900 dark:text-green-200">Is this correct?</p>
                          <div className="flex items-center gap-1 text-orange-600">
                            <Timer className="w-4 h-4" />
                            <span className="text-sm">{timeRemaining}s</span>
                          </div>
                        </div>
                        <p className="text-green-800 dark:text-green-300 mb-3 bg-background/50 p-3 rounded-md">"{currentTranscript}"</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={confirmAnswer}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            onClick={retryAnswer}
                            variant="outline"
                            size="sm"
                            className="hover:bg-muted/50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                          <Button
                            onClick={skipToNext}
                            variant="outline"
                            size="sm"
                            className="hover:bg-muted/50"
                          >
                            <SkipForward className="w-4 h-4 mr-1" />
                            Skip
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Action buttons */}
                  {currentTranscript && validationState === 'none' && !showConfirmation && (
                    <div className="flex gap-3 animate-fade-in">
                      <Button
                        onClick={handleConfirmAnswer}
                        disabled={!currentTranscript.trim() || isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-600/25 transform transition-all duration-200 hover:scale-105"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm & Continue
                      </Button>
                      <Button
                        onClick={retryQuestion}
                        variant="outline"
                        className="border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Enhanced Manual navigation */}
                  {!showConfirmation && validationState === 'none' && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestionIndex === 0 || isProcessing}
                        className="text-sm hover:bg-muted/50"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={skipToNext}
                        disabled={isProcessing}
                        className="text-sm hover:bg-muted/50"
                      >
                        <SkipForward className="w-4 h-4 mr-1" />
                        Skip Question
                      </Button>
                      {currentQuestionIndex === questions.length - 1 && Object.keys(answers).length >= questions.filter(q => q.required).length && (
                        <Button
                          onClick={completeCheckIn}
                          disabled={isProcessing}
                          className="ml-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                        >
                          Complete Check-In
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Progress summary */}
            <div className="border-t border-border/50 p-5 bg-gradient-to-r from-muted/20 to-muted/10">
              <h4 className="text-sm font-medium text-foreground mb-3">Completed Questions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {questions.slice(0, currentQuestionIndex).map((question, index) => (
                  <div 
                    key={question.id} 
                    className="flex items-center gap-3 text-xs transition-all duration-200 opacity-70 hover:opacity-100 p-2 rounded-md hover:bg-background/50"
                  >
                    <div className="rounded-full p-0.5 bg-green-500">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="truncate flex-1 text-muted-foreground">{question.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};