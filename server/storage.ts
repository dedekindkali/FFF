import { users, attendanceRecords, rides, rideRequests, rideJoinRequests, type User, type InsertUser, type AttendanceRecord, type InsertAttendance, type UpdateAttendance, type Ride, type InsertRide, type RideRequest, type InsertRideRequest, type RideJoinRequest, type InsertRideJoinRequest } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Attendance methods
  getAttendanceByUserId(userId: number): Promise<AttendanceRecord | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(attendance: UpdateAttendance): Promise<AttendanceRecord>;
  
  // Ride methods
  createRide(ride: InsertRide): Promise<Ride>;
  getAllRides(): Promise<Array<Ride & { driver: User }>>;
  getRidesByDriverId(driverId: number): Promise<Ride[]>;
  getRide(rideId: number): Promise<Ride | undefined>;
  updateRideSeats(rideId: number, availableSeats: number): Promise<void>;
  
  // Ride request methods
  createRideRequest(request: InsertRideRequest): Promise<RideRequest>;
  getAllRideRequests(): Promise<Array<RideRequest & { requester: User }>>;
  getRideRequestsByUserId(userId: number): Promise<RideRequest[]>;
  updateRideRequestStatus(requestId: number, status: string, rideId?: number): Promise<void>;
  
  // Ride join request methods
  createRideJoinRequest(request: InsertRideJoinRequest): Promise<RideJoinRequest>;
  getRideJoinRequestsForDriver(driverId: number): Promise<Array<RideJoinRequest & { requester: User; ride: Ride }>>;
  respondToRideJoinRequest(requestId: number, status: string, driverId: number): Promise<void>;
  
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

  // Ride methods
  async createRide(ride: InsertRide): Promise<Ride> {
    const [newRide] = await db
      .insert(rides)
      .values(ride)
      .returning();
    return newRide;
  }

  async getAllRides(): Promise<Array<Ride & { driver: User }>> {
    const result = await db
      .select()
      .from(rides)
      .innerJoin(users, eq(rides.driverId, users.id))
      .where(eq(rides.isActive, true))
      .orderBy(desc(rides.createdAt));

    return result.map(row => ({
      ...row.rides,
      driver: row.users,
    }));
  }

  async getRidesByDriverId(driverId: number): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rides.createdAt));
  }

  async getRide(rideId: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
    return ride || undefined;
  }

  async updateRideSeats(rideId: number, availableSeats: number): Promise<void> {
    await db
      .update(rides)
      .set({ availableSeats })
      .where(eq(rides.id, rideId));
  }

  // Ride request methods
  async createRideRequest(request: InsertRideRequest): Promise<RideRequest> {
    const [newRequest] = await db
      .insert(rideRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getAllRideRequests(): Promise<Array<RideRequest & { requester: User }>> {
    const result = await db
      .select()
      .from(rideRequests)
      .innerJoin(users, eq(rideRequests.requesterId, users.id))
      .orderBy(desc(rideRequests.createdAt));

    return result.map(row => ({
      ...row.ride_requests,
      requester: row.users,
    }));
  }

  async getRideRequestsByUserId(userId: number): Promise<RideRequest[]> {
    return await db
      .select()
      .from(rideRequests)
      .where(eq(rideRequests.requesterId, userId))
      .orderBy(desc(rideRequests.createdAt));
  }

  async updateRideRequestStatus(requestId: number, status: string, rideId?: number): Promise<void> {
    const updateData: any = { status };
    if (rideId) {
      updateData.rideId = rideId;
    }
    
    await db
      .update(rideRequests)
      .set(updateData)
      .where(eq(rideRequests.id, requestId));
  }

  // Ride join request methods
  async createRideJoinRequest(request: InsertRideJoinRequest): Promise<RideJoinRequest> {
    const [newRequest] = await db
      .insert(rideJoinRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getRideJoinRequestsForDriver(driverId: number): Promise<Array<RideJoinRequest & { requester: User; ride: Ride }>> {
    const result = await db
      .select()
      .from(rideJoinRequests)
      .innerJoin(rides, eq(rideJoinRequests.rideId, rides.id))
      .innerJoin(users, eq(rideJoinRequests.requesterId, users.id))
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rideJoinRequests.createdAt));

    return result.map(row => ({
      ...row.ride_join_requests,
      requester: row.users,
      ride: row.rides,
    }));
  }

  async respondToRideJoinRequest(requestId: number, status: string, driverId: number): Promise<void> {
    // First verify the driver owns the ride
    const joinRequest = await db
      .select()
      .from(rideJoinRequests)
      .innerJoin(rides, eq(rideJoinRequests.rideId, rides.id))
      .where(eq(rideJoinRequests.id, requestId))
      .limit(1);

    if (!joinRequest.length || joinRequest[0].rides.driverId !== driverId) {
      throw new Error("Unauthorized to respond to this request");
    }

    await db
      .update(rideJoinRequests)
      .set({ 
        status, 
        respondedAt: new Date() 
      })
      .where(eq(rideJoinRequests.id, requestId));

    // If accepted, reduce available seats
    if (status === 'accepted') {
      const ride = joinRequest[0].rides;
      if (ride.availableSeats > 0) {
        await this.updateRideSeats(ride.id, ride.availableSeats - 1);
      }
    }
  }
}

export const storage = new DatabaseStorage();
