import { type Translation, type InsertTranslation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getRecentTranslations(limit?: number): Promise<Translation[]>;
  clearTranslations(): Promise<void>;
}

export class MemStorage implements IStorage {
  private translations: Map<string, Translation>;

  constructor() {
    this.translations = new Map();
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = randomUUID();
    const translation: Translation = {
      ...insertTranslation,
      id,
      createdAt: new Date(),
    };
    this.translations.set(id, translation);
    return translation;
  }

  async getRecentTranslations(limit = 10): Promise<Translation[]> {
    const allTranslations = Array.from(this.translations.values());
    return allTranslations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async clearTranslations(): Promise<void> {
    this.translations.clear();
  }
}

export const storage = new MemStorage();
