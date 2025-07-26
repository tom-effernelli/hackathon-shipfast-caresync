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
  X
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

  // Auto-ask question when moving to next
  useEffect(() => {
    if (hasAudioPermission && currentQuestion && !isProcessing) {
      setTimeout(() => {
        speakQuestion(currentQuestion.text);
      }, 1000);
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
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCurrentTranscript(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          if (currentTranscript.trim()) {
            processAnswer(currentTranscript.trim());
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
        // Auto-start recording after question is spoken
        setTimeout(() => {
          startRecording();
        }, 500);
      };
      
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;
    
    setIsRecording(true);
    setCurrentTranscript("");
    
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

        // Move to next question after a brief delay
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
          } else {
            completeCheckIn();
          }
        }, 1500);
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
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">Voice-Guided Check-In</DialogTitle>
          <div className="flex items-center justify-between mt-4">
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            <Progress value={progress} className="flex-1 mx-4" />
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Feed */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!hasVideoPermission && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                      <div className="text-center">
                        <VideoOff className="w-12 h-12 mx-auto mb-2" />
                        <p>Camera access needed</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                  )}

                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      <span className="text-sm font-medium">Processing</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question and Controls */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Current Question</h3>
                <p className="text-lg mb-6">{currentQuestion?.text}</p>
                
                {currentTranscript && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Your answer:</p>
                    <p className="text-blue-800">{currentTranscript}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Recording Controls */}
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing || isPlaying}
                      className={isRecording ? "bg-red-500 hover:bg-red-600" : ""}
                      size="lg"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={retryQuestion}
                      disabled={isProcessing || isRecording}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0 || isProcessing}
                    >
                      Previous
                    </Button>

                    {!currentQuestion?.required && (
                      <Button
                        variant="outline"
                        onClick={skipQuestion}
                        disabled={isProcessing}
                      >
                        Skip
                      </Button>
                    )}

                    {currentQuestionIndex === questions.length - 1 && Object.keys(answers).length >= questions.filter(q => q.required).length && (
                      <Button
                        onClick={completeCheckIn}
                        disabled={isProcessing}
                        className="ml-auto"
                      >
                        Complete Check-In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Progress Summary</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {questions.map((q, index) => (
                    <div key={q.id} className="flex items-center gap-2 text-sm">
                      {answers[q.field] ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : index === currentQuestionIndex ? (
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                      ) : (
                        <div className="w-4 h-4 border rounded-full border-gray-300" />
                      )}
                      <span className={index === currentQuestionIndex ? "font-medium" : "text-muted-foreground"}>
                        {q.text.slice(0, 50)}...
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Exit Voice Check-In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};