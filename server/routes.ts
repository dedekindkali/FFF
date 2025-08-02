import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAttendanceSchema, updateAttendanceSchema, insertRideSchema, insertRideRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username } = insertUserSchema.parse(req.body);
      
      let user = await storage.getUserByUsername(username);
      if (!user) {
        // Create new user if doesn't exist
        user = await storage.createUser({ username });
      }
      
      // Store user in session
      (req as any).session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(400).json({ message: "Invalid username" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        res.status(500).json({ message: "Could not log out" });
      } else {
        res.json({ message: "Logged out successfully" });
      }
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const attendance = await storage.getAttendanceByUserId(userId);
      res.json({ attendance });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const attendanceData = insertAttendanceSchema.parse({ ...req.body, userId });
      
      // Check if attendance record already exists
      const existingAttendance = await storage.getAttendanceByUserId(userId);
      
      let attendance;
      if (existingAttendance) {
        attendance = await storage.updateAttendance({ ...attendanceData, userId });
      } else {
        attendance = await storage.createAttendance(attendanceData);
      }
      
      res.json({ attendance });
    } catch (error) {
      console.error('Attendance error:', error);
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  // Participants routes
  app.get("/api/participants", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const participants = await storage.getAllUsersWithAttendance();
      res.json({ participants });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAttendanceStats();
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/export/:type", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { type } = req.params;
      const participants = await storage.getAllUsersWithAttendance();
      
      // Simple CSV export
      let csvData = '';
      
      if (type === 'attendance') {
        csvData = 'Username,Day1 Breakfast,Day1 Lunch,Day1 Dinner,Day1 Night,Day2 Breakfast,Day2 Lunch,Day2 Dinner,Day2 Night,Day3 Breakfast,Day3 Lunch,Day3 Dinner,Day3 Night\n';
        participants.forEach(p => {
          if (p.attendance) {
            csvData += `${p.username},${p.attendance.day1Breakfast},${p.attendance.day1Lunch},${p.attendance.day1Dinner},${p.attendance.day1Night},${p.attendance.day2Breakfast},${p.attendance.day2Lunch},${p.attendance.day2Dinner},${p.attendance.day2Night},${p.attendance.day3Breakfast},${p.attendance.day3Lunch},${p.attendance.day3Dinner},${p.attendance.day3Night}\n`;
          }
        });
      } else if (type === 'rides') {
        csvData = 'Username,Transportation Status,Transportation Details\n';
        participants.forEach(p => {
          if (p.attendance) {
            csvData += `${p.username},${p.attendance.transportationStatus || ''},${p.attendance.transportationDetails || ''}\n`;
          }
        });
      } else if (type === 'dietary') {
        csvData = 'Username,Vegetarian,Vegan,Gluten Free,Dairy Free,Allergies\n';
        participants.forEach(p => {
          if (p.attendance) {
            csvData += `${p.username},${p.attendance.vegetarian},${p.attendance.vegan},${p.attendance.glutenFree},${p.attendance.dairyFree},${p.attendance.allergies || ''}\n`;
          }
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ride routes
  app.get("/api/rides", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rides = await storage.getAllRides();
      res.json({ rides });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rides", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideData = insertRideSchema.parse({
        ...req.body,
        driverId: userId,
      });
      
      const ride = await storage.createRide(rideData);
      res.json({ ride });
    } catch (error) {
      res.status(400).json({ message: "Invalid ride data" });
    }
  });

  app.post("/api/rides/:id/join", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideId = parseInt(req.params.id);
      // This would typically create a ride passenger record and update available seats
      // For now, just update the available seats
      const rides = await storage.getAllRides();
      const ride = rides.find(r => r.id === rideId);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      if (ride.availableSeats <= 0) {
        return res.status(400).json({ message: "No available seats" });
      }
      
      await storage.updateRideSeats(rideId, ride.availableSeats - 1);
      res.json({ message: "Successfully joined ride" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ride request routes
  app.get("/api/ride-requests", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requests = await storage.getAllRideRequests();
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/ride-requests", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requestData = insertRideRequestSchema.parse({
        ...req.body,
        requesterId: userId,
      });
      
      const request = await storage.createRideRequest(requestData);
      res.json({ request });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
