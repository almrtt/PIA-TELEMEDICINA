"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Shield, Users, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Guardar usuario en localStorage
        localStorage.setItem("user", JSON.stringify(data.user))

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente.",
        })

        // Redirigir al dashboard
        window.location.href = "/dashboard"
      } else {
        toast({
          title: "Error",
          description: data.message || "Credenciales inválidas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          name,
          email,
          password,
          type: userType,
          specialty: userType === "doctor" ? specialty : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
        })
        setIsLogin(true)
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al crear la cuenta",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-12 w-12 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">TelemedCom</h1>
          </div>
          <p className="text-gray-600">Análisis de Imágenes</p>
          <p className="text-sm text-gray-500 mt-2">Ingresar al Sistema</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</CardTitle>
            <CardDescription className="text-center">
              {isLogin ? "Ingresa tus credenciales para acceder" : "Completa el formulario para registrarte"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "register"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" onClick={() => setIsLogin(false)}>
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "INICIAR SESIÓN"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register">Correo</Label>
                    <Input
                      id="email-register"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register">Contraseña</Label>
                    <Input
                      id="password-register"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirma tu contraseña</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-type">Tipo de cuenta</Label>
                    <Select value={userType} onValueChange={setUserType} required disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegir*" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Paciente
                          </div>
                        </SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            Médico/Doctor
                          </div>
                        </SelectItem>
                        <SelectItem value="hospital">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            Hospital/Clínica
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {userType === "doctor" && (
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Tipo de Especialidad</Label>
                      <Select value={specialty} onValueChange={setSpecialty} required disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Especialidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pediatria">Pediatría</SelectItem>
                          <SelectItem value="neurologia">Neurología</SelectItem>
                          <SelectItem value="traumatologia">Traumatología</SelectItem>
                          <SelectItem value="radiologia">Radiología</SelectItem>
                          <SelectItem value="biomedico">Ingeniero Biomédico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear tu cuenta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 TelemedCom - Plataforma de Telemedicina</p>
        </div>
      </div>
    </div>
  )
}
