export async function uploadFileToBlob(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validar que sea un archivo DICOM
    if (!file.name.toLowerCase().endsWith(".dcm") && !file.name.toLowerCase().endsWith(".dicom")) {
      return { success: false, error: "Solo se permiten archivos DICOM (.dcm, .dicom)" }
    }

    // Validar tamaño del archivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return { success: false, error: "El archivo es demasiado grande. Máximo 100MB permitido." }
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData()
    formData.append("file", file)

    // Enviar archivo al endpoint de upload
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.message || "Error al subir el archivo" }
    }

    return { success: true, url: result.url }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Error de conexión al subir el archivo" }
  }
}
