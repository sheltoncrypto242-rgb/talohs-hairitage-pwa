import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import type { ProgressPhoto } from "@/types/progress";
import { useAuth } from "@/context/AuthContext";

interface TimelineViewProps {
  photos: ProgressPhoto[];
  onPhotoDeleted: () => void;
}

export function TimelineView({ photos, onPhotoDeleted }: TimelineViewProps) {
  const { user } = useAuth();
  const handleDelete = async (
    photoId: string,
    photoUrl: string,
    userId: string,
  ) => {
    try {
      // 1️⃣ Delete from database
      const { error: dbError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("id", photoId)
        .eq("user_id", userId); // extra safety: only allow deleting own record

      if (dbError) throw dbError;

      // 2️⃣ Delete from storage
      if (photoUrl) {
        // Parse URL
        const url = new URL(photoUrl);

        // Extract filename from the path
        const filename = url.pathname.split("/").pop();
        if (!filename) throw new Error("Invalid photo URL");

        // Build full path in private folder by user ID
        const bucketPath = `${userId}/${filename}`;

        const { error: storageError } = await supabase.storage
          .from("progress-photos")
          .remove([bucketPath]);

        if (storageError) throw storageError;
      }

      // 3️⃣ Refresh photos
      onPhotoDeleted();
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground max-w-sm">
            No progress photos yet. Start your journey by uploading your first
            photo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-4 md:left-8 top-0 bottom-0 w-[2px] bg-border" />

      <div className="space-y-10">
        {photos.map((photo) => (
          <div key={photo.id} className="relative flex gap-4 md:gap-6">
            {/* Timeline Dot */}
            <div className="absolute left-4 md:left-8 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

            {/* Date */}
            <div className="hidden md:block w-28 pt-4 text-sm text-muted-foreground">
              {format(new Date(photo.created_at), "MMM d, yyyy")}
            </div>

            {/* Card */}
            <Card className="flex-1 ml-8 md:ml-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full md:w-36 h-56 md:h-36 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={photo.photo_url}
                      alt={`Progress photo from ${format(
                        new Date(photo.created_at),
                        "MMMM d, yyyy",
                      )}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-between flex-1">
                    {/* Mobile Date */}
                    <p className="md:hidden text-xs text-muted-foreground mb-1">
                      {format(new Date(photo.created_at), "MMM d, yyyy")}
                    </p>

                    {/* Note */}
                    {photo.note && (
                      <p className="text-sm mb-3 leading-relaxed">
                        {photo.note}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this progress
                              photo? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(
                                  photo.id,
                                  photo.photo_url,
                                  user?.id as string,
                                )
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
