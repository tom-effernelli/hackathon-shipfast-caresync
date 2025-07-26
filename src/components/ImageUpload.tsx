import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageAnalysisResult, analyzePatientImage } from '@/lib/api';

interface ImageUploadProps {
  onAnalysisComplete: (analysis: ImageAnalysisResult) => void;
  disabled?: boolean;
}

export function ImageUpload({ onAnalysisComplete, disabled }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAnalysis(null); // Clear previous analysis
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzePatientImage(selectedImage);
      setAnalysis(result);
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Injury/Burn Photo (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!imagePreview ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Upload a photo of the injury or affected area for AI-powered preliminary assessment
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Choose Photo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected injury"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {!analysis && (
              <Button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing || disabled}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing Image...' : 'Analyze with AI'}
              </Button>
            )}

            {analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Preliminary AI Assessment</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Urgency Level:</span>
                    <Badge className={getUrgencyColor(analysis.urgency_level)}>
                      {analysis.urgency_level.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      ({Math.round(analysis.confidence * 100)}% confidence)
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Observations:</span>
                    <ul className="text-sm text-gray-700 ml-4 mt-1">
                      {analysis.observations.map((obs, index) => (
                        <li key={index} className="list-disc">{obs}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Recommendations:</span>
                    <ul className="text-sm text-gray-700 ml-4 mt-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="list-disc">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}