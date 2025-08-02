import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Plus, MapPin, Clock, Users, MessageSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Ride, RideRequest, InsertRide, InsertRideRequest } from "@shared/schema";

export function Rides() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];

  const offerRideMutation = useMutation({
    mutationFn: (rideData: InsertRide) => apiRequest('POST', '/api/rides', rideData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      setShowOfferDialog(false);
      toast({
        title: "Success",
        description: "Ride offer created successfully!",
      });
    },
  });

  const requestRideMutation = useMutation({
    mutationFn: (requestData: InsertRideRequest) => apiRequest('POST', '/api/ride-requests', requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
      setShowRequestDialog(false);
      toast({
        title: "Success",
        description: "Ride request created successfully!",
      });
    },
  });

  const joinRideMutation = useMutation({
    mutationFn: (rideId: number) => apiRequest('POST', `/api/rides/${rideId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: "Success",
        description: "Successfully joined the ride!",
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('ridesTitle')}</h1>
        <div className="flex space-x-4">
          <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('offerRide')}
              </Button>
            </DialogTrigger>
            <OfferRideDialog 
              onSubmit={(data) => offerRideMutation.mutate(data)}
              isLoading={offerRideMutation.isPending}
            />
          </Dialog>

          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('requestRide')}
              </Button>
            </DialogTrigger>
            <RequestRideDialog 
              onSubmit={(data) => requestRideMutation.mutate(data)}
              isLoading={requestRideMutation.isPending}
            />
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">{t('availableRides')}</TabsTrigger>
          <TabsTrigger value="requests">{t('rideRequests')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride: Ride & { driver: any }) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onJoin={() => joinRideMutation.mutate(ride.id)}
                isJoining={joinRideMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request: RideRequest & { requester: any }) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RideCard({ ride, onJoin, isJoining }: { ride: Ride & { driver: any }, onJoin: () => void, isJoining: boolean }) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Car className="h-5 w-5 mr-2" />
          {ride.driver.username}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 mr-1" />
          {ride.departure} → {ride.destination}
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          {ride.departureTime}
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-1" />
          {ride.availableSeats}/{ride.totalSeats} {t('seats')}
        </div>
        
        {ride.notes && (
          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="h-4 w-4 mr-1 mt-0.5" />
            <span className="text-xs">{ride.notes}</span>
          </div>
        )}
        
        <Button 
          onClick={onJoin} 
          disabled={isJoining || ride.availableSeats === 0}
          className="w-full"
          size="sm"
        >
          {ride.availableSeats === 0 ? "Full" : t('joinRide')}
        </Button>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request }: { request: RideRequest & { requester: any } }) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{request.requester.username}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 mr-1" />
          {request.departure} → {request.destination}
        </div>
        
        {request.preferredTime && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            {request.preferredTime}
          </div>
        )}
        
        {request.notes && (
          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="h-4 w-4 mr-1 mt-0.5" />
            <span className="text-xs">{request.notes}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Status: {request.status}
        </div>
      </CardContent>
    </Card>
  );
}

function OfferRideDialog({ onSubmit, isLoading }: { onSubmit: (data: InsertRide) => void, isLoading: boolean }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    departure: '',
    destination: '',
    departureTime: '',
    totalSeats: 4,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      availableSeats: formData.totalSeats,
      driverId: 0, // This will be set by the backend
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('offerRide')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="departure">{t('departure')}</Label>
          <Input
            id="departure"
            value={formData.departure}
            onChange={(e) => setFormData(prev => ({ ...prev, departure: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="destination">{t('destination')}</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="departureTime">{t('time')}</Label>
          <Input
            id="departureTime"
            value={formData.departureTime}
            onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
            placeholder="e.g., 9:00 AM"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="totalSeats">{t('seats')}</Label>
          <Input
            id="totalSeats"
            type="number"
            min="1"
            max="8"
            value={formData.totalSeats}
            onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: parseInt(e.target.value) }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="notes">{t('notes')}</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional information..."
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('loading') : t('offerRide')}
        </Button>
      </form>
    </DialogContent>
  );
}

function RequestRideDialog({ onSubmit, isLoading }: { onSubmit: (data: InsertRideRequest) => void, isLoading: boolean }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    departure: '',
    destination: '',
    preferredTime: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      requesterId: 0, // This will be set by the backend
      rideId: null,
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('requestRide')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="departure">{t('departure')}</Label>
          <Input
            id="departure"
            value={formData.departure}
            onChange={(e) => setFormData(prev => ({ ...prev, departure: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="destination">{t('destination')}</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="preferredTime">{t('time')}</Label>
          <Input
            id="preferredTime"
            value={formData.preferredTime}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
            placeholder="e.g., 9:00 AM"
          />
        </div>
        
        <div>
          <Label htmlFor="notes">{t('notes')}</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional information..."
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('loading') : t('requestRide')}
        </Button>
      </form>
    </DialogContent>
  );
}