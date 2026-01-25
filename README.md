# 🍔 Pinheiros Burguer

**Pinheiros Burguer** é uma plataforma completa para gestão de delivery, projetada para otimizar desde a experiência do cliente até a operação da cozinha e o controle financeiro.

O sistema combina um **App do Cliente** (PWA) moderno e intuitivo com um poderoso **Painel Administrativo** para gestão total do negócio.

## ✨ Funcionalidades

### 📱 Para o Cliente (Delivery App)
- **Cardápio Digital Interativo**: Navegação fluida por categorias com fotos de alta qualidade.
- **Carrinho de Compras Inteligente**: Cálculo automático de totais, taxas de entrega e cupons.
- **Geolocalização**: Cálculo de taxa de entrega baseado na distância (km) do endereço do cliente.
- **Histórico de Pedidos**: Acompanhamento de status em tempo real.

### 🏢 Painel Administrativo
- **Gestão de Cardápio**: Adicionar/Editar produtos, categorias e disponibilidade.
- **Gestão de Pedidos**: Kanban ou Lista para acompanhar fluxo de pedidos.
- **Gestão de Estoque**: Controle de itens, movimentações e alertas de nível baixo.
- **Cupons de Desconto**: Criação de campanhas promocionais.

### 👨‍🍳 KDS (Kitchen Display System)
Monitor dedicado para a cozinha, eliminando impressoras de papel.
- **Tempo Real**: Pedidos aparecem instantaneamente na tela.
- **Monitoramento de SLA**: Temporizador com alertas visuais para pedidos atrasados (>20min).
- **Sem Papel**: Gestão 100% digital do fluxo de preparo.

### 💰 Gestão Financeira
Painel unificado para controle fiscal e estratégico.
- **Fechamento de Caixa**: Consolidação diária de Vendas vs Despesas.
- **Lucro Líquido**: Cálculo automático do resultado do dia.
- **Análise de Dados**: Gráficos de faturamento e rankings de produtos/clientes.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com uma stack moderna focada em performance e escalabilidade:

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (Server State)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Real-time)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn
- Conta no Supabase (para backend)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/pinheiros-burguer.git
cd pinheiros-burguer
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O projeto estará rodando em `http://localhost:8080` (ou porta disponível).

## 📂 Estrutura do Projeto

```
src/
├── components/         # Componentes React reutilizáveis
│   ├── admin/          # Componentes específicos do Painel Admin
│   │   ├── finance/    # Módulos financeiro (DailyClosing, SalesAnalytics)
│   │   ├── stock/      # Gestão de estoque
│   │   └── kds/        # Componentes do KDS
│   ├── ui/             # Componentes base (Shadcn)
├── pages/              # Páginas da aplicação (Rotas)
│   ├── admin/          # Páginas administrativas
│   └── ...             # Páginas do app do cliente
├── hooks/              # Custom Hooks
├── integrations/       # Configuração de serviços externos (Supabase)
└── lib/                # Funções utilitárias
```

## 📄 Licença

Este projeto é proprietário e desenvolvido para uso exclusivo do Pinheiros Burguer.
