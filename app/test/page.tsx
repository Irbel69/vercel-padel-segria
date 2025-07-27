import DebugPanel from "@/components/DebugPanel";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔧 Página de Pruebas y Depuración
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Esta página ayuda a diagnosticar problemas de conectividad y autenticación.
        </p>
        <DebugPanel />
      </div>
    </div>
  );
}
