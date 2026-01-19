import React, { useState } from "react";
import { useParams } from "react-router-dom";

// Imports corretos do shadcn/ui usando alias (mais limpo e padrão)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Imports dos componentes que VOCÊ REALMENTE TEM em src/components/
import AbaCharts from "./components/AbaCharts";
import AbaAiAnalysis from "./components/AbaAiAnalysis";
import AbaSessionsList from "./components/AbaSessionsList"; // pode usar como histórico temporário

// Os componentes abaixo AINDA NÃO EXISTEM na sua estrutura atual → comentados
// import { KPIDashboard } from "./components/aba/KPIDashboard";
// import { ComparacaoHabilidades } from "./components/ComparacaoHabilidades";
// import { HistoricoSessoes } from "./components/HistoricoSessoes";
// import { NiveisAuxilioCard } from "./components/NiveisAuxilioCard";

// Comentado por enquanto (trpc pode dar erro se não estiver configurado)
// import { trpc } from "./lib/trpc";

export default function DashboardABA() {
  const { id } = useParams();
  const idPaciente = id ? parseInt(id, 10) : 1;

  // Estado temporário até implementar seleção real de habilidade
  const [selectedHabilidade] = useState(null);

  // Dados mock para evitar erros enquanto trpc não estiver funcionando
  const habilidadesMock = [
    { id: 1, descricao: "Imitação Motora", dominio: "Motor" },
    { id: 2, descricao: "Contato Visual", dominio: "Social" },
    { id: 3, descricao: "Nomear Objetos", dominio: "Linguagem" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard ABA</h1>
          <p className="text-gray-600 mt-2">
            Análise completa do progresso e desempenho das habilidades – Paciente {idPaciente}
          </p>
        </div>

        <Tabs defaultValue="kpis" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="comparacao">Comparação</TabsTrigger>
            <TabsTrigger value="niveis">Níveis de Auxílio</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* ==================== Aba KPIs ==================== */}
          <TabsContent value="kpis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores Chave de Desempenho (KPIs)</CardTitle>
                <CardDescription>Visão geral do progresso clínico</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Usando AbaCharts como substituto temporário para KPIDashboard */}
                <AbaCharts patientId={idPaciente} />
                <p className="text-center text-sm text-gray-500 mt-6">
                  Componente KPIDashboard completo em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== Aba Comparação ==================== */}
          <TabsContent value="comparacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Habilidades</CardTitle>
                <CardDescription>Evolução entre diferentes domínios</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-xl text-gray-600">
                  Funcionalidade de comparação avançada em desenvolvimento
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Em breve: gráficos comparativos entre habilidades e períodos
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== Aba Níveis de Auxílio ==================== */}
          <TabsContent value="niveis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Níveis de Auxílio por Habilidade</CardTitle>
                <CardDescription>
                  Selecione uma habilidade para visualizar o nível atual de prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Habilidades Cadastradas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {habilidadesMock.map((hab) => (
                      <Card
                        key={hab.id}
                        className={`p-4 cursor-pointer transition-all border-2 ${
                          selectedHabilidade === hab.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedHabilidade(hab.id)}
                      >
                        <p className="font-medium">{hab.descricao}</p>
                        <p className="text-sm text-gray-600 mt-1">Domínio: {hab.dominio}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedHabilidade ? (
                  <div className="mt-8 p-8 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-900">
                      {
                        habilidadesMock.find((h) => h.id === selectedHabilidade)
                          ?.descricao
                      }
                    </p>
                    <p className="text-lg text-blue-700 mt-4">
                      Componente NiveisAuxilioCard em desenvolvimento
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Clique em uma habilidade acima para visualizar os níveis de auxílio
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== Aba Histórico ==================== */}
          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sessões</CardTitle>
                <CardDescription>Todas as sessões registradas do paciente</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Usando AbaSessionsList como base temporária */}
                <AbaSessionsList patientId={idPaciente} />
                <p className="text-center text-sm text-gray-500 mt-6">
                  Versão completa do histórico em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}