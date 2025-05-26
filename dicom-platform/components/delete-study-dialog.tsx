"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import type { Study } from "@/lib/supabase"

interface DeleteStudyDialogProps {
  study: Study | null
  isOpen: boolean
  onClose: () => void
  onDelete: (studyId: string) => Promise<void>
}

export function DeleteStudyDialog({ study, isOpen, onClose, onDelete }: DeleteStudyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!study) return

    setIsDeleting(true)
    try {
      await onDelete(study.id)
      onClose()
    } catch (error) {
      console.error("Error deleting study:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!study) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Eliminar Estudio
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El estudio y todos sus datos asociados serán eliminados permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Estudio a eliminar:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Tipo:</span> {study.study_type}
              </p>
              <p>
                <span className="font-medium">Archivo:</span> {study.file_name}
              </p>
              <p>
                <span className="font-medium">Fecha:</span> {new Date(study.study_date).toLocaleDateString("es-ES")}
              </p>
              {study.study_description && (
                <p>
                  <span className="font-medium">Descripción:</span> {study.study_description}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Estudio
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
