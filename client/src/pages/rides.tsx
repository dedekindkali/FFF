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

  const joinRequestMutation = useMutation({
    mutationFn: ({ rideId, message }: { rideId: number; message: string }) => 
      apiRequest('POST', `/api/rides/${rideId}/request-join`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: "Success",
        description: "Join request sent successfully!",
      });
    },
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ['/api/rides/join-requests'],
  });

  const joinRequests = (joinRequestsData as any)?.requests || [];

  const respondToJoinRequestMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: string }) => 
      apiRequest('POST', `/api/rides/join-requests/${requestId}/respond`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: "Success",
        description: "Response sent successfully!",
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">{t('availableRides')}</TabsTrigger>
          <TabsTrigger value="requests">{t('rideRequests')}</TabsTrigger>
          <TabsTrigger value="join-requests">Join Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride: Ride & { driver: any }) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onRequestJoin={(message) => joinRequestMutation.mutate({ rideId: ride.id, message })}
                isRequestingJoin={joinRequestMutation.isPending}
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

        <TabsContent value="join-requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {joinRequests.map((request: any) => (
              <JoinRequestCard 
                key={request.id} 
                request={request} 
                onRespond={(status) => respondToJoinRequestMutation.mutate({ requestId: request.id, status })}
                isResponding={respondToJoinRequestMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RideCard({ ride, onRequestJoin, isRequestingJoin }: { ride: Ride & { driver: any }, onRequestJoin: (message: string) => void, isRequestingJoin: boolean }) {
  const { t } = useLanguage();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  const handleRequestJoin = () => {
    if (ride.tripType === 'arrival') {
      setShowJoinDialog(true);
    } else {
      onRequestJoin(joinMessage);
    }
  };

  const handleConfirmJoin = () => {
    onRequestJoin(joinMessage);
    setShowJoinDialog(false);
    setJoinMessage("");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              {ride.driver.username}
            </div>
            <div className="flex items-center space-x-2">
              {ride.tripType === 'arrival' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Arrival</span>
              )}
              {ride.tripType === 'departure' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Departure</span>
              )}
            </div>
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
            onClick={handleRequestJoin} 
            disabled={isRequestingJoin || ride.availableSeats === 0}
            className="w-full"
            size="sm"
          >
            {ride.availableSeats === 0 ? "Full" : "Request to Join"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join Ride</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Trip:</strong> {ride.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
              <p><strong>Route:</strong> {ride.departure} → Massello</p>
              <p><strong>Time:</strong> {ride.departureTime}</p>
              <p><strong>Driver:</strong> {ride.driver.username}</p>
            </div>
            
            <div>
              <Label htmlFor="join-message">Message (optional)</Label>
              <Textarea
                id="join-message"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Let the driver know anything relevant..."
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)} className="w-full">
                Cancel
              </Button>
              <Button onClick={handleConfirmJoin} disabled={isRequestingJoin} className="w-full">
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

function JoinRequestCard({ request, onRespond, isResponding }: { 
  request: any, 
  onRespond: (status: string) => void, 
  isResponding: boolean 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <div className="flex items-center justify-between">
            <span>{request.requester.username}</span>
            <span className="text-sm text-gray-500">wants to join</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Ride:</strong> {request.ride.departure} → {request.ride.destination}</p>
          <p><strong>Time:</strong> {request.ride.departureTime}</p>
          <p><strong>Trip Type:</strong> {request.ride.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
        </div>
        
        {request.message && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">{request.message}</p>
          </div>
        )}
        
        {request.status === 'pending' && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => onRespond('accepted')} 
              disabled={isResponding}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              Accept
            </Button>
            <Button 
              onClick={() => onRespond('declined')} 
              disabled={isResponding}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Decline
            </Button>
          </div>
        )}
        
        {request.status !== 'pending' && (
          <div className="text-center text-sm font-medium">
            <span className={`px-2 py-1 rounded ${
              request.status === 'accepted' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OfferRideDialog({ onSubmit, isLoading }: { onSubmit: (data: InsertRide) => void, isLoading: boolean }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    tripType: 'departure' as 'arrival' | 'departure',
    departure: '',
    destination: 'Massello',
    departureTime: '',
    totalSeats: 4,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rideData = {
      ...formData,
      availableSeats: formData.totalSeats,
      driverId: 0, // This will be set by the backend
    };
    
    // Adjust departure/destination based on trip type
    if (formData.tripType === 'arrival') {
      rideData.destination = 'Massello';
    } else {
      rideData.departure = 'Massello';
    }
    
    onSubmit(rideData);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('offerRide')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Trip Type</Label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="tripType"
                value="departure"
                checked={formData.tripType === 'departure'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tripType: e.target.value as 'departure',
                  departure: e.target.value === 'departure' ? 'Massello' : '',
                  destination: e.target.value === 'departure' ? '' : 'Massello'
                }))}
                className="mr-2"
              />
              Departure from Massello
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tripType"
                value="arrival"
                checked={formData.tripType === 'arrival'}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tripType: e.target.value as 'arrival',
                  departure: e.target.value === 'arrival' ? '' : 'Massello',
                  destination: e.target.value === 'arrival' ? 'Massello' : ''
                }))}
                className="mr-2"
              />
              Arrival to Massello
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="location">
            {formData.tripType === 'departure' ? 'Destination' : 'Departure Location'}
          </Label>
          <Input
            id="location"
            value={formData.tripType === 'departure' ? formData.destination : formData.departure}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              [formData.tripType === 'departure' ? 'destination' : 'departure']: e.target.value 
            }))}
            placeholder={formData.tripType === 'departure' ? 'Where to?' : 'Where from?'}
            required
          />
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Route:</strong> {formData.tripType === 'departure' ? `Massello → ${formData.destination || '[Destination]'}` : `${formData.departure || '[Origin]'} → Massello`}</p>
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