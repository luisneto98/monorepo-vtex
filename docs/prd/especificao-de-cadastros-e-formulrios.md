# Especificação de Cadastros e Formulários

## Visão Geral dos Cadastros

O sistema VTEX DAY 26 possui múltiplos tipos de usuários e entidades que requerem cadastros específicos. Esta seção detalha todos os formulários, campos, validações e regras de negócio para cada tipo de cadastro.

## 1. Cadastro de Usuários Administrativos

### 1.1 Tipos de Usuários

| Tipo | Permissões | Descrição |
|------|------------|-----------|
| **Super Admin** | Acesso total | Gerencia toda plataforma, usuários e configurações |
| **Produtor** | Gestão de conteúdo | Gerencia palestras, palestrantes, FAQ, patrocinadores e agenda |
| **Patrocinador** | Portal limitado | Acesso ao portal do expositor para gerenciar perfil e leads |

### 1.2 Campos do Cadastro de Admin

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

### 1.3 Fluxo de Cadastro de Admin

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

## 2. Cadastro de Palestrantes

### 2.1 Campos do Palestrante

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

## 3. Cadastro de Palestras/Sessões

### 3.1 Campos da Palestra

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

## 4. Cadastro de Patrocinadores

### 4.1 Cadastro de Cotas

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

### 4.2 Cadastro do Patrocinador

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

## 5. Cadastro de Participantes (Fase 2)

### 5.1 Campos do Participante

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

## 6. Cadastro de Configurações Gerais

### 6.1 Controle de Visibilidade de Seções

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

### 6.2 Configurações do Evento

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

## 7. Cadastro de Imprensa e Releases

### 7.1 Materiais de Imprensa

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

### 7.2 Releases / Notícias (Parte de Imprensa)

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

## 8. Cadastro de Páginas Legais

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

## 9. Cadastro de FAQ

### 9.1 Categorias de FAQ

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

### 9.2 Perguntas FAQ

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

## 10. Validações e Regras de Negócio

### 10.1 Validações Gerais

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

### 10.2 Regras de Negócio

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

## 11. Fluxos de Integração

### 11.1 Integração com Ticketeira

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
