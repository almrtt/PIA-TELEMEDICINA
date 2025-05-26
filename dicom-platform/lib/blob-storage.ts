import { put, del, list } from "@vercel/blob"

export async function uploadDicomFile(
  file: File,
  fileName: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validar que sea un archivo DICOM
    if (!fileName.toLowerCase().endsWith(".dcm") && !fileName.toLowerCase().endsWith(".dicom")) {
      return { success: false, error: "Solo se permiten archivos DICOM (.dcm, .dicom)" }
    }

    // Subir archivo a Vercel Blob
    const blob = await put(`dicom/${Date.now()}-${fileName}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Error al subir el archivo" }
  }
}

export async function deleteDicomFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    await del(url)
    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { success: false, error: "Error al eliminar el archivo" }
  }
}

export async function listDicomFiles() {
  try {
    const { blobs } = await list({ prefix: "dicom/" })
    return { success: true, files: blobs }
  } catch (error) {
    console.error("Error listing files:", error)
    return { success: false, error: "Error al listar archivos" }
  }
}
