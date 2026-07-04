# Mandarim Learning Web

Front-end React para o sistema de aprendizado de mandarim, consumindo a API Spring Boot.

## Tecnologias

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- React Router DOM v6
- Axios
- React Hook Form + Zod
- Recharts
- Lucide React

## Pré-requisitos

- Node.js 18+
- npm 9+
- API Spring Boot rodando em `http://localhost:8080`

## Instalação

```bash
cd mandarim-learning-web
npm install
```

## Configuração da API

O arquivo `.env` já vem configurado com o endereço padrão da API:

```env
VITE_API_URL=http://localhost:8080/api
```

Para alterar, edite o `.env` antes de rodar o projeto:

```env
VITE_API_URL=http://seu-servidor:porta/api
```

## Rodando o projeto

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

## Build para produção

```bash
npm run build
npm run preview
```

## Estrutura do projeto

```
src/
├── components/
│   ├── layout/        # Sidebar, Topbar, MainLayout
│   └── ui/            # Componentes reutilizáveis
├── context/           # Contextos React (Toast)
├── hooks/             # Hooks customizados
├── lib/               # Configuração do Axios
├── pages/             # Páginas da aplicação
│   ├── Dashboard/
│   ├── Usuarios/
│   ├── Conteudos/
│   ├── Exercicios/
│   ├── Quiz/
│   ├── Revisoes/
│   ├── Recomendacoes/
│   ├── IA/
│   ├── Estatisticas/
│   ├── Temas/
│   └── Tags/
├── services/          # Camada de comunicação com a API
├── styles/            # CSS global
├── types/             # Tipos TypeScript
└── utils/             # Funções utilitárias
```

## Funcionalidades

| Página         | Descrição                                              |
|----------------|--------------------------------------------------------|
| Dashboard      | Cards de resumo + gráficos de desempenho               |
| Usuários       | CRUD completo de usuários                              |
| Conteúdos      | CRUD com filtro por tipo e nível HSK                   |
| Exercícios     | CRUD com suporte a múltipla escolha e texto livre      |
| Quiz           | Sessão de prática com envio de respostas à API         |
| Revisões       | Revisões pendentes por repetição espaçada              |
| Recomendações  | Conteúdos recomendados por usuário                     |
| Conteúdos IA   | Geração e aprovação de conteúdos via IA                |
| Estatísticas   | Gráficos e tabela por período                          |
| Temas          | CRUD de temas                                          |
| Tags           | CRUD de tags                                           |

## Swagger da API

Com a API rodando, acesse a documentação em:
**http://localhost:8080/swagger-ui/index.html**
