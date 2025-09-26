# Detalhamento dos Épicos

## Épico 1: Fundação Backend e API White-Label
**Objetivo:** Estabelecer a base técnica do backend com NestJS, MongoDB e APIs RESTful documentadas, incluindo autenticação e estrutura modular pronta para consumo por qualquer frontend.

### Story 1.1: Setup Inicial do Projeto
Como desenvolvedor,
Eu quero configurar a estrutura base do monorepo com NestJS,
Para que tenhamos um ambiente de desenvolvimento padronizado.

**Critérios de Aceitação:**
1. Monorepo configurado com workspaces para backend, web e mobile
2. NestJS instalado com estrutura modular (auth, content, common)
3. MongoDB/Mongoose configurado com conexão para MongoDB Atlas
4. ESLint e Prettier configurados com regras consistentes
5. Scripts npm para desenvolvimento, build e teste funcionando
6. README com instruções de setup local

### Story 1.2: Módulo de Autenticação JWT
Como administrador,
Eu quero fazer login seguro no sistema,
Para que possa acessar funcionalidades administrativas.

**Critérios de Aceitação:**
1. Endpoint POST /auth/login funcional com email/senha
2. JWT tokens gerados com expiração configurável
3. Refresh token implementado para renovação de sessão
4. Guard de autenticação protegendo rotas administrativas
5. Endpoint POST /auth/refresh para renovar token
6. Tratamento de erros para credenciais inválidas

### Story 1.3: Schemas Base do MongoDB
Como desenvolvedor,
Eu quero schemas Mongoose bem estruturados,
Para que os dados sejam consistentes e validados.

**Critérios de Aceitação:**
1. Schema User com roles e timestamps
2. Schema Speaker com campos multilíngues
3. Schema Session com relações para speakers
4. Schema Sponsor com níveis de cota
5. Schema FAQ com categorização
6. Índices otimizados para queries frequentes

### Story 1.4: APIs CRUD Genéricas
Como frontend developer,
Eu quero APIs RESTful padronizadas,
Para que possa consumir dados de qualquer interface.

**Critérios de Aceitação:**
1. CRUD endpoints para cada entidade (speakers, sessions, sponsors, FAQ)
2. Paginação, ordenação e filtros implementados
3. Responses padronizados com status codes apropriados
4. Validação de entrada com class-validator
5. Suporte a query params para filtros complexos
6. Soft delete implementado onde aplicável

### Story 1.5: Documentação Swagger
Como desenvolvedor frontend,
Eu quero documentação automática das APIs,
Para que possa entender e testar os endpoints.

**Critérios de Aceitação:**
1. Swagger UI acessível em /api/docs
2. Todos endpoints documentados com exemplos
3. Schemas de request/response visíveis
4. Autenticação testável pelo Swagger
5. Agrupamento lógico de endpoints
6. Descrições claras de parâmetros e respostas

## Épico 2: Backoffice White-Label Completo
**Objetivo:** Criar interface administrativa funcional com design neutro Bootstrap/Material-UI para gestão completa de conteúdo, focando em funcionalidade sobre estética.

### Story 2.1: Dashboard e Layout Base
Como administrador,
Eu quero uma interface administrativa organizada,
Para que possa navegar facilmente entre funcionalidades.

**Critérios de Aceitação:**
1. Layout com sidebar, header e área de conteúdo
2. Menu lateral com todas seções do admin
3. Breadcrumbs para navegação contextual
4. Dashboard com cards de resumo (total palestras, palestrantes, etc)
5. Responsivo para tablets (não precisa mobile)
6. Logout funcional com limpeza de sessão

### Story 2.2: Gestão de Palestrantes
Como produtor de conteúdo,
Eu quero gerenciar palestrantes com suas informações,
Para que apareçam corretamente no site e app.

**Critérios de Aceitação:**
1. Listagem com busca, paginação, filtros e ordenação customizável
2. Formulário com campos: nome, bio, foto, empresa, cargo (internacionalizado), links sociais
3. Upload de foto com preview e validação de tamanho
4. Suporte multilíngue (PT/EN/ES) com tabs
5. Sistema de marcação de palestrante em destaque para home
6. Confirmação antes de deletar

### Story 2.3: Gestão de Palestras/Sessões
Como produtor de conteúdo,
Eu quero gerenciar a agenda completa do evento,
Para que participantes vejam horários e informações corretas.

**Critérios de Aceitação:**
1. CRUD completo com título, descrição, data/hora, duração
2. Seleção múltipla de palestrantes (many-to-many)
3. Campos: palco/sala, capacidade, tags, nível técnico, idioma
4. Vinculação de patrocinadores à palestra
5. Validação de conflitos de horário por palco
6. Preview de como aparecerá na agenda com logo do patrocinador

### Story 2.4: Gestão de Cotas e Patrocinadores
Como administrador,
Eu quero gerenciar cotas e patrocinadores com ordenação flexível,
Para que sejam exibidos com destaque apropriado.

**Critérios de Aceitação:**
1. CRUD de cotas com ordenação customizável e limite de posts padrão
2. CRUD de patrocinadores vinculados às cotas
3. Upload de logo com redimensionamento e otimização automática
4. Campos: nome, descrição, website, e-mail admin, local do stand, redes sociais
5. Ordenação customizável entre cotas e dentro de cada cota
6. Limite de posts no feed (herdado da cota mas editável por admin)
7. Criação automática de conta para o patrocinador

### Story 2.5: Gestão de FAQ
Como produtor de conteúdo,
Eu quero gerenciar perguntas frequentes categorizadas,
Para que participantes encontrem respostas rapidamente.

**Critérios de Aceitação:**
1. CRUD de categorias de FAQ
2. CRUD de perguntas com editor rich text para respostas
3. Ordenação customizada dentro de categorias
4. Busca em perguntas e respostas
5. Suporte multilíngue com indicador de tradução pendente
6. Estatísticas de perguntas mais vistas (preparar campo)

### Story 2.6: Controle de Visibilidade
Como administrador,
Eu quero controlar o que está visível no site/app,
Para que possa liberar conteúdo gradualmente.

**Critérios de Aceitação:**
1. Toggles on/off para cada seção principal
2. Mensagem customizada quando seção está oculta
3. Data/hora para ativação automática
4. Preview do estado atual do site
5. Log de mudanças de visibilidade
6. Aplicação imediata sem necessitar deploy

### Story 2.7: Push Notifications
Como administrador,
Eu quero enviar notificações para os apps,
Para que possa comunicar mudanças importantes.

**Critérios de Aceitação:**
1. Interface para criar e enviar notificações
2. Preview de como aparecerá no dispositivo
3. Agendamento de envio futuro
4. Histórico de notificações enviadas
5. Contador de dispositivos alcançados
6. Teste de envio para dispositivo específico

## Épico 3: App Mobile White-Label
**Objetivo:** Desenvolver aplicativo React Native funcional com design minimalista, focando em performance e funcionalidades core do modo visitante.

### Story 3.1: Setup e Navegação Base
Como desenvolvedor mobile,
Eu quero estrutura de navegação configurada,
Para que o app tenha fluxo intuitivo.

**Critérios de Aceitação:**
1. React Navigation com tab bar inferior
2. Tabs: Home, Agenda, Buscar, Mais
3. Stack navigation para telas de detalhe
4. Splash screen com placeholder
5. Tratamento de deep links básico
6. Gesture handler para voltar

### Story 3.2: Tela Home e Destaques
Como visitante,
Eu quero ver informações principais do evento,
Para que possa me orientar rapidamente.

**Critérios de Aceitação:**
1. Cards de destaque (próximas palestras, speakers marcados como destaque)
2. Botão de redirecionamento para página de patrocinadores (sem logos na home)
3. Links rápidos para seções importantes
4. Pull-to-refresh funcional
5. Skeleton loading durante carregamento
6. Tratamento de erro de conexão

### Story 3.3: Agenda Completa
Como visitante,
Eu quero visualizar toda programação do evento,
Para que possa planejar minha participação.

**Critérios de Aceitação:**
1. Visualização por dia com tabs (sem visualização de calendário)
2. Cards de sessão com hora, título, palestrante, sala, patrocinador
3. Filtros por palco, tema, palestrante
4. Busca contextual por texto em título/descrição/palestrante
5. Indicador visual de sessões acontecendo agora
6. Scroll infinito com paginação para grandes volumes

### Story 3.4: Detalhes e Perfis
Como visitante,
Eu quero ver informações detalhadas,
Para que possa conhecer melhor palestras e palestrantes.

**Critérios de Aceitação:**
1. Tela de detalhe da palestra com todas informações
2. Perfil do palestrante com bio e foto
3. Lista de outras palestras do mesmo speaker
4. Links para redes sociais (abrir browser)
5. Compartilhar palestra via share nativo
6. Navegação entre speakers de uma mesma palestra

### Story 3.5: Busca e FAQ
Como visitante,
Eu quero buscar informações e tirar dúvidas,
Para que encontre o que preciso rapidamente.

**Critérios de Aceitação:**
1. Busca contextual por seção (não global)
2. Resultados relevantes à seção atual
3. FAQ em accordion expandível com ordenação customizada
4. Categorias de FAQ navegáveis e ordenáveis
5. Editor rich text básico para respostas (negrito, bullets, links)
6. Cache de buscas recentes

### Story 3.6: Push Notifications e Offline
Como visitante,
Eu quero receber avisos e acessar conteúdo offline,
Para que fique informado mesmo sem conexão.

**Critérios de Aceitação:**
1. Permissão de notificação no onboarding
2. Recepção e display de push notifications
3. Badge de notificações não lidas
4. Cache de dados com AsyncStorage
5. Indicador de modo offline
6. Sincronização automática ao reconectar

## Épico 4: Integração Website Lovable
**Objetivo:** Conectar o site desenvolvido no Lovable com as APIs do backend, garantindo funcionamento completo de todas features.

### Story 4.1: Configuração de CORS e Domínios
Como desenvolvedor,
Eu quero configurar CORS apropriadamente,
Para que o site Lovable possa consumir as APIs.

**Critérios de Aceitação:**
1. CORS configurado para domínio Lovable
2. Whitelist de origins por ambiente
3. Headers apropriados para cache
4. Preflight requests otimizados
5. Tratamento de cookies/sessão se necessário
6. Documentação de configuração

### Story 4.2: Adaptação de APIs para Lovable
Como desenvolvedor frontend,
Eu quero APIs compatíveis com Lovable,
Para que a integração seja simples.

**Critérios de Aceitação:**
1. Endpoints GET públicos sem autenticação
2. Responses em formato esperado pelo Lovable
3. Imagens servidas com URLs absolutas e otimizadas
4. Paginação compatível (scroll infinito para patrocinadores/palestrantes)
5. Filtros via query parameters
6. Rate limiting apropriado para tráfego público

### Story 4.3: Scripts de Integração
Como desenvolvedor,
Eu quero scripts auxiliares de integração,
Para que o site funcione completamente.

**Critérios de Aceitação:**
1. Script JS para inicialização de API client
2. Interceptors para tratamento de erros
3. Helpers para formatação de dados
4. Polyfills se necessário
5. Analytics integrado nas chamadas
6. Documentação de uso

### Story 4.4: Testes e Validação
Como QA,
Eu quero validar a integração completa,
Para que o site funcione perfeitamente.

**Critérios de Aceitação:**
1. Todas seções carregando dados corretamente
2. Filtros e busca funcionais
3. Imagens e assets carregando
4. Links e navegação funcionando
5. Formulário de contato enviando
6. Performance adequada (LCP < 2.5s)

## Épico 5: Customização Visual do App
**Objetivo:** Aplicar identidade visual VTEX no app mobile, transformando o white-label em produto final polido.

### Story 5.1: Design System VTEX Mobile
Como designer,
Eu quero componentes seguindo identidade VTEX,
Para que o app seja visualmente consistente.

**Critérios de Aceitação:**
1. Paleta de cores VTEX aplicada
2. Tipografia oficial configurada
3. Espaçamentos e grids padronizados
4. Componentes base estilizados (botões, cards, inputs)
5. Ícones customizados VTEX
6. Tema light configurado

### Story 5.2: Refinamento de Telas
Como usuário,
Eu quero interface polida e profissional,
Para que a experiência seja premium.

**Critérios de Aceitação:**
1. Splash screen com logo VTEX animado
2. Onboarding com slides de boas-vindas
3. Micro-animações em transições
4. Loading states melhorados
5. Empty states ilustrados
6. Error boundaries amigáveis

### Story 5.3: Assets e Branding
Como usuário,
Eu quero ver a marca VTEX presente,
Para que identifique o evento.

**Critérios de Aceitação:**
1. Logo VTEX em locais apropriados
2. Imagens de placeholder temáticas
3. Ilustrações customizadas
4. App icon e nome atualizados
5. Store listings preparados
6. Screenshots para app stores

## Épico 6: Customização Visual do Backoffice
**Objetivo:** Aplicar branding VTEX no backoffice mantendo usabilidade e profissionalismo.

### Story 6.1: Tema VTEX para Admin
Como administrador,
Eu quero interface administrativa com identidade VTEX,
Para que seja consistente com a marca.

**Critérios de Aceitação:**
1. Header com logo e cores VTEX
2. Sidebar estilizado com tema
3. Botões e forms com design system
4. Tabelas com estilo VTEX
5. Alerts e toasts customizados
6. Footer com informações VTEX

### Story 6.2: Dashboard Melhorado
Como administrador,
Eu quero dashboard informativo e visual,
Para que tenha visão geral do evento.

**Critérios de Aceitação:**
1. Cards com métricas e ícones
2. Gráficos simples de progresso
3. Timeline de próximos eventos
4. Quick actions destacadas
5. Notificações de sistema
6. Widget de dias para o evento

## Épico 7: Deploy e Otimizações
**Objetivo:** Preparar toda infraestrutura de produção, garantindo performance, segurança e confiabilidade.

### Story 7.1: Infraestrutura de Produção
Como DevOps,
Eu quero ambiente de produção configurado,
Para que o sistema rode com estabilidade.

**Critérios de Aceitação:**
1. MongoDB Atlas production cluster configurado
2. Backend deployado (Railway/Heroku/AWS)
3. Domínios e SSL configurados
4. CDN CloudFlare ativo
5. Backups automáticos configurados
6. Variáveis de ambiente seguras

### Story 7.2: CI/CD Pipeline
Como desenvolvedor,
Eu quero deploy automatizado,
Para que releases sejam consistentes.

**Critérios de Aceitação:**
1. GitHub Actions para build e testes
2. Deploy automático para staging em PRs
3. Deploy para produção em merge para main
4. Rollback automático em falhas
5. Notificações de deploy status
6. Versionamento semântico

### Story 7.3: Monitoramento e Logs
Como administrador de sistema,
Eu quero visibilidade do sistema,
Para que possa identificar e resolver problemas.

**Critérios de Aceitação:**
1. Logs centralizados acessíveis
2. Alertas para erros críticos
3. Métricas de API (latência, erros)
4. Dashboard de status do sistema
5. Health checks configurados
6. Uptime monitoring ativo

### Story 7.4: Testes de Carga e Otimização
Como arquiteto,
Eu quero validar performance sob carga,
Para que o sistema suporte o evento.

**Critérios de Aceitação:**
1. Testes simulando 2000 usuários simultâneos (pico esperado)
2. Simulação do padrão de acesso: 90% nas 2h antes do evento
3. Otimização de queries lentas e imagens
4. Cache Redis configurado para dados frequentes
5. Rate limiting calibrado para picos
6. Documentação de capacidade máxima
