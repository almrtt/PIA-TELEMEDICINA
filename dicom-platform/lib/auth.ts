import bcrypt from "bcryptjs"
import { createServerClient } from "./supabase"
import type { User } from "./supabase"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(userData: {
  email: string
  password: string
  name: string
  user_type: "patient" | "doctor" | "hospital"
  specialty?: string
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const serverClient = createServerClient()

    // Verificar si el usuario ya existe
    const { data: existingUser } = await serverClient.from("users").select("id").eq("email", userData.email).single()

    if (existingUser) {
      return { success: false, error: "El usuario ya existe" }
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(userData.password)

    // Crear usuario
    const { data: user, error } = await serverClient
      .from("users")
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        user_type: userData.user_type,
        specialty: userData.specialty,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Error del servidor" }
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const serverClient = createServerClient()

    // Buscar usuario por email
    const { data: user, error } = await serverClient.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return { success: false, error: "Credenciales inválidas" }
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Credenciales inválidas" }
    }

    // Remover password_hash del objeto de respuesta
    const { password_hash, ...userWithoutPassword } = user

    return { success: true, user: userWithoutPassword }
  } catch (error) {
    return { success: false, error: "Error del servidor" }
  }
}
