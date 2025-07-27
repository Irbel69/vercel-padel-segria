"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DebugInfo {
  supabaseUrl: string;
  hasAnonKey: boolean;
  authStatus: string;
  userId?: string;
  userEmail?: string;
  apiTest?: any;
  timestamp: string;
}

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const runDebug = async () => {
    setLoading(true);
    
    try {
      // Información de configuración
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "No configurado";
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Estado de autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      let authStatus = "No autenticado";
      if (authError) {
        authStatus = `Error: ${authError.message}`;
      } else if (user) {
        authStatus = "Autenticado";
      }
      
      // Test de API
      let apiTest = null;
      try {
        const response = await fetch("/api/user/profile");
        const data = await response.json();
        apiTest = {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (error) {
        apiTest = {
          error: String(error)
        };
      }

      setDebugInfo({
        supabaseUrl,
        hasAnonKey,
        authStatus,
        userId: user?.id,
        userEmail: user?.email,
        apiTest,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error en debug:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  if (!debugInfo) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>🔧 Panel de Depuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔧 Panel de Depuración
          <Button onClick={runDebug} disabled={loading} size="sm">
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Última actualización: {new Date(debugInfo.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Configuración de Supabase</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>URL de Supabase:</span>
              <Badge variant="outline">{debugInfo.supabaseUrl}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Clave anónima:</span>
              <Badge variant={debugInfo.hasAnonKey ? "default" : "destructive"}>
                {debugInfo.hasAnonKey ? "Configurada" : "No configurada"}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Estado de Autenticación</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Estado:</span>
              <Badge variant={debugInfo.authStatus === "Autenticado" ? "default" : "destructive"}>
                {debugInfo.authStatus}
              </Badge>
            </div>
            {debugInfo.userId && (
              <div className="flex items-center justify-between">
                <span>User ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {debugInfo.userId}
                </code>
              </div>
            )}
            {debugInfo.userEmail && (
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="text-sm">{debugInfo.userEmail}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Test de API</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Estado de respuesta:</span>
              <Badge variant={debugInfo.apiTest?.ok ? "default" : "destructive"}>
                {debugInfo.apiTest?.status || "Error"}
              </Badge>
            </div>
            <div className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              <pre>{JSON.stringify(debugInfo.apiTest, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Acciones de depuración</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log("=== DEBUG INFO ===");
                console.log(debugInfo);
                console.log("=== FIN DEBUG INFO ===");
              }}
            >
              Log en consola
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
              }}
            >
              Copiar info
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
