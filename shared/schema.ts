import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, json, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  // Day 1 - August 28
  day1Breakfast: boolean("day1_breakfast").default(false).notNull(),
  day1Lunch: boolean("day1_lunch").default(false).notNull(),
  day1Dinner: boolean("day1_dinner").default(false).notNull(),
  day1Night: boolean("day1_night").default(false).notNull(),
  // Day 2 - August 29
  day2Breakfast: boolean("day2_breakfast").default(false).notNull(),
  day2Lunch: boolean("day2_lunch").default(false).notNull(),
  day2Dinner: boolean("day2_dinner").default(false).notNull(),
  day2Night: boolean("day2_night").default(false).notNull(),
  // Day 3 - August 30
  day3Breakfast: boolean("day3_breakfast").default(false).notNull(),
  day3Lunch: boolean("day3_lunch").default(false).notNull(),
  day3Dinner: boolean("day3_dinner").default(false).notNull(),
  day3Night: boolean("day3_night").default(false).notNull(),
  // Transportation
  transportationStatus: varchar("transportation_status", { length: 50 }), // 'offering', 'needed', 'own'
  transportationDetails: text("transportation_details"),
  // Dietary preferences
  vegetarian: boolean("vegetarian").default(false).notNull(),
  vegan: boolean("vegan").default(false).notNull(),
  glutenFree: boolean("gluten_free").default(false).notNull(),
  dairyFree: boolean("dairy_free").default(false).notNull(),
  allergies: text("allergies"),
  // Additional notes
  notes: text("notes"),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  updatedAt: true,
});

export const updateAttendanceSchema = insertAttendanceSchema.partial().extend({
  userId: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof updateAttendanceSchema>;
