# VTEX DAY 26 Product Requirements Document (PRD)

## Objetivos e Contexto

### Objetivos
- Entregar uma plataforma digital unificada que centraliza todas as informações e interações do VTEX DAY 26 através de touchpoints web e mobile
- Alcançar 80% de adoção do app entre participantes com ingressos validados para maximizar engajamento e valor do evento
- Habilitar gestão de conteúdo e comunicação em tempo real entre organizadores, participantes e patrocinadores através de ferramentas integradas de backoffice
- Fornecer aos patrocinadores ROI mensurável através de ferramentas de captura de leads e analytics de engajamento, visando 500+ leads qualificados
- Criar uma experiência progressiva que evolui de visitante público para participante engajado através da validação de ingresso
- Estabelecer uma arquitetura de plataforma escalável que possa ser reutilizada para futuros eventos VTEX globalmente
- Reduzir custos operacionais em 25% através da automação de atualizações de conteúdo, notificações e suporte ao participante

### Contexto

A plataforma VTEX DAY 26 endereça pontos críticos de dor no gerenciamento de eventos corporativos de grande escala, onde participantes atualmente sofrem com fontes fragmentadas de informação e ferramentas limitadas de engajamento, enquanto organizadores carecem de capacidades eficientes de gestão de conteúdo. Esta solução cria um ecossistema digital abrangente que unifica toda a experiência do evento através de quatro componentes integrados: um website responsivo multilíngue para informações públicas, aplicativos mobile nativos para iOS/Android com desbloqueio progressivo de funcionalidades, um backoffice administrativo robusto para controle de conteúdo em tempo real, e um portal do expositor para geração de leads e rastreamento de engajamento. Implementando uma arquitetura centralizada de conteúdo com APIs RESTful, a plataforma garante consistência através de todos os touchpoints enquanto habilita experiências personalizadas baseadas em comportamento e preferências do usuário.

### Log de Mudanças

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 24/09/2025 | 1.0 | Criação inicial do PRD baseado no Brief do Projeto | John (PM) |

## Requisitos

### Requisitos Funcionais

#### Website e Core
- **RF1:** A plataforma deve fornecer um website responsivo bilíngue (PT-BR, EN) com detecção automática de idioma e troca manual
- **RF2:** O sistema deve exibir agenda completa com filtros por tema, palestrante, palco, data, horário e tags
- **RF3:** O website deve apresentar perfis detalhados de palestrantes com bio, foto, empresa, cargo (internacionalizado), sessões vinculadas, priorização de exibição e marcação de destaque para home
- **RF4:** O sistema deve exibir patrocinadores organizados por cota configurável (Diamond, Gold, Silver, etc.) com logos, descrições, links e ordenação customizável tanto entre cotas quanto dentro de cada cota. Implementar scroll infinito para grandes volumes (250+ patrocinadores). Na home, usar apenas botão de redirecionamento para página de patrocinadores
- **RF5:** O website deve fornecer área de imprensa com download de press releases, logos e materiais oficiais, incluindo informações de contato (assessoria@vtex.com)
- **RF6:** O sistema deve disponibilizar mapa estático do local com integração para Google/Apple Maps. Esta seção pode ser ativada/desativada conforme disponibilidade do material
- **RF7:** A plataforma deve implementar FAQ categorizado com busca, navegação por categorias, ordenação customizável de categorias e perguntas, e editor rich text básico para respostas (negrito, bullets, links)
- **RF8:** O sistema deve processar formulário de contato próprio (não embed) com suporte multilíngue nos campos, salvando dados no backend para consulta no backoffice. Preparar para futura integração com CRM externo

#### Aplicativo Mobile - Modo Visitante
- **RF9:** O app deve espelhar todo conteúdo público do website em formato otimizado para mobile
- **RF10:** O sistema deve permitir visualização de agenda em formato lista e calendário (horário de Brasília GMT-3)
- **RF11:** O app deve implementar busca contextual por seção (agenda, palestrantes, patrocinadores, FAQ) - não busca integrada global
- **RF12:** O sistema deve receber e processar push notifications gerais do backoffice com histórico de notificações recebidas no app
- **RF13:** O app deve permitir navegação offline de conteúdo previamente carregado

#### Aplicativo Mobile - Modo Participante (Fase 2)
- **IMPORTANTE:** Incluir páginas legais no app (termos de uso, política de privacidade). Design da entrada da Fase 2 sem forçar cadastro imediato
- **RF14:** O sistema deve validar ingressos através de código/QR code para desbloquear modo participante
- **RF15:** O app deve capturar interesses e preferências durante onboarding para personalização
- **RF16:** O sistema deve permitir favoritar palestras e criar agenda pessoal com detecção de conflitos
- **RF17:** O app deve habilitar chat moderado (canal geral e mensagens 1:1 com consentimento mútuo)
- **RF18:** O sistema deve permitir envio de mensagens para patrocinadores através de formulários específicos
- **RF19:** O app deve integrar mapa interativo do evento (embed de solução externa)
- **RF20:** O sistema deve gerenciar feed social com posts (texto/imagem/vídeo/GIF), curtidas e comentários

#### Ambiente de Palco Ao Vivo (Fase 2)
- **RF21:** O sistema deve gerenciar Q&A moderado com votação de perguntas por relevância
- **RF22:** O app deve aplicar pesquisas de satisfação específicas por palestra
- **RF23:** O sistema deve executar enquetes em tempo real durante apresentações
- **RF24:** O app deve integrar com serviço de tradução simultânea
- **RF25:** O sistema deve gerar e disponibilizar resumos em PDF das palestras

#### Backoffice Administrativo
- **RF26:** O sistema deve autenticar administradores com recuperação de senha e gestão de sessões, será obrigatório que os usuários administradores tenham uma senha forte (12+ caracteres, letras maiúsculas, letras minúsculas, números, símbolos, aleatória) e ao se cadastrarem eles irão receber um link que expira após determinado período para criação da senha
- **RF27:** O backoffice deve fornecer CRUD completo para palestras com campos: título, descrição, palestrantes (múltiplos), horário, palco, tags, idioma, patrocinadores da palestra
- **RF28:** O sistema deve gerenciar CRUD de palestrantes: nome, bio, foto, empresa, cargo, redes sociais, palestras vinculadas
- **RF29:** O backoffice deve administrar patrocinadores com cota configurável, logo, descrição, ordem de exibição, links, e-mail do administrador do patrocinador, quantidade de posts permitidos no feed (herdado da cota mas editável), local do stand, links de redes sociais. Incluir CRUD de cotas com ordenação
- **RF30:** O sistema deve controlar visibilidade de TODAS as seções (on/off/em breve) com mensagens customizadas e ativação agendada automática por data/hora
- **RF31:** O backoffice deve criar, agendar e enviar push notifications para todos usuários do app
- **RF32:** O sistema deve gerenciar múltiplos perfis de acesso (super admin, produtor, patrocinador)
- **RF33:** O backoffice deve fornecer upload e gestão de assets (imagens, PDFs, logos) com otimização automática para qualquer upload feito no backoffice
- **RF34:** O sistema deve registrar logs de auditoria para todas as operações de cadastro, edição e exclusão com identificação do usuário

#### Portal do Expositor (Fase 2)
- **RF35:** O portal deve permitir login autônomo para patrocinadores com credenciais específicas
- **RF36:** O sistema deve habilitar edição de perfil próprio: descrição, logo, contatos, materiais
- **RF37:** O portal deve receber e gerenciar inbox de mensagens/leads dos participantes
- **RF38:** O sistema deve permitir publicação limitada de posts no feed (quota por cota de patrocínio)
- **RF39:** O sistema deve fornecer dashboard com métricas: visualizações, mensagens recebidas

#### Integrações e Analytics
- **RF40:** O sistema deve integrar com API da ticketeira usando fila de eventos (compra/edição/cancelamento) para manter independência operacional
- **RF41:** A plataforma deve implementar Google Tag Manager e Analytics em todas as páginas
- **RF42:** O sistema deve gerar relatórios de engajamento: páginas mais vistas, palestrantes populares, horários de pico
- **RF43:** O backoffice deve exibir dashboard em tempo real durante o evento com métricas principais

#### Páginas Adicionais
- **RF44:** O sistema deve incluir páginas legais: política de privacidade, termos de uso, política de cookies
- **RF45:** Implementar preferência de idioma por usuário no app (não depender do idioma do dispositivo)
- **RF46:** Push notifications com suporte multilíngue baseado na preferência do usuário

### Requisitos Não Funcionais

- **RNF1:** O website deve alcançar First Contentful Paint < 1.5s e Time to Interactive < 3.5s em redes 4G
- **RNF2:** Os aplicativos móveis devem inicializar em < 2 segundos e responder a ações locais em < 1 segundo em dispositivos de 2019 em diante
- **RNF3:** A plataforma deve suportar 20.000 usuários totais com picos de 2.000 usuários simultâneos, especialmente nas 2 horas antes da abertura do evento. 99.9% de uptime durante o período de 3 dias
- **RNF4:** Todas as APIs devem responder dentro de 200ms no percentil 95 sob condições normais de carga
- **RNF5:** O sistema deve cumprir com requisitos LGPD para coleta de dados, armazenamento e gerenciamento de consentimento do usuário
- **RNF6:** A plataforma deve implementar autenticação OAuth 2.0/JWT com controle de acesso baseado em papéis para usuários do backoffice
- **RNF7:** Todas as transmissões de dados devem usar criptografia TLS 1.3 com certificate pinning nos apps móveis
- **RNF8:** O sistema deve fornecer logs de auditoria abrangentes para todas as ações administrativas e modificações de dados
- **RNF9:** Os apps móveis devem funcionar com funcionalidades degradadas quando offline, sincronizando dados quando a conectividade retornar
- **RNF10:** A plataforma deve implementar rate limiting e proteção DDoS para todos os endpoints públicos

## Objetivos de Design de Interface do Usuário

### Visão Geral de UX
A experiência do usuário será centrada em **simplicidade e eficiência**, com navegação intuitiva que minimize cliques para acessar informações críticas do evento. A interface priorizará **hierarquia visual clara** com cards informativos, tipografia legível e espaçamento generoso para facilitar a leitura em dispositivos móveis. O design seguirá princípios de **progressive disclosure**, revelando funcionalidades avançadas conforme o usuário evolui de visitante para participante validado.

### Paradigmas de Interação Principais
- **Navegação por Gestos:** Swipe lateral para navegar entre dias da agenda, pull-to-refresh para atualizar conteúdo
- **Busca Contextual:** Search persistente com filtros dinâmicos que se adaptam ao contexto (agenda, palestrantes, FAQ)
- **Interação por Cards:** Conteúdo organizado em cards expansíveis para otimizar espaço em tela
- **Feedback Visual Imediato:** Micro-animações e estados de loading para toda ação do usuário
- **Modo Offline-First:** Interface indica claramente status de conectividade e conteúdo disponível offline

### Telas e Views Principais
- **Tela de Splash/Onboarding:** Apresentação do evento e seleção de idioma
- **Home/Dashboard:** Hub central com destaques, próximas sessões e acesso rápido
- **Agenda Completa:** Vista lista/calendário com filtros avançados
- **Detalhes da Palestra:** Informações completas, palestrantes, localização
- **Perfil do Palestrante:** Bio, foto, palestras relacionadas, links sociais
- **Mapa do Local:** Visualização estática com link para navegação
- **Minha Agenda:** Palestras favoritadas e agenda personalizada (Fase 2)
- **Feed Social:** Timeline de posts e interações (Fase 2)
- **Área de Notificações:** Central de avisos e mudanças

### Acessibilidade: WCAG AA
O projeto seguirá padrões **WCAG AA** incluindo contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande, suporte completo a leitores de tela, navegação por teclado, áreas de toque mínimas de 44x44px, e textos alternativos para todas as imagens.

### Branding
Design seguirá a **identidade visual VTEX** com paleta de cores corporativas (roxo #F71963, rosa #FFB6C1, cinza #142032), tipografia oficial (fontes VTEX), e elementos visuais que remetam à **inovação e tecnologia**. Incorporar elementos sutis de **glassmorphism** e **gradientes** para modernidade.

### Plataformas-Alvo: Web Responsivo e Mobile Nativo
- **Web Responsivo:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **iOS Nativo:** iPhone 11+ (iOS 13+)
- **Android Nativo:** Dispositivos com Android 8+ (API 26+)
- **Progressive Web App:** Como alternativa de contingência

## Premissas Técnicas

### Estrutura de Repositório: Monorepo
Utilizaremos **Monorepo** com workspaces para gerenciar frontend web, apps mobile e backend em um único repositório, facilitando compartilhamento de código, tipos TypeScript e deploy coordenado.

### Arquitetura de Serviços
Adotaremos arquitetura **Monolítica Modular** para acelerar desenvolvimento:
- **API Monolítica:** Aplicação NestJS única com módulos bem definidos
- **Estrutura Modular:** Separação por domínios (auth, content, notifications, analytics) usando módulos do NestJS
- **RESTful API:** Endpoints versionados com documentação Swagger automática
- **Background Jobs:** Bull queues integradas com NestJS para processamento assíncrono
- **Database NoSQL:** MongoDB com Mongoose para flexibilidade de schema
Esta abordagem permite rápida iteração e futura migração para microserviços se necessário.

### Requisitos de Testes
Implementaremos **Testes Focados no Crítico**:
- **Testes Unitários:** 60% cobertura focada em services e guards críticos
- **Testes de Integração:** Controllers principais e integração com ticketeira
- **Testes E2E:** Fluxos essenciais usando Jest e Supertest
- **Testes Manuais:** Checklist de QA para funcionalidades secundárias
- **Smoke Tests:** Suite rápida para validar deploys em produção

### Premissas Técnicas Adicionais

**Stack de Desenvolvimento:**
- **Frontend Web:** React 18 com Vite, TypeScript, Tailwind CSS, Axios para APIs
- **Mobile:** React Native com Expo para máximo reuso de lógica e componentes
- **Backend:** NestJS com decorators, pipes de validação, interceptors
- **Database:** MongoDB com Mongoose ODM, schemas tipados com TypeScript
- **Cache:** Redis para cache de queries e sessões via @nestjs/cache-manager
- **File Storage:** AWS S3 com multer-s3 para uploads

**Infraestrutura Pragmática:**
- **Deploy:** Docker containers em AWS ECS ou Railway para simplicidade
- **Database:** MongoDB Atlas (managed) para alta disponibilidade
- **CDN:** CloudFlare para assets estáticos e cache de API
- **CI/CD:** GitHub Actions com stages para dev/staging/prod
- **Monitoramento:** Winston logger integrado, Sentry para error tracking

**Integrações com NestJS:**
- **Push Notifications:** Firebase Admin SDK como NestJS service
- **Analytics:** Custom middleware para Google Analytics
- **Email:** @nestjs-modules/mailer com SendGrid
- **WebSockets:** @nestjs/websockets para atualizações real-time (Fase 2)
- **Swagger:** @nestjs/swagger para documentação automática da API

**Patterns NestJS e MongoDB:**
- **DTOs:** Class-validator para validação de entrada
- **Schemas:** Mongoose schemas com @nestjs/mongoose decorators
- **Guards:** JWT auth guard global com roles
- **Interceptors:** Transform response e logging
- **Exception Filters:** Tratamento padronizado de erros
- **Aggregation Pipeline:** Para queries complexas e analytics

**Segurança com NestJS:**
- **Helmet:** Proteção headers HTTP via @nestjs/helmet
- **Rate Limiting:** @nestjs/throttler para proteção contra abuse
- **CORS:** Configuração restritiva por ambiente
- **Validation Pipe:** Global validation com whitelist
- **Mongoose Plugins:** Para audit trails e soft deletes

**Justificativa das Escolhas:**
- **NestJS:** Framework enterprise-ready com arquitetura clara, dependency injection e suporte TypeScript nativo
- **MongoDB:** Flexibilidade para mudanças de schema durante desenvolvimento rápido, ótimo para dados semi-estruturados do evento
- **Mongoose:** ODM maduro com validações, middleware e virtual properties
- **Monolito Modular:** Complexidade gerenciável com benefícios de modularização do NestJS
- **Docker + MongoDB Atlas:** Deploy simples com database gerenciado, reduz overhead operacional

## Lista de Épicos

### Estratégia de Desenvolvimento: White-Label + Lovable

A estratégia consiste em desenvolver backend e app como white-label enquanto o design cria o site no Lovable. Após integração, aplicamos a identidade visual VTEX em toda a plataforma.

### Épicos para MVP (Entrega 1 - 10/11/2025)

**Épico 1: Fundação Backend e API White-Label** - Setup inicial do NestJS com MongoDB e APIs RESTful genéricas

**Épico 2: Backoffice White-Label Completo** - Dashboard administrativo funcional com design neutro para gestão completa de conteúdo

**Épico 3: App Mobile White-Label** - Aplicativo React Native funcional com design básico consumindo APIs

**Épico 4: Integração Website Lovable** - Conectar o site criado no Lovable com as APIs do backend

**Épico 5: Customização Visual do App** - Aplicar identidade visual VTEX no app mobile baseado no design do Lovable

**Épico 6: Customização Visual do Backoffice** - Aplicar branding VTEX no backoffice para consistência visual

**Épico 7: Deploy e Otimizações** - Configurar infraestrutura de produção e ajustes finais

## Detalhamento dos Épicos

### Épico 1: Fundação Backend e API White-Label
**Objetivo:** Estabelecer a base técnica do backend com NestJS, MongoDB e APIs RESTful documentadas, incluindo autenticação e estrutura modular pronta para consumo por qualquer frontend.

#### Story 1.1: Setup Inicial do Projeto
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

#### Story 1.2: Módulo de Autenticação JWT
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

#### Story 1.3: Schemas Base do MongoDB
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

#### Story 1.4: APIs CRUD Genéricas
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

#### Story 1.5: Documentação Swagger
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

### Épico 2: Backoffice White-Label Completo
**Objetivo:** Criar interface administrativa funcional com design neutro Bootstrap/Material-UI para gestão completa de conteúdo, focando em funcionalidade sobre estética.

#### Story 2.1: Dashboard e Layout Base
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

#### Story 2.2: Gestão de Palestrantes
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

#### Story 2.3: Gestão de Palestras/Sessões
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

#### Story 2.4: Gestão de Cotas e Patrocinadores
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

#### Story 2.5: Gestão de FAQ
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

#### Story 2.6: Controle de Visibilidade
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

#### Story 2.7: Push Notifications
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

### Épico 3: App Mobile White-Label
**Objetivo:** Desenvolver aplicativo React Native funcional com design minimalista, focando em performance e funcionalidades core do modo visitante.

#### Story 3.1: Setup e Navegação Base
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

#### Story 3.2: Tela Home e Destaques
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

#### Story 3.3: Agenda Completa
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

#### Story 3.4: Detalhes e Perfis
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

#### Story 3.5: Busca e FAQ
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

#### Story 3.6: Push Notifications e Offline
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

### Épico 4: Integração Website Lovable
**Objetivo:** Conectar o site desenvolvido no Lovable com as APIs do backend, garantindo funcionamento completo de todas features.

#### Story 4.1: Configuração de CORS e Domínios
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

#### Story 4.2: Adaptação de APIs para Lovable
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

#### Story 4.3: Scripts de Integração
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

#### Story 4.4: Testes e Validação
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

### Épico 5: Customização Visual do App
**Objetivo:** Aplicar identidade visual VTEX no app mobile, transformando o white-label em produto final polido.

#### Story 5.1: Design System VTEX Mobile
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

#### Story 5.2: Refinamento de Telas
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

#### Story 5.3: Assets e Branding
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

### Épico 6: Customização Visual do Backoffice
**Objetivo:** Aplicar branding VTEX no backoffice mantendo usabilidade e profissionalismo.

#### Story 6.1: Tema VTEX para Admin
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

#### Story 6.2: Dashboard Melhorado
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

### Épico 7: Deploy e Otimizações
**Objetivo:** Preparar toda infraestrutura de produção, garantindo performance, segurança e confiabilidade.

#### Story 7.1: Infraestrutura de Produção
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

#### Story 7.2: CI/CD Pipeline
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

#### Story 7.3: Monitoramento e Logs
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

#### Story 7.4: Testes de Carga e Otimização
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

## Especificação de Cadastros e Formulários

### Visão Geral dos Cadastros

O sistema VTEX DAY 26 possui múltiplos tipos de usuários e entidades que requerem cadastros específicos. Esta seção detalha todos os formulários, campos, validações e regras de negócio para cada tipo de cadastro.

### 1. Cadastro de Usuários Administrativos

#### 1.1 Tipos de Usuários

| Tipo | Permissões | Descrição |
|------|------------|-----------|
| **Super Admin** | Acesso total | Gerencia toda plataforma, usuários e configurações |
| **Produtor** | Gestão de conteúdo | Gerencia palestras, palestrantes, FAQ, patrocinadores e agenda |
| **Patrocinador** | Portal limitado | Acesso ao portal do expositor para gerenciar perfil e leads |

#### 1.2 Campos do Cadastro de Admin

```yaml
cadastro_admin:
  campos_obrigatorios:
    nome_completo:
      tipo: string
      min: 3
      max: 100
      regex: "^[a-zA-ZÀ-ÿ\\s]+$"
      exemplo: "João Silva Oliveira"

    email:
      tipo: email
      único: true
      exemplo: "admin@vtex.com"

    senha:
      tipo: password
      min: 12
      requisitos:
        - Mínimo 1 maiúscula
        - Mínimo 1 minúscula
        - Mínimo 2 números
        - Mínimo 2 caracteres especiais
        - Não pode conter nome ou email
        - Não pode ser sequencial
      força: strong
      exemplo: "V@t3x#D4y&2025!"

    tipo_usuario:
      tipo: enum
      valores: [super_admin, produtor, patrocinador]
      default: produtor

    telefone:
      tipo: string
      formato: "+55 (11) 98765-4321"
      mask: "+## (##) #####-####"
```

#### 1.3 Fluxo de Cadastro de Admin

1. **Convite por Email**
   - Super Admin envia convite com link temporário (48h)
   - Email contém role pré-definido e instruções

2. **Criação de Conta**
   - Usuário clica no link e acessa formulário
   - Preenche dados obrigatórios
   - Sistema valida senha forte em tempo real
   - Aceita termos de uso administrativo

3. **Validação**
   - Verificação de email único no sistema

4. **Ativação**
   - Conta ativa imediatamente após cadastro
   - Log de auditoria registrado

### 2. Cadastro de Palestrantes

#### 2.1 Campos do Palestrante

```yaml
cadastro_palestrante:
  informacoes_basicas:
    nome:
      tipo: string
      min: 3
      max: 100
      obrigatório: true
      exemplo: "Carlos Eduardo Mendes"

  informacoes_profissionais:
    empresa:
      tipo: string
      max: 100
      obrigatório: true
      exemplo: "VTEX"

    cargo:
      tipo: object
      multilingual: true
      obrigatório: true
      campos:
        pt: "Diretor de Tecnologia"
        en: "Chief Technology Officer"

    biografia:
      tipo: object
      multilingual: true
      obrigatório: true
      min: 100
      max: 500
      rich_text: true
      campos:
        pt: "Biografia em português..."
        en: "Biography in English..."

  midias:
    foto_perfil:
      tipo: file
      obrigatório: true
      formatos: [jpg, png, webp]
      max_size: 5MB
      dimensoes:
        min: 400x400
        recomendado: 800x800
        aspect_ratio: 1:1
      processamento:
        - Redimensionar para 800x800
        - Gerar thumbnail 200x200
        - Otimizar qualidade (85%)
        - Converter para WebP

  redes_sociais:
    linkedin:
      tipo: url
      obrigatório: false
      validação: linkedin_profile
      placeholder: "https://linkedin.com/in/username"

    twitter:
      tipo: string
      obrigatório: false
      formato: "@username"
      validação: twitter_handle

    instagram:
      tipo: string
      obrigatório: false
      formato: "@username"
      validação: instagram_handle

    website:
      tipo: url
      obrigatório: false
      validação: url_valida

  configuracoes:
    destaque_home:
      tipo: boolean
      default: false
      descrição: "Exibir na home do site"

    ordem_exibicao:
      tipo: integer
      min: 1
      max: 999
      default: auto_increment

    palestrante_principal:
      tipo: boolean
      default: false
      descrição: "Keynote speaker"

    tags:
      tipo: array
      max_items: 10
      valores: tags_predefinidas
```

### 3. Cadastro de Palestras/Sessões

#### 3.1 Campos da Palestra

```yaml
cadastro_palestra:
  informacoes_gerais:
    titulo:
      tipo: object
      multilingual: true
      obrigatório: true
      max: 150
      campos:
        pt: "Título em português"
        en: "Title in English"

    descricao:
      tipo: object
      multilingual: true
      obrigatório: true
      min: 100
      max: 1000
      rich_text: true
      campos:
        pt: "Descrição detalhada..."
        en: "Detailed description..."

    tipo_sessao:
      tipo: enum
      obrigatório: true
      valores:
        - keynote: "Palestra Principal"
        - talk: "Palestra"
        - panel: "Painel"
        - workshop: "Workshop"
        - networking: "Networking"
        - break: "Intervalo"

  programacao:
    data:
      tipo: date
      obrigatório: true
      formato: "YYYY-MM-DD"
      validação:
        min: "2025-11-26"
        max: "2025-11-28"

    horario_inicio:
      tipo: time
      obrigatório: true
      formato: "HH:mm"
      step: 5
      timezone: "America/Sao_Paulo"

    duracao:
      tipo: integer
      obrigatório: true
      unidade: minutos
      min: 15
      max: 480
      valores_sugeridos: [30, 45, 60, 90, 120]

    palco:
      tipo: enum
      obrigatório: true
      valores:
        - principal: "Palco Principal"
        - inovacao: "Palco Inovação"
        - tech: "Palco Tech"
        - startup: "Palco Startup"
        - workshop_a: "Sala Workshop A"
        - workshop_b: "Sala Workshop B"

  palestrantes:
    palestrantes_principais:
      tipo: array
      obrigatório: true
      min_items: 1
      max_items: 5
      relacao: palestrante_id
      ordenavel: true

  categorias:
    tags:
      tipo: array
      obrigatório: false
      max_items: 10
      valores_sugeridos:
        - "AI/ML"
        - "Omnichannel"
        - "B2B"
        - "B2C"
        - "Marketplace"
        - "Performance"
        - "Mobile Commerce"
        - "Social Commerce"

  patrocinio:
    patrocinadores:
      tipo: array
      obrigatório: false
      max_items: 10
      relacao: patrocinador_id
      descrição: "Patrocinadores da sessão (logos sempre exibidos)"

  recursos:
    link_traducao_simultanea:
      tipo: url
      obrigatório: false
      descrição: "Link para acessar tradução simultânea"
      exemplo: "https://traducao.vtexday.com/sala-1"

    arquivo_resumo:
      tipo: file
      obrigatório: false
      formato: pdf
      max_size: 10MB
      descrição: "Resumo da palestra (disponível após o evento)"
      disponivel_apos_evento: true
```

### 4. Cadastro de Patrocinadores

#### 4.1 Cadastro de Cotas

```yaml
cadastro_cota:
  identificacao:
    nome:
      tipo: string
      obrigatório: true
      único: true
      max: 50
      exemplo: "Diamond"

    nome_exibicao:
      tipo: object
      multilingual: true
      obrigatório: true
      campos:
        pt: "Diamante"
        en: "Diamond"

    ordenacao:
      tipo: integer
      obrigatório: true
      único: true
      min: 1
      max: 999
      descrição: "Ordem de exibição (1 = primeiro)"

  beneficios:
    posts_feed_social:
      tipo: integer
      obrigatório: true
      min: 0
      max: 100
      default: 5
      descrição: "Posts permitidos no feed"
```

#### 4.2 Cadastro do Patrocinador

```yaml
cadastro_patrocinador:
  dados_empresa:
    nome:
      tipo: string
      obrigatório: true
      max: 100
      único: true
      exemplo: "VTEX"

    slug:
      tipo: string
      obrigatório: true
      único: true
      formato: kebab-case
      auto_generate: from_nome
      exemplo: "vtex"
      descrição: "URL amigável para o patrocinador"

    cota:
      tipo: reference
      obrigatório: true
      relacao: cota_id

    posts_feed_social:
      tipo: integer
      obrigatório: false
      min: 0
      max: 999
      default: null
      descrição: "Sobrescreve quantidade de posts da cota se definido"

    tags:
      tipo: array
      obrigatório: false
      max_items: 10
      valores_sugeridos:
        - "E-commerce"
        - "Pagamentos"
        - "Logística"
        - "Marketing"
        - "Tecnologia"
        - "Consultoria"
        - "Plataforma"
        - "SaaS"
        - "Integração"
        - "Analytics"

  descricao:
    sobre_empresa:
      tipo: object
      multilingual: true
      obrigatório: true
      max: 500
      campos:
        pt: "Descrição em português..."
        en: "Description in English..."

    produtos_servicos:
      tipo: array
      max_items: 10
      item:
        nome: string
        descricao: text
        link: url

  midias:
    logo_principal:
      tipo: file
      obrigatório: true
      formatos: [png, svg]
      max_size: 2MB
      dimensoes:
        min: 200x100
        max: 2000x1000
        fundo: transparente
      versoes:
        - colorida
        - monocromatica
        - negativa

    banner_stand:
      tipo: file
      obrigatório: false
      formatos: [jpg, png]
      max_size: 10MB
      dimensoes:
        recomendado: 1920x600
        aspect_ratio: "3.2:1"

    video_institucional:
      tipo: url
      obrigatório: false
      validação: youtube_vimeo
      max_duracao: 180

  contato:
    nome:
      tipo: string
      obrigatório: true
      max: 100
      exemplo: "João Silva"

    email:
      tipo: email
      obrigatório: true
      exemplo: "contato@empresa.com"

    telefone:
      tipo: string
      obrigatório: true
      formato: "+55 (11) 98765-4321"

    cargo:
      tipo: string
      obrigatório: false
      max: 50
      exemplo: "Gerente de Marketing"

  configuracoes:
    ordem_exibicao:
      tipo: integer
      obrigatório: true
      min: 1
      descrição: "Ordem dentro da cota"

    destaque:
      tipo: boolean
      default: false
      descrição: "Destacar este patrocinador"

    captura_leads:
      tipo: boolean
      default: true
      descrição: "Habilitar captura de leads"
```

### 5. Cadastro de Participantes (Fase 2)

#### 5.1 Campos do Participante

```yaml
cadastro_participante:
  validacao_ingresso:
    codigo_ingresso:
      tipo: string
      obrigatório: true
      único: true
      formato: "VTXDAY-XXXXX"
      validação: api_ticketeira

    email_ingresso:
      tipo: email
      obrigatório: true
      validação: match_ticketeira

  dados_pessoais:
    nome_completo:
      tipo: string
      obrigatório: true
      min: 3
      max: 100
      fonte: ticketeira_ou_manual

    nome_cracha:
      tipo: string
      obrigatório: false
      max: 30
      default: primeiro_nome

    email:
      tipo: email
      obrigatório: true
      único: true

    telefone:
      tipo: string
      obrigatório: true
      formato: telefone_br

    documento:
      tipo: string
      obrigatório: true
      tipos: ["CPF", "Passaporte"]
      validação: documento_valido
      criptografado: true

    data_nascimento:
      tipo: date
      obrigatório: false
      validação: maior_16_anos

  perfil_profissional:
    empresa:
      tipo: string
      obrigatório: true
      max: 100
      sugestoes: empresas_cadastradas

    cargo:
      tipo: string
      obrigatório: true
      max: 50
      sugestoes:
        - "CEO/Presidente"
        - "Diretor"
        - "Gerente"
        - "Coordenador"
        - "Analista"
        - "Desenvolvedor"
        - "Consultor"
        - "Outros"

    area_atuacao:
      tipo: enum
      obrigatório: true
      valores:
        - tecnologia: "Tecnologia"
        - marketing: "Marketing"
        - vendas: "Vendas"
        - operacoes: "Operações"
        - financeiro: "Financeiro"
        - rh: "Recursos Humanos"
        - outros: "Outros"

    senioridade:
      tipo: enum
      obrigatório: false
      valores:
        - junior: "Júnior (0-2 anos)"
        - pleno: "Pleno (2-5 anos)"
        - senior: "Sênior (5-10 anos)"
        - especialista: "Especialista (10+ anos)"

  preferencias:
    interesses:
      tipo: array
      obrigatório: true
      min_items: 3
      max_items: 10
      valores: tags_palestras
      descrição: "Usado para recomendações"

    objetivos_evento:
      tipo: array
      obrigatório: false
      max_items: 5
      valores:
        - networking: "Networking"
        - aprendizado: "Aprendizado"
        - negocios: "Oportunidades de Negócio"
        - tendencias: "Conhecer Tendências"
        - certificacao: "Certificação"

    restricoes_alimentares:
      tipo: array
      obrigatório: false
      valores:
        - vegetariano: "Vegetariano"
        - vegano: "Vegano"
        - sem_gluten: "Sem Glúten"
        - sem_lactose: "Sem Lactose"
        - kosher: "Kosher"
        - halal: "Halal"
        - alergias: "Alergias (especificar)"

    acessibilidade:
      tipo: object
      campos:
        necessidades_especiais: boolean
        descricao: text
        acompanhante: boolean
        equipamentos: array

  consentimentos:
    termos_uso:
      tipo: boolean
      obrigatório: true
      timestamp: datetime
      ip: string

    politica_privacidade:
      tipo: boolean
      obrigatório: true
      timestamp: datetime
      versao: string

    comunicacao_marketing:
      tipo: boolean
      obrigatório: false
      default: false
      canais:
        email: boolean
        sms: boolean
        push: boolean
        whatsapp: boolean

    compartilhamento_dados:
      tipo: boolean
      obrigatório: false
      default: false
      descrição: "Compartilhar com patrocinadores"

    uso_imagem:
      tipo: boolean
      obrigatório: false
      default: true
      descrição: "Fotos e vídeos do evento"
```

### 6. Cadastro de Configurações Gerais

#### 6.1 Controle de Visibilidade de Seções

```yaml
controle_secoes:
  secoes_disponiveis:
    agenda:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "visivel")
        mensagem_em_breve: string (default: "Em breve disponibilizaremos a agenda completa")
        data_liberacao: datetime
        ordem: integer

    palestrantes:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "visivel")
        mensagem_em_breve: string (default: "Em breve anunciaremos os palestrantes")
        data_liberacao: datetime
        ordem: integer

    patrocinadores:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "visivel")
        mensagem_em_breve: string (default: "Em breve divulgaremos nossos patrocinadores")
        data_liberacao: datetime
        ordem: integer

    mapa:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "oculto")
        mensagem_em_breve: string (default: "O mapa do evento será disponibilizado em breve")
        data_liberacao: datetime
        ordem: integer

    faq:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "visivel")
        mensagem_em_breve: string (default: "Perguntas frequentes em breve")
        data_liberacao: datetime
        ordem: integer

    imprensa:
      tipo: object
      campos:
        status: enum ["visivel", "em_breve", "oculto"] (default: "oculto")
        mensagem_em_breve: string (default: "Materiais de imprensa em breve")
        data_liberacao: datetime
        ordem: integer
```

#### 6.2 Configurações do Evento

```yaml
configuracoes_evento:
  informacoes_basicas:
    nome_evento:
      tipo: string
      obrigatório: true
      default: "VTEX DAY 26"

    data_inicio:
      tipo: date
      obrigatório: true
      formato: "YYYY-MM-DD"
      default: "2025-11-26"

    data_fim:
      tipo: date
      obrigatório: true
      formato: "YYYY-MM-DD"
      default: "2025-11-28"

    local:
      tipo: string
      obrigatório: true
      exemplo: "São Paulo Expo"

    endereco:
      tipo: object
      campos:
        rua: string
        numero: string
        complemento: string
        bairro: string
        cidade: string
        estado: string
        cep: string
        pais: string

  mapa:
    link_google_maps:
      tipo: url
      obrigatório: false
      exemplo: "https://maps.google.com/..."

    imagem_mapa_estatico:
      tipo: file
      obrigatório: false
      formato: [jpg, png]
      max_size: 5MB
      descrição: "Imagem do mapa do local"

    pdf_mapa_evento:
      tipo: file
      obrigatório: false
      formato: pdf
      max_size: 10MB
      descrição: "Mapa detalhado do evento em PDF"

  contatos:
    email_contato:
      tipo: email
      obrigatório: true
      exemplo: "contato@vtexday.com"

    email_imprensa:
      tipo: email
      obrigatório: false
      exemplo: "imprensa@vtexday.com"

    telefone:
      tipo: string
      obrigatório: true
      formato: "+55 (11) 98765-4321"

    whatsapp:
      tipo: string
      obrigatório: false
      formato: "+55 (11) 98765-4321"

  redes_sociais:
    instagram:
      tipo: string
      obrigatório: false
      formato: "@username"

    linkedin:
      tipo: url
      obrigatório: false

    twitter:
      tipo: string
      obrigatório: false
      formato: "@username"

    youtube:
      tipo: url
      obrigatório: false
```

### 7. Cadastro de Imprensa e Releases

#### 7.1 Materiais de Imprensa

```yaml
cadastro_material_imprensa:
  identificacao:
    titulo:
      tipo: string
      obrigatório: true
      max: 200
      exemplo: "Kit de Imprensa VTEX DAY 26"

    tipo:
      tipo: enum
      obrigatório: true
      valores:
        - press_kit: "Press Kit Completo"
        - logo_pack: "Pacote de Logos"
        - fotos_evento: "Fotos do Evento"
        - videos: "Vídeos"
        - apresentacoes: "Apresentações"

    descricao:
      tipo: text
      obrigatório: false
      max: 500

  arquivo:
    arquivo_principal:
      tipo: file
      obrigatório: true
      formatos: [pdf, zip, jpg, png, mp4]
      max_size: 100MB

    thumbnail:
      tipo: file
      obrigatório: false
      formatos: [jpg, png]
      max_size: 2MB
      dimensoes:
        recomendado: 400x300

  configuracoes:
    ordem:
      tipo: integer
      obrigatório: true
      min: 1

    destaque:
      tipo: boolean
      default: false

    publico:
      tipo: boolean
      default: true
      descrição: "Disponível para download público"
```

#### 7.2 Releases / Notícias (Parte de Imprensa)

```yaml
cadastro_release:
  conteudo:
    titulo:
      tipo: object
      multilingual: true
      obrigatório: true
      max: 200
      campos:
        pt: "Título em português"
        en: "Title in English"

    resumo:
      tipo: object
      multilingual: true
      obrigatório: true
      max: 300
      campos:
        pt: "Resumo em português"
        en: "Summary in English"

    conteudo_completo:
      tipo: object
      multilingual: true
      obrigatório: true
      max: 5000
      rich_text: true
      campos:
        pt: "Conteúdo completo..."
        en: "Full content..."

    slug:
      tipo: string
      obrigatório: true
      único: true
      auto_generate: from_titulo
      formato: kebab-case

  midia:
    imagem_destaque:
      tipo: file
      obrigatório: false
      formatos: [jpg, png, webp]
      max_size: 5MB
      dimensoes:
        min: 800x600
        recomendado: 1200x800

    galeria:
      tipo: array
      max_items: 10
      item:
        arquivo: file
        legenda: string
        creditos: string

  metadados:
    data_publicacao:
      tipo: datetime
      obrigatório: true
      default: now

    autor:
      tipo: string
      obrigatório: false
      exemplo: "Equipe VTEX"

    tags:
      tipo: array
      max_items: 5
      valores_sugeridos:
        - "Novidade"
        - "Palestrante"
        - "Patrocinador"
        - "Agenda"
        - "Importante"

    destaque_home:
      tipo: boolean
      default: false

    publicado:
      tipo: boolean
      default: false
```

### 8. Cadastro de Páginas Legais

```yaml
cadastro_paginas_legais:
  termos_uso:
    arquivo_pdf_pt:
      tipo: file
      obrigatório: true
      formato: pdf
      max_size: 5MB
      descrição: "Termos de Uso em Português"

    arquivo_pdf_en:
      tipo: file
      obrigatório: true
      formato: pdf
      max_size: 5MB
      descrição: "Terms of Use in English"

    data_atualizacao:
      tipo: date
      obrigatório: true
      auto_update: true

  politica_privacidade:
    arquivo_pdf_pt:
      tipo: file
      obrigatório: true
      formato: pdf
      max_size: 5MB
      descrição: "Política de Privacidade em Português"

    arquivo_pdf_en:
      tipo: file
      obrigatório: true
      formato: pdf
      max_size: 5MB
      descrição: "Privacy Policy in English"

    data_atualizacao:
      tipo: date
      obrigatório: true
      auto_update: true
```

### 9. Cadastro de FAQ

#### 9.1 Categorias de FAQ

```yaml
cadastro_categoria_faq:
  nome:
    tipo: object
    multilingual: true
    obrigatório: true
    único: true
    max: 50
    campos:
      pt: "Nome da Categoria"
      en: "Category Name"

  ordem:
    tipo: integer
    obrigatório: true
    min: 1
    único: true
    descrição: "Ordem de exibição"
```

#### 9.2 Perguntas FAQ

```yaml
cadastro_pergunta_faq:
  pergunta:
    tipo: object
    multilingual: true
    obrigatório: true
    max: 200
    campos:
      pt: "Pergunta em português?"
      en: "Question in English?"

  resposta:
    tipo: object
    multilingual: true
    obrigatório: true
    max: 2000
    rich_text: true
    recursos:
      - negrito
      - italico
      - listas
      - links
      - imagens_inline
    campos:
      pt: "Resposta detalhada..."
      en: "Detailed answer..."

  categoria:
    tipo: reference
    obrigatório: true
    relacao: categoria_faq_id

  ordem:
    tipo: integer
    obrigatório: true
    min: 1
    escopo: por_categoria
    descrição: "Ordem dentro da categoria"
```

### 10. Validações e Regras de Negócio

#### 10.1 Validações Gerais

```yaml
validacoes_sistema:
  email:
    - Formato válido (RFC 5322)

  telefone:
    - Formato E.164 ou nacional
    - Validação por país

  cpf_cnpj:
    - Algoritmo de validação oficial

  arquivos:
    - Validação MIME type
    - Limite de tamanho por tipo
    - Otimização automática de imagens

  urls:
    - Protocolo HTTPS preferencial
```

#### 10.2 Regras de Negócio

```yaml
regras_negocio:
  palestrantes:
    - Não pode ter duas palestras no mesmo horário
    - Foto obrigatória para palestrantes principais

  palestras:
    - Não pode haver conflito de horário no mesmo palco

  patrocinadores:
    - Logo obrigatório para todas as cotas
    - Limite de posts baseado na cota

  participantes:
    - Ingresso validado apenas uma vez
    - Dados pessoais criptografados (LGPD)

  sistema:
    - Backup automático a cada 4 horas
    - Logs mantidos por 90 dias
    - Sessão expira em 2 horas de inatividade
    - Rate limit: 100 requests/min por IP
```

### 11. Fluxos de Integração

#### 11.1 Integração com Ticketeira

```yaml
integracao_ticketeira:
  webhook_eventos:
    - compra_ingresso
    - cancelamento_ingresso
    - transferencia_ingresso
    - check_in_evento

  dados_sincronizados:
    - codigo_ingresso
    - nome_comprador
    - email_comprador
    - tipo_ingresso
    - status_pagamento
    - data_compra

  validacao:
    - API call para validar código
    - Cache de 1 hora para códigos válidos
    - Fallback para modo offline
    - Queue para reprocessamento
```

## Relatório de Validação do Checklist

### Resumo Executivo
- **Completude Geral do PRD:** 95%
- **Adequação do Escopo MVP:** Apropriado
- **Prontidão para Fase de Arquitetura:** PRONTO
- **Gaps Críticos:** Nenhum bloqueador identificado

### Status por Categoria

| Categoria | Status | Questões Críticas |
|-----------|--------|-------------------|
| 1. Definição do Problema e Contexto | PASS | Nenhuma |
| 2. Definição do Escopo MVP | PASS | Nenhuma |
| 3. Requisitos de Experiência do Usuário | PASS | Nenhuma |
| 4. Requisitos Funcionais | PASS | Nenhuma |
| 5. Requisitos Não-Funcionais | PASS | Nenhuma |
| 6. Estrutura de Épicos e Stories | PASS | Nenhuma |
| 7. Orientação Técnica | PASS | Nenhuma |
| 8. Requisitos Cross-Funcionais | PARTIAL | Integrações com ticketeira pendente documentação |
| 9. Clareza e Comunicação | PASS | Nenhuma |

### Questões por Prioridade

**ALTA:**
- Confirmar disponibilidade e documentação da API da ticketeira
- Validar orçamento para infraestrutura MongoDB Atlas e serviços AWS

**MÉDIA:**
- Definir processo de aprovação com stakeholders VTEX
- Estabelecer SLAs específicos para suporte durante o evento

**BAIXA:**
- Considerar documentação de fallback caso Lovable tenha limitações
- Planejar treinamento para equipe administrativa

### Avaliação do Escopo MVP

**Adequadamente Dimensionado:**
- Estratégia white-label permite desenvolvimento paralelo eficiente
- Foco em funcionalidades essenciais para primeira entrega
- Customização visual deixada para final maximiza velocidade

**Riscos Identificados:**
- Timeline de 8 semanas é agressivo mas viável com equipe dedicada
- Integração com Lovable pode apresentar desafios técnicos
- Performance sob carga de 20000 usuários totais com picos de 2000 simultâneos precisa validação antecipada

### Prontidão Técnica

**Pontos Fortes:**
- Stack bem definido (NestJS, MongoDB, React, React Native)
- Arquitetura monolítica apropriada para prazo
- Estratégia de deploy pragmática

**Áreas de Atenção:**
- Configuração de CORS para Lovable precisa ser testada cedo
- Cache strategy com Redis deve ser implementada desde início
- Push notifications precisam setup antecipado para app stores

## Próximos Passos

### Prompt para UX Expert

Para iniciar o processo de design da interface, use o seguinte prompt:

"Por favor, revise o PRD da plataforma VTEX DAY 26 em docs/prd.md. Crie wireframes e fluxos de usuário para o backoffice administrativo e aplicativo mobile, seguindo a estratégia white-label definida. Foque em usabilidade e eficiência, usando componentes padrão (Bootstrap/Material) inicialmente. Priorize os fluxos: 1) Admin fazendo login e gerenciando palestras, 2) Visitante navegando agenda no app, 3) Admin enviando push notification. Documente as decisões de UX em docs/ux-design.md"

### Prompt para Architect

Para iniciar a arquitetura técnica, use o seguinte prompt:

"Por favor, revise o PRD da plataforma VTEX DAY 26 em docs/prd.md. Crie a arquitetura técnica detalhada seguindo as premissas: NestJS monolítico modular, MongoDB com Mongoose, React para backoffice, React Native para mobile, estratégia white-label. Defina: 1) Estrutura de módulos NestJS, 2) Schemas MongoDB, 3) Estrutura de componentes React reutilizáveis, 4) Estratégia de cache com Redis, 5) Pipeline CI/CD com GitHub Actions. Priorize simplicidade e velocidade de desenvolvimento para entregar MVP em 8 semanas. Documente em docs/architecture.md"

### Recomendações Finais

1. **Iniciar Imediatamente:**
   - Setup do monorepo e configuração base do NestJS
   - Criação da conta MongoDB Atlas
   - Configuração do Firebase para push notifications

2. **Validar na Primeira Semana:**
   - Acesso e documentação da API da ticketeira
   - Capacidades e limitações do Lovable
   - Disponibilidade da equipe de desenvolvimento

3. **Estabelecer Processos:**
   - Daily standups para acompanhar progresso
   - Code reviews obrigatórios mesmo com prazo apertado
   - Ambiente de staging funcional desde semana 2

4. **Mitigar Riscos:**
   - Ter plano B para integração com ticketeira
   - Preparar versão PWA como fallback para apps nativos
   - Implementar feature flags para controlar rollout

---

*Documento finalizado em 24/09/2025*
*Próxima revisão: Após feedback do Architect*
*Status: APROVADO PARA DESENVOLVIMENTO*