---
title: Legal Pages Management Module
section: 8
type: full-stack
epic: Legal and Compliance
priority: high
estimated_hours: 10
status: Draft
---

# User Story: Legal Pages Management System

## Story
**As a** compliance officer or legal team member,
**I want** a system to manage and version control legal documents,
**So that** I can ensure all legal pages are up-to-date, versioned, and available in multiple languages with proper audit trails

## Background
The VTEX Day 2026 platform requires a robust legal pages management system to handle Terms of Use, Privacy Policy, Cookie Policy, and other legal documents. This module must support versioning, multilingual content (pt-BR, en, es), effective date management, and maintain a complete audit trail for compliance purposes. Based on lessons learned from previous modules, this implementation will include comprehensive security measures, proper input sanitization, and complete test coverage from the start.

## Acceptance Criteria

### Backend API Requirements
- [ ] CRUD endpoints for legal pages with proper authentication
- [ ] Version control system with full history tracking
- [ ] Multilingual support (pt-BR, en, es) for all content
- [ ] Effective date management for version activation
- [ ] Acceptance tracking for users who accept terms
- [ ] Audit trail for all changes with author attribution
- [ ] Public endpoints for active legal pages (no auth required)
- [ ] Comparison endpoint to show differences between versions
- [ ] PDF generation for legal documents
- [ ] Email notification system for major updates
- [ ] Input sanitization with DOMPurify for all content
- [ ] Rate limiting on all endpoints
- [ ] Automatic backup of all versions
- [ ] Digital signature support for document integrity
- [ ] GDPR compliance features (data export, deletion requests)

### Frontend Admin Requirements
- [ ] Legal pages listing with version history
- [ ] Rich text editor with legal formatting support
- [ ] Version comparison viewer with diff highlighting
- [ ] Multilingual content editor with side-by-side view
- [ ] Effective date scheduler with calendar
- [ ] Preview mode for all languages
- [ ] Approval workflow interface
- [ ] Acceptance statistics dashboard
- [ ] Audit log viewer with filters
- [ ] Bulk operations for translations
- [ ] Template system for standard clauses
- [ ] Export functionality (PDF, DOCX, HTML)
- [ ] Search across all versions and languages
- [ ] Proper modal components (no prompt dialogs)
- [ ] Real-time collaboration indicators

### Frontend Public Requirements
- [ ] Clean, accessible legal pages display
- [ ] Language switcher for all supported languages
- [ ] Version history viewer for transparency
- [ ] Print-friendly layout
- [ ] Table of contents with smooth scrolling
- [ ] Search functionality within documents
- [ ] Acceptance mechanism with timestamp
- [ ] Cookie consent management integration
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Mobile-responsive design
- [ ] Offline viewing capability (PWA)

### Data Model Requirements
- [ ] Immutable version storage (versions never deleted)
- [ ] Structured content with sections and clauses
- [ ] Metadata for SEO and document properties
- [ ] Change tracking with detailed diffs
- [ ] User acceptance records with IP and timestamp
- [ ] Document relationships (e.g., privacy policy references)
- [ ] Template system for reusable content blocks

### Security Requirements
- [ ] JWT authentication for admin operations
- [ ] Role-based access (ADMIN, LEGAL_ADMIN, SUPER_ADMIN)
- [ ] Content integrity verification with checksums
- [ ] HTML sanitization to prevent XSS
- [ ] Audit logging for all operations
- [ ] Data encryption at rest for sensitive content
- [ ] HTTPS-only for all legal page access
- [ ] Rate limiting to prevent abuse
- [ ] CSRF protection on state-changing operations

### Compliance Requirements
- [ ] GDPR compliance for privacy policy
- [ ] LGPD compliance (Brazilian data protection)
- [ ] CCPA compliance (California privacy rights)
- [ ] Accessibility standards (WCAG 2.1 AA)
- [ ] Document retention policies
- [ ] Right to be forgotten implementation
- [ ] Data portability features
- [ ] Consent management and tracking

### Performance Requirements
- [ ] Page load time < 2 seconds
- [ ] Document search < 500ms
- [ ] Version comparison < 1 second
- [ ] Caching for public pages
- [ ] CDN integration for global access
- [ ] Database indexing for search
- [ ] Lazy loading for version history

### Testing Requirements
- [ ] Unit tests with >85% coverage
- [ ] Integration tests for all endpoints
- [ ] Component tests for frontend
- [ ] Accessibility tests (automated and manual)
- [ ] Security penetration testing
- [ ] Performance load testing
- [ ] Cross-browser compatibility tests
- [ ] Multi-language content tests

## Tasks / Subtasks

### 1. Backend Module Setup (1 hour)
- [ ] Create legal-pages module structure
- [ ] Define interfaces and types
- [ ] Setup module configuration
- [ ] Register module in app.module.ts
- [ ] Configure database connections
- [ ] Setup encryption utilities
- [ ] Initialize audit logging

### 2. Database Schema Design (1.5 hours)
- [ ] Create LegalPage schema with versioning
- [ ] Design Version sub-schema with immutability
- [ ] Implement LocalizedContent for translations
- [ ] Create UserAcceptance tracking schema
- [ ] Design AuditLog schema
- [ ] Setup compound indexes for performance
- [ ] Implement soft delete with archival

### 3. DTOs and Validation (1 hour)
- [ ] CreateLegalPageDto with validation
- [ ] UpdateLegalPageDto for new versions
- [ ] QueryLegalPageDto for filtering
- [ ] AcceptanceDto for user consent
- [ ] ComparisonDto for version diffs
- [ ] ExportDto for document export
- [ ] Custom validators for legal content

### 4. Service Implementation (2 hours)
- [ ] Version control service with branching
- [ ] Content sanitization service
- [ ] PDF generation service
- [ ] Email notification service
- [ ] Diff comparison service
- [ ] Template management service
- [ ] Acceptance tracking service
- [ ] Export service (multiple formats)
- [ ] Backup service with scheduling
- [ ] GDPR compliance service

### 5. Controller Implementation (1.5 hours)
- [ ] Admin CRUD endpoints
- [ ] Public read endpoints
- [ ] Version management endpoints
- [ ] Acceptance tracking endpoints
- [ ] Export endpoints
- [ ] Comparison endpoints
- [ ] Statistics endpoints
- [ ] Compliance endpoints (GDPR)
- [ ] Webhook endpoints for integrations

### 6. Frontend Admin Components (2 hours)
- [ ] Create LegalPages.tsx main page
- [ ] Build VersionHistory component
- [ ] Create LegalPageEditor with rich text
- [ ] Implement VersionComparison viewer
- [ ] Build ApprovalWorkflow component
- [ ] Create AuditLogViewer
- [ ] Add StatisticsDashboard
- [ ] Implement TemplateManager

### 7. Frontend Public Pages (1.5 hours)
- [ ] Create public LegalPage component
- [ ] Build TableOfContents generator
- [ ] Implement LanguageSwitcher
- [ ] Create AcceptanceModal
- [ ] Build SearchWithinDocument
- [ ] Add PrintView component
- [ ] Implement OfflineViewer (PWA)
- [ ] Create AccessibilityToolbar

### 8. Version Control Features (1 hour)
- [ ] Implement version branching
- [ ] Create diff algorithm
- [ ] Build merge conflict resolver
- [ ] Add rollback functionality
- [ ] Create version tagging
- [ ] Implement draft versions
- [ ] Add scheduled publishing

### 9. Compliance Features (1 hour)
- [ ] GDPR data export functionality
- [ ] Right to deletion implementation
- [ ] Consent management system
- [ ] Cookie policy integration
- [ ] Data retention automation
- [ ] Privacy settings dashboard
- [ ] Compliance reporting tools

### 10. Testing Implementation (1.5 hours)
- [ ] Backend unit tests
- [ ] Integration test suite
- [ ] Frontend component tests
- [ ] Accessibility test suite
- [ ] Security test scenarios
- [ ] Performance benchmarks
- [ ] E2E test workflows

## Dev Notes

### Technical Context
**Backend Stack:**
- NestJS with modular architecture
- MongoDB for document storage
- PostgreSQL for relational data (acceptance records)
- Redis for caching and sessions
- Bull queue for background jobs
- Puppeteer for PDF generation
- Nodemailer for notifications
- DOMPurify for sanitization
- Bcrypt for checksum generation

**Frontend Stack:**
- React 18 with TypeScript
- Shadcn/ui components
- React Query for data fetching
- Lexical or Slate for rich text editing
- Monaco Editor for code/markup view
- Diff2Html for version comparison
- React-PDF for PDF preview
- Workbox for PWA/offline support

### Security Implementation (CRITICAL)
Based on QA findings from previous modules:
1. **ALL text inputs MUST use DOMPurify sanitization**
2. **NO prompt() dialogs - use proper modal components**
3. **Proper memory management - revoke all object URLs**
4. **Rate limiting configured per endpoint type**
5. **Path traversal protection for all file operations**
6. **Content Security Policy headers required**
7. **Input validation at both client and server**
8. **Checksum verification for document integrity**

### File Structure
```
apps/api/src/modules/legal-pages/
├── legal-pages.module.ts
├── legal-pages.controller.ts
├── legal-pages.service.ts
├── services/
│   ├── version-control.service.ts
│   ├── content-sanitization.service.ts
│   ├── pdf-generation.service.ts
│   ├── notification.service.ts
│   ├── diff-comparison.service.ts
│   ├── compliance.service.ts
│   ├── acceptance-tracking.service.ts
│   └── backup.service.ts
├── schemas/
│   ├── legal-page.schema.ts
│   ├── version.schema.ts
│   ├── user-acceptance.schema.ts
│   └── audit-log.schema.ts
├── dto/
│   ├── create-legal-page.dto.ts
│   ├── update-legal-page.dto.ts
│   ├── query-legal-page.dto.ts
│   ├── acceptance.dto.ts
│   └── export.dto.ts
├── utils/
│   ├── checksum.util.ts
│   ├── diff.util.ts
│   └── sanitization.util.ts
└── tests/
    ├── legal-pages.service.spec.ts
    ├── version-control.spec.ts
    └── compliance.spec.ts

apps/admin/src/
├── pages/
│   └── LegalPages.tsx
├── components/
│   └── legal-pages/
│       ├── LegalPagesList.tsx
│       ├── LegalPageEditor.tsx
│       ├── VersionHistory.tsx
│       ├── VersionComparison.tsx
│       ├── ApprovalWorkflow.tsx
│       ├── AuditLogViewer.tsx
│       ├── StatisticsDashboard.tsx
│       ├── TemplateManager.tsx
│       └── MultilingualEditor.tsx

apps/web/src/
├── pages/
│   ├── terms-of-use.tsx
│   ├── privacy-policy.tsx
│   └── legal/[slug].tsx
└── components/
    └── legal/
        ├── LegalPageView.tsx
        ├── TableOfContents.tsx
        ├── AcceptanceModal.tsx
        ├── LanguageSwitcher.tsx
        └── SearchInDocument.tsx
```

### API Endpoints
```
# Admin Endpoints (Requires Auth)
GET    /api/legal-pages                    - List all pages with versions
GET    /api/legal-pages/:id                - Get specific page details
POST   /api/legal-pages                    - Create new legal page
PUT    /api/legal-pages/:id                - Create new version
DELETE /api/legal-pages/:id                - Archive page (soft delete)
GET    /api/legal-pages/:id/versions       - Get version history
GET    /api/legal-pages/:id/versions/:vid  - Get specific version
POST   /api/legal-pages/:id/publish        - Publish version
POST   /api/legal-pages/:id/compare        - Compare versions
GET    /api/legal-pages/:id/audit-log      - Get audit trail
GET    /api/legal-pages/statistics         - Get acceptance statistics
POST   /api/legal-pages/:id/export         - Export document

# Public Endpoints (No Auth)
GET    /api/public/legal/:slug             - Get active version by slug
GET    /api/public/legal/:slug/history     - Get public version history
POST   /api/public/legal/:slug/accept      - Record user acceptance
GET    /api/public/legal/:slug/pdf         - Get PDF version

# Compliance Endpoints
POST   /api/compliance/gdpr/export         - Export user data
POST   /api/compliance/gdpr/delete         - Request data deletion
GET    /api/compliance/consent/:userId     - Get user consents
```

### Schema Definition Example
```typescript
@Schema({ collection: 'legal_pages', timestamps: true })
export class LegalPage {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, enum: ['terms', 'privacy', 'cookies', 'other'] })
  type: LegalPageType;

  @Prop({ type: [VersionSchema], default: [] })
  versions: Version[];

  @Prop({ type: String, ref: 'Version' })
  activeVersion: string;

  @Prop({
    type: {
      pt: String,
      en: String,
      es: String
    },
    required: true
  })
  title: LocalizedString;

  @Prop({ default: false })
  requiresAcceptance: boolean;

  @Prop({ default: false })
  archived: boolean;

  @Prop({ type: [AuditLogSchema] })
  auditLog: AuditLog[];
}

@Schema({ _id: true })
export class Version {
  @Prop({ required: true })
  versionNumber: string;

  @Prop({
    type: {
      pt: String,
      en: String,
      es: String
    },
    required: true
  })
  content: LocalizedString;

  @Prop({ required: true })
  effectiveDate: Date;

  @Prop()
  expiryDate?: Date;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  checksum: string;

  @Prop({ default: 'draft', enum: ['draft', 'pending', 'active', 'expired'] })
  status: VersionStatus;

  @Prop()
  approvedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}
```

### Environment Variables
```
# Legal Module Configuration
LEGAL_PAGES_CACHE_TTL=3600
LEGAL_PDF_GENERATION=true
LEGAL_EMAIL_NOTIFICATIONS=true
LEGAL_BACKUP_SCHEDULE="0 0 * * *"
LEGAL_RETENTION_DAYS=2555
GDPR_EXPORT_ENABLED=true
ENCRYPTION_KEY=<secure-key>
```

### Testing Standards
- Test files: Adjacent to source (*.spec.ts, *.test.tsx)
- Minimum coverage: 85% for all new code
- Security tests mandatory for all input handling
- Accessibility tests for all public pages
- Performance benchmarks for critical paths
- Mock all external services
- Use factories for test data
- Test both success and error scenarios
- Compliance scenario testing

### Performance Optimizations
1. **Caching Strategy**:
   - Redis cache for active legal pages (1 hour TTL)
   - CDN for static content delivery
   - Browser cache headers for public pages

2. **Database Optimization**:
   - Compound indexes on (slug, status, effectiveDate)
   - Text indexes for content search
   - Separate collection for acceptance records

3. **Frontend Optimization**:
   - Virtual scrolling for version history
   - Lazy loading for audit logs
   - Code splitting by route
   - Service Worker for offline access

### Accessibility Requirements
1. **WCAG 2.1 Level AA Compliance**:
   - Proper heading hierarchy
   - ARIA labels for all interactive elements
   - Keyboard navigation support
   - Screen reader optimization
   - High contrast mode support
   - Focus indicators
   - Skip navigation links

2. **Legal Readability**:
   - Glossary for legal terms
   - Plain language summaries
   - Adjustable font size
   - Reading time estimates
   - Progress indicators

### Monitoring and Alerting
1. **Metrics to Track**:
   - Page load times
   - Acceptance rates
   - Version publication frequency
   - API response times
   - Error rates by endpoint

2. **Alerts**:
   - Failed PDF generation
   - Unusual acceptance patterns
   - High error rates
   - Backup failures
   - Compliance deadline approaching

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code coverage >85%
- [ ] All tests passing
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Code review approved
- [ ] Documentation complete
- [ ] Compliance requirements verified
- [ ] Deployed to staging environment

## Dependencies
- MongoDB and PostgreSQL configured
- Redis instance available
- Email service configured
- PDF generation dependencies installed
- Translation service API keys
- CDN configuration
- SSL certificates

## Risks and Mitigations
1. **Risk**: Legal content corruption or loss
   - **Mitigation**: Immutable versioning, checksums, automated backups

2. **Risk**: Unauthorized content modification
   - **Mitigation**: Role-based access, audit logging, approval workflow

3. **Risk**: Non-compliance with regulations
   - **Mitigation**: Built-in compliance features, regular audits

4. **Risk**: Poor performance with many versions
   - **Mitigation**: Proper indexing, caching, pagination

5. **Risk**: XSS through legal content
   - **Mitigation**: Strict HTML sanitization, CSP headers

## Notes
- Consider integration with external legal management systems
- Plan for automated translation services integration
- Future: Blockchain integration for document integrity
- Consider A/B testing for acceptance rates
- Plan for multi-tenant support if needed
- Consider webhook notifications for external systems

## Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2025-09-28 | Sarah (PO) | Initial story creation with comprehensive requirements based on learnings from previous modules |

## Dev Agent Record
*To be populated during implementation*

### Agent Model Used
*To be recorded*

### Debug Log References
*To be recorded*

### Completion Notes List
*To be recorded*

### File List
*To be recorded*

## QA Results
*To be populated after implementation*