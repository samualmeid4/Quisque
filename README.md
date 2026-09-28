# Quisque — MesaFlow 🍽️

Sistema web responsivo para pequenos restaurantes, lanchonetes e quiosques, focado em organização e agilidade de pedidos, mesas, cozinha e fechamento de conta.

---

## 🚀 Funcionalidades

- **📱 Visão Cliente (Cardápio Digital & QR Code):**
  - Cardápio interativo por categorias.
  - Seleção de itens e carrinho em tempo real.
  - Envio de pedidos vinculados à mesa.

- **👨‍🍳 Painel da Cozinha (KDS):**
  - Fila de pedidos em tempo real.
  - Separação de status (Pendente, Em Preparo, Pronto).
  - Alertas visuais e atualização de status em tempo real.

- **🤵 Painel do Garçom:**
  - Visão geral das mesas (Livre, Ocupada, Aguardando Fechamento).
  - Lançamento rápido de pedidos por mesa.
  - Notificação de pedidos prontos para entrega.

- **📊 Painel Administrativo:**
  - Gestão de cardápio (produtos, preços, categorias).
  - Gestão e fechamento de contas de mesas.
  - Métricas e dashboard de vendas/pedidos.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Roteamento:** [React Router 7](https://reactrouter.com/)
- **Estilização:** CSS moderno e responsivo com design tokens e micro-animações
- **Gerenciamento de Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Backend / Realtime:** [Supabase](https://supabase.com/)

---

## 📦 Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/samualmeid4/Quisque.git
   cd Quisque
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   - Acesse o link fornecido pelo Vite (geralmente `http://localhost:5173`).

---

## 📁 Estrutura de Pastas

```text
├── public/              # Arquivos públicos e estáticos
├── src/
│   ├── layouts/         # Layouts das diferentes áreas (Admin, Garçom, Cozinha, Público)
│   ├── pages/           # Páginas por perfil de acesso
│   │   ├── admin/       # Dashboard, Mesas, Cardápio, Pedidos
│   │   ├── cliente/     # Cardápio Público e Carrinho
│   │   ├── cozinha/     # Painel KDS
│   │   └── garcom/      # Gestão de mesas e pedidos
│   ├── lib/             # Cliente e configuração Supabase
│   ├── store/           # Stores Zustand de estado global
│   ├── App.jsx          # Configuração de rotas da aplicação
│   └── main.jsx         # Ponto de entrada
├── supabase/            # Configurações e migrações do banco
├── package.json
└── vite.config.js
```
