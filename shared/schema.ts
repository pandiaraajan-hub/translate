import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  sourceText: text("source_text").notNull(),
  translatedText: text("translated_text").notNull(),
  confidence: text("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

// Language codes for the supported languages
export const SUPPORTED_LANGUAGES = {
  english: { code: 'en-US', name: 'English', flag: 'EN' },
  tamil: { code: 'ta-IN', name: 'Tamil', flag: 'த' },
  chinese: { code: 'zh-CN', name: 'Chinese', flag: '中' },
  malay: { code: 'ms-MY', name: 'Malay', flag: 'MY' }
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
