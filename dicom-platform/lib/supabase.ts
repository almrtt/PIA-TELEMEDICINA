import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente singleton para el lado del cliente
let supabaseClientInstance: any = null

export const supabase = (() => {
  if (typeof window === "undefined") {
    // En el servidor, crear una nueva instancia cada vez
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // En el cliente, usar singleton
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  }
  return supabaseClientInstance
})()

// Cliente para el servidor (solo usar en API routes)
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Tipos de la base de datos
export interface User {
  id: string
  email: string
  name: string
  user_type: "patient" | "doctor" | "hospital"
  specialty?: string
  created_at: string
  updated_at: string
}

export interface Study {
  id: string
  patient_id: string
  doctor_id?: string
  study_type: string
  study_description?: string
  study_date: string
  file_name: string
  file_url: string
  file_size?: number
  diagnosis?: string
  status: "pending" | "in-review" | "completed"
  notes?: string
  dicom_metadata?: any
  created_at: string
  updated_at: string
  // Relaciones
  patient?: User
  doctor?: User
}
