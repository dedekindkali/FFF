import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

export function Participants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [rideFilter, setRideFilter] = useState("");

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['/api/participants'],
  });

  const participants = participantsData?.participants || [];

  const filteredParticipants = participants.filter((participant: any) => {
    const matchesSearch = participant.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDay = true;
    if (dayFilter) {
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
    if (rideFilter) {
      matchesRide = participant.attendance?.transportationStatus === rideFilter;
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
    if (attendance.vegetarian) restrictions.push('Vegetarian');
    if (attendance.vegan) restrictions.push('Vegan');
    if (attendance.glutenFree) restrictions.push('Gluten-free');
    if (attendance.dairyFree) restrictions.push('Dairy-free');
    if (attendance.allergies) restrictions.push('Allergies');
    
    return restrictions.length > 0 ? restrictions : ['No restrictions'];
  };

  const getTransportationStatus = (attendance: any) => {
    if (!attendance?.transportationStatus) return 'Not specified';
    
    switch (attendance.transportationStatus) {
      case 'offering': return 'Offering Rides';
      case 'needed': return 'Need Ride';
      case 'own': return 'Own Transport';
      default: return 'Not specified';
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Participants</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View all confirmed participants and their preferences</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search participants..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Days</SelectItem>
            <SelectItem value="day1">August 28</SelectItem>
            <SelectItem value="day2">August 29</SelectItem>
            <SelectItem value="day3">August 30</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={rideFilter} onValueChange={setRideFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Ride Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Ride Status</SelectItem>
            <SelectItem value="offering">Offering Rides</SelectItem>
            <SelectItem value="needed">Need Rides</SelectItem>
            <SelectItem value="own">Own Transport</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParticipants.map((participant: any) => (
          <Card key={participant.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {getInitials(participant.username)}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{participant.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Joined {new Date(participant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendance</h4>
                  <div className="flex flex-wrap gap-1">
                    {getAttendingDays(participant.attendance).map((day: string) => (
                      <Badge key={day} variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        {day}
                      </Badge>
                    ))}
                    {getAttendingDays(participant.attendance).length === 0 && (
                      <Badge variant="outline" className="text-gray-500">No days selected</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transportation</h4>
                  <Badge 
                    variant="secondary" 
                    className={
                      participant.attendance?.transportationStatus === 'offering' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : participant.attendance?.transportationStatus === 'needed'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }
                  >
                    {getTransportationStatus(participant.attendance)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dietary</h4>
                  <div className="flex flex-wrap gap-1">
                    {getDietaryRestrictions(participant.attendance).map((restriction: string) => (
                      <Badge 
                        key={restriction} 
                        variant="secondary"
                        className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      >
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No participants found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
