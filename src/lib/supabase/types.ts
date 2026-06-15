export type UserRole = "trainer" | "client";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "stripe" | "cash" | "transfer" | "other";
export type RoutineStatus = "draft" | "active" | "archived";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "glutes" | "core" | "cardio" | "full_body" | "other";
export type PreferredLanguage = "es" | "en";

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      routine_status: RoutineStatus;
      difficulty_level: DifficultyLevel;
      muscle_group: MuscleGroup;
      preferred_language: PreferredLanguage;
    };
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone: string | null;
          date_of_birth: string | null;
          weight_kg: number | null;
          height_cm: number | null;
          preferred_language: PreferredLanguage;
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          preferred_language?: PreferredLanguage;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          preferred_language?: PreferredLanguage;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          trainer_id: string;
          email: string;
          token: string;
          status: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          email: string;
          token?: string;
          status?: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          email?: string;
          token?: string;
          status?: string;
          expires_at?: string;
        };
        Relationships: [
          { foreignKeyName: "invitations_trainer_id_fkey"; columns: ["trainer_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      trainer_clients: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string;
          active: boolean;
          status: string;
          ended_at: string | null;
          notes: string | null;
          monthly_fee: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          client_id: string;
          active?: boolean;
          status?: string;
          ended_at?: string | null;
          notes?: string | null;
          monthly_fee?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string;
          active?: boolean;
          status?: string;
          ended_at?: string | null;
          notes?: string | null;
          monthly_fee?: number | null;
        };
        Relationships: [
          { foreignKeyName: "trainer_clients_trainer_id_fkey"; columns: ["trainer_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "trainer_clients_client_id_fkey"; columns: ["client_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      routines: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          status: RoutineStatus;
          difficulty: DifficultyLevel;
          duration_weeks: number | null;
          days_per_week: number | null;
          is_template: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          client_id?: string | null;
          name: string;
          description?: string | null;
          status?: RoutineStatus;
          difficulty?: DifficultyLevel;
          duration_weeks?: number | null;
          days_per_week?: number | null;
          is_template?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          status?: RoutineStatus;
          difficulty?: DifficultyLevel;
          duration_weeks?: number | null;
          days_per_week?: number | null;
          is_template?: boolean;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "routines_trainer_id_fkey"; columns: ["trainer_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "routines_client_id_fkey"; columns: ["client_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      exercises: {
        Row: {
          id: string;
          created_by: string | null;
          name_es: string;
          name_en: string;
          description_es: string | null;
          description_en: string | null;
          muscle_group: MuscleGroup;
          difficulty: DifficultyLevel;
          video_url: string | null;
          thumbnail_url: string | null;
          is_global: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          name_es: string;
          name_en: string;
          description_es?: string | null;
          description_en?: string | null;
          muscle_group?: MuscleGroup;
          difficulty?: DifficultyLevel;
          video_url?: string | null;
          thumbnail_url?: string | null;
          is_global?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string | null;
          name_es?: string;
          name_en?: string;
          description_es?: string | null;
          description_en?: string | null;
          muscle_group?: MuscleGroup;
          difficulty?: DifficultyLevel;
          video_url?: string | null;
          thumbnail_url?: string | null;
          is_global?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          method: PaymentMethod;
          description: string | null;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          stripe_receipt_url: string | null;
          due_date: string | null;
          paid_at: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          client_id: string;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          method?: PaymentMethod;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          stripe_receipt_url?: string | null;
          due_date?: string | null;
          paid_at?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          method?: PaymentMethod;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          stripe_receipt_url?: string | null;
          due_date?: string | null;
          paid_at?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payments_trainer_id_fkey"; columns: ["trainer_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_client_id_fkey"; columns: ["client_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          day_number: number;
          order_index: number;
          sets: number;
          reps: number | null;
          duration_sec: number | null;
          rest_sec: number;
          weight_kg: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          day_number?: number;
          order_index?: number;
          sets?: number;
          reps?: number | null;
          duration_sec?: number | null;
          rest_sec?: number;
          weight_kg?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          day_number?: number;
          order_index?: number;
          sets?: number;
          reps?: number | null;
          duration_sec?: number | null;
          rest_sec?: number;
          weight_kg?: number | null;
          notes?: string | null;
        };
        Relationships: [
          { foreignKeyName: "routine_exercises_routine_id_fkey"; columns: ["routine_id"]; referencedRelation: "routines"; referencedColumns: ["id"] },
          { foreignKeyName: "routine_exercises_exercise_id_fkey"; columns: ["exercise_id"]; referencedRelation: "exercises"; referencedColumns: ["id"] }
        ];
      };
      tracking_logs: {
        Row: {
          id: string;
          client_id: string;
          routine_id: string | null;
          routine_exercise_id: string | null;
          exercise_id: string | null;
          logged_at: string;
          sets_completed: number | null;
          reps_completed: number | null;
          weight_kg: number | null;
          duration_sec: number | null;
          rpe: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          routine_id?: string | null;
          routine_exercise_id?: string | null;
          exercise_id?: string | null;
          logged_at?: string;
          sets_completed?: number | null;
          reps_completed?: number | null;
          weight_kg?: number | null;
          duration_sec?: number | null;
          rpe?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          routine_id?: string | null;
          routine_exercise_id?: string | null;
          exercise_id?: string | null;
          logged_at?: string;
          sets_completed?: number | null;
          reps_completed?: number | null;
          weight_kg?: number | null;
          duration_sec?: number | null;
          rpe?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
  };
}
