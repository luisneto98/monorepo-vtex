import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsReleaseDocument } from '../schemas/news-release.schema';
import * as RSS from 'rss';

@Injectable()
export class FeedGeneratorService {
  constructor(private configService: ConfigService) {}

  generateRssFeed(releases: NewsReleaseDocument[], language: 'pt-BR' | 'en' | 'es' = 'en'): string {
    const siteUrl = this.configService.get('SITE_URL') || 'https://vtexday2026.com';
    const feedLimit = parseInt(this.configService.get('RSS_FEED_ITEMS') || '50', 10);

    const feedOptions = {
      title: this.getFeedTitle(language),
      description: this.getFeedDescription(language),
      feed_url: `${siteUrl}/api/public/news/feed.rss?lang=${language}`,
      site_url: `${siteUrl}/news`,
      image_url: `${siteUrl}/logo.png`,
      copyright: `© ${new Date().getFullYear()} VTEX Day 2026`,
      language: this.getLanguageCode(language),
      pubDate: new Date(),
      ttl: 60,
    };

    const feed = new RSS(feedOptions);

    releases.slice(0, feedLimit).forEach((release) => {
      const content = release.content[language];
      if (!content) return;

      feed.item({
        title: content.title,
        description: content.metaDescription || this.truncateContent(content.content, 200),
        url: `${siteUrl}/news/${release.slug}`,
        guid: release._id.toString(),
        categories: release.tags || [],
        date: release.publishedAt || release.createdAt,
        author: release.author.name,
        enclosure: release.featuredImage
          ? {
              url: release.featuredImage,
              type: 'image/jpeg',
            }
          : undefined,
      });
    });

    return feed.xml({ indent: true });
  }

  generateAtomFeed(
    releases: NewsReleaseDocument[],
    language: 'pt-BR' | 'en' | 'es' = 'en',
  ): string {
    const siteUrl = this.configService.get('SITE_URL') || 'https://vtexday2026.com';
    const feedLimit = parseInt(this.configService.get('RSS_FEED_ITEMS') || '50', 10);

    let atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${this.getFeedTitle(language)}</title>
  <link href="${siteUrl}/news" />
  <link rel="self" href="${siteUrl}/api/public/news/feed.atom?lang=${language}" />
  <updated>${new Date().toISOString()}</updated>
  <id>${siteUrl}/news</id>
  <subtitle>${this.getFeedDescription(language)}</subtitle>
  <rights>© ${new Date().getFullYear()} VTEX Day 2026</rights>`;

    releases.slice(0, feedLimit).forEach((release) => {
      const content = release.content[language];
      if (!content) return;

      atomFeed += `
  <entry>
    <title>${this.escapeXml(content.title)}</title>
    <link href="${siteUrl}/news/${release.slug}" />
    <id>${siteUrl}/news/${release.slug}</id>
    <updated>${(release.updatedAt || release.createdAt).toISOString()}</updated>
    <published>${(release.publishedAt || release.createdAt).toISOString()}</published>
    <author>
      <name>${this.escapeXml(release.author.name)}</name>
      <email>${release.author.email}</email>
    </author>
    <summary>${this.escapeXml(content.metaDescription || this.truncateContent(content.content, 200))}</summary>
    <content type="html">${this.escapeXml(content.content)}</content>`;

      if (release.categories) {
        release.categories.forEach((category) => {
          atomFeed += `
    <category term="${this.escapeXml(category)}" />`;
        });
      }

      atomFeed += `
  </entry>`;
    });

    atomFeed += `
</feed>`;

    return atomFeed;
  }

  private getFeedTitle(language: 'pt-BR' | 'en' | 'es'): string {
    const titles = {
      'pt-BR': 'VTEX Day 2026 - Notícias e Atualizações',
      en: 'VTEX Day 2026 - News and Updates',
      es: 'VTEX Day 2026 - Noticias y Actualizaciones',
    };
    return titles[language] || titles['en'];
  }

  private getFeedDescription(language: 'pt-BR' | 'en' | 'es'): string {
    const descriptions = {
      'pt-BR': 'Últimas notícias e atualizações sobre o VTEX Day 2026',
      en: 'Latest news and updates about VTEX Day 2026',
      es: 'Últimas noticias y actualizaciones sobre VTEX Day 2026',
    };
    return descriptions[language] || descriptions['en'];
  }

  private getLanguageCode(language: 'pt-BR' | 'en' | 'es'): string {
    const codes = {
      'pt-BR': 'pt-br',
      en: 'en-us',
      es: 'es-es',
    };
    return codes[language] || 'en-us';
  }

  private truncateContent(content: string, maxLength: number): string {
    const stripped = content.replace(/<[^>]*>?/gm, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substr(0, maxLength).trim() + '...';
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
