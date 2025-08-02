import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, json, timestamp, serial, integer } from "drizzle-orm/pg-core";
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
  userId: integer("user_id").references(() => users.id).notNull(),
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
  omnivore: boolean("omnivore").default(false).notNull(),
  vegetarian: boolean("vegetarian").default(false).notNull(),
  vegan: boolean("vegan").default(false).notNull(),
  glutenFree: boolean("gluten_free").default(false).notNull(),
  dairyFree: boolean("dairy_free").default(false).notNull(),
  allergies: text("allergies"),
  // Additional notes
  notes: text("notes"),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  departure: varchar("departure", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  departureTime: varchar("departure_time", { length: 50 }).notNull(),
  availableSeats: integer("available_seats").notNull(),
  totalSeats: integer("total_seats").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const rideRequests = pgTable("ride_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  rideId: integer("ride_id").references(() => rides.id),
  departure: varchar("departure", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  preferredTime: varchar("preferred_time", { length: 50 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'matched', 'closed'
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
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

export const insertRideSchema = createInsertSchema(rides).omit({
  id: true,
  createdAt: true,
});

export const insertRideRequestSchema = createInsertSchema(rideRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof updateAttendanceSchema>;
export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;
export type RideRequest = typeof rideRequests.$inferSelect;
export type InsertRideRequest = z.infer<typeof insertRideRequestSchema>;
