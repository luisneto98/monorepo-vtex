# Próximos Passos

## Prompt para UX Expert

Para iniciar o processo de design da interface, use o seguinte prompt:

"Por favor, revise o PRD da plataforma VTEX DAY 26 em docs/prd.md. Crie wireframes e fluxos de usuário para o backoffice administrativo e aplicativo mobile, seguindo a estratégia white-label definida. Foque em usabilidade e eficiência, usando componentes padrão (Bootstrap/Material) inicialmente. Priorize os fluxos: 1) Admin fazendo login e gerenciando palestras, 2) Visitante navegando agenda no app, 3) Admin enviando push notification. Documente as decisões de UX em docs/ux-design.md"

## Prompt para Architect

Para iniciar a arquitetura técnica, use o seguinte prompt:

"Por favor, revise o PRD da plataforma VTEX DAY 26 em docs/prd.md. Crie a arquitetura técnica detalhada seguindo as premissas: NestJS monolítico modular, MongoDB com Mongoose, React para backoffice, React Native para mobile, estratégia white-label. Defina: 1) Estrutura de módulos NestJS, 2) Schemas MongoDB, 3) Estrutura de componentes React reutilizáveis, 4) Estratégia de cache com Redis, 5) Pipeline CI/CD com GitHub Actions. Priorize simplicidade e velocidade de desenvolvimento para entregar MVP em 8 semanas. Documente em docs/architecture.md"

## Recomendações Finais

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