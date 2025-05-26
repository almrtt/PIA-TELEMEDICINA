import { type NextRequest, NextResponse } from "next/server"
import { createUser, authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name, type, specialty } = body

    if (action === "login") {
      const result = await authenticateUser(email, password)

      if (result.success) {
        return NextResponse.json({
          success: true,
          user: result.user,
        })
      } else {
        return NextResponse.json({ success: false, message: result.error }, { status: 401 })
      }
    }

    if (action === "register") {
      const result = await createUser({
        email,
        password,
        name,
        user_type: type,
        specialty,
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "Usuario registrado exitosamente",
          user: result.user,
        })
      } else {
        return NextResponse.json({ success: false, message: result.error }, { status: 400 })
      }
    }

    return NextResponse.json({ success: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}
