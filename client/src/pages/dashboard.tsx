import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Utensils, Users, CalendarPlus, CarFront, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";

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

  const attendance = (attendanceData as any)?.attendance;
  const rides = (ridesData as any)?.rides || [];

  const calculateAttendingDays = () => {
    if (!attendance) return 0;
    
    let days = 0;
    if (attendance.day1Breakfast || attendance.day1Lunch || attendance.day1Dinner || attendance.day1Night) days++;
    if (attendance.day2Breakfast || attendance.day2Lunch || attendance.day2Dinner || attendance.day2Night) days++;
    if (attendance.day3Breakfast || attendance.day3Lunch || attendance.day3Dinner || attendance.day3Night) days++;
    
    return days;
  };

  const getRideStatus = () => {
    if (!attendance?.transportationStatus) return "Not Set";
    return attendance.transportationStatus === "offering" ? "Offering" :
           attendance.transportationStatus === "needed" ? "Need Ride" : "Own Transport";
  };

  const getDietaryStatus = () => {
    if (!attendance) return t('notSet');
    const preferences = [];
    if (attendance.vegetarian) preferences.push(t('vegetarian'));
    if (attendance.vegan) preferences.push(t('vegan'));
    if (attendance.glutenFree) preferences.push(t('glutenFree'));
    if (attendance.dairyFree) preferences.push(t('dairyFree'));
    if (attendance.allergies) preferences.push(`${t('allergies')}: ${attendance.allergies}`);
    
    return preferences.length > 0 ? preferences.join(', ') : t('notSet');
  };

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
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('daysAttending')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {calculateAttendingDays()}/3
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('rideCoordination')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {rides.length} {t('availableRides')}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dietaryPreferences')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-40" title={getDietaryStatus()}>
                  {getDietaryStatus()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('quickActions')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              onClick={() => onNavigate('attendance')}
            >
              <CalendarPlus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium">{t('updateAttendance')}</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              onClick={() => onNavigate('rides')}
            >
              <CarFront className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium">{t('rideCoordination')}</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              onClick={() => onNavigate('attendance')}
            >
              <Leaf className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium">{t('dietaryPreferences')}</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              onClick={() => onNavigate('participants')}
            >
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium">{t('viewParticipants')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
