import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ImageUpload";
import { AnalysisResults } from "@/components/AnalysisResults";
import { LoadingState } from "@/components/LoadingState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GeolocationAnalysis } from "@shared/schema";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<GeolocationAnalysis | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest<GeolocationAnalysis>(
        "POST",
        "/api/analyze",
        { image: imageBase64 }
      );
      return response;
    },
    onSuccess: (data) => {
      console.log("API Response:", data);
      setAnalysis(data);
    },
  });

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedImage({ file, preview });
    setAnalysis(null);

    // Convert to base64 and analyze
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      analyzeMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleNewAnalysis = () => {
    setSelectedImage(null);
    setAnalysis(null);
    analyzeMutation.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PG</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Photo Geolocator</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Estimate where a photo was taken
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Image</h2>
              <p className="text-muted-foreground">
                Upload any photo to analyze its location using AI vision
              </p>
            </div>

            <ImageUpload
              onImageSelect={handleImageSelect}
              isAnalyzing={analyzeMutation.isPending}
            />

            {selectedImage && (
              <Button
                variant="outline"
                onClick={handleNewAnalysis}
                className="w-full"
                disabled={analyzeMutation.isPending}
                data-testid="button-new-analysis"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Analyze Different Image
              </Button>
            )}

            {/* Error State */}
            {analyzeMutation.isError && (
              <Alert variant="destructive" data-testid="alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to analyze image. Please try again with a different photo.
                </AlertDescription>
              </Alert>
            )}

            {/* Getting Started Tips */}
            {!selectedImage && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">How it works</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Upload any image (JPG, PNG, or BMP format)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>AI analyzes visual features like architecture, vegetation, and signage</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Get predicted location with confidence score and detailed reasoning</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>View results on an interactive map with accuracy radius</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-3">
            {analyzeMutation.isPending && <LoadingState />}
            
            {analysis && !analyzeMutation.isPending && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Analysis Results</h2>
                  <p className="text-muted-foreground">
                    Location prediction based on visual analysis
                  </p>
                </div>
                <AnalysisResults analysis={analysis} />
              </div>
            )}

            {!selectedImage && !analyzeMutation.isPending && (
              <div className="h-full flex items-center justify-center p-12">
                <div className="text-center space-y-3 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Ready to analyze</h3>
                  <p className="text-muted-foreground">
                    Upload an image to see AI-powered geolocation analysis in action
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
