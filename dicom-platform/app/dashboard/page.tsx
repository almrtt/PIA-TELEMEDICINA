"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Activity,
  Upload,
  Download,
  Eye,
  LogOut,
  Plus,
  FileImage,
  Calendar,
  Stethoscope,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Edit,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User as UserType, Study } from "@/lib/supabase"
import { StudyPreview } from "@/components/study-preview"
import { DeleteStudyDialog } from "@/components/delete-study-dialog"
import { StatusUpdateDialog } from "@/components/status-update-dialog"

export default function Dashboard() {
  const [user, setUser] = useState<UserType | null>(null)
  const [studies, setStudies] = useState<Study[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null)
  const [studyToUpdate, setStudyToUpdate] = useState<Study | null>(null)
  const { toast } = useToast()

  const loadStudies = useCallback(
    async (currentUser: UserType) => {
      try {
        setIsRefreshing(true)
        console.log("🔄 Loading studies for user:", currentUser.id, "type:", currentUser.user_type)

        const url = `/api/studies?userId=${currentUser.id}&userType=${currentUser.user_type}&timestamp=${Date.now()}`
        console.log("📡 Fetching from:", url)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        console.log("📊 Response status:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("📋 Studies data received:", {
          success: data.success,
          count: data.studies?.length || 0,
          studies: data.studies?.map((s: Study) => ({ id: s.id, type: s.study_type, date: s.study_date })) || [],
        })

        if (data.success) {
          setStudies(data.studies || [])
          console.log("✅ Studies updated in state:", data.studies?.length || 0)
        } else {
          console.error("❌ Error in response:", data.message)
          toast({
            title: "Error",
            description: data.message || "Error al cargar estudios",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("💥 Error loading studies:", error)
        toast({
          title: "Error",
          description: "Error de conexión al cargar estudios",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    // Verificar si el usuario está logueado
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/"
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log("👤 User loaded from localStorage:", parsedUser.id, parsedUser.user_type)
      setUser(parsedUser)
      loadStudies(parsedUser)
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("user")
      window.location.href = "/"
    }
  }, [loadStudies])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUploading(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const file = formData.get("file") as File

    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      })
      setIsUploading(false)
      return
    }

    try {
      console.log("🚀 Starting file upload for user:", user.id, "type:", user.user_type)

      // Primero subir el archivo a Vercel Blob
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      console.log("📤 Uploading file to blob storage...")
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const uploadResult = await uploadResponse.json()
      console.log("📤 Upload result:", uploadResult.success ? "✅ Success" : "❌ Failed", uploadResult.message)

      if (!uploadResult.success) {
        toast({
          title: "Error",
          description: uploadResult.message || "Error al subir el archivo",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      }

      // Luego guardar la información del estudio
      const studyFormData = new FormData()
      studyFormData.append("fileUrl", uploadResult.url)
      studyFormData.append("fileName", file.name)
      studyFormData.append("fileSize", file.size.toString())
      studyFormData.append("studyType", formData.get("studyType") as string)
      studyFormData.append("studyDescription", (formData.get("studyDescription") as string) || "")
      studyFormData.append("notes", (formData.get("notes") as string) || "")
      studyFormData.append("userId", user.id)
      studyFormData.append("userType", user.user_type)

      console.log("💾 Saving study metadata...")
      const studyResponse = await fetch("/api/studies", {
        method: "POST",
        body: studyFormData,
      })

      const studyResult = await studyResponse.json()
      console.log("💾 Study save result:", studyResult.success ? "✅ Success" : "❌ Failed", studyResult.message)

      if (studyResult.success) {
        toast({
          title: "¡Éxito!",
          description: "Estudio subido y guardado exitosamente",
        })
        setShowUploadDialog(false)

        // Limpiar el formulario
        const form = e.target as HTMLFormElement
        form.reset()

        // Recargar estudios
        loadStudies(user)
      } else {
        toast({
          title: "Error",
          description: studyResult.message || "Error al guardar el estudio",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 Upload error:", error)
      toast({
        title: "Error",
        description: "Error de conexión durante la subida",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteStudy = async (studyId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/studies?studyId=${studyId}&userId=${user.id}&userType=${user.user_type}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Estudio eliminado",
          description: "El estudio ha sido eliminado exitosamente",
        })
        loadStudies(user)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al eliminar el estudio",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting study:", error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar el estudio",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStudyStatus = async (studyId: string, data: { status: string; diagnosis?: string }) => {
    try {
      const response = await fetch("/api/studies", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          status: data.status,
          diagnosis: data.diagnosis,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: "El estado del estudio ha sido actualizado exitosamente",
        })
        loadStudies(user!)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating study status:", error)
      toast({
        title: "Error",
        description: "Error de conexión al actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    if (user) {
      console.log("🔄 Manual refresh triggered")
      loadStudies(user)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/"
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

  const getDashboardTitle = () => {
    if (!user) return "PANEL DE CONTROL"

    switch (user.user_type) {
      case "patient":
        return "MIS ESTUDIOS MÉDICOS"
      case "doctor":
        return "GESTIÓN DE ESTUDIOS MÉDICOS"
      case "hospital":
        return "ADMINISTRAR ARCHIVOS HOSPITALARIOS"
      default:
        return "PANEL DE CONTROL"
    }
  }

  const canDeleteStudy = (study: Study) => {
    if (!user) return false
    if (user.user_type === "doctor" || user.user_type === "hospital") return true
    if (user.user_type === "patient" && study.patient_id === user.id) return true
    return false
  }

  const canUpdateStatus = (study: Study) => {
    return user?.user_type === "doctor" || user?.user_type === "hospital"
  }

  const handleViewStudy = (study: Study) => {
    window.open(`/viewer?fileUrl=${encodeURIComponent(study.file_url)}&studyId=${study.id}`, "_blank")
  }

  const handlePreviewStudy = (study: Study) => {
    setSelectedStudy(study)
    setShowPreview(true)
  }

  const handleDownloadStudy = (study: Study) => {
    const link = document.createElement("a")
    link.href = study.file_url
    link.download = study.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">TelemedCom</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                <span className="ml-2 text-gray-400">({user.user_type})</span>
                {user.specialty && <span className="ml-2 text-gray-500">• {user.specialty}</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de control</h2>
          <p className="text-gray-600">{getDashboardTitle()}</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex space-x-4">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {user.user_type === "doctor" ? "Agregar Estudio" : "Agregar Archivo"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Subir Estudio DICOM</DialogTitle>
                <DialogDescription>
                  Selecciona el archivo DICOM y completa la información del estudio.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Archivo DICOM *</Label>
                  <Input id="file" name="file" type="file" accept=".dcm,.dicom" required disabled={isUploading} />
                  <p className="text-xs text-gray-500">Formatos soportados: .dcm, .dicom (máx. 100MB)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study-type">Tipo de Estudio *</Label>
                  <Select name="studyType" required disabled={isUploading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resonancia Magnética">Resonancia Magnética</SelectItem>
                      <SelectItem value="Tomografía Computarizada">Tomografía Computarizada</SelectItem>
                      <SelectItem value="Radiografía">Radiografía</SelectItem>
                      <SelectItem value="Ultrasonido">Ultrasonido</SelectItem>
                      <SelectItem value="Mamografía">Mamografía</SelectItem>
                      <SelectItem value="Angiografía">Angiografía</SelectItem>
                      <SelectItem value="Medicina Nuclear">Medicina Nuclear</SelectItem>
                      <SelectItem value="Endoscopia">Endoscopia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study-description">Descripción del Estudio</Label>
                  <Input
                    id="study-description"
                    name="studyDescription"
                    placeholder="Ej: RM cerebral con contraste"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Información adicional sobre el estudio..."
                    rows={3}
                    disabled={isUploading}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Archivo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>

          <Button variant="outline" onClick={() => window.open("/viewer", "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Abrir Visualizador
          </Button>
        </div>

        {/* Studies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileImage className="h-5 w-5 mr-2" />
                {user.user_type === "doctor" ? "TODOS LOS ESTUDIOS" : "MIS ESTUDIOS"} ({studies.length})
              </div>
              {studies.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {studies.filter((s) => s.status === "pending").length} pendientes
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {user.user_type === "doctor"
                ? "Gestión completa de estudios DICOM - Ver, editar estados y diagnosticar"
                : user.user_type === "patient"
                  ? "Tus estudios médicos personales"
                  : "Gestión de estudios DICOM y diagnósticos médicos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studies.length === 0 ? (
              <div className="text-center py-12">
                <FileImage className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {user.user_type === "doctor" ? "No hay estudios disponibles" : "No hay estudios disponibles"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {user.user_type === "doctor"
                    ? "Sube un estudio DICOM para comenzar a trabajar con imágenes médicas"
                    : "Sube tu primer archivo DICOM para comenzar a crear tu historial clínico"}
                </p>
                <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {user.user_type === "doctor" ? "Subir Primer Estudio" : "Subir Primer Archivo"}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Estudio</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>{user.user_type === "doctor" ? "Paciente" : "Médico Asignado"}</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studies.map((study) => (
                      <TableRow key={study.id}>
                        <TableCell className="font-medium">{study.study_type}</TableCell>
                        <TableCell>{study.study_description || "Sin descripción"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(study.study_date).toLocaleDateString("es-ES")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              {user.user_type === "doctor" ? (
                                <>
                                  <p className="text-sm font-medium">{study.patient?.name || "Paciente no asignado"}</p>
                                  <p className="text-xs text-gray-500">{study.patient?.email || ""}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-medium">{study.doctor?.name || "Por asignar"}</p>
                                  {study.doctor?.specialty && (
                                    <p className="text-xs text-gray-500">{study.doctor.specialty}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48">
                            {study.diagnosis ? (
                              <p className="text-sm text-gray-900 truncate" title={study.diagnosis}>
                                {study.diagnosis}
                              </p>
                            ) : (
                              <span className="text-sm text-gray-500 italic">Pendiente de diagnóstico</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(study.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewStudy(study)}
                              title="Vista rápida"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStudy(study)}
                              title="Ver estudio en visualizador"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadStudy(study)}
                              title="Descargar archivo DICOM"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canUpdateStatus(study) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setStudyToUpdate(study)
                                  setShowStatusDialog(true)
                                }}
                                title="Actualizar estado"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteStudy(study) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setStudyToDelete(study)
                                  setShowDeleteDialog(true)
                                }}
                                title="Eliminar estudio"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        {studies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileImage className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Estudios</p>
                    <p className="text-2xl font-bold text-gray-900">{studies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">P</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studies.filter((s) => s.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">R</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En Revisión</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studies.filter((s) => s.status === "in-review").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">C</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studies.filter((s) => s.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Study Preview Modal */}
      <StudyPreview study={selectedStudy} isOpen={showPreview} onClose={() => setShowPreview(false)} />

      {/* Delete Study Dialog */}
      <DeleteStudyDialog
        study={studyToDelete}
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setStudyToDelete(null)
        }}
        onDelete={handleDeleteStudy}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        study={studyToUpdate}
        isOpen={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false)
          setStudyToUpdate(null)
        }}
        onUpdate={handleUpdateStudyStatus}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription>
              ¿Está seguro de querer cerrar la sesión? Si lo hace tendrá que volver a iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
