export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  note: string | null;
  created_at: string;
}

export interface PhotoUpload {
  file: File;
  note: string;
  preview: string;
}

export interface TimelineGroup {
  date: string;
  photos: ProgressPhoto[];
}