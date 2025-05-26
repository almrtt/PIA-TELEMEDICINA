import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar que sea un archivo DICOM
    if (!file.name.toLowerCase().endsWith(".dcm") && !file.name.toLowerCase().endsWith(".dicom")) {
      return NextResponse.json(
        { success: false, message: "Solo se permiten archivos DICOM (.dcm, .dicom)" },
        { status: 400 },
      )
    }

    // Validar tamaño del archivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "El archivo es demasiado grande. Máximo 100MB permitido." },
        { status: 400 },
      )
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomSuffix}-${file.name}`

    // Subir archivo a Vercel Blob
    const blob = await put(`dicom/${fileName}`, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "Archivo subido exitosamente",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
