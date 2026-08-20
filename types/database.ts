// Tipos gerados manualmente a partir do schema SQL (supabase/migrations).
// Se preferir, substitua por `supabase gen types typescript` no futuro.

export type QueueEntryStatus =
  | "WAITING"
  | "CALLED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "REMOVED";

export interface Profile {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Barbershop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  queue_open: boolean;
  average_service_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface QueueEntry {
  id: string;
  barbershop_id: string;
  customer_name: string;
  status: QueueEntryStatus;
  position: number;
  client_token: string;
  joined_at: string;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      barbershops: {
        Row: Barbershop;
        Insert: Partial<Barbershop> & {
          owner_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Barbershop>;
        Relationships: [];
      };
      queue_entries: {
        Row: QueueEntry;
        Insert: Partial<QueueEntry> & {
          barbershop_id: string;
          customer_name: string;
        };
        Update: Partial<QueueEntry>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      call_next: {
        Args: { target_barbershop_id: string };
        Returns: QueueEntry | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
