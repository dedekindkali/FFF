import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Utensils, Users, CalendarPlus, CarFront, Leaf, MapPin, Clock, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/attendance'],
  });

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const attendance = (attendanceData as any)?.attendance;
  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];
  const currentUser = (authData as any)?.user;



  const getAttendancePeriods = () => {
    if (!attendance) return [];
    
    const periods = [];
    
    // Day 1 periods
    const day1Events = [];
    if (attendance.day1Breakfast) day1Events.push('breakfast');
    if (attendance.day1Lunch) day1Events.push('lunch');
    if (attendance.day1Dinner) day1Events.push('dinner');
    if (attendance.day1Night) day1Events.push('overnight');
    
    if (day1Events.length > 0) {
      const firstEvent = day1Events[0];
      const lastEvent = day1Events[day1Events.length - 1];
      if (firstEvent === lastEvent) {
        periods.push(`${firstEvent} of Aug 28`);
      } else {
        periods.push(`from ${firstEvent} of Aug 28 to ${lastEvent} of Aug 28`);
      }
    }
    
    // Day 2 periods
    const day2Events = [];
    if (attendance.day2Breakfast) day2Events.push('breakfast');
    if (attendance.day2Lunch) day2Events.push('lunch');
    if (attendance.day2Dinner) day2Events.push('dinner');
    if (attendance.day2Night) day2Events.push('overnight');
    
    if (day2Events.length > 0) {
      const firstEvent = day2Events[0];
      const lastEvent = day2Events[day2Events.length - 1];
      if (firstEvent === lastEvent) {
        periods.push(`${firstEvent} of Aug 29`);
      } else {
        periods.push(`from ${firstEvent} of Aug 29 to ${lastEvent} of Aug 29`);
      }
    }
    
    // Day 3 periods
    const day3Events = [];
    if (attendance.day3Breakfast) day3Events.push('breakfast');
    if (attendance.day3Lunch) day3Events.push('lunch');
    if (attendance.day3Dinner) day3Events.push('dinner');
    if (attendance.day3Night) day3Events.push('overnight');
    
    if (day3Events.length > 0) {
      const firstEvent = day3Events[0];
      const lastEvent = day3Events[day3Events.length - 1];
      if (firstEvent === lastEvent) {
        periods.push(`${firstEvent} of Aug 30`);
      } else {
        periods.push(`from ${firstEvent} of Aug 30 to ${lastEvent} of Aug 30`);
      }
    }
    
    return periods;
  };

  const getRideCoordinationInfo = () => {
    if (!currentUser) return null;

    // Check if user is offering a ride
    const offeringRide = rides.find((ride: any) => ride.driverId === currentUser.id);
    if (offeringRide) {
      return {
        type: "offering",
        icon: Car,
        title: t('offeringRide'),
        details: [
          `Route: ${offeringRide.departure} → ${offeringRide.destination}`,
          `Available seats: ${offeringRide.availableSeats}/${offeringRide.totalSeats}`,
          `Departure: ${offeringRide.departureTime}`,
          offeringRide.notes && `Notes: ${offeringRide.notes}`
        ].filter(Boolean),
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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
          `Passengers: ${requestingRide.passengerCount}`,
          `Preferred time: ${requestingRide.preferredTime}`,
          requestingRide.notes && `Notes: ${requestingRide.notes}`
        ].filter(Boolean),
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      };
    }

    // Check if user has joined a ride
    const joinedRide = rides.find((ride: any) => 
      ride.passengers && ride.passengers.some((p: any) => p.id === currentUser.id)
    );
    if (joinedRide) {
      return {
        type: "passenger",
        icon: User,
        title: t('joinedRide'),
        details: [
          `Driver: ${joinedRide.driverUsername}`,
          `Route: ${joinedRide.departure} → ${joinedRide.destination}`,
          `Departure: ${joinedRide.departureTime}`,
          `Seats taken: ${joinedRide.totalSeats - joinedRide.availableSeats}/${joinedRide.totalSeats}`
        ],
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      };
    }

    return null;
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('welcomeBack')} FroForForno</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('eventDates')} • Gestisci la tua partecipazione e preferenze</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">


        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('rideCoordination')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rideInfo ? rideInfo.title : t('noRideCoordination')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Utensils className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dietary')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {getDietaryStatus()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Attendance Information */}
      {attendancePeriods.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CalendarPlus className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('attendanceDetails')}</h3>
            </div>
            <div className="space-y-2">
              {attendancePeriods.map((period, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="capitalize">{period}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Ride Information */}
      {rideInfo && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <rideInfo.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rideDetails')}</h3>
              <Badge className={`ml-auto ${rideInfo.color}`}>
                {rideInfo.title}
              </Badge>
            </div>
            <div className="space-y-2">
              {rideInfo.details.map((detail, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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