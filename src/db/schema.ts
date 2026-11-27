import { boolean, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { CampaignConfig } from "../lib/types";

/** One row per campaign ("main", or "dev" when dev mode is on). */
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  config: jsonb("config").$type<CampaignConfig>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** The primary key makes a second draw for the same day impossible. */
export const drawResults = pgTable(
  "draw_results",
  {
    campaignId: text("campaign_id").notNull(),
    date: text("date").notNull(),
    participantIds: jsonb("participant_ids").$type<string[]>().notNull(),
    revealedAt: timestamp("revealed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.date] })],
);

/** Christmas wishes left by visitors. Hidden until the organiser approves them. */
export const wishes = pgTable("wishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: text("campaign_id").notNull(),
  author: text("author").notNull(),
  message: text("message").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable(
  "photos",
  {
    campaignId: text("campaign_id").notNull(),
    participantId: text("participant_id").notNull(),
    dataUrl: text("data_url").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.participantId] })],
);

/** Fun Lab votes / progress — one row per (game, voter). */
export const funLabEntries = pgTable(
  "fun_lab_entries",
  {
    game: text("game").notNull(),
    voterName: text("voter_name").notNull(),
    value: jsonb("value").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.game, table.voterName] })],
);
