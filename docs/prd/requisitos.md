# Requisitos

## Requisitos Funcionais

### Website e Core
- **RF1:** A plataforma deve fornecer um website responsivo bilíngue (PT-BR, EN) com detecção automática de idioma e troca manual
- **RF2:** O sistema deve exibir agenda completa com filtros por tema, palestrante, palco, data, horário e tags
- **RF3:** O website deve apresentar perfis detalhados de palestrantes com bio, foto, empresa, cargo (internacionalizado), sessões vinculadas, priorização de exibição e marcação de destaque para home
- **RF4:** O sistema deve exibir patrocinadores organizados por cota configurável (Diamond, Gold, Silver, etc.) com logos, descrições, links e ordenação customizável tanto entre cotas quanto dentro de cada cota. Implementar scroll infinito para grandes volumes (250+ patrocinadores). Na home, usar apenas botão de redirecionamento para página de patrocinadores
- **RF5:** O website deve fornecer área de imprensa com download de press releases, logos e materiais oficiais, incluindo informações de contato (assessoria@vtex.com)
- **RF6:** O sistema deve disponibilizar mapa estático do local com integração para Google/Apple Maps. Esta seção pode ser ativada/desativada conforme disponibilidade do material
- **RF7:** A plataforma deve implementar FAQ categorizado com busca, navegação por categorias, ordenação customizável de categorias e perguntas, e editor rich text básico para respostas (negrito, bullets, links)
- **RF8:** O sistema deve processar formulário de contato próprio (não embed) com suporte multilíngue nos campos, salvando dados no backend para consulta no backoffice. Preparar para futura integração com CRM externo

### Aplicativo Mobile - Modo Visitante
- **RF9:** O app deve espelhar todo conteúdo público do website em formato otimizado para mobile
- **RF10:** O sistema deve permitir visualização de agenda em formato lista e calendário (horário de Brasília GMT-3)
- **RF11:** O app deve implementar busca contextual por seção (agenda, palestrantes, patrocinadores, FAQ) - não busca integrada global
- **RF12:** O sistema deve receber e processar push notifications gerais do backoffice com histórico de notificações recebidas no app
- **RF13:** O app deve permitir navegação offline de conteúdo previamente carregado

### Aplicativo Mobile - Modo Participante (Fase 2)
- **IMPORTANTE:** Incluir páginas legais no app (termos de uso, política de privacidade). Design da entrada da Fase 2 sem forçar cadastro imediato
- **RF14:** O sistema deve validar ingressos através de código/QR code para desbloquear modo participante
- **RF15:** O app deve capturar interesses e preferências durante onboarding para personalização
- **RF16:** O sistema deve permitir favoritar palestras e criar agenda pessoal com detecção de conflitos
- **RF17:** O app deve habilitar chat moderado (canal geral e mensagens 1:1 com consentimento mútuo)
- **RF18:** O sistema deve permitir envio de mensagens para patrocinadores através de formulários específicos
- **RF19:** O app deve integrar mapa interativo do evento (embed de solução externa)
- **RF20:** O sistema deve gerenciar feed social com posts (texto/imagem/vídeo/GIF), curtidas e comentários

### Ambiente de Palco Ao Vivo (Fase 2)
- **RF21:** O sistema deve gerenciar Q&A moderado com votação de perguntas por relevância
- **RF22:** O app deve aplicar pesquisas de satisfação específicas por palestra
- **RF23:** O sistema deve executar enquetes em tempo real durante apresentações
- **RF24:** O app deve integrar com serviço de tradução simultânea
- **RF25:** O sistema deve gerar e disponibilizar resumos em PDF das palestras

### Backoffice Administrativo
- **RF26:** O sistema deve autenticar administradores com recuperação de senha e gestão de sessões, será obrigatório que os usuários administradores tenham uma senha forte (12+ caracteres, letras maiúsculas, letras minúsculas, números, símbolos, aleatória) e ao se cadastrarem eles irão receber um link que expira após determinado período para criação da senha
- **RF27:** O backoffice deve fornecer CRUD completo para palestras com campos: título, descrição, palestrantes (múltiplos), horário, palco, tags, idioma, patrocinadores da palestra
- **RF28:** O sistema deve gerenciar CRUD de palestrantes: nome, bio, foto, empresa, cargo, redes sociais, palestras vinculadas
- **RF29:** O backoffice deve administrar patrocinadores com cota configurável, logo, descrição, ordem de exibição, links, e-mail do administrador do patrocinador, quantidade de posts permitidos no feed (herdado da cota mas editável), local do stand, links de redes sociais. Incluir CRUD de cotas com ordenação
- **RF30:** O sistema deve controlar visibilidade de TODAS as seções (on/off/em breve) com mensagens customizadas e ativação agendada automática por data/hora
- **RF31:** O backoffice deve criar, agendar e enviar push notifications para todos usuários do app
- **RF32:** O sistema deve gerenciar múltiplos perfis de acesso (super admin, produtor, patrocinador)
- **RF33:** O backoffice deve fornecer upload e gestão de assets (imagens, PDFs, logos) com otimização automática para qualquer upload feito no backoffice
- **RF34:** O sistema deve registrar logs de auditoria para todas as operações de cadastro, edição e exclusão com identificação do usuário

### Portal do Expositor (Fase 2)
- **RF35:** O portal deve permitir login autônomo para patrocinadores com credenciais específicas
- **RF36:** O sistema deve habilitar edição de perfil próprio: descrição, logo, contatos, materiais
- **RF37:** O portal deve receber e gerenciar inbox de mensagens/leads dos participantes
- **RF38:** O sistema deve permitir publicação limitada de posts no feed (quota por cota de patrocínio)
- **RF39:** O sistema deve fornecer dashboard com métricas: visualizações, mensagens recebidas

### Integrações e Analytics
- **RF40:** O sistema deve integrar com API da ticketeira usando fila de eventos (compra/edição/cancelamento) para manter independência operacional
- **RF41:** A plataforma deve implementar Google Tag Manager e Analytics em todas as páginas
- **RF42:** O sistema deve gerar relatórios de engajamento: páginas mais vistas, palestrantes populares, horários de pico
- **RF43:** O backoffice deve exibir dashboard em tempo real durante o evento com métricas principais

### Páginas Adicionais
- **RF44:** O sistema deve incluir páginas legais: política de privacidade, termos de uso, política de cookies
- **RF45:** Implementar preferência de idioma por usuário no app (não depender do idioma do dispositivo)
- **RF46:** Push notifications com suporte multilíngue baseado na preferência do usuário

## Requisitos Não Funcionais

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
