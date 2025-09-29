import { Model } from 'mongoose';
import { SanitizationUtil } from './sanitization.util';

export class SlugGeneratorUtil {
  static async generateUniqueSlug(
    text: string,
    model: Model<any>,
    existingId?: string,
  ): Promise<string> {
    const baseSlug = SanitizationUtil.sanitizeSlug(text);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query: any = { slug };
      if (existingId) {
        query._id = { $ne: existingId };
      }

      const existing = await model.findOne(query);
      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
