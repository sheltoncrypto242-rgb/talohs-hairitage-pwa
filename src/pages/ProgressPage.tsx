import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { type ProgressPhoto as ProgressPhotoType } from "@/types/progress";
import { Button } from "../components/ui/button";
import { Camera, Loader2, ImagePlus } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { PhotoUploadDialog } from "@/components/PhotoUploadDialog";
import { TimelineView } from "@/components/TimelineView";

export function Progress() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhotoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchPhotos();
  }, [user]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data) {
        setPhotos([]);
        return;
      }

      const photosWithUrls = await Promise.all(
        data.map(async (photo) => {
          if (!photo.photo_url) return photo;

          const path = photo.photo_url.replace(
            "https://viglpwqnrievcdraviiu.supabase.co/storage/v1/object/public/progress-photos/",
            "",
          );

          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(path, 3600);

          return {
            ...photo,
            photo_url: signed?.signedUrl,
          };
        }),
      );

      setPhotos(photosWithUrls);
    } catch (err) {
      setError("Failed to load photos");
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = () => {
    fetchPhotos();
    setUploadDialogOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Please sign in to view your progress photos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Progress Timeline
          </h1>

          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Track your hair growth journey over time
          </p>
        </div>

        <Button
          onClick={() => setUploadDialogOpen(true)}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <Camera className="h-4 w-4" />
          Add Progress Photo
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Card Container */}
      <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading progress photos...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && photos.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-4">
            <ImagePlus className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No progress photos yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first photo to start tracking progress
              </p>
            </div>

            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Upload First Photo
            </Button>
          </div>
        )}

        {/* Timeline */}
        {!loading && photos.length > 0 && (
          <TimelineView photos={photos} onPhotoDeleted={fetchPhotos} />
        )}
      </div>

      {/* Mobile Floating Upload Button */}
      <Button
        onClick={() => setUploadDialogOpen(true)}
        className="fixed bottom-6 right-6 md:hidden shadow-lg rounded-full h-14 w-14 p-0"
      >
        <Camera className="h-5 w-5" />
      </Button>

      {/* Upload Dialog */}
      <PhotoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handlePhotoUploaded}
        userId={user.id}
      />
    </div>
  );
}
