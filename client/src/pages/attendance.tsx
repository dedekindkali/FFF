import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Utensils, StickyNote, RotateCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";

export function Attendance() {
  const [formData, setFormData] = useState({
    // Day 1 - August 28
    day1Breakfast: false,
    day1Lunch: false,
    day1Dinner: false,
    day1Night: false,
    // Day 2 - August 29
    day2Breakfast: false,
    day2Lunch: false,
    day2Dinner: false,
    day2Night: false,
    // Day 3 - August 30
    day3Breakfast: false,
    day3Lunch: false,
    day3Dinner: false,
    day3Night: false,
    // Dietary
    omnivore: false,
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    allergies: "",
    // Notes
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['/api/attendance'],
  });

  useEffect(() => {
    const attendance = (attendanceData as any)?.attendance;
    if (attendance) {
      setFormData({
        day1Breakfast: attendance.day1Breakfast || false,
        day1Lunch: attendance.day1Lunch || false,
        day1Dinner: attendance.day1Dinner || false,
        day1Night: attendance.day1Night || false,
        day2Breakfast: attendance.day2Breakfast || false,
        day2Lunch: attendance.day2Lunch || false,
        day2Dinner: attendance.day2Dinner || false,
        day2Night: attendance.day2Night || false,
        day3Breakfast: attendance.day3Breakfast || false,
        day3Lunch: attendance.day3Lunch || false,
        day3Dinner: attendance.day3Dinner || false,
        day3Night: attendance.day3Night || false,
        omnivore: attendance.omnivore || false,
        vegetarian: attendance.vegetarian || false,
        vegan: attendance.vegan || false,
        glutenFree: attendance.glutenFree || false,
        dairyFree: attendance.dairyFree || false,
        allergies: attendance.allergies || "",
        notes: attendance.notes || "",
      });
    }
  }, [attendanceData]);

  const saveMutation = useMutation({
    mutationFn: (attendanceData: any) => apiRequest('POST', '/api/attendance', attendanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: t('attendanceSaved'),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save attendance preferences.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      day1Breakfast: false,
      day1Lunch: false,
      day1Dinner: false,
      day1Night: false,
      day2Breakfast: false,
      day2Lunch: false,
      day2Dinner: false,
      day2Night: false,
      day3Breakfast: false,
      day3Lunch: false,
      day3Dinner: false,
      day3Night: false,
      omnivore: false,
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      allergies: "",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('attendanceTitle')}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('attendanceSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Day 1: August 28 */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              Wednesday, August 28
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'day1Breakfast', label: t('breakfast'), time: '8:00 AM' },
                { key: 'day1Lunch', label: t('lunch'), time: '12:00 PM' },
                { key: 'day1Dinner', label: t('dinner'), time: '7:00 PM' },
                { key: 'day1Night', label: t('overnight'), time: '9:00 PM' },
              ].map(({ key, label, time }) => (
                <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Checkbox
                    checked={formData[key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day 2: August 29 */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              Thursday, August 29
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'day2Breakfast', label: t('breakfast'), time: '8:00 AM' },
                { key: 'day2Lunch', label: t('lunch'), time: '12:00 PM' },
                { key: 'day2Dinner', label: t('dinner'), time: '7:00 PM' },
                { key: 'day2Night', label: t('overnight'), time: '9:00 PM' },
              ].map(({ key, label, time }) => (
                <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Checkbox
                    checked={formData[key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day 3: August 30 */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              Friday, August 30
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'day3Breakfast', label: t('breakfast'), time: '8:00 AM' },
                { key: 'day3Lunch', label: t('lunch'), time: '12:00 PM' },
                { key: 'day3Dinner', label: t('dinner'), time: '7:00 PM' },
                { key: 'day3Night', label: t('overnight'), time: '9:00 PM' },
              ].map(({ key, label, time }) => (
                <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Checkbox
                    checked={formData[key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Utensils className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              {t('dietary')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: 'omnivore', label: t('omnivore') },
                  { key: 'vegetarian', label: t('vegetarian') },
                  { key: 'vegan', label: t('vegan') },
                  { key: 'glutenFree', label: t('glutenFree') },
                  { key: 'dairyFree', label: t('dairyFree') },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <Checkbox
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('allergies')}
                </label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="Please list any food allergies or additional dietary restrictions"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <StickyNote className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              {t('additionalNotes')}
            </h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information or special requests"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button type="button" variant="outline" onClick={resetForm}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : t('saveAttendance')}
          </Button>
        </div>
      </form>
    </div>
  );
}