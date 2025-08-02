import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Utensils, Users, MapPin, Clock, Mail, Phone, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";

interface ProfileProps {
  onNavigate: (view: string) => void;
  userId: string;
}

export function Profile({ onNavigate, userId }: ProfileProps) {
  const { t } = useLanguage();
  
  const { data: profileData, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: attendanceData } = useQuery({
    queryKey: [`/api/users/${userId}/attendance`],
    enabled: !!userId,
  });

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const user = (profileData as any)?.user;
  const attendance = (attendanceData as any)?.attendance;
  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">User not found</p>
            <Button 
              onClick={() => onNavigate('dashboard')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAttendancePeriods = () => {
    if (!attendance) return [];
    
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
    
    const periods = [];
    let currentPeriod = null;
    
    for (let i = 0; i < events.length; i++) {
      if (!currentPeriod) {
        currentPeriod = { start: events[i], end: events[i] };
      } else {
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
          periods.push(currentPeriod);
          currentPeriod = { start: currentEvent, end: currentEvent };
        }
      }
    }
    
    if (currentPeriod) {
      periods.push(currentPeriod);
    }
    
    return periods.map(period => {
      if (period.start.label === period.end.label) {
        return period.start.label;
      } else {
        return `from ${period.start.label} to ${period.end.label}`;
      }
    });
  };

  const getUserRideInfo = () => {
    const offeringRide = rides.find((ride: any) => ride.driverId === user.id);
    if (offeringRide) {
      return {
        type: "offering",
        title: `Offering ride: ${offeringRide.departure} → ${offeringRide.destination}`,
        details: [
          `Day: ${offeringRide.eventDay === 'day1' ? 'Aug 28' : offeringRide.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Departure: ${offeringRide.departureTime}`,
          `Available seats: ${offeringRide.availableSeats}/${offeringRide.totalSeats}`
        ],
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      };
    }

    const requestingRide = requests.find((request: any) => request.requesterId === user.id);
    if (requestingRide) {
      return {
        type: "requesting",
        title: `Requesting ride: ${requestingRide.departure} → ${requestingRide.destination}`,
        details: [
          `Day: ${requestingRide.eventDay === 'day1' ? 'Aug 28' : requestingRide.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}`,
          `Preferred time: ${requestingRide.preferredTime}`,
          `Status: ${requestingRide.status}`
        ],
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      };
    }

    return null;
  };

  const getDietaryStatus = () => {
    if (!attendance) return 'Not specified';
    const preferences = [];
    if (attendance.omnivore) preferences.push('Omnivore');
    if (attendance.vegetarian) preferences.push('Vegetarian');
    if (attendance.vegan) preferences.push('Vegan');
    if (attendance.glutenFree) preferences.push('Gluten-free');
    if (attendance.dairyFree) preferences.push('Dairy-free');
    if (attendance.allergies) preferences.push(`Allergies: ${attendance.allergies}`);
    
    if (preferences.length === 0) {
      preferences.push('Vegan');
    }
    
    return preferences.join(', ');
  };

  const attendancePeriods = getAttendancePeriods();
  const rideInfo = getUserRideInfo();

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button 
          onClick={() => onNavigate('dashboard')} 
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center logo-style">
            <span className="text-2xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white logo-style">
              {user.username}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {user.isAdmin ? 'Event Administrator' : 'Participant'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2" />
                <span>{user.phone}</span>
              </div>
            )}
            {!user.email && !user.phone && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No contact information provided
              </p>
            )}
          </CardContent>
        </Card>

        {/* Attendance Status */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Attendance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendancePeriods.length > 0 ? (
              <div className="space-y-2">
                {attendancePeriods.map((period, index) => (
                  <Badge key={index} variant="secondary" className="mr-2 mb-2">
                    {period}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No attendance registered
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Utensils className="h-5 w-5 mr-2" />
              Dietary Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {getDietaryStatus()}
            </p>
          </CardContent>
        </Card>

        {/* Ride Coordination */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Ride Coordination
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rideInfo ? (
              <div className="space-y-2">
                <Badge className={rideInfo.color}>
                  {rideInfo.title}
                </Badge>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {rideInfo.details.map((detail, index) => (
                    <div key={index}>{detail}</div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No ride coordination
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}