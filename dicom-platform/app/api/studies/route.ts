import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { deleteDicomFile } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userType = searchParams.get("userType")

    console.log("🔍 API: Getting studies for user:", userId, "type:", userType)

    if (!userId || !userType) {
      console.log("❌ API: Missing required parameters")
      return NextResponse.json({ success: false, message: "Parámetros requeridos faltantes" }, { status: 400 })
    }

    const serverClient = createServerClient()

    // Primero verificar que el usuario existe
    const { data: user, error: userError } = await serverClient
      .from("users")
      .select("id, name, user_type")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.log("❌ API: User not found:", userError?.message)
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("👤 API: User found:", user.name, user.user_type)

    let query = serverClient
      .from("studies")
      .select(`
        *,
        patient:users!studies_patient_id_fkey(id, name, email),
        doctor:users!studies_doctor_id_fkey(id, name, email, specialty)
      `)
      .order("created_at", { ascending: false })

    // 🔧 NUEVA LÓGICA: Filtrado estricto según tipo de usuario
    if (userType === "patient") {
      // Pacientes solo ven SUS propios estudios
      query = query.eq("patient_id", userId)
      console.log("🔍 API: Filtering studies for patient (own studies only):", userId)
    } else if (userType === "doctor") {
      // Doctores ven TODOS los estudios (para poder asignarlos y gestionarlos)
      console.log("🔍 API: Showing ALL studies for doctor:", userId)
    } else if (userType === "hospital") {
      // Hospitales ven todos los estudios
      console.log("🔍 API: Showing all studies for hospital user")
    }

    const { data: studies, error } = await query

    console.log("📊 API: Query result:", {
      studiesCount: studies?.length || 0,
      error: error?.message,
      firstStudy: studies?.[0]
        ? {
            id: studies[0].id,
            type: studies[0].study_type,
            patient_id: studies[0].patient_id,
            doctor_id: studies[0].doctor_id,
            date: studies[0].study_date,
          }
        : null,
    })

    if (error) {
      console.error("❌ API: Database error:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      studies: studies || [],
      count: studies?.length || 0,
      user: {
        id: user.id,
        name: user.name,
        type: user.user_type,
      },
    })
  } catch (error) {
    console.error("💥 API: Error fetching studies:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fileUrl = formData.get("fileUrl") as string
    const fileName = formData.get("fileName") as string
    const fileSize = formData.get("fileSize") as string
    const studyType = formData.get("studyType") as string
    const studyDescription = formData.get("studyDescription") as string
    const notes = formData.get("notes") as string
    const userId = formData.get("userId") as string
    const userType = formData.get("userType") as string

    console.log("💾 API: Creating study with data:", {
      fileUrl: fileUrl ? "present" : "missing",
      fileName,
      fileSize,
      studyType,
      userId,
      userType,
    })

    if (!fileUrl || !fileName || !userId || !studyType || !userType) {
      console.log("❌ API: Missing required fields")
      return NextResponse.json({ success: false, message: "Datos requeridos faltantes" }, { status: 400 })
    }

    // Verificar que el usuario existe
    const serverClient = createServerClient()

    const { data: user, error: userError } = await serverClient
      .from("users")
      .select("id, name, user_type")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("❌ API: User not found:", userError)
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("👤 API: User verified:", user.name, user.user_type)

    // 🔧 NUEVA LÓGICA: Crear el estudio según el tipo de usuario
    const studyData: any = {
      study_type: studyType,
      study_description: studyDescription || null,
      study_date: new Date().toISOString().split("T")[0],
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize ? Number.parseInt(fileSize) : null,
      notes: notes || null,
      status: "pending" as const,
    }

    // Asignar el usuario según su tipo
    if (userType === "patient") {
      studyData.patient_id = userId
      // doctor_id se queda null hasta que se asigne
    } else if (userType === "doctor") {
      // Si un doctor sube un estudio, se asigna como doctor Y como paciente temporal
      // (puede cambiar esto después)
      studyData.doctor_id = userId
      studyData.patient_id = userId // Temporal, puede reasignarse
    } else if (userType === "hospital") {
      // Para hospitales, crear estudios sin asignar inicialmente
    }

    console.log("💾 API: Inserting study data:", studyData)

    try {
      const { data: study, error } = await serverClient
        .from("studies")
        .insert(studyData)
        .select(`
          *,
          patient:users!studies_patient_id_fkey(id, name, email),
          doctor:users!studies_doctor_id_fkey(id, name, email, specialty)
        `)
        .single()

      console.log("💾 API: Insert operation completed")
      console.log("💾 API: Error:", error)
      console.log("💾 API: Study data:", study ? "Study created" : "No study returned")

      if (error) {
        console.error("❌ API: Detailed error creating study:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return NextResponse.json(
          {
            success: false,
            message: `Error al crear estudio: ${error.message}`,
            error: error,
          },
          { status: 500 },
        )
      }

      if (!study) {
        console.error("❌ API: No study returned from insert")
        return NextResponse.json(
          {
            success: false,
            message: "No se pudo crear el estudio - sin datos retornados",
          },
          { status: 500 },
        )
      }

      console.log("✅ API: Study created successfully:", study.id)

      return NextResponse.json({
        success: true,
        message: "Estudio guardado exitosamente",
        study,
      })
    } catch (insertError) {
      console.error("💥 API: Exception during insert:", insertError)
      return NextResponse.json(
        {
          success: false,
          message: `Error de inserción: ${insertError.message}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("💥 API: Error saving study:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { studyId, diagnosis, doctorId, status } = body

    console.log("🔄 API: Updating study:", studyId, "with data:", { diagnosis, doctorId, status })

    if (!studyId) {
      return NextResponse.json({ success: false, message: "ID de estudio requerido" }, { status: 400 })
    }

    const serverClient = createServerClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (diagnosis) updateData.diagnosis = diagnosis
    if (doctorId) updateData.doctor_id = doctorId
    if (status) updateData.status = status

    const { data: study, error } = await serverClient
      .from("studies")
      .update(updateData)
      .eq("id", studyId)
      .select(`
        *,
        patient:users!studies_patient_id_fkey(id, name, email),
        doctor:users!studies_doctor_id_fkey(id, name, email, specialty)
      `)
      .single()

    if (error) {
      console.error("❌ API: Error updating study:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("✅ API: Study updated successfully")

    return NextResponse.json({
      success: true,
      message: "Estudio actualizado exitosamente",
      study,
    })
  } catch (error) {
    console.error("💥 API: Error updating study:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studyId = searchParams.get("studyId")
    const userId = searchParams.get("userId")
    const userType = searchParams.get("userType")

    console.log("🗑️ API: Deleting study:", studyId, "by user:", userId, "type:", userType)

    if (!studyId || !userId || !userType) {
      return NextResponse.json({ success: false, message: "Parámetros requeridos faltantes" }, { status: 400 })
    }

    const serverClient = createServerClient()

    // Primero obtener el estudio para verificar permisos y obtener la URL del archivo
    const { data: study, error: fetchError } = await serverClient.from("studies").select("*").eq("id", studyId).single()

    if (fetchError || !study) {
      console.error("❌ API: Study not found:", fetchError)
      return NextResponse.json({ success: false, message: "Estudio no encontrado" }, { status: 404 })
    }

    // Verificar permisos de eliminación
    let canDelete = false
    if (userType === "patient" && study.patient_id === userId) {
      canDelete = true // Pacientes pueden eliminar sus propios estudios
    } else if (userType === "doctor") {
      canDelete = true // Doctores pueden eliminar cualquier estudio
    } else if (userType === "hospital") {
      canDelete = true // Hospitales pueden eliminar cualquier estudio
    }

    if (!canDelete) {
      console.log("❌ API: User not authorized to delete this study")
      return NextResponse.json(
        { success: false, message: "No tienes permisos para eliminar este estudio" },
        { status: 403 },
      )
    }

    // Eliminar el archivo de Vercel Blob
    try {
      await deleteDicomFile(study.file_url)
      console.log("✅ API: File deleted from blob storage")
    } catch (blobError) {
      console.error("⚠️ API: Error deleting file from blob storage:", blobError)
      // Continuar con la eliminación de la base de datos aunque falle la eliminación del archivo
    }

    // Eliminar el estudio de la base de datos
    const { error: deleteError } = await serverClient.from("studies").delete().eq("id", studyId)

    if (deleteError) {
      console.error("❌ API: Error deleting study from database:", deleteError)
      return NextResponse.json({ success: false, message: deleteError.message }, { status: 500 })
    }

    console.log("✅ API: Study deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Estudio eliminado exitosamente",
    })
  } catch (error) {
    console.error("💥 API: Error deleting study:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
