"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Activity, FileImage, Download, Eye } from "lucide-react"

export default function SamplesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">TelemedCom</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Archivos DICOM de Ejemplo</h2>
          <p className="text-gray-600 mb-6">
            Descarga archivos DICOM de muestra para probar las funcionalidades del visualizador. Estos archivos
            contienen imágenes médicas reales que puedes usar para familiarizarte con la plataforma.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileImage className="h-5 w-5 mr-2" />
                Cómo usar los archivos de ejemplo
              </CardTitle>
              <CardDescription>Sigue estos pasos para visualizar archivos DICOM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Descargar archivo</h4>
                  <p className="text-sm text-gray-600">
                    Haz clic en el botón de descarga junto al archivo que quieras probar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Ir al visualizador</h4>
                  <p className="text-sm text-gray-600">
                    Navega al visualizador DICOM desde el dashboard o usando el botón de abajo
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Cargar archivo</h4>
                  <p className="text-sm text-gray-600">
                    Usa el botón "Cargar Archivo DICOM" en el visualizador para seleccionar el archivo descargado
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Explorar controles</h4>
                  <p className="text-sm text-gray-600">
                    Usa los controles de zoom, contraste, brillo y rotación para examinar la imagen
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={() => (window.location.href = "/viewer")} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ir al Visualizador DICOM
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Archivos de ejemplo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Archivos Disponibles</CardTitle>
                <CardDescription>Archivos DICOM de diferentes modalidades médicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Radiografía de Tórax</h4>
                        <p className="text-sm text-gray-600">Imagen de rayos X • 512x512 • CR</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">RM Cerebral</h4>
                        <p className="text-sm text-gray-600">Resonancia Magnética • 256x256 • MR</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">TC Abdominal</h4>
                        <p className="text-sm text-gray-600">Tomografía Computarizada • 512x512 • CT</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <FileImage className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Información importante</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Los archivos DICOM contienen imágenes médicas reales anonimizadas para fines educativos. El
                      visualizador soporta la mayoría de modalidades DICOM estándar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
