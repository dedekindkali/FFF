import { users, attendanceRecords, type User, type InsertUser, type AttendanceRecord, type InsertAttendance, type UpdateAttendance } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Attendance methods
  getAttendanceByUserId(userId: number): Promise<AttendanceRecord | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(attendance: UpdateAttendance): Promise<AttendanceRecord>;
  
  // Admin methods
  getAllUsersWithAttendance(): Promise<Array<User & { attendance?: AttendanceRecord }>>;
  getAttendanceStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAttendanceByUserId(userId: number): Promise<AttendanceRecord | undefined> {
    const [attendance] = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.userId, userId));
    return attendance || undefined;
  }

  async createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord> {
    const [newAttendance] = await db
      .insert(attendanceRecords)
      .values(attendance)
      .returning();
    return newAttendance;
  }

  async updateAttendance(attendance: UpdateAttendance): Promise<AttendanceRecord> {
    const [updatedAttendance] = await db
      .update(attendanceRecords)
      .set({
        ...attendance,
        updatedAt: new Date(),
      })
      .where(eq(attendanceRecords.userId, attendance.userId!))
      .returning();
    return updatedAttendance;
  }

  async getAllUsersWithAttendance(): Promise<Array<User & { attendance?: AttendanceRecord }>> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(attendanceRecords, eq(users.id, attendanceRecords.userId));

    return result.map(row => ({
      ...row.users,
      attendance: row.attendance_records || undefined,
    }));
  }

  async getAttendanceStats(): Promise<any> {
    const allAttendance = await db.select().from(attendanceRecords);
    
    const stats = {
      totalParticipants: allAttendance.length,
      day1: {
        breakfast: allAttendance.filter(a => a.day1Breakfast).length,
        lunch: allAttendance.filter(a => a.day1Lunch).length,
        dinner: allAttendance.filter(a => a.day1Dinner).length,
        night: allAttendance.filter(a => a.day1Night).length,
      },
      day2: {
        breakfast: allAttendance.filter(a => a.day2Breakfast).length,
        lunch: allAttendance.filter(a => a.day2Lunch).length,
        dinner: allAttendance.filter(a => a.day2Dinner).length,
        night: allAttendance.filter(a => a.day2Night).length,
      },
      day3: {
        breakfast: allAttendance.filter(a => a.day3Breakfast).length,
        lunch: allAttendance.filter(a => a.day3Lunch).length,
        dinner: allAttendance.filter(a => a.day3Dinner).length,
        night: allAttendance.filter(a => a.day3Night).length,
      },
      transportation: {
        offering: allAttendance.filter(a => a.transportationStatus === 'offering').length,
        needed: allAttendance.filter(a => a.transportationStatus === 'needed').length,
        own: allAttendance.filter(a => a.transportationStatus === 'own').length,
      },
      dietary: {
        vegetarian: allAttendance.filter(a => a.vegetarian).length,
        vegan: allAttendance.filter(a => a.vegan).length,
        glutenFree: allAttendance.filter(a => a.glutenFree).length,
        dairyFree: allAttendance.filter(a => a.dairyFree).length,
        withAllergies: allAttendance.filter(a => a.allergies && a.allergies.trim().length > 0).length,
      }
    };

    return stats;
  }
}

export const storage = new DatabaseStorage();
