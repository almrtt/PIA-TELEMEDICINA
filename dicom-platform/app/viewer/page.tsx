"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ZoomIn, ZoomOut, RotateCw, Move, Download, FileImage, Info, Upload, Loader2 } from "lucide-react"

// Agregar después de los imports existentes
import { DicomSamples } from "@/components/dicom-samples"

// Tipos para Cornerstone
declare global {
  interface Window {
    cornerstone: any
    cornerstoneWADOImageLoader: any
    dicomParser: any
  }
}

export default function DicomViewer() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentImage, setCurrentImage] = useState<any>(null)
  const [zoom, setZoom] = useState([1])
  const [contrast, setContrast] = useState([1])
  const [brightness, setBrightness] = useState([0])
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [translation, setTranslation] = useState({ x: 0, y: 0 })
  const [dicomData, setDicomData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Datos del estudio
  const [studyData, setStudyData] = useState({
    patientName: "Seleccionar archivo DICOM",
    studyType: "No hay archivo cargado",
    date: new Date().toISOString().split("T")[0],
    doctor: "N/A",
    fileName: "Ninguno",
    series: "N/A",
    instance: "N/A",
    pixelSpacing: "N/A",
    sliceThickness: "N/A",
  })

  useEffect(() => {
    const loadCornerstone = async () => {
      try {
        // Cargar Cornerstone y dependencias
        const cornerstoneScript = document.createElement("script")
        cornerstoneScript.src = "https://unpkg.com/cornerstone-core@2.6.1/dist/cornerstone.min.js"
        document.head.appendChild(cornerstoneScript)

        const wadoScript = document.createElement("script")
        wadoScript.src =
          "https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js"
        document.head.appendChild(wadoScript)

        const dicomParserScript = document.createElement("script")
        dicomParserScript.src = "https://unpkg.com/dicom-parser@1.8.21/dist/dicomParser.min.js"
        document.head.appendChild(dicomParserScript)

        // Esperar a que se carguen los scripts
        await new Promise((resolve) => {
          let loadedCount = 0
          const checkLoaded = () => {
            loadedCount++
            if (loadedCount === 3) resolve(true)
          }
          cornerstoneScript.onload = checkLoaded
          wadoScript.onload = checkLoaded
          dicomParserScript.onload = checkLoaded
        })

        // Inicializar Cornerstone
        if (window.cornerstone && elementRef.current) {
          window.cornerstone.enable(elementRef.current)

          // Configurar WADO Image Loader
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

          // Verificar si hay un archivo en la URL
          const urlParams = new URLSearchParams(window.location.search)
          const fileUrl = urlParams.get("fileUrl")
          if (fileUrl) {
            loadDicomFromUrl(decodeURIComponent(fileUrl))
          }
        }
      } catch (error) {
        console.error("Error loading Cornerstone:", error)
      }
    }

    loadCornerstone()

    return () => {
      if (window.cornerstone && elementRef.current) {
        try {
          window.cornerstone.disable(elementRef.current)
        } catch (error) {
          console.error("Error disabling cornerstone:", error)
        }
      }
    }
  }, [])

  const loadDicomFromUrl = async (url: string) => {
    if (!window.cornerstone || !elementRef.current) return

    setIsLoading(true)

    try {
      const imageId = `wadouri:${url}`
      const image = await window.cornerstone.loadImage(imageId)
      window.cornerstone.displayImage(elementRef.current, image)

      setCurrentImage(image)

      // Extraer metadatos si están disponibles
      if (image.data && image.data.byteArray) {
        try {
          const dataSet = window.dicomParser.parseDicom(image.data.byteArray)

          const patientName = dataSet.string("x00100010") || "Desconocido"
          const studyDescription = dataSet.string("x00081030") || "Estudio DICOM"
          const studyDate = dataSet.string("x00080020") || new Date().toISOString().split("T")[0]
          const physicianName = dataSet.string("x00080090") || "No especificado"
          const seriesNumber = dataSet.string("x00200011") || "N/A"
          const instanceNumber = dataSet.string("x00200013") || "N/A"
          const pixelSpacing = dataSet.string("x00280030") || "N/A"
          const sliceThickness = dataSet.string("x00180050") || "N/A"

          setStudyData({
            patientName,
            studyType: studyDescription,
            date: studyDate,
            doctor: physicianName,
            fileName: url.split("/").pop() || "archivo.dcm",
            series: seriesNumber,
            instance: instanceNumber,
            pixelSpacing: pixelSpacing !== "N/A" ? `${pixelSpacing}mm` : "N/A",
            sliceThickness: sliceThickness !== "N/A" ? `${sliceThickness}mm` : "N/A",
          })

          setDicomData(dataSet)
        } catch (metadataError) {
          console.error("Error parsing DICOM metadata:", metadataError)
        }
      }

      resetView()
    } catch (error) {
      console.error("Error loading DICOM from URL:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".dcm") && !file.name.toLowerCase().endsWith(".dicom")) {
      alert("Por favor selecciona un archivo DICOM válido (.dcm o .dicom)")
      return
    }

    setIsLoading(true)

    try {
      // Crear URL del archivo
      const fileUrl = URL.createObjectURL(file)
      const imageId = `wadouri:${fileUrl}`

      if (window.cornerstone && elementRef.current) {
        // Cargar y mostrar la imagen
        const image = await window.cornerstone.loadImage(imageId)
        window.cornerstone.displayImage(elementRef.current, image)

        setCurrentImage(image)

        // Extraer metadatos DICOM
        if (image.data && image.data.byteArray) {
          try {
            const dataSet = window.dicomParser.parseDicom(image.data.byteArray)

            const patientName = dataSet.string("x00100010") || "Desconocido"
            const studyDescription = dataSet.string("x00081030") || "Estudio DICOM"
            const studyDate = dataSet.string("x00080020") || new Date().toISOString().split("T")[0]
            const physicianName = dataSet.string("x00080090") || "No especificado"
            const seriesNumber = dataSet.string("x00200011") || "N/A"
            const instanceNumber = dataSet.string("x00200013") || "N/A"
            const pixelSpacing = dataSet.string("x00280030") || "N/A"
            const sliceThickness = dataSet.string("x00180050") || "N/A"

            setStudyData({
              patientName,
              studyType: studyDescription,
              date: studyDate,
              doctor: physicianName,
              fileName: file.name,
              series: seriesNumber,
              instance: instanceNumber,
              pixelSpacing: pixelSpacing !== "N/A" ? `${pixelSpacing}mm` : "N/A",
              sliceThickness: sliceThickness !== "N/A" ? `${sliceThickness}mm` : "N/A",
            })

            setDicomData(dataSet)
          } catch (metadataError) {
            console.error("Error parsing DICOM metadata:", metadataError)
            setStudyData((prev) => ({
              ...prev,
              fileName: file.name,
              studyType: "Archivo DICOM cargado",
              patientName: "Metadatos no disponibles",
            }))
          }
        }

        // Resetear controles
        resetView()
      }
    } catch (error) {
      console.error("Error loading DICOM file:", error)
      alert("Error al cargar el archivo DICOM. Asegúrate de que sea un archivo válido.")
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
        translation: translation,
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
  }, [zoom, contrast, brightness, rotation, translation])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentImage) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !currentImage) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    setTranslation((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setZoom([1])
    setContrast([1])
    setBrightness([0])
    setRotation(0)
    setTranslation({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoom([Math.min(4, zoom[0] + 0.25)])
  }

  const handleZoomOut = () => {
    setZoom([Math.max(0.25, zoom[0] - 0.25)])
  }

  const handleRotate = (degrees: number) => {
    setRotation((prev) => prev + degrees)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-white hover:bg-gray-700 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <FileImage className="h-6 w-6 mr-2" />
              <h1 className="text-lg font-semibold">Visualizador DICOM</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Serie: {studyData.series}</Badge>
              <Badge variant="outline">Instancia: {studyData.instance}</Badge>
              <Button size="sm" variant="outline" disabled={!currentImage}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar con controles */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          {/* Carga de archivo */}
          <Card className="bg-gray-700 border-gray-600 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Cargar Archivo DICOM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".dcm,.dicom"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
              />
              {isLoading && (
                <div className="flex items-center text-yellow-400 text-xs mt-2">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Cargando archivo DICOM...
                </div>
              )}
              {!isLoaded && <p className="text-red-400 text-xs mt-2">Cargando librerías DICOM...</p>}
            </CardContent>
          </Card>

          {/* En el JSX, después del Card de "Cargar Archivo DICOM", agregar: */}
          <DicomSamples />

          {/* Información del paciente */}
          <Card className="bg-gray-700 border-gray-600 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Información del Estudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Paciente:</span>
                <p className="text-white font-medium">{studyData.patientName}</p>
              </div>
              <div>
                <span className="text-gray-400">Estudio:</span>
                <p className="text-white">{studyData.studyType}</p>
              </div>
              <div>
                <span className="text-gray-400">Fecha:</span>
                <p className="text-white">{studyData.date}</p>
              </div>
              <div>
                <span className="text-gray-400">Médico:</span>
                <p className="text-white">{studyData.doctor}</p>
              </div>
              <div>
                <span className="text-gray-400">Archivo:</span>
                <p className="text-white font-mono text-xs">{studyData.fileName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Controles de visualización */}
          <Card className="bg-gray-700 border-gray-600 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zoom */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Zoom: {(zoom[0] * 100).toFixed(0)}%</label>
                <Slider
                  value={zoom}
                  onValueChange={setZoom}
                  min={0.25}
                  max={4}
                  step={0.25}
                  className="w-full"
                  disabled={!currentImage}
                />
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={!currentImage}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={!currentImage}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Contraste */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Contraste: {(contrast[0] * 100).toFixed(0)}%</label>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                  disabled={!currentImage}
                />
              </div>

              {/* Brillo */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Brillo: {brightness[0].toFixed(1)}</label>
                <Slider
                  value={brightness}
                  onValueChange={setBrightness}
                  min={-2}
                  max={2}
                  step={0.1}
                  className="w-full"
                  disabled={!currentImage}
                />
              </div>

              {/* Rotación */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Rotación: {rotation}°</label>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleRotate(-90)} disabled={!currentImage}>
                    <RotateCw className="h-4 w-4 transform scale-x-[-1]" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRotate(90)} disabled={!currentImage}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={resetView} className="w-full" variant="secondary" disabled={!currentImage}>
                Restablecer Vista
              </Button>
            </CardContent>
          </Card>

          {/* Información técnica */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">Espaciado de píxel:</span>
                <p className="text-white">{studyData.pixelSpacing}</p>
              </div>
              <div>
                <span className="text-gray-400">Grosor de corte:</span>
                <p className="text-white">{studyData.sliceThickness}</p>
              </div>
              <div>
                <span className="text-gray-400">Posición:</span>
                <p className="text-white">
                  X: {translation.x.toFixed(0)}, Y: {translation.y.toFixed(0)}
                </p>
              </div>
              {currentImage && (
                <>
                  <div>
                    <span className="text-gray-400">Dimensiones:</span>
                    <p className="text-white">
                      {currentImage.width} x {currentImage.height}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bits por píxel:</span>
                    <p className="text-white">{currentImage.color ? "24" : currentImage.bitsAllocated || "N/A"}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Área principal del visor */}
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-4xl max-h-4xl">
            <div
              ref={elementRef}
              className={`w-full h-full border border-gray-600 ${
                isDragging ? "cursor-grabbing" : currentImage ? "cursor-grab" : "cursor-default"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minHeight: "512px", minWidth: "512px" }}
            >
              {!currentImage && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Visualizador DICOM</p>
                    <p className="text-sm opacity-75">Selecciona un archivo DICOM para comenzar</p>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay con información */}
            {currentImage && (
              <>
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                  <p>{studyData.patientName}</p>
                  <p>{studyData.studyType}</p>
                  <p>
                    Serie: {studyData.series}, Instancia: {studyData.instance}
                  </p>
                </div>

                {/* Indicador de herramientas */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                  <div className="flex items-center">
                    <Move className="h-3 w-3 mr-1" />
                    Arrastrar para mover
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
