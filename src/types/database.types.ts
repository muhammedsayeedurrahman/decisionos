/**
 * Supabase Database Types
 * Auto-generated from schema
 */

export type Role = 'owner' | 'sales' | 'production' | 'finance';
export type TaskType = 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
export type TaskSource = 'TEXT' | 'VOICE' | 'UPLOAD';
export type TaskCategory = 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
export type HandoffStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          workspace_id: string;
          role: Role;
          full_name: string;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          workspace_id: string;
          role: Role;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          role?: Role;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: number;
          workspace_id: string;
          title: string;
          subtext: string | null;
          type: TaskType;
          source: TaskSource;
          category: TaskCategory;
          assigned_to: Role;
          created_by: string | null;
          done: boolean;
          details_count: number;
          scheduled_date: string | null;
          reminder_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          workspace_id: string;
          title: string;
          subtext?: string | null;
          type?: TaskType;
          source?: TaskSource;
          category?: TaskCategory;
          assigned_to: Role;
          created_by?: string | null;
          done?: boolean;
          details_count?: number;
          scheduled_date?: string | null;
          reminder_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          workspace_id?: string;
          title?: string;
          subtext?: string | null;
          type?: TaskType;
          source?: TaskSource;
          category?: TaskCategory;
          assigned_to?: Role;
          created_by?: string | null;
          done?: boolean;
          details_count?: number;
          scheduled_date?: string | null;
          reminder_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      handoffs: {
        Row: {
          id: number;
          workspace_id: string;
          from_role: Role;
          to_role: Role;
          title: string;
          description: string | null;
          instruction: string | null;
          message: string;
          status: HandoffStatus;
          reply_text: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          workspace_id: string;
          from_role: Role;
          to_role: Role;
          title: string;
          description?: string | null;
          instruction?: string | null;
          message: string;
          status?: HandoffStatus;
          reply_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          workspace_id?: string;
          from_role?: Role;
          to_role?: Role;
          title?: string;
          description?: string | null;
          instruction?: string | null;
          message?: string;
          status?: HandoffStatus;
          reply_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          action_label: string | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          read?: boolean;
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          read?: boolean;
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          uploaded_by: string;
          filename: string;
          file_size: number;
          file_type: string;
          title: string | null;
          content: string;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          uploaded_by: string;
          filename: string;
          file_size: number;
          file_type: string;
          title?: string | null;
          content: string;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          uploaded_by?: string;
          filename?: string;
          file_size?: number;
          file_type?: string;
          title?: string | null;
          content?: string;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          workspace_id?: string;
          chunk_index?: number;
          content?: string;
          token_count?: number;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
    };
  };
}
