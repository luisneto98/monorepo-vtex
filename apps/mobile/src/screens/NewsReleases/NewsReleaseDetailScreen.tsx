import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { NewsRelease } from '@vtexday26/shared/types/news-releases';
import { NewsReleasesService } from '../../services/NewsReleasesService';
import ErrorState from '../../components/error/ErrorState';
import { formatFullDate } from '../../utils/dateUtils';
import { sanitizeHtml } from '../../utils/htmlUtils';

type RootStackParamList = {
  NewsReleaseDetail: { slug: string };
  NewsReleases: undefined;
};

type NewsReleaseDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsReleaseDetail'>;

const NewsReleaseDetailScreen: React.FC = () => {
  const route = useRoute<NewsReleaseDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // Device locale - defaulting to pt-BR (TODO: integrate with i18n)
  const locale = 'pt-BR';

  const { slug } = route.params;

  // State
  const [article, setArticle] = useState<NewsRelease | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image gallery viewer
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Track view count (only once per article)
  const viewTrackedRef = useRef(false);

  /**
   * Load article by slug
   */
  const loadArticle = async () => {
    try {
      setError(null);
      setLoading(true);

      const articleData = await NewsReleasesService.getNewsBySlug(slug);
      setArticle(articleData);

      // Track view count (only once)
      if (!viewTrackedRef.current) {
        viewTrackedRef.current = true;
        NewsReleasesService.incrementViewCount(slug);
      }

      // Load related articles if available
      if (articleData.relatedArticles && articleData.relatedArticles.length > 0) {
        loadRelatedArticles(articleData.relatedArticles);
      }
    } catch (err) {
      console.error('Error loading article:', err);
      const error = err as Error;
      setError(error.message || 'Não foi possível carregar o artigo');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load related articles
   */
  const loadRelatedArticles = async (slugs: string[]) => {
    try {
      const related = await Promise.all(
        slugs.slice(0, 3).map((relatedSlug) =>
          NewsReleasesService.getNewsBySlug(relatedSlug)
        )
      );
      setRelatedArticles(related.filter(Boolean));
    } catch (err) {
      console.error('Error loading related articles:', err);
      // Don't show error for related articles - they're optional
    }
  };

  /**
   * Handle share article
   */
  const handleShare = async () => {
    if (!article) return;

    try {
      const content = NewsReleasesService.getLocalizedContent(article, locale);
      const message = `${content.title}\n\n${content.subtitle || ''}\n\nLeia mais: https://vtexday26.com/news/${article.slug}`;

      await Share.share({
        message,
        title: content.title,
      });
    } catch (err) {
      console.error('Error sharing article:', err);
    }
  };

  /**
   * Open image gallery
   */
  const handleImagePress = (index: number) => {
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  /**
   * Navigate to related article
   */
  const handleRelatedArticlePress = (relatedSlug: string) => {
    navigation.push('NewsReleaseDetail' as never, { slug: relatedSlug } as never);
  };

  /**
   * Initial load
   */
  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71921" />
          <Text style={styles.loadingText}>Carregando artigo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState error={error || 'Artigo não encontrado'} onRetry={loadArticle} />
      </SafeAreaView>
    );
  }

  const content = NewsReleasesService.getLocalizedContent(article, locale);
  const sanitizedHtml = sanitizeHtml(content.content);

  // Prepare images for gallery viewer
  const galleryImages = article.images.sort((a, b) => a.order - b.order);
  const currentGalleryImage = galleryImages[galleryIndex];

  // Generate HTML for WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          padding: 20px;
          background-color: #FFFFFF;
        }
        p {
          margin-bottom: 16px;
        }
        h1, h2, h3, h4 {
          font-weight: bold;
          color: #1A1A1A;
          margin-top: 20px;
          margin-bottom: 12px;
        }
        h1 { font-size: 24px; }
        h2 { font-size: 22px; }
        h3 { font-size: 20px; }
        h4 { font-size: 18px; }
        a {
          color: #D71921;
          text-decoration: underline;
        }
        strong { font-weight: bold; }
        em { font-style: italic; }
        ul, ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        li {
          margin-bottom: 8px;
        }
        blockquote {
          border-left: 4px solid #D71921;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #666;
        }
        img {
          max-width: 100%;
          height: auto;
          margin: 16px 0;
          border-radius: 8px;
        }
        pre, code {
          background-color: #F5F5F5;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      ${sanitizedHtml}
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Featured Image */}
        {article.featuredImage && (
          <Image
            source={{ uri: article.featuredImage }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        )}

        {/* Article Header */}
        <View style={styles.header}>
          {/* Categories */}
          {article.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {article.categories.map((category) => (
                <View key={category} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{content.title}</Text>

          {/* Subtitle */}
          {content.subtitle && <Text style={styles.subtitle}>{content.subtitle}</Text>}

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metadataText}>
                {article.publishedAt && formatFullDate(article.publishedAt, locale)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.metadataText}>{article.author.name}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.metadataText}>{article.viewCount} visualizações</Text>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#D71921" />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>

        {/* Article Content (HTML) */}
        <View style={styles.contentSection}>
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webView}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onMessage={(event) => {
              // Handle any messages from WebView if needed
            }}
            injectedJavaScript={`
              // Disable zooming
              const meta = document.createElement('meta');
              meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
              meta.setAttribute('name', 'viewport');
              document.getElementsByTagName('head')[0].appendChild(meta);

              // Send height to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                height: document.documentElement.scrollHeight
              }));
            `}
          />
        </View>

        {/* Image Gallery */}
        {article.images.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.gallerySectionTitle}>Galeria de Imagens</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {article.images
                .sort((a, b) => a.order - b.order)
                .map((image, index) => (
                  <TouchableOpacity
                    key={image._id || index}
                    style={styles.galleryImageWrapper}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: image.thumbnailUrl || image.url }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    {image.caption && image.caption[locale] && (
                      <Text style={styles.galleryCaption} numberOfLines={2}>
                        {image.caption[locale]}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Tags:</Text>
            <View style={styles.tagsContainer}>
              {article.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedSectionTitle}>Artigos Relacionados</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedArticles.map((related) => {
                const relatedContent = NewsReleasesService.getLocalizedContent(related, locale);
                return (
                  <TouchableOpacity
                    key={related._id}
                    style={styles.relatedCard}
                    onPress={() => handleRelatedArticlePress(related.slug)}
                  >
                    {related.featuredImage && (
                      <Image
                        source={{ uri: related.featuredImage }}
                        style={styles.relatedImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.relatedTitle} numberOfLines={2}>
                      {relatedContent.title}
                    </Text>
                    {relatedContent.subtitle && (
                      <Text style={styles.relatedSubtitle} numberOfLines={2}>
                        {relatedContent.subtitle}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Image Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={styles.galleryModal}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.galleryCloseButton}
            onPress={() => setGalleryVisible(false)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Image Container */}
          <View style={styles.galleryImageContainer}>
            <Image
              source={{ uri: currentGalleryImage?.url }}
              style={styles.galleryFullImage}
              resizeMode="contain"
            />

            {/* Image Caption */}
            {currentGalleryImage?.caption && currentGalleryImage.caption[locale] && (
              <View style={styles.galleryCaptionContainer}>
                <Text style={styles.galleryCaptionText}>
                  {currentGalleryImage.caption[locale]}
                </Text>
              </View>
            )}
          </View>

          {/* Navigation Arrows */}
          {galleryImages.length > 1 && (
            <>
              {galleryIndex > 0 && (
                <TouchableOpacity
                  style={[styles.galleryNavButton, styles.galleryNavButtonLeft]}
                  onPress={() => setGalleryIndex(galleryIndex - 1)}
                >
                  <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {galleryIndex < galleryImages.length - 1 && (
                <TouchableOpacity
                  style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
                  onPress={() => setGalleryIndex(galleryIndex + 1)}
                >
                  <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Image Counter */}
          {galleryImages.length > 1 && (
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {galleryIndex + 1} / {galleryImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  featuredImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D71921',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    lineHeight: 26,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D71921',
    marginLeft: 8,
  },
  contentSection: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    minHeight: 200,
  },
  webView: {
    backgroundColor: 'transparent',
    minHeight: 200,
  },
  gallerySection: {
    marginTop: 30,
    paddingVertical: 20,
    backgroundColor: '#F9F9F9',
  },
  gallerySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  galleryImageWrapper: {
    marginLeft: 20,
    width: 200,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  galleryCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  tagsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  relatedSection: {
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: '#F9F9F9',
  },
  relatedSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  relatedCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginLeft: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    padding: 12,
    lineHeight: 22,
  },
  relatedSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 12,
    lineHeight: 18,
  },
  // Gallery Modal
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  galleryImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryFullImage: {
    width: '100%',
    height: '80%',
  },
  galleryCaptionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  galleryCaptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  galleryNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 25,
  },
  galleryNavButtonLeft: {
    left: 20,
  },
  galleryNavButtonRight: {
    right: 20,
  },
  galleryCounter: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});

export default NewsReleaseDetailScreen;
