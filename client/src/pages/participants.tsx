import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Car, MapPin, Users2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface ParticipantsProps {
  onNavigate: (view: string) => void;
}

export function Participants({ onNavigate }: ParticipantsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [rideFilter, setRideFilter] = useState("");
  const { t } = useLanguage();

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['/api/participants'],
  });

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  const participants = (participantsData as any)?.participants || [];
  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];

  const getRideStatus = (participant: any) => {
    // Check if user is offering a ride
    const offeringRide = rides.find((ride: any) => ride.driverId === participant.id);
    if (offeringRide) {
      return {
        status: "offering",
        label: t('offeringRide'),
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        details: `${offeringRide.departure} → ${offeringRide.destination}`
      };
    }

    // Check if user has requested a ride
    const requestingRide = requests.find((request: any) => request.requesterId === participant.id);
    if (requestingRide) {
      return {
        status: "requesting",
        label: t('requestingRide'),
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        details: `${requestingRide.departure} → ${requestingRide.destination}`
      };
    }

    // Check if user has joined a ride
    const joinedRide = rides.find((ride: any) => 
      ride.passengers && ride.passengers.some((p: any) => p.id === participant.id)
    );
    if (joinedRide) {
      return {
        status: "passenger",
        label: t('joinedRide'),
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        details: `with ${joinedRide.driverUsername}`
      };
    }

    return {
      status: "none",
      label: t('noRideCoordination'),
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      details: ""
    };
  };

  const filteredParticipants = participants.filter((participant: any) => {
    const matchesSearch = participant.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDay = true;
    if (dayFilter && dayFilter !== 'all') {
      const attendance = participant.attendance;
      if (!attendance) {
        matchesDay = false;
      } else {
        switch (dayFilter) {
          case 'day1':
            matchesDay = attendance.day1Breakfast || attendance.day1Lunch || attendance.day1Dinner || attendance.day1Night;
            break;
          case 'day2':
            matchesDay = attendance.day2Breakfast || attendance.day2Lunch || attendance.day2Dinner || attendance.day2Night;
            break;
          case 'day3':
            matchesDay = attendance.day3Breakfast || attendance.day3Lunch || attendance.day3Dinner || attendance.day3Night;
            break;
        }
      }
    }
    
    let matchesRide = true;
    if (rideFilter && rideFilter !== 'all') {
      const rideStatus = getRideStatus(participant);
      matchesRide = rideStatus.status === rideFilter;
    }
    
    return matchesSearch && matchesDay && matchesRide;
  });

  const getAttendingDays = (attendance: any) => {
    if (!attendance) return [];
    
    const days = [];
    if (attendance.day1Breakfast || attendance.day1Lunch || attendance.day1Dinner || attendance.day1Night) {
      days.push('Aug 28');
    }
    if (attendance.day2Breakfast || attendance.day2Lunch || attendance.day2Dinner || attendance.day2Night) {
      days.push('Aug 29');
    }
    if (attendance.day3Breakfast || attendance.day3Lunch || attendance.day3Dinner || attendance.day3Night) {
      days.push('Aug 30');
    }
    
    return days;
  };

  const getDietaryRestrictions = (attendance: any) => {
    if (!attendance) return [];
    
    const restrictions = [];
    if (attendance.omnivore) restrictions.push('Omnivore');
    if (attendance.vegetarian) restrictions.push('Vegetarian');
    if (attendance.vegan) restrictions.push('Vegan');
    if (attendance.glutenFree) restrictions.push('Gluten-free');
    if (attendance.dairyFree) restrictions.push('Dairy-free');
    
    // Default to vegan if nothing is specified
    if (restrictions.length === 0) {
      restrictions.push('Vegan');
    }
    
    return restrictions;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('participants')}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t('participantsSubtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('searchParticipants')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('filterByDay')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allDays')}</SelectItem>
            <SelectItem value="day1">Wednesday, Aug 28</SelectItem>
            <SelectItem value="day2">Thursday, Aug 29</SelectItem>
            <SelectItem value="day3">Friday, Aug 30</SelectItem>
          </SelectContent>
        </Select>

        <Select value={rideFilter} onValueChange={setRideFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('filterByRide')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRideStatuses')}</SelectItem>
            <SelectItem value="offering">{t('offeringRide')}</SelectItem>
            <SelectItem value="requesting">{t('requestingRide')}</SelectItem>
            <SelectItem value="passenger">{t('joinedRide')}</SelectItem>
            <SelectItem value="none">{t('noRideCoordination')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participants Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('showingParticipants')} {filteredParticipants.length} / {participants.length}
        </p>
      </div>

      {/* Participants List */}
      <div className="space-y-4">
        {filteredParticipants.map((participant: any) => {
          const attendingDays = getAttendingDays(participant.attendance);
          const dietaryRestrictions = getDietaryRestrictions(participant.attendance);
          const rideStatus = getRideStatus(participant);

          return (
            <Card key={participant.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 
                        className="text-lg font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                        onClick={() => onNavigate(`profile/${participant.id}`)}
                      >
                        {participant.username}
                      </h3>
                      {participant.isAdmin && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Admin
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Attending Days */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t('attendingDays')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {attendingDays.length > 0 ? (
                            attendingDays.map((day, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {day}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {t('noAttendance')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ride Coordination */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          <Car className="h-4 w-4 inline mr-1" />
                          {t('rideCoordination')}
                        </p>
                        <div className="flex flex-col gap-1">
                          <Badge className={rideStatus.color}>
                            {rideStatus.label}
                          </Badge>
                          {rideStatus.details && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {rideStatus.details}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dietary Restrictions */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {t('dietary')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {dietaryRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <Users2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t('noParticipantsFound')}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('noParticipantsFoundDesc')}
          </p>
        </div>
      )}
    </div>
  );
}