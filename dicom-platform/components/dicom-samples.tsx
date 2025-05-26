"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileImage } from "lucide-react"

const sampleDicomFiles = [
  {
    name: "Radiografía de Tórax",
    description: "Imagen de rayos X del tórax",
    url: "https://barre.dev/medical/samples/chest.dcm",
    size: "512x512",
    type: "CR",
  },
  {
    name: "Resonancia Magnética Cerebral",
    description: "Corte axial de RM cerebral",
    url: "https://barre.dev/medical/samples/brain_mri.dcm",
    size: "256x256",
    type: "MR",
  },
  {
    name: "Tomografía Computarizada",
    description: "Corte de TC abdominal",
    url: "https://barre.dev/medical/samples/ct_abdomen.dcm",
    size: "512x512",
    type: "CT",
  },
]

export function DicomSamples() {
  const downloadSample = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Error downloading sample:", error)
      alert("Error al descargar el archivo de ejemplo")
    }
  }

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <FileImage className="h-4 w-4 mr-2" />
          Archivos DICOM de Ejemplo
        </CardTitle>
        <CardDescription className="text-gray-300">
          Descarga archivos DICOM de muestra para probar el visualizador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sampleDicomFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded">
            <div className="flex-1">
              <h4 className="text-white text-sm font-medium">{file.name}</h4>
              <p className="text-gray-300 text-xs">{file.description}</p>
              <p className="text-gray-400 text-xs">
                {file.type} • {file.size}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSample(file.url, `${file.name.toLowerCase().replace(/\s+/g, "_")}.dcm`)}
              className="ml-2"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <div className="text-xs text-gray-400 mt-3">
          <p>💡 Tip: Descarga un archivo y luego cárgalo en el visualizador usando el botón "Cargar Archivo DICOM"</p>
        </div>
      </CardContent>
    </Card>
  )
}
