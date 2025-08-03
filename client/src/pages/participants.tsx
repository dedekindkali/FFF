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

  const getAttendancePeriods = (participant: any) => {
    if (!participant.attendance) return [];
    
    const attendance = participant.attendance;
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

  // getRideStatus function removed as requested

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
    
    // Ride filter removed as requested
    let matchesRide = true;
    
    return matchesSearch && matchesDay && matchesRide;
  });

  // Removed getAttendingDays and getDietaryRestrictions functions as they are no longer needed

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
          const attendancePeriods = getAttendancePeriods(participant);

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

                    <div>
                      {/* Attending Periods */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Attending Periods
                        </p>
                        <div className="space-y-1">
                          {attendancePeriods.length > 0 ? (
                            attendancePeriods.map((period, index) => (
                              <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                {period}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              No attendance recorded
                            </span>
                          )}
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