import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, json, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  // Day 1 - August 28, 2025
  day1Breakfast: boolean("day1_breakfast").default(false).notNull(),
  day1Lunch: boolean("day1_lunch").default(false).notNull(),
  day1Dinner: boolean("day1_dinner").default(false).notNull(),
  day1Night: boolean("day1_night").default(false).notNull(),
  // Day 2 - August 29, 2025
  day2Breakfast: boolean("day2_breakfast").default(false).notNull(),
  day2Lunch: boolean("day2_lunch").default(false).notNull(),
  day2Dinner: boolean("day2_dinner").default(false).notNull(),
  day2Night: boolean("day2_night").default(false).notNull(),
  // Day 3 - August 30, 2025
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
  tripType: varchar("trip_type", { length: 20 }).notNull(), // 'arrival' or 'departure'
  eventDay: varchar("event_day", { length: 20 }).notNull(), // 'day1', 'day2', 'day3'
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
  tripType: varchar("trip_type", { length: 20 }).notNull(), // 'arrival' or 'departure'
  eventDay: varchar("event_day", { length: 20 }).notNull(), // 'day1', 'day2', 'day3'
  preferredTime: varchar("preferred_time", { length: 50 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

// New table for ride join requests with notification system
export const rideJoinRequests = pgTable("ride_join_requests", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").references(() => rides.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'accepted', 'declined'
  message: text("message"),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  respondedAt: timestamp("responded_at"),
});

export const rideNotifications = pgTable("ride_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rideId: integer("ride_id").references(() => rides.id),
  requestId: integer("request_id").references(() => rideRequests.id),
  type: varchar("type", { length: 50 }).notNull(), // 'ride_modified', 'ride_offer', 'request_accepted', 'request_declined'
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
});

export const rideInvitations = pgTable("ride_invitations", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").references(() => rides.id).notNull(),
  inviterId: integer("inviter_id").references(() => users.id).notNull(),
  inviteeId: integer("invitee_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").default(sql`NOW()`).notNull(),
  respondedAt: timestamp("responded_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  phone: true,
}).extend({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
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

export const insertRideJoinRequestSchema = createInsertSchema(rideJoinRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertRideNotificationSchema = createInsertSchema(rideNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertRideInvitationSchema = createInsertSchema(rideInvitations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
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
export type RideJoinRequest = typeof rideJoinRequests.$inferSelect;
export type InsertRideJoinRequest = z.infer<typeof insertRideJoinRequestSchema>;
export type RideNotification = typeof rideNotifications.$inferSelect;
export type InsertRideNotification = z.infer<typeof insertRideNotificationSchema>;
export type RideInvitation = typeof rideInvitations.$inferSelect;
export type InsertRideInvitation = z.infer<typeof insertRideInvitationSchema>;
