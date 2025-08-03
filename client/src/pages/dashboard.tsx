import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Utensils, Users, CalendarPlus, CarFront, Leaf, MapPin, Clock, User, Bell } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useRef } from "react";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const processedNotificationsRef = useRef<Set<number>>(new Set());
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/attendance'],
  });

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ['/api/rides/join-requests'],
  });

  const { data: rideJoinStatusData } = useQuery({
    queryKey: ['/api/ride-join-status'],
  });

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const { data: rideInvitationsData } = useQuery({
    queryKey: ['/api/ride-invitations'],
  });

  const attendance = (attendanceData as any)?.attendance;
  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];
  const joinRequests = (joinRequestsData as any)?.requests || [];
  const rideJoinStatus = (rideJoinStatusData as any)?.joinRequests || [];
  const currentUser = (authData as any)?.user;
  const notifications = (notificationsData as any)?.notifications || [];
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  const rideInvitations = (rideInvitationsData as any)?.invitations || [];
  const pendingInvitations = rideInvitations.filter((inv: any) => inv.status === 'pending');

  // Mutation to mark notifications as read
  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: number) => apiRequest('POST', `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      // Delay query invalidation to prevent immediate re-rendering
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }, 2000);
    },
  });

  // Effect to show temporary toasts for ride modification notifications
  useEffect(() => {
    const rideModifiedNotifications = notifications.filter((n: any) => 
      n.type === 'ride_modified' && !n.isRead && !processedNotificationsRef.current.has(n.id)
    );
    
    if (rideModifiedNotifications.length > 0) {
      rideModifiedNotifications.forEach((notification: any) => {
        // Add to processed set to prevent duplicate processing
        processedNotificationsRef.current.add(notification.id);
        
        toast({
          title: "Ride Modified",
          description: notification.message,
          duration: 5000, // Show for 5 seconds
        });
        
        // Mark notification as read after showing the toast
        setTimeout(() => {
          markNotificationReadMutation.mutate(notification.id);
        }, 1000); // Delay to ensure toast is shown first
      });
    }
  }, [notifications]);



  const getAttendancePeriods = () => {
    if (!attendance) return [];
    
    // Create a chronological list of all events the user is attending
    const events = [];
    
    if (attendance.day1Breakfast) events.push({ day: 1, event: 'breakfast', label: 'breakfast Aug 28' });
    if (attendance.day1Lunch) events.push({ day: 1, event: 'lunch', label: 'lunch Aug 28' });
    if (attendance.day1Dinner) events.push({ day: 1, event: 'dinner', label: 'dinner Aug 28' });
    if (attendance.day1Night) events.push({ day: 1, event: 'overnight', label: 'overnight Aug 28-29' });
    
    if (attendance.day2Breakfast) events.push({ day: 2, event: 'breakfast', label: 'breakfast Aug 29' });
    if (attendance.day2Lunch) events.push({ day: 2, event: 'lunch', label: 'lunch Aug 29' });
    if (attendance.day2Dinner) events.push({ day: 2, event: 'dinner', label: 'dinner Aug 29' });
    if (attendance.day2Night) events.push({ day: 2, event: 'overnight', label: 'overnight Aug 29-30' });
    
    if (attendance.day3Breakfast) events.push({ day: 3, event: 'breakfast', label: 'breakfast Aug 30' });
    if (attendance.day3Lunch) events.push({ day: 3, event: 'lunch', label: 'lunch Aug 30' });
    if (attendance.day3Dinner) events.push({ day: 3, event: 'dinner', label: 'dinner Aug 30' });
    
    if (events.length === 0) return [];
    
    // Group continuous periods
    const periods = [];
    let currentPeriod = null;
    
    for (let i = 0; i < events.length; i++) {
      if (!currentPeriod) {
        currentPeriod = { start: events[i], end: events[i] };
      } else {
        // Check if this event is continuous with the previous one
        const prevEvent = events[i - 1];
        const currentEvent = events[i];
        
        const isContinuous = (
          (prevEvent.day === currentEvent.day) || 
          (prevEvent.day === currentEvent.day - 1 && prevEvent.event === 'overnight') ||
          (prevEvent.day === currentEvent.day - 1 && currentEvent.event === 'breakfast')
        );
        
        if (isContinuous) {
          currentPeriod.end = currentEvent;
        } else {
          // End current period and start new one
          periods.push(currentPeriod);
          currentPeriod = { start: currentEvent, end: currentEvent };
        }
      }
    }
    
    if (currentPeriod) {
      periods.push(currentPeriod);
    }
    
    // Format periods as strings
    return periods.map(period => {
      if (period.start.label === period.end.label) {
        return period.start.label;
      } else {
        return `from ${period.start.label} to ${period.end.label}`;
      }
    });
  };

  const getRideCoordinationInfo = () => {
    if (!currentUser) return null;

    // Check if user is offering a ride
    const offeringRide = rides.find((ride: any) => ride.driverId === currentUser.id);
    if (offeringRide) {
      // Check for pending join requests to show notification
      const pendingJoinRequests = joinRequests.filter((req: any) => req.status === 'pending');
      const hasNotifications = pendingJoinRequests.length > 0;
      
      return {
        type: "offering",
        icon: Car,
        title: t('offeringRide'),
        details: [
          `Route: ${offeringRide.departure} → ${offeringRide.destination}`,
          `Available seats: ${offeringRide.availableSeats}/${offeringRide.totalSeats}`,
          `Day: ${offeringRide.eventDay === 'day1' ? 'Aug 28' : offeringRide.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Departure: ${offeringRide.departureTime}`,
          offeringRide.notes && `Notes: ${offeringRide.notes}`
        ].filter(Boolean),
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        hasNotifications,
        notificationCount: pendingJoinRequests.length
      };
    }

    // Check if user has made join requests
    const myJoinRequest = rideJoinStatus.find((joinReq: any) => joinReq.status === 'pending');
    if (myJoinRequest) {
      return {
        type: "pending-request",
        icon: Clock,
        title: "Pending Join Request",
        details: [
          `Driver: ${myJoinRequest.ride.driver.username}`,
          `Route: ${myJoinRequest.ride.departure} → ${myJoinRequest.ride.destination}`,
          `Day: ${myJoinRequest.ride.eventDay === 'day1' ? 'Aug 28' : myJoinRequest.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Departure: ${myJoinRequest.ride.departureTime}`,
          `Status: Waiting for response`
        ],
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      };
    }

    // Check if user has accepted join request 
    const acceptedJoinRequest = rideJoinStatus.find((joinReq: any) => joinReq.status === 'accepted');
    if (acceptedJoinRequest) {
      return {
        type: "ride-accepted",
        icon: User,
        title: `Ride Accepted by ${acceptedJoinRequest.ride.driver.username}`,
        details: [
          `Driver: ${acceptedJoinRequest.ride.driver.username}`,
          `Route: ${acceptedJoinRequest.ride.departure} → ${acceptedJoinRequest.ride.destination}`,
          `Day: ${acceptedJoinRequest.ride.eventDay === 'day1' ? 'Aug 28' : acceptedJoinRequest.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Departure: ${acceptedJoinRequest.ride.departureTime}`
        ],
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      };
    }

    // Check if user has pending ride invitations - just show notification count
    if (pendingInvitations.length > 0) {
      return {
        type: "invitation-pending",
        icon: Bell,
        title: t('invitationsPending'),
        details: [],
        color: "bg-ff-primary/10 text-ff-primary dark:bg-ff-primary/20 dark:text-ff-primary",
        hasNotifications: true,
        notificationCount: pendingInvitations.length
      };
    }

    // Check if user has requested a ride
    const requestingRide = requests.find((request: any) => request.requesterId === currentUser.id);
    if (requestingRide) {
      return {
        type: "requesting",
        icon: MapPin,
        title: t('requestingRide'),
        details: [
          `Route: ${requestingRide.departure} → ${requestingRide.destination}`,
          `Day: ${requestingRide.eventDay === 'day1' ? 'Aug 28' : requestingRide.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Preferred time: ${requestingRide.preferredTime}`,
          requestingRide.notes && `Notes: ${requestingRide.notes}`
        ].filter(Boolean),
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      };
    }

    return null;
  };

  const getAllUserRides = () => {
    if (!currentUser) return [];

    const userRides: any[] = [];

    // Add rides user is offering (as driver)
    const offeringRides = rides.filter((ride: any) => ride.driverId === currentUser.id);
    offeringRides.forEach((ride: any) => {
      const pendingJoinRequests = joinRequests.filter((req: any) => req.rideId === ride.id && req.status === 'pending');
      userRides.push({
        type: "offering",
        role: "Driver",
        route: `${ride.departure} → ${ride.destination}`,
        day: ride.eventDay === 'day1' ? 'Aug 28' : ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30',
        time: ride.departureTime,
        seats: `${ride.availableSeats}/${ride.totalSeats} available`,
        notes: ride.notes,
        hasNotifications: pendingJoinRequests.length > 0,
        notificationCount: pendingJoinRequests.length
      });
    });

    // Add rides user has joined (as passenger) - accepted requests
    const acceptedJoinRequests = rideJoinStatus.filter((joinReq: any) => joinReq.status === 'accepted');
    acceptedJoinRequests.forEach((joinReq: any) => {
      userRides.push({
        type: "passenger",
        role: "Passenger",
        route: `${joinReq.ride.departure} → ${joinReq.ride.destination}`,
        day: joinReq.ride.eventDay === 'day1' ? 'Aug 28' : joinReq.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30',
        time: joinReq.ride.departureTime,
        driver: joinReq.ride.driver.username,
        notes: joinReq.ride.notes
      });
    });

    // Add pending join requests
    const pendingJoinRequests = rideJoinStatus.filter((joinReq: any) => joinReq.status === 'pending');
    pendingJoinRequests.forEach((joinReq: any) => {
      userRides.push({
        type: "pending",
        role: "Pending Request",
        route: `${joinReq.ride.departure} → ${joinReq.ride.destination}`,
        day: joinReq.ride.eventDay === 'day1' ? 'Aug 28' : joinReq.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30',
        time: joinReq.ride.departureTime,
        driver: joinReq.ride.driver.username,
        status: "Waiting for response"
      });
    });

    // Add ride requests user has made
    const userRequests = requests.filter((request: any) => request.requesterId === currentUser.id);
    userRequests.forEach((request: any) => {
      userRides.push({
        type: "requesting",
        role: "Ride Request",
        route: `${request.departure} → ${request.destination}`,
        day: request.eventDay === 'day1' ? 'Aug 28' : request.eventDay === 'day2' ? 'Aug 29' : 'Aug 30',
        time: request.preferredTime,
        status: request.status === 'offered' ? `Offered by ${request.offerer?.username || 'someone'}` : request.status,
        notes: request.notes
      });
    });

    // Add pending invitations
    pendingInvitations.forEach((invitation: any) => {
      userRides.push({
        type: "invitation",
        role: "Ride Invitation",
        route: `${invitation.ride.departure} → ${invitation.ride.destination}`,
        day: invitation.ride.eventDay === 'day1' ? 'Aug 28' : invitation.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30',
        time: invitation.ride.departureTime,
        driver: invitation.ride.driver.username,
        status: "Invitation pending"
      });
    });

    return userRides;
  };

  const getDietaryStatus = () => {
    if (!attendance) return t('notSet');
    const preferences = [];
    if (attendance.omnivore) preferences.push(t('omnivore'));
    if (attendance.vegetarian) preferences.push(t('vegetarian'));
    if (attendance.vegan) preferences.push(t('vegan'));
    if (attendance.glutenFree) preferences.push(t('glutenFree'));
    if (attendance.dairyFree) preferences.push(t('dairyFree'));
    if (attendance.allergies) preferences.push(`${t('allergies')}: ${attendance.allergies}`);
    
    // Default to Vegan if nothing is specified
    if (preferences.length === 0) {
      preferences.push(t('vegan'));
    }
    
    return preferences.join(', ');
  };

  const rideInfo = getRideCoordinationInfo();
  const attendancePeriods = getAttendancePeriods();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl title-font text-gray-900 dark:text-white">{currentUser?.username || t('welcomeBack')}</h2>
        <p className="mt-1 text-sm body-text text-gray-600 dark:text-gray-400">{t('eventDates')} • Gestisci la tua partecipazione e preferenze</p>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">


        <Card className="card-elevated bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="relative p-3 bg-gradient-to-br from-ff-primary/20 to-black/10 dark:from-ff-primary/30 dark:to-black/20 rounded-xl border-2 border-ff-primary/20">
                <Car className="h-6 w-6 text-ff-primary" />
                {rideInfo?.hasNotifications && (
                  <div className="absolute -top-2 -right-2 bg-ff-primary text-black text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {rideInfo.notificationCount}
                  </div>
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm subtitle-font text-gray-600 dark:text-gray-400">{t('rideCoordination')}</p>
                <p className="text-lg body-text text-gray-900 dark:text-white">
                  {rideInfo ? rideInfo.title : t('noRideCoordination')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-ff-primary/20 to-black/10 dark:from-ff-primary/30 dark:to-black/20 rounded-xl border-2 border-ff-primary/20">
                <Utensils className="h-6 w-6 text-ff-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm subtitle-font text-gray-600 dark:text-gray-400">{t('dietary')}</p>
                <p className="text-lg body-text text-gray-900 dark:text-white">
                  {getDietaryStatus()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Attendance Information */}
      {attendancePeriods.length > 0 && (
        <Card className="card-elevated bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CalendarPlus className="h-5 w-5 text-ff-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('attendanceDetails')}</h3>
            </div>
            <div className="space-y-2">
              {attendancePeriods.map((period, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-ff-primary rounded-full mr-3"></div>
                  <span className="capitalize">{period}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Ride Information */}
      <Card className="card-elevated bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Car className="h-5 w-5 text-ff-primary mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ride Details</h3>
          </div>
          {(() => {
            const allRides = getAllUserRides();
            return allRides.length > 0 ? (
              <div className="space-y-4">
                {allRides.map((ride, index) => (
                  <div key={index} className="border-l-2 border-ff-primary/30 pl-4 pb-3">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-ff-primary rounded-full mr-3"></div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{ride.role}</span>
                      {ride.hasNotifications && (
                        <span className="ml-2 bg-ff-primary text-black text-xs font-bold rounded-full px-2 py-1">
                          {ride.notificationCount}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <div>{ride.route}</div>
                      <div>{ride.day} at {ride.time}</div>
                      {ride.driver && <div>Driver: {ride.driver}</div>}
                      {ride.seats && <div>Seats: {ride.seats}</div>}
                      {ride.status && <div>Status: {ride.status}</div>}
                      {ride.notes && <div>Notes: {ride.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                <span>No active ride coordination</span>
              </div>
            );
          })()}
        </CardContent>
      </Card>



      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={() => onNavigate('attendance')}
          className="h-20 flex flex-col items-center justify-center space-y-2"
          variant="outline"
        >
          <Calendar className="h-6 w-6" />
          <span className="text-sm">{t('updateAttendance')}</span>
        </Button>

        <Button
          onClick={() => onNavigate('rides')}
          className="h-20 flex flex-col items-center justify-center space-y-2"
          variant="outline"
        >
          <CarFront className="h-6 w-6" />
          <span className="text-sm">{t('manageRides')}</span>
        </Button>

        <Button
          onClick={() => onNavigate('participants')}
          className="h-20 flex flex-col items-center justify-center space-y-2"
          variant="outline"
        >
          <Users className="h-6 w-6" />
          <span className="text-sm">{t('viewParticipants')}</span>
        </Button>


      </div>
    </div>
  );
}