import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Camera, X, RotateCw, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent } from "./ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCameraReady(false);

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please allow camera access in your browser settings.",
          );
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else if (err.name === "NotReadableError") {
          setError("Camera is already in use by another application.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera. Please try again.");
      }
    }
  }, [facingMode]);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      initCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, initCamera]);

  // Switch camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Create file from blob
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);
          setCapturedImage(previewUrl);
        }
        setIsCapturing(false);
      },
      "image/jpeg",
      0.95, // Quality
    );
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  // Use captured photo
  const usePhoto = () => {
    if (!capturedImage) return;

    // Convert captured image to file
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onCapture(file);
        handleClose();
      });
  };

  // Handle close
  const handleClose = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setError(null);
    setIsCameraReady(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
            <span className="text-white font-medium">Take Photo</span>
            {isMobile && !capturedImage && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={switchCamera}
              >
                <RotateCw className="h-5 w-5" />
              </Button>
            )}
            {!isMobile && !capturedImage && <div className="w-9" />}{" "}
            {/* Spacer */}
          </div>

          {/* Camera View / Captured Image */}
          <div className="relative aspect-video bg-black">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {!isCameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Error Display */}
          {error && (
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <Alert
                variant="destructive"
                className="bg-destructive/90 border-destructive"
              >
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Controls */}
          <div className="p-4 bg-background">
            {!capturedImage ? (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-white hover:bg-gray-100 border-4 border-primary"
                  onClick={capturePhoto}
                  disabled={!isCameraReady || isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-8 w-8 text-primary" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 max-w-[200px]"
                  onClick={retakePhoto}
                >
                  <X className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  size="lg"
                  className="flex-1 max-w-[200px]"
                  onClick={usePhoto}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            )}
          </div>

          {/* Desktop camera switch (outside controls for better UX) */}
          {!isMobile && !capturedImage && (
            <div className="absolute bottom-24 right-4 z-10">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full shadow-lg"
                onClick={switchCamera}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
