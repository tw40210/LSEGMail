export interface Member {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Rotation {
  id: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RotationMember {
  id: string;
  member_id: string;
  position: number;
  name: string;
  email: string;
}

export interface RotationWithMembers extends Rotation {
  members: RotationMember[];
}

export interface CalendarEvent {
  id: string;
  rotation_id: string;
  member_id: string | null;
  event_date: string;
  title: string | null;
  notes: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  manually_edited: boolean;
  member_name: string | null;
  member_email: string | null;
  rotation_name: string;
  frequency: "daily" | "weekly";
  created_at: string;
  updated_at: string;
}

export interface GmailStatus {
  authorized: boolean;
  authorized_email: string | null;
  email_subject_template: string;
  email_body_template: string;
}
