import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  isAnalyzing: boolean;
}

export function ImageUpload({ onImageSelect, isAnalyzing }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      setSelectedFile(file);
      onImageSelect(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  if (preview) {
    return (
      <Card className="relative overflow-hidden">
        <img
          src={preview}
          alt="Upload preview"
          className="w-full max-h-[500px] object-contain rounded-lg"
          data-testid="img-upload-preview"
        />
        {!isAnalyzing && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4"
            onClick={clearImage}
            data-testid="button-clear-image"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 transition-colors ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      data-testid="div-upload-zone"
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/bmp"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isAnalyzing}
        data-testid="input-file-upload"
      />
      
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            Drop your image here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>Supports JPG, PNG, BMP</span>
        </div>
      </div>
    </div>
  );
}
