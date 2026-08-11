import {
  Activity,
  ArrowLeft,
  BarChartLine,
  Bell,
  CashStack,
  ClipboardCheck,
  CreditCard2Front,
  Cpu,
  FileEarmarkBarGraph,
  Gear,
  HouseDoor,
  People
} from 'react-bootstrap-icons';
import { CLINIC_MODULES } from './clinicModules';

const ROOT_PATH = '/dashboard-executivo';

const defaultMeta = {
  eyebrow: 'Clinica / Executivo',
  title: 'Visao Executiva',
  subtitle: 'Performance, crescimento e eficiencia em uma unica visao.',
  breadcrumb: 'Clinica / Executivo / Visao Executiva'
};

const buildMeta = (title, subtitle, breadcrumb) => ({
  eyebrow: 'Clinica / Executivo',
  title,
  subtitle,
  breadcrumb: breadcrumb || `Clinica / Executivo / ${title}`
});

const routeDefinitions = [
  {
    match: (pathname) => pathname.includes('/profissionais/') && pathname.endsWith('/financeiro'),
    meta: buildMeta(
      'Financeiro do Profissional',
      'Receita, repasses e historico financeiro por profissional.'
    )
  },
  {
    match: (pathname) => pathname === ROOT_PATH || pathname === `${ROOT_PATH}/`,
    meta: defaultMeta
  },
  {
    match: (pathname) => pathname.endsWith('/solucoes'),
    meta: buildMeta(
      'Solucoes AutisConnect',
      'Panorama dos modulos disponiveis e das capacidades ativas na clinica.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/configuracoes'),
    meta: buildMeta(
      'Configuracoes Financeiras',
      'Padroes, regras e preferencias financeiras da operacao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/plano-de-contas'),
    meta: buildMeta(
      'Plano de Contas',
      'Estrutura contabil e classificacoes usadas no ecossistema financeiro.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/rateios'),
    meta: buildMeta(
      'Rateios Financeiros',
      'Distribuicao de custos e receitas para leitura gerencial.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/dre'),
    meta: buildMeta(
      'DRE Gerencial',
      'Demonstrativo gerencial para acompanhar margem e resultado operacional.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/balanco-patrimonial'),
    meta: buildMeta(
      'Balanco Patrimonial',
      'Leitura patrimonial consolidada com foco em reconciliacao e estrutura.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro/exportacoes'),
    meta: buildMeta(
      'Exportacoes Financeiras',
      'Central de exportacao e compartilhamento de dados financeiros.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/financeiro'),
    meta: buildMeta(
      'Financeiro',
      'Receita, caixa e estrutura financeira em nivel estrategico.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/fiscal'),
    meta: buildMeta(
      'Gestao Fiscal',
      'Controles e diagnosticos fiscais para reduzir riscos da operacao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/profissionais'),
    meta: buildMeta(
      'Gestao dos Profissionais',
      'Desempenho, contratos e produtividade da equipe clinica.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/relatorios'),
    meta: buildMeta(
      'Relatorios Executivos',
      'Exportacoes estrategicas para acompanhamento da alta gestao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/ia'),
    meta: buildMeta(
      'Inteligencia Executiva',
      'Analises assistidas por IA para apoiar decisoes e priorizacao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/auditoria'),
    meta: buildMeta(
      'Auditoria Executiva',
      'Rastreabilidade, verificacoes e governanca sobre a operacao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/assinatura'),
    meta: buildMeta(
      'Assinatura',
      'Visibilidade sobre plano contratado, limites e adesao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/uso'),
    meta: buildMeta(
      'Uso da Plataforma',
      'Adocao, uso operacional e tracao dos modulos do ecossistema.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/alertas'),
    meta: buildMeta(
      'Alertas Executivos',
      'Riscos, vencimentos e desvios que exigem atencao da gestao.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/indicadores-executivos'),
    meta: buildMeta(
      'Indicadores Executivos',
      'Indicadores avancados com formulas, qualidade e comparativos.'
    )
  },
  {
    match: (pathname) => pathname.endsWith('/saude'),
    meta: buildMeta(
      'Saude Operacional',
      'Estabilidade operacional e pontos de observacao do sistema.'
    )
  }
];

const createItem = ({
  key,
  label,
  description,
  to,
  icon,
  exact = false,
  visible = true
}) => ({
  key,
  label,
  description,
  to,
  icon,
  exact,
  visible
});

export const getExecutiveNavigationGroups = ({ modules = {}, user }) => {
  const financialEnabled = Boolean(modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed);
  const fiscalEnabled = Boolean(modules[CLINIC_MODULES.FISCAL_MANAGEMENT]?.allowed);
  const reportsEnabled = Boolean(modules[CLINIC_MODULES.EXECUTIVE_REPORTS]?.allowed);
  const aiEnabled = Boolean(modules[CLINIC_MODULES.EXECUTIVE_AI]?.allowed);
  const auditEnabled = Boolean(modules[CLINIC_MODULES.EXECUTIVE_AUDIT]?.allowed);
  const systemHealthEnabled = Boolean(modules[CLINIC_MODULES.SYSTEM_HEALTH]?.allowed);

  const groups = [
    {
      key: 'executivo',
      label: 'Executivo',
      items: [
        createItem({
          key: 'overview',
          label: 'Visao Executiva',
          description: 'Resumo estrategico da clinica.',
          to: ROOT_PATH,
          icon: HouseDoor,
          exact: true
        }),
        createItem({
          key: 'indicators',
          label: 'Indicadores Executivos',
          description: 'Leitura avancada de performance.',
          to: `${ROOT_PATH}/indicadores-executivos`,
          icon: BarChartLine
        }),
        createItem({
          key: 'alerts',
          label: 'Alertas Executivos',
          description: 'Riscos e sinais de atencao.',
          to: `${ROOT_PATH}/alertas`,
          icon: Bell
        })
      ]
    },
    {
      key: 'analises',
      label: 'Analises',
      items: [
        createItem({
          key: 'financial-overview',
          label: 'Financeiro',
          description: 'Receita, caixa e rentabilidade.',
          to: `${ROOT_PATH}/financeiro`,
          icon: CashStack,
          visible: financialEnabled
        }),
        createItem({
          key: 'dre',
          label: 'DRE Gerencial',
          description: 'Resultado e margem operacional.',
          to: `${ROOT_PATH}/financeiro/dre`,
          icon: CashStack,
          visible: financialEnabled
        }),
        createItem({
          key: 'balance-sheet',
          label: 'Balanco Patrimonial',
          description: 'Leitura patrimonial gerencial.',
          to: `${ROOT_PATH}/financeiro/balanco-patrimonial`,
          icon: CashStack,
          visible: financialEnabled
        }),
        createItem({
          key: 'fiscal',
          label: 'Gestao Fiscal',
          description: 'Acompanhamento de obrigacoes fiscais.',
          to: `${ROOT_PATH}/fiscal`,
          icon: CashStack,
          visible: fiscalEnabled
        }),
        createItem({
          key: 'professionals',
          label: 'Equipe',
          description: 'Performance e contratos dos profissionais.',
          to: `${ROOT_PATH}/profissionais`,
          icon: People
        })
      ]
    },
    {
      key: 'financeiro-detalhado',
      label: 'Financeiro Detalhado',
      items: [
        createItem({
          key: 'chart-of-accounts',
          label: 'Plano de Contas',
          description: 'Classificacoes da estrutura financeira.',
          to: `${ROOT_PATH}/financeiro/plano-de-contas`,
          icon: FileEarmarkBarGraph,
          visible: financialEnabled
        }),
        createItem({
          key: 'allocations',
          label: 'Rateios',
          description: 'Distribuicao de custos e receitas.',
          to: `${ROOT_PATH}/financeiro/rateios`,
          icon: FileEarmarkBarGraph,
          visible: financialEnabled
        }),
        createItem({
          key: 'exports',
          label: 'Exportacoes',
          description: 'Saidas gerenciais do financeiro.',
          to: `${ROOT_PATH}/financeiro/exportacoes`,
          icon: FileEarmarkBarGraph,
          visible: financialEnabled
        }),
        createItem({
          key: 'financial-settings',
          label: 'Configuracoes Financeiras',
          description: 'Preferencias e regras do modulo.',
          to: `${ROOT_PATH}/financeiro/configuracoes`,
          icon: Gear,
          visible: financialEnabled
        })
      ]
    },
    {
      key: 'inteligencia',
      label: 'Inteligencia',
      items: [
        createItem({
          key: 'reports',
          label: 'Relatorios',
          description: 'Relatorios estrategicos e exports.',
          to: `${ROOT_PATH}/relatorios`,
          icon: FileEarmarkBarGraph,
          visible: reportsEnabled
        }),
        createItem({
          key: 'ai',
          label: 'IA',
          description: 'Analises assistidas e priorizacao.',
          to: `${ROOT_PATH}/ia`,
          icon: Cpu,
          visible: aiEnabled
        }),
        createItem({
          key: 'audit',
          label: 'Auditoria',
          description: 'Governanca e rastreabilidade.',
          to: `${ROOT_PATH}/auditoria`,
          icon: ClipboardCheck,
          visible: auditEnabled
        }),
        createItem({
          key: 'system-health',
          label: 'Saude Operacional',
          description: 'Confiabilidade e monitoramento tecnico.',
          to: `${ROOT_PATH}/saude`,
          icon: Activity,
          visible: systemHealthEnabled
        }),
        createItem({
          key: 'platform-usage',
          label: 'Uso da Plataforma',
          description: 'Adocao e tracao dos modulos.',
          to: `${ROOT_PATH}/uso`,
          icon: BarChartLine
        }),
        createItem({
          key: 'solutions',
          label: 'Solucoes AutisConnect',
          description: 'Panorama do ecossistema habilitado.',
          to: `${ROOT_PATH}/solucoes`,
          icon: BarChartLine
        })
      ]
    },
    {
      key: 'conta',
      label: 'Conta',
      items: [
        createItem({
          key: 'subscription',
          label: 'Assinatura',
          description: 'Plano, limites e adesao da clinica.',
          to: `${ROOT_PATH}/assinatura`,
          icon: CreditCard2Front
        })
      ]
    }
  ];

  const footerItems = [];
  if (user?.tipo_usuario === 'clinica' && user?.id) {
    footerItems.push(
      createItem({
        key: 'back-to-clinic',
        label: 'Gestao da Clinica',
        description: 'Retornar ao dashboard operacional.',
        to: `/clinic-dashboard/${user.id}`,
        icon: ArrowLeft
      })
    );
  }

  return {
    groups: groups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.visible) }))
      .filter((group) => group.items.length),
    footerItems
  };
};

export const resolveExecutiveRouteMeta = (pathname = '') => {
  const match = routeDefinitions.find((definition) => definition.match(pathname));
  return match?.meta || defaultMeta;
};
