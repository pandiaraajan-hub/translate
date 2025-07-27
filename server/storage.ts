import { translations, type Translation, type InsertTranslation } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getRecentTranslations(limit?: number): Promise<Translation[]>;
  clearTranslations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    return translation;
  }

  async getRecentTranslations(limit = 10): Promise<Translation[]> {
    return await db
      .select()
      .from(translations)
      .orderBy(desc(translations.createdAt))
      .limit(limit);
  }

  async clearTranslations(): Promise<void> {
    await db.delete(translations);
  }
}

export const storage = new DatabaseStorage();
