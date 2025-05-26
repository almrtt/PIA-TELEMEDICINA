"use client"

import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface UploadProgressProps {
  isUploading: boolean
  progress: number
  error?: string
  success?: boolean
}

export function UploadProgress({ isUploading, progress, error, success }: UploadProgressProps) {
  if (!isUploading && !error && !success) return null

  return (
    <div className="space-y-2">
      {isUploading && (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Subiendo archivo...</span>
        </div>
      )}

      {isUploading && <Progress value={progress} className="w-full" />}

      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Archivo subido exitosamente</span>
        </div>
      )}
    </div>
  )
}
