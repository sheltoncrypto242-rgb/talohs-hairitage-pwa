import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
  userId: string;
}

export function PhotoUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  userId,
}: PhotoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB (increased from 5MB for better quality)
  });

  const handleCameraCapture = () => {
    setCameraOpen(true);
  };

  const handleCameraCaptureComplete = (file: File) => {
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setCameraOpen(false);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a photo");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Compress image if needed (optional)
      let fileToUpload = selectedFile;

      // If image is too large, compress it
      if (selectedFile.size > 5 * 1024 * 1024) {
        fileToUpload = await compressImage(selectedFile);
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("progress-photos").getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase.from("progress_photos").insert({
        user_id: userId,
        photo_url: publicUrl,
        note: note.trim() || null,
      });

      if (dbError) throw dbError;

      // Reset and close
      setSelectedFile(null);
      setPreview(null);
      setNote("");
      onUploadComplete();
      onOpenChange(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Helper function to compress images
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions (max 1920px on the longest side)
          const maxSize = 1920;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            "image/jpeg",
            0.9, // Quality
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setNote("");
    setError(null);
    onOpenChange(false);
  };

  const handleRemovePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Progress Photo</DialogTitle>
            <DialogDescription>
              Capture or upload a photo to track your progress
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Photo Preview */}
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {/* Upload Options */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={handleCameraCapture}
                  >
                    <Camera className="h-8 w-8" />
                    <span>Take Photo</span>
                  </Button>

                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25 hover:border-primary"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isDragActive ? "Drop here" : "Upload from gallery"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Supported formats: JPEG, PNG, GIF, WEBP (max 10MB)
                </p>
              </>
            )}

            {/* Note Input */}
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium">
                Note (Optional)
              </label>
              <Textarea
                id="note"
                placeholder="Add a note about your progress..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="min-w-[120px]"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCaptureComplete}
      />
    </>
  );
}
