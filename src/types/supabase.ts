export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: number
          created_at: string
          role: 'user' | 'assistant'
          content: string
          session_id?: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          role: 'user' | 'assistant'
          content: string
          session_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          role?: 'user' | 'assistant'
          content?: string
          session_id?: string | null
        }
      }
      chat_sessions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string | null
        }
      }
      vaccinations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          date_administered: string | null
          next_due_date: string | null
          status: 'completed' | 'upcoming' | 'overdue'
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          date_administered?: string | null
          next_due_date?: string | null
          status?: 'completed' | 'upcoming' | 'overdue'
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          date_administered?: string | null
          next_due_date?: string | null
          status?: 'completed' | 'upcoming' | 'overdue'
          notes?: string | null
        }
      }
    }
  }
}
