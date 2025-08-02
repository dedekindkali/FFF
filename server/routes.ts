import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAttendanceSchema, updateAttendanceSchema, insertRideSchema, insertRideRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      (req as any).session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      if (!userData.username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      (req as any).session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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

  // Admin authentication route
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Check if the password matches the admin password
      if (password === "Autarch3i@") {
        (req as any).session.adminAuthenticated = true;
        res.json({ message: "Admin access granted" });
      } else {
        res.status(401).json({ message: "Invalid admin password" });
      }
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

  // Admin authentication
  app.post("/api/admin/auth", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { password } = req.body;
      if (password !== "Autarch3i@") {
        return res.status(403).json({ message: "Invalid admin password" });
      }

      // Set admin access in session
      (req as any).session.isAdminAuthenticated = true;
      res.json({ message: "Admin access granted" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/users/:userId", async (req, res) => {
    const currentUserId = (req as any).session?.userId;
    if (!currentUserId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/attendance", async (req, res) => {
    const currentUserId = (req as any).session?.userId;
    if (!currentUserId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = parseInt(req.params.userId);
      const attendance = await storage.getAttendanceByUserId(userId);
      
      res.json({ attendance });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced ride system routes
  app.put("/api/rides/:rideId", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideId = parseInt(req.params.rideId);
      const ride = await storage.getRide(rideId);
      
      if (!ride || ride.driverId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this ride" });
      }

      const updates = req.body;
      await storage.updateRide(rideId, updates);

      // Notify all passengers about the modification
      const joinRequests = await storage.getRideJoinRequestsForDriver(userId);
      const acceptedPassengers = joinRequests.filter(jr => jr.rideId === rideId && jr.status === 'accepted');
      
      for (const passenger of acceptedPassengers) {
        await storage.createRideNotification({
          userId: passenger.requesterId,
          rideId: rideId,
          type: 'ride_modified',
          message: 'A ride you joined has been modified. Please check the updated details.',
        });
      }

      res.json({ message: "Ride updated successfully" });
    } catch (error) {
      console.error("Error updating ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const notifications = await storage.getRideNotifications(userId);
      res.json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    const userId = (req as any).session?.userId;
    const adminAuthenticated = (req as any).session?.isAdminAuthenticated;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!adminAuthenticated) {
      return res.status(403).json({ message: "Admin password required" });
    }

    try {
      const stats = await storage.getAttendanceStats();
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    const userId = (req as any).session?.userId;
    const adminAuthenticated = (req as any).session?.isAdminAuthenticated;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!adminAuthenticated) {
      return res.status(403).json({ message: "Admin password required" });
    }

    try {
      const users = await storage.getAllUsersWithAttendance();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const userId = (req as any).session?.userId;
    const adminAuthenticated = (req as any).session?.adminAuthenticated;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!adminAuthenticated) {
      return res.status(403).json({ message: "Admin password required" });
    }

    try {
      const userIdToDelete = parseInt(req.params.id);
      if (isNaN(userIdToDelete)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      await storage.deleteUser(userIdToDelete);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/export/:type", async (req, res) => {
    const userId = (req as any).session?.userId;
    const adminAuthenticated = (req as any).session?.adminAuthenticated;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!adminAuthenticated) {
      return res.status(403).json({ message: "Admin password required" });
    }

    try {

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

  // New ride join request system
  app.post("/api/rides/:id/request-join", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideId = parseInt(req.params.id);
      const { message } = req.body;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      if (ride.driverId === userId) {
        return res.status(400).json({ message: "Cannot request to join your own ride" });
      }

      const joinRequest = await storage.createRideJoinRequest({
        rideId,
        requesterId: userId,
        message: message || ""
      });

      res.json({ joinRequest });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rides/join-requests", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requests = await storage.getRideJoinRequestsForDriver(userId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ride-join-status", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const joinRequests = await storage.getRideJoinRequestsForUser(userId);
      res.json({ joinRequests });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rides/join-requests/:id/respond", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.respondToRideJoinRequest(requestId, status, userId);
      res.json({ message: `Request ${status}` });
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

  // Delete ride routes
  app.delete("/api/rides/:rideId", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideId = parseInt(req.params.rideId);
      const ride = await storage.getRide(rideId);
      
      if (!ride || ride.driverId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this ride" });
      }

      await storage.deleteRide(rideId);
      res.json({ message: "Ride deleted successfully" });
    } catch (error) {
      console.error("Error deleting ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete ride request routes
  app.delete("/api/ride-requests/:requestId", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requestId = parseInt(req.params.requestId);
      const request = await storage.getRideRequest(requestId);
      
      if (!request || request.requesterId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this request" });
      }

      await storage.deleteRideRequest(requestId);
      res.json({ message: "Ride request deleted successfully" });
    } catch (error) {
      console.error("Error deleting ride request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invite user to specific ride
  app.post("/api/rides/:rideId/invite", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rideId = parseInt(req.params.rideId);
      const { userId: invitedUserId, message } = req.body;

      const ride = await storage.getRide(rideId);
      if (!ride || ride.driverId !== userId) {
        return res.status(403).json({ message: "Not authorized to invite to this ride" });
      }

      // Create a ride invitation for the passenger
      const invitation = await storage.createRideInvitation({
        rideId,
        inviterId: userId,
        inviteeId: invitedUserId,
      });

      // Create notification for the invited user (passenger)
      const driver = await storage.getUserById(userId);
      await storage.createRideNotification({
        userId: invitedUserId,
        type: 'ride_invitation',
        message: `${driver?.username || 'A driver'} offered you a ride from ${ride.departure} to ${ride.destination}`,
      });

      res.json({ message: "Ride offer sent successfully", invitation });
    } catch (error) {
      console.error("Error sending ride invitation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update ride request status
  app.put("/api/ride-requests/:requestId", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;

      const request = await storage.getRideRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Ride request not found" });
      }

      await storage.updateRideRequestStatus(requestId, status);
      res.json({ message: "Ride request updated successfully" });
    } catch (error) {
      console.error("Error updating ride request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get ride invitations for user
  app.get("/api/ride-invitations", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const invitations = await storage.getRideInvitations(userId);
      res.json({ invitations });
    } catch (error) {
      console.error("Error getting ride invitations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Respond to ride invitation
  app.put("/api/ride-invitations/:invitationId/respond", async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const invitationId = parseInt(req.params.invitationId);
      const { status } = req.body; // 'accepted' or 'declined'

      // Verify the invitation exists and belongs to the user
      const invitations = await storage.getRideInvitations(userId);
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      await storage.respondToRideInvitation(invitationId, status);

      // If accepted, add user to the ride (create join request)
      if (status === 'accepted') {
        await storage.createRideJoinRequest({
          rideId: invitation.rideId,
          requesterId: userId,
          message: "Accepted ride invitation",
        });

        // Update ride available seats
        const ride = await storage.getRide(invitation.rideId);
        if (ride && ride.availableSeats > 0) {
          await storage.updateRideSeats(invitation.rideId, ride.availableSeats - 1);
        }
      }

      res.json({ message: `Invitation ${status} successfully` });
    } catch (error) {
      console.error("Error responding to ride invitation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
