import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Autisconnect ABA Module
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de gestao de terapia ABA - Registro e acompanhamento de habilidades
          </p>
        </div>

        {isAuthenticated ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Bem-vindo, {user?.name}!</h2>
            <p className="text-gray-600 mb-6">
              Acesse o modulo ABA para gerenciar habilidades e acompanhar o progresso dos pacientes.
            </p>
            <Link href="/aba">
              <Button size="lg" className="w-full">
                Acessar Modulo ABA
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-6">
              Faca login para acessar o sistema
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg">
                Fazer Login
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
