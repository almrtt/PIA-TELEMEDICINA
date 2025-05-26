"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Loader2,
  FileImage,
  Calendar,
  User,
  Stethoscope,
  AlertCircle,
} from "lucide-react"
import type { Study } from "@/lib/supabase"

interface StudyPreviewProps {
  study: Study | null
  isOpen: boolean
  onClose: () => void
}

// Tipos para Cornerstone
declare global {
  interface Window {
    cornerstone: any
    cornerstoneWADOImageLoader: any
    dicomParser: any
  }
}

export function StudyPreview({ study, isOpen, onClose }: StudyPreviewProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState<any>(null)
  const [zoom, setZoom] = useState([1])
  const [contrast, setContrast] = useState([1])
  const [brightness, setBrightness] = useState([0])
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dicomMetadata, setDicomMetadata] = useState<any>(null)

  // Cargar Cornerstone cuando se abre el modal
  useEffect(() => {
    if (isOpen && !isLoaded) {
      loadCornerstone()
    }
  }, [isOpen, isLoaded])

  // Cargar imagen cuando cambia el estudio
  useEffect(() => {
    if (isOpen && study && isLoaded) {
      loadDicomImage()
    }
  }, [isOpen, study, isLoaded])

  const loadCornerstone = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Verificar si ya están cargados
      if (window.cornerstone && window.cornerstoneWADOImageLoader && window.dicomParser) {
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      // Cargar scripts si no están presentes
      const scripts = [
        {
          src: "https://unpkg.com/cornerstone-core@2.6.1/dist/cornerstone.min.js",
          name: "cornerstone",
        },
        {
          src: "https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js",
          name: "wadoImageLoader",
        },
        {
          src: "https://unpkg.com/dicom-parser@1.8.21/dist/dicomParser.min.js",
          name: "dicomParser",
        },
      ]

      for (const script of scripts) {
        if (!document.querySelector(`script[src="${script.src}"]`)) {
          await new Promise((resolve, reject) => {
            const scriptElement = document.createElement("script")
            scriptElement.src = script.src
            scriptElement.onload = resolve
            scriptElement.onerror = reject
            document.head.appendChild(scriptElement)
          })
        }
      }

      // Configurar Cornerstone
      if (window.cornerstone && elementRef.current) {
        window.cornerstone.enable(elementRef.current)

        if (window.cornerstoneWADOImageLoader) {
          window.cornerstoneWADOImageLoader.external.cornerstone = window.cornerstone
          window.cornerstoneWADOImageLoader.external.dicomParser = window.dicomParser
          window.cornerstoneWADOImageLoader.configure({
            useWebWorkers: true,
            decodeConfig: {
              convertFloatPixelDataToInt: false,
            },
          })
        }

        setIsLoaded(true)
      }
    } catch (error) {
      console.error("Error loading Cornerstone:", error)
      setError("Error al cargar el visualizador DICOM")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDicomImage = async () => {
    if (!window.cornerstone || !elementRef.current || !study) return

    setIsLoading(true)
    setError(null)

    try {
      const imageId = `wadouri:${study.file_url}`
      const image = await window.cornerstone.loadImage(imageId)
      window.cornerstone.displayImage(elementRef.current, image)

      setCurrentImage(image)

      // Extraer metadatos DICOM
      if (image.data && image.data.byteArray) {
        try {
          const dataSet = window.dicomParser.parseDicom(image.data.byteArray)
          setDicomMetadata({
            patientName: dataSet.string("x00100010") || "Desconocido",
            studyDescription: dataSet.string("x00081030") || study.study_type,
            studyDate: dataSet.string("x00080020") || study.study_date,
            modality: dataSet.string("x00080060") || "N/A",
            seriesNumber: dataSet.string("x00200011") || "N/A",
            instanceNumber: dataSet.string("x00200013") || "N/A",
            pixelSpacing: dataSet.string("x00280030") || "N/A",
            sliceThickness: dataSet.string("x00180050") || "N/A",
            windowCenter: dataSet.string("x00281050") || "N/A",
            windowWidth: dataSet.string("x00281051") || "N/A",
          })
        } catch (metadataError) {
          console.error("Error parsing DICOM metadata:", metadataError)
        }
      }

      resetView()
    } catch (error) {
      console.error("Error loading DICOM image:", error)
      setError("Error al cargar la imagen DICOM")
    } finally {
      setIsLoading(false)
    }
  }

  const updateViewport = () => {
    if (!window.cornerstone || !elementRef.current || !currentImage) return

    try {
      const viewport = window.cornerstone.getViewport(elementRef.current)

      const newViewport = {
        ...viewport,
        scale: zoom[0],
        rotation: rotation,
        voi: {
          windowWidth: viewport.voi.windowWidth * contrast[0],
          windowCenter: viewport.voi.windowCenter + brightness[0] * 100,
        },
      }

      window.cornerstone.setViewport(elementRef.current, newViewport)
    } catch (error) {
      console.error("Error updating viewport:", error)
    }
  }

  useEffect(() => {
    updateViewport()
  }, [zoom, contrast, brightness, rotation])

  const resetView = () => {
    setZoom([1])
    setContrast([1])
    setBrightness([0])
    setRotation(0)
  }

  const handleZoomIn = () => setZoom([Math.min(4, zoom[0] + 0.25)])
  const handleZoomOut = () => setZoom([Math.max(0.25, zoom[0] - 0.25)])
  const handleRotate = () => setRotation((prev) => prev + 90)

  const handleDownload = () => {
    if (!study) return
    const link = document.createElement("a")
    link.href = study.file_url
    link.download = study.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInViewer = () => {
    if (!study) return
    window.open(`/viewer?fileUrl=${encodeURIComponent(study.file_url)}&studyId=${study.id}`, "_blank")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "in-review":
        return <Badge className="bg-blue-100 text-blue-800">En Revisión</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  if (!study) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileImage className="h-5 w-5 mr-2" />
              Vista Rápida - {study.study_type}
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(study.status)}
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button size="sm" onClick={handleOpenInViewer}>
                <Eye className="h-4 w-4 mr-2" />
                Abrir en Visualizador
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 min-h-0">
          {/* Panel de información */}
          <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
            {/* Información del estudio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Información del Estudio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium">{study.study_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Descripción:</span>
                  <p className="font-medium">{study.study_description || "Sin descripción"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{new Date(study.study_date).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Archivo:</span>
                  <p className="font-mono text-xs break-all">{study.file_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tamaño:</span>
                  <p>{study.file_size ? formatFileSize(study.file_size) : "N/A"}</p>
                </div>
                {study.patient && (
                  <div>
                    <span className="text-gray-500">Paciente:</span>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="font-medium">{study.patient.name}</p>
                        <p className="text-xs text-gray-500">{study.patient.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                {study.doctor && (
                  <div>
                    <span className="text-gray-500">Médico:</span>
                    <div className="flex items-center">
                      <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="font-medium">{study.doctor.name}</p>
                        {study.doctor.specialty && <p className="text-xs text-gray-500">{study.doctor.specialty}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {study.diagnosis && (
                  <div>
                    <span className="text-gray-500">Diagnóstico:</span>
                    <p className="font-medium">{study.diagnosis}</p>
                  </div>
                )}
                {study.notes && (
                  <div>
                    <span className="text-gray-500">Notas:</span>
                    <p className="text-sm">{study.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controles de visualización */}
            {currentImage && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Controles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Zoom */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Zoom: {(zoom[0] * 100).toFixed(0)}%</label>
                    <Slider value={zoom} onValueChange={setZoom} min={0.25} max={4} step={0.25} className="w-full" />
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="outline" onClick={handleZoomOut}>
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleZoomIn}>
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Contraste */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      Contraste: {(contrast[0] * 100).toFixed(0)}%
                    </label>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Brillo */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Brillo: {brightness[0].toFixed(1)}</label>
                    <Slider
                      value={brightness}
                      onValueChange={setBrightness}
                      min={-2}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Rotación */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Rotación: {rotation}°</label>
                    <Button size="sm" variant="outline" onClick={handleRotate} className="w-full">
                      <RotateCw className="h-3 w-3 mr-2" />
                      Rotar 90°
                    </Button>
                  </div>

                  <Button onClick={resetView} className="w-full" variant="secondary" size="sm">
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Restablecer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Metadatos DICOM */}
            {dicomMetadata && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Metadatos DICOM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500">Paciente:</span>
                    <p>{dicomMetadata.patientName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Modalidad:</span>
                    <p>{dicomMetadata.modality}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Serie:</span>
                    <p>{dicomMetadata.seriesNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Instancia:</span>
                    <p>{dicomMetadata.instanceNumber}</p>
                  </div>
                  {dicomMetadata.pixelSpacing !== "N/A" && (
                    <div>
                      <span className="text-gray-500">Espaciado:</span>
                      <p>{dicomMetadata.pixelSpacing}mm</p>
                    </div>
                  )}
                  {dicomMetadata.sliceThickness !== "N/A" && (
                    <div>
                      <span className="text-gray-500">Grosor:</span>
                      <p>{dicomMetadata.sliceThickness}mm</p>
                    </div>
                  )}
                  {currentImage && (
                    <div>
                      <span className="text-gray-500">Dimensiones:</span>
                      <p>
                        {currentImage.width} x {currentImage.height}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Área del visualizador */}
          <div className="flex-1 bg-black rounded-lg flex items-center justify-center relative min-h-0">
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Cargando imagen DICOM...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center text-white bg-red-600 bg-opacity-90 p-6 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                  <p>{error}</p>
                  <Button size="sm" variant="outline" onClick={loadDicomImage} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            <div
              ref={elementRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ minHeight: "400px" }}
            >
              {!currentImage && !isLoading && !error && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Vista Rápida DICOM</p>
                    <p className="text-sm opacity-75">Cargando imagen médica...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay con información */}
            {currentImage && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm">
                <p className="font-medium">{dicomMetadata?.patientName || study.study_type}</p>
                <p className="text-xs opacity-75">{study.file_name}</p>
                <p className="text-xs opacity-75">
                  {dicomMetadata?.modality} • Serie: {dicomMetadata?.seriesNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
