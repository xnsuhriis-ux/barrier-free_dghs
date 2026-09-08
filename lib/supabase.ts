import { createClient } from '@supabase/supabase-js'

// 1. 아래 따옴표 안에 본인의 진짜 Supabase URL을 넣으세요.
const supabaseUrl = "https://iguncettxxmvkvaafiih.supabase.co" 

// 2. 아래 따옴표 안에 본인의 진짜 anon public 키를 넣으세요. (아주 깁니다)
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndW5jZXR0eHhtdmt2YWFmaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MTgyODUsImV4cCI6MjEwMzE5NDI4NX0.El_Ov79dXYDSCD4WOz82mqbPeIHtANX5Iuvt_IQUf9w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export type Report = any;export type Report = any;
export type Report = {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
  lat: number;
  lng: number;
  created_at?: string;
};