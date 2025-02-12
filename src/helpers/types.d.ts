export interface UserWithLastRegistration {
  id: number;
  name: string;
  last_name: string;
  email: string;
  secretariat: string;
  registration_id: number | null;
  entry_capture: Date | null;
  exit_capture: Date | null;
  entry_date: Date | null;
  exit_date: Date | null;
  description: string | null;
  comment: string | null;
  created_at: Date | null;
}
