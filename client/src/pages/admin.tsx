import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Car, Utensils, Download, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Admin() {
  const { toast } = useToast();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const stats = statsData?.stats;

  const handleExport = (type: string) => {
    // Open the export endpoint in a new window to trigger download
    window.open(`/api/admin/export/${type}`, '_blank');
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} export started`,
      description: "Your download should begin shortly.",
    });
  };

  const handleSendReminders = () => {
    toast({
      title: "Reminder functionality not implemented",
      description: "This would send email reminders to participants.",
    });
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

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-500">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Event overview and management tools</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Participants</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Day</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Aug {Math.max(
                    stats.day1.breakfast + stats.day1.lunch + stats.day1.dinner + stats.day1.night,
                    stats.day2.breakfast + stats.day2.lunch + stats.day2.dinner + stats.day2.night,
                    stats.day3.breakfast + stats.day3.lunch + stats.day3.dinner + stats.day3.night
                  ) === (stats.day1.breakfast + stats.day1.lunch + stats.day1.dinner + stats.day1.night) ? '28' :
                  Math.max(
                    stats.day2.breakfast + stats.day2.lunch + stats.day2.dinner + stats.day2.night,
                    stats.day3.breakfast + stats.day3.lunch + stats.day3.dinner + stats.day3.night
                  ) === (stats.day2.breakfast + stats.day2.lunch + stats.day2.dinner + stats.day2.night) ? '29' : '30'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Car className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ride Offers</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.transportation.offering}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Utensils className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Special Diets</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.dietary.vegetarian + stats.dietary.vegan + stats.dietary.glutenFree + stats.dietary.dairyFree + stats.dietary.withAllergies}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">August 28 Attendance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Breakfast</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day1.breakfast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Lunch</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day1.lunch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dinner</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day1.dinner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Night Activity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day1.night}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">August 29 Attendance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Breakfast</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day2.breakfast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Lunch</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day2.lunch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dinner</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day2.dinner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Night Activity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day2.night}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">August 30 Attendance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Breakfast</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day3.breakfast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Lunch</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day3.lunch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dinner</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day3.dinner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Night Activity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.day3.night}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export and Actions */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export & Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => handleExport('attendance')}>
              <Download className="h-4 w-4 mr-2" />
              Export Attendance
            </Button>
            <Button variant="outline" onClick={() => handleExport('rides')}>
              <Car className="h-4 w-4 mr-2" />
              Export Rides
            </Button>
            <Button variant="outline" onClick={() => handleExport('dietary')}>
              <Utensils className="h-4 w-4 mr-2" />
              Export Dietary
            </Button>
            <Button onClick={handleSendReminders}>
              <Mail className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
