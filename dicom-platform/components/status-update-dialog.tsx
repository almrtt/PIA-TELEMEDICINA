"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText } from "lucide-react"
import type { Study } from "@/lib/supabase"

interface StatusUpdateDialogProps {
  study: Study | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (studyId: string, data: { status: string; diagnosis?: string }) => Promise<void>
}

export function StatusUpdateDialog({ study, isOpen, onClose, onUpdate }: StatusUpdateDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState("")
  const [diagnosis, setDiagnosis] = useState("")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!study || !status) return

    setIsUpdating(true)
    try {
      const updateData: { status: string; diagnosis?: string } = { status }
      if (diagnosis.trim()) {
        updateData.diagnosis = diagnosis.trim()
      }

      await onUpdate(study.id, updateData)
      onClose()
      setStatus("")
      setDiagnosis("")
    } catch (error) {
      console.error("Error updating study:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "pending":
        return "text-yellow-600"
      case "in-review":
        return "text-blue-600"
      case "completed":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  if (!study) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Actualizar Estado del Estudio
          </DialogTitle>
          <DialogDescription>Cambia el estado del estudio y agrega un diagnóstico si es necesario.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Estudio:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Tipo:</span> {study.study_type}
              </p>
              <p>
                <span className="font-medium">Archivo:</span> {study.file_name}
              </p>
              <p>
                <span className="font-medium">Estado actual:</span>
                <span className={`ml-1 font-medium ${getStatusColor(study.status)}`}>
                  {study.status === "pending" && "Pendiente"}
                  {study.status === "in-review" && "En Revisión"}
                  {study.status === "completed" && "Completado"}
                </span>
              </p>
              {study.diagnosis && (
                <p>
                  <span className="font-medium">Diagnóstico actual:</span> {study.diagnosis}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Nuevo Estado *</Label>
            <Select value={status} onValueChange={setStatus} required disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="text-yellow-600">● Pendiente</span>
                </SelectItem>
                <SelectItem value="in-review">
                  <span className="text-blue-600">● En Revisión</span>
                </SelectItem>
                <SelectItem value="completed">
                  <span className="text-green-600">● Completado</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Agregar o actualizar diagnóstico..."
              rows={4}
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Opcional. Si se proporciona, se actualizará el diagnóstico del estudio.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating || !status}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Estado"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
