import { Test } from '@nestjs/testing';
import * as DOMPurify from 'isomorphic-dompurify';
import { sanitizeHtml } from '../utils/sanitization.util';
import { ContentSanitizationService } from '../services/content-sanitization.service';
import { ImageProcessingService } from '../services/image-processing.service';

describe('News Releases Security Tests', () => {
  let sanitizationService: ContentSanitizationService;
  let imageProcessingService: ImageProcessingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ContentSanitizationService, ImageProcessingService],
    }).compile();

    sanitizationService = moduleRef.get<ContentSanitizationService>(ContentSanitizationService);
    imageProcessingService = moduleRef.get<ImageProcessingService>(ImageProcessingService);
  });

  describe('XSS Prevention', () => {
    describe('HTML Sanitization', () => {
      it('should remove script tags', () => {
        const malicious = '<p>Hello</p><script>alert("XSS")</script>';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).toBe('<p>Hello</p>');
        expect(sanitized).not.toContain('<script>');
      });

      it('should remove event handlers', () => {
        const malicious = '<button onclick="alert(\'XSS\')">Click me</button>';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('onclick');
      });

      it('should remove javascript: protocols', () => {
        const malicious = '<a href="javascript:alert(\'XSS\')">Link</a>';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('javascript:');
      });

      it('should remove data: URLs for non-image types', () => {
        const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('data:text/html');
      });

      it('should remove dangerous attributes', () => {
        const testCases = [
          '<div style="background: url(javascript:alert(\'XSS\'))">Test</div>',
          '<img src="x" onerror="alert(\'XSS\')">',
          '<svg onload="alert(\'XSS\')">',
          '<iframe src="javascript:alert(\'XSS\')">',
          '<object data="javascript:alert(\'XSS\')">',
          '<embed src="javascript:alert(\'XSS\')">',
          '<form action="javascript:alert(\'XSS\')">',
          '<input onfocus="alert(\'XSS\')" autofocus>',
          '<video onloadstart="alert(\'XSS\')" src="x">',
          '<audio oncanplay="alert(\'XSS\')" src="x">',
        ];

        testCases.forEach((malicious) => {
          const sanitized = sanitizeHtml(malicious);
          expect(sanitized).not.toMatch(/on\w+=/);
          expect(sanitized).not.toContain('javascript:');
        });
      });

      it('should prevent DOM clobbering', () => {
        const malicious = '<img name="getElementById"><form id="createElement">';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('name="getElementById"');
        expect(sanitized).not.toContain('id="createElement"');
      });

      it('should sanitize SVG content', () => {
        const malicious = `
          <svg xmlns="http://www.w3.org/2000/svg">
            <script>alert('XSS')</script>
            <foreignObject>
              <iframe src="javascript:alert('XSS')"></iframe>
            </foreignObject>
            <set attributeName="onmouseover" to="alert('XSS')"/>
            <animate onbegin="alert('XSS')"/>
          </svg>
        `;
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('<foreignObject>');
        expect(sanitized).not.toContain('onbegin');
      });

      it('should handle mutation XSS attempts', () => {
        const malicious = '<div><div><img src=x onerror=alert(1)//></div></div>';
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('onerror');
      });

      it('should prevent CSS injection', () => {
        const malicious = `
          <style>
            @import url('javascript:alert("XSS")');
            body { background: url('javascript:alert("XSS")'); }
          </style>
        `;
        const sanitized = sanitizeHtml(malicious);
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('@import');
      });
    });

    describe('Content Sanitization Service', () => {
      it('should sanitize all text fields in news release', () => {
        const maliciousRelease = {
          title: {
            'pt-BR': '<script>alert("XSS")</script>Title',
            en: 'Title<img src=x onerror=alert(1)>',
            es: '<svg onload=alert(1)>Title</svg>',
          },
          subtitle: {
            'pt-BR': '<iframe src="javascript:alert(1)">',
            en: '<object data="javascript:alert(1)">',
            es: '<embed src="javascript:alert(1)">',
          },
          content: {
            'pt-BR': '<p onclick="alert(1)">Content</p>',
            en: '<a href="javascript:alert(1)">Link</a>',
            es: '<form action="javascript:alert(1)">',
          },
        };

        const sanitized = sanitizationService.sanitizeNewsRelease(maliciousRelease);

        Object.values(sanitized.title).forEach((value) => {
          expect(value).not.toMatch(/<script|onerror|onload/i);
        });

        Object.values(sanitized.subtitle).forEach((value) => {
          expect(value).not.toMatch(/javascript:|<iframe|<object|<embed/i);
        });

        Object.values(sanitized.content).forEach((value) => {
          expect(value).not.toMatch(/onclick|javascript:|action=/i);
        });
      });

      it('should preserve safe HTML structure', () => {
        const safeContent = {
          content: {
            en: '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul>',
          },
        };

        const sanitized = sanitizationService.sanitizeNewsRelease(safeContent);

        expect(sanitized.content.en).toContain('<h1>Title</h1>');
        expect(sanitized.content.en).toContain('<strong>bold</strong>');
        expect(sanitized.content.en).toContain('<em>italic</em>');
        expect(sanitized.content.en).toContain('<ul>');
        expect(sanitized.content.en).toContain('<li>');
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal in file paths', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'uploads/../../../etc/passwd',
        'uploads/..%2F..%2F..%2Fetc%2Fpasswd',
        'uploads/..%252F..%252F..%252Fetc%252Fpasswd',
        'uploads/..\\/..\\/..\\/etc/passwd',
        'uploads/....//....//....//etc/passwd',
        'uploads/../.../../etc/passwd',
      ];

      maliciousPaths.forEach((path) => {
        const result = imageProcessingService.sanitizeFilePath(path);
        expect(result).not.toMatch(/\.\./);
        expect(result).not.toContain('etc/passwd');
        expect(result).not.toContain('system32');
      });
    });

    it('should sanitize S3 keys properly', () => {
      const maliciousKeys = [
        'news-releases/../../../private/secrets.txt',
        'news-releases/..%2F..%2Fprivate%2Fsecrets.txt',
      ];

      maliciousKeys.forEach((key) => {
        const sanitized = imageProcessingService.sanitizeS3Key(key);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('private');
        expect(sanitized).toMatch(/^news-releases\//);
      });
    });

    it('should validate URLs to prevent SSRF', () => {
      const maliciousUrls = [
        'file:///etc/passwd',
        'http://169.254.169.254/latest/meta-data/',
        'http://localhost:8080/admin',
        'http://127.0.0.1:22',
        'gopher://localhost:8080',
        'dict://localhost:11211',
        'ftp://internal-server/files',
      ];

      maliciousUrls.forEach((url) => {
        const isValid = imageProcessingService.isValidImageUrl(url);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('JSON Injection Prevention', () => {
    it('should prevent prototype pollution', () => {
      const maliciousJSON = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
        caption: 'Normal caption',
      };

      const sanitized = sanitizationService.sanitizeJSON(maliciousJSON);

      expect(sanitized).not.toHaveProperty('__proto__');
      expect(sanitized).not.toHaveProperty('constructor');
      expect(sanitized).toHaveProperty('caption');
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('should validate JSON structure', () => {
      const invalidJSON = '{"caption": "test", "__proto__": {"isAdmin": true}}';

      expect(() => {
        JSON.parse(invalidJSON, (key, value) => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return undefined;
          }
          return value;
        });
      }).not.toThrow();
    });

    it('should handle circular references safely', () => {
      const obj: any = { a: 1 };
      obj.circular = obj;

      expect(() => {
        sanitizationService.sanitizeJSON(obj);
      }).not.toThrow();
    });
  });

  describe('File Upload Security', () => {
    it('should validate file MIME types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const invalidTypes = [
        'application/javascript',
        'text/html',
        'application/x-sh',
        'application/x-executable',
        'text/x-php',
        'application/pdf',
      ];

      validTypes.forEach((type) => {
        expect(imageProcessingService.isValidImageType(type)).toBe(true);
      });

      invalidTypes.forEach((type) => {
        expect(imageProcessingService.isValidImageType(type)).toBe(false);
      });
    });

    it('should detect polyglot files', () => {
      // Simulate a file that appears to be an image but contains script
      const polyglotContent = Buffer.from('\xFF\xD8\xFF\xE0<script>alert(1)</script>');

      const isValid = imageProcessingService.validateImageContent(polyglotContent);
      expect(isValid).toBe(false);
    });

    it('should enforce file size limits', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFile = Buffer.alloc(maxSize + 1);

      const isValid = imageProcessingService.validateFileSize(oversizedFile, maxSize);
      expect(isValid).toBe(false);
    });

    it('should sanitize file names', () => {
      const maliciousNames = [
        '../../../etc/passwd.jpg',
        '..\\..\\windows\\system32.png',
        'file%00.jpg',
        'file\x00.jpg',
        'file<script>.jpg',
        'file;rm -rf /.jpg',
        'file&& whoami.jpg',
        'file| ls -la.jpg',
      ];

      maliciousNames.forEach((name) => {
        const sanitized = imageProcessingService.sanitizeFileName(name);
        expect(sanitized).not.toMatch(/[<>:"|?*\x00-\x1f]/);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('&&');
        expect(sanitized).not.toContain('|');
        expect(sanitized).not.toContain(';');
      });
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should sanitize MongoDB query operators', () => {
      const maliciousQueries = [
        { title: { $gt: '' } },
        { _id: { $ne: null } },
        { $where: 'this.password == "admin"' },
        { status: { $regex: '.*', $options: 'i' } },
        { $or: [{ admin: true }] },
      ];

      maliciousQueries.forEach((query) => {
        const sanitized = sanitizationService.sanitizeMongoQuery(query);
        expect(sanitized).not.toHaveProperty('$where');
        expect(sanitized).not.toHaveProperty('$or');

        Object.keys(sanitized).forEach((key) => {
          if (typeof sanitized[key] === 'object') {
            expect(Object.keys(sanitized[key])).not.toContain('$gt');
            expect(Object.keys(sanitized[key])).not.toContain('$ne');
          }
        });
      });
    });

    it('should escape special regex characters in search', () => {
      const maliciousSearches = ['.*', '.+', '(.*)', '[a-z]*', '^admin$', 'password|admin'];

      maliciousSearches.forEach((search) => {
        const escaped = sanitizationService.escapeRegex(search);
        expect(escaped).not.toContain('.*');
        expect(escaped).not.toContain('.+');
        expect(() => new RegExp(escaped)).not.toThrow();
      });
    });
  });

  describe('Rate Limiting Validation', () => {
    it('should enforce rate limits per endpoint', () => {
      const limits = {
        'GET /api/public/news': 100,
        'POST /api/news-releases': 20,
        'POST /api/news-releases/:id/images': 10,
      };

      Object.entries(limits).forEach(([endpoint, limit]) => {
        const config = imageProcessingService.getRateLimitConfig(endpoint);
        expect(config.max).toBe(limit);
        expect(config.windowMs).toBe(60000); // 1 minute
      });
    });
  });

  describe('Authentication & Authorization', () => {
    it('should validate JWT tokens properly', () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.',
        '',
        null,
        undefined,
      ];

      invalidTokens.forEach((token) => {
        expect(sanitizationService.isValidJWT(token)).toBe(false);
      });
    });

    it('should enforce role-based access control', () => {
      const endpoints = {
        'POST /api/news-releases': ['ADMIN', 'EDITOR'],
        'DELETE /api/news-releases/:id': ['ADMIN'],
        'GET /api/public/news': ['*'],
      };

      Object.entries(endpoints).forEach(([endpoint, allowedRoles]) => {
        const config = sanitizationService.getEndpointRoles(endpoint);
        expect(config).toEqual(allowedRoles);
      });
    });
  });

  describe('Content Security Policy', () => {
    it('should generate proper CSP headers', () => {
      const csp = sanitizationService.generateCSP();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).not.toContain('unsafe-eval');
    });
  });
});
