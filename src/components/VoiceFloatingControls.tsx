import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Play, 
  SkipForward, 
  X, 
  Zap, 
  Edit,
  CheckCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VoiceFloatingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  quickMode: boolean;
  confidenceLevel: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResume: () => void;
  onSkip: () => void;
  onToggleQuickMode: () => void;
  onClose: () => void;
  onFinishManually: () => void;
  canSkip: boolean;
}

export const VoiceFloatingControls: React.FC<VoiceFloatingControlsProps> = ({
  isRecording,
  isPaused,
  quickMode,
  confidenceLevel,
  onStartRecording,
  onStopRecording,
  onResume,
  onSkip,
  onToggleQuickMode,
  onClose,
  onFinishManually,
  canSkip
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-60 space-y-3">
      {/* Main Voice Control */}
      <div className="bg-background border rounded-full shadow-lg p-2">
        <div className="relative">
          <Button
            onClick={isPaused ? onResume : isRecording ? onStopRecording : onStartRecording}
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="w-16 h-16 rounded-full relative overflow-hidden"
          >
            {isPaused ? (
              <Play className="w-6 h-6" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          
          {/* Progress Ring */}
          {confidenceLevel > 0 && (
            <div className="absolute inset-0 rounded-full">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${confidenceLevel * 175.9} 175.9`}
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2 min-w-[200px]">
        {/* Quick Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quick Mode</span>
          <Button
            onClick={onToggleQuickMode}
            variant={quickMode ? "default" : "outline"}
            size="sm"
            className="h-6"
          >
            <Zap className="w-3 h-3 mr-1" />
            {quickMode ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Confidence Indicator */}
        {confidenceLevel > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Confidence</span>
              <span>{Math.round(confidenceLevel * 100)}%</span>
            </div>
            <Progress value={confidenceLevel * 100} className="h-1" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {canSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <SkipForward className="w-3 h-3 mr-1" />
              Skip
            </Button>
          )}
          
          <Button
            onClick={onFinishManually}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Manual
          </Button>
        </div>

        {/* Always visible finish button */}
        <Button
          onClick={onFinishManually}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Finish Manually
        </Button>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="w-full text-xs text-destructive hover:text-destructive"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel Voice Check-in
        </Button>
      </div>

      {/* Status Indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
          isRecording 
            ? 'bg-destructive/10 text-destructive' 
            : isPaused 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isRecording 
              ? 'bg-destructive animate-pulse' 
              : isPaused 
              ? 'bg-amber-500' 
              : 'bg-muted-foreground'
          }`} />
          {isRecording ? 'Recording...' : isPaused ? 'Paused' : 'Ready'}
        </div>
      </div>
    </div>
  );
};