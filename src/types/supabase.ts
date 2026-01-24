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
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          age: number | null
          height_cm: number | null
          weight_kg: number | null
          gender: string | null
          blood_type: string | null
          allergies: string | null
          medical_conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          age?: number | null
          height_cm?: number | null
          weight_kg?: number | null
          gender?: string | null
          blood_type?: string | null
          allergies?: string | null
          medical_conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          age?: number | null
          height_cm?: number | null
          weight_kg?: number | null
          gender?: string | null
          blood_type?: string | null
          allergies?: string | null
          medical_conditions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          title: string
          description: string | null
          lat: number
          lng: number
          severity: 'high' | 'medium' | 'low'
          radius: number
          city: string | null
          state: string | null
          status: 'pending' | 'verified' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          lat: number
          lng: number
          severity?: 'high' | 'medium' | 'low'
          radius?: number
          city?: string | null
          state?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          lat?: number
          lng?: number
          severity?: 'high' | 'medium' | 'low'
          radius?: number
          city?: string | null
          state?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
        }
      }
      vaccinations: {
        Row: {
          id: string
          user_id: string
          name: string
          status: 'completed' | 'upcoming' | 'overdue' | null
          date_administered: string | null
          next_due_date: string | null
          due_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: 'completed' | 'upcoming' | 'overdue' | null
          date_administered?: string | null
          next_due_date?: string | null
          due_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: 'completed' | 'upcoming' | 'overdue' | null
          date_administered?: string | null
          next_due_date?: string | null
          due_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string | null
          role: 'user' | 'assistant' | null
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          role?: 'user' | 'assistant' | null
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: 'user' | 'assistant' | null
          content?: string | null
          created_at?: string
        }
      }
    }
  }
}
