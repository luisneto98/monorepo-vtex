import { Injectable } from '@nestjs/common';
import { SanitizationUtil } from '../utils/sanitization.util';
import { LocalizedNewsContent } from '@vtexday26/shared';

@Injectable()
export class ContentSanitizationService {
  sanitizeLocalizedContent(content: LocalizedNewsContent): LocalizedNewsContent {
    return {
      title: SanitizationUtil.sanitizeText(content.title),
      subtitle: content.subtitle ? SanitizationUtil.sanitizeText(content.subtitle) : undefined,
      content: SanitizationUtil.sanitizeHtml(content.content),
      metaTitle: content.metaTitle ? SanitizationUtil.sanitizeText(content.metaTitle) : undefined,
      metaDescription: content.metaDescription
        ? SanitizationUtil.sanitizeText(content.metaDescription)
        : undefined,
      keywords: content.keywords?.map((k) => SanitizationUtil.sanitizeText(k)),
    };
  }

  sanitizeAllContent(content: {
    'pt-BR': LocalizedNewsContent;
    en: LocalizedNewsContent;
    es: LocalizedNewsContent;
  }): any {
    return {
      'pt-BR': this.sanitizeLocalizedContent(content['pt-BR']),
      en: this.sanitizeLocalizedContent(content['en']),
      es: this.sanitizeLocalizedContent(content['es']),
    };
  }
}
