import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, Plus, MapPin, Clock, Users, MessageSquare, Calendar, User, Edit, Bell, ChevronDown, Trash2 } from "lucide-react";
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
  const [editingRide, setEditingRide] = useState<any>(null);
  const [showModifyDialog, setShowModifyDialog] = useState(false);

  const { data: ridesData } = useQuery({
    queryKey: ['/api/rides'],
  });

  const { data: requestsData } = useQuery({
    queryKey: ['/api/ride-requests'],
  });

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const rides = (ridesData as any)?.rides || [];
  const requests = (requestsData as any)?.requests || [];
  const currentUser = (authData as any)?.user;

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

  const modifyRideMutation = useMutation({
    mutationFn: ({ rideId, updates }: { rideId: number; updates: Partial<InsertRide> }) => 
      apiRequest('PUT', `/api/rides/${rideId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      setShowModifyDialog(false);
      setEditingRide(null);
      toast({
        title: "Success",
        description: "Ride updated successfully! Passengers have been notified.",
      });
    },
  });

  const deleteRideMutation = useMutation({
    mutationFn: (rideId: number) => apiRequest('DELETE', `/api/rides/${rideId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      toast({
        title: "Success",
        description: "Ride deleted successfully!",
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest('DELETE', `/api/ride-requests/${requestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
      toast({
        title: "Success", 
        description: "Ride request deleted successfully!",
      });
    },
  });

  const joinRequestMutation = useMutation({
    mutationFn: ({ rideId, message }: { rideId: number; message: string }) => 
      apiRequest('POST', `/api/rides/${rideId}/request-join`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ride-join-status'] });
      toast({
        title: "Success",
        description: "Join request sent successfully!",
      });
    },
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ['/api/rides/join-requests'],
  });

  const { data: userJoinStatusData } = useQuery({
    queryKey: ['/api/ride-join-status'],
  });

  const joinRequests = (joinRequestsData as any)?.requests || [];
  const userJoinRequests = (userJoinStatusData as any)?.joinRequests || [];

  const respondToJoinRequestMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: string }) => 
      apiRequest('POST', `/api/rides/join-requests/${requestId}/respond`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ride-join-status'] });
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available">{t('availableRides')}</TabsTrigger>
          <TabsTrigger value="requests">{t('requestedRides')}</TabsTrigger>
          <TabsTrigger value="join-requests">{t('joinRequests')}</TabsTrigger>
          <TabsTrigger value="my-requests">{t('myRequests')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride: Ride & { driver: any }) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                onRequestJoin={(message) => joinRequestMutation.mutate({ rideId: ride.id, message })}
                isRequestingJoin={joinRequestMutation.isPending}
                currentUser={currentUser}
                onModifyRide={(ride) => {
                  setEditingRide(ride);
                  setShowModifyDialog(true);
                }}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request: RideRequest & { requester: any }) => (
              <RequestCard 
                key={request.id} 
                request={request}
                currentUser={currentUser}
                userRides={rides.filter((ride: any) => ride.driverId === currentUser?.id)}
                onOfferRide={async (requestId, selectedRideId) => {
                  // Send invitation to join specific ride
                  if (selectedRideId) {
                    try {
                      await apiRequest('POST', `/api/rides/${selectedRideId}/invite`, {
                        userId: request.requesterId,
                        message: `You've been invited to join this ride based on your request from ${request.departure} to ${request.destination}`
                      });
                      
                      // Update the request status to indicate an offer was made
                      await apiRequest('PUT', `/api/ride-requests/${requestId}`, {
                        status: 'offered'
                      });
                      
                      queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                      
                      toast({
                        title: "Success",
                        description: `Ride offer sent to ${request.requester.username}!`
                      });
                    } catch (error) {
                      console.error('Error sending ride offer:', error);
                      toast({
                        title: "Error",
                        description: "Failed to send ride offer. Please try again."
                      });
                    }
                  }
                }}
              />
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

        <TabsContent value="my-requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userJoinRequests.map((request: any) => (
              <UserJoinRequestCard 
                key={request.id} 
                request={request} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modify Ride Dialog */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="sm:max-w-[425px] scrollable-popup">
          <DialogHeader>
            <DialogTitle>{t('modifyRide')}</DialogTitle>
            <DialogDescription>
              Update your ride details and notify passengers
            </DialogDescription>
          </DialogHeader>
          {editingRide && (
            <ModifyRideDialog
              ride={editingRide}
              onSubmit={(updates) => {
                modifyRideMutation.mutate({
                  rideId: editingRide.id,
                  updates
                });
              }}
              isLoading={modifyRideMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModifyRideDialog({ ride, onSubmit, isLoading }: { 
  ride: any; 
  onSubmit: (updates: Partial<InsertRide>) => void; 
  isLoading: boolean 
}) {
  const { t } = useLanguage();
  const [departure, setDeparture] = useState(ride.departure);
  const [destination, setDestination] = useState(ride.destination);
  const [departureTime, setDepartureTime] = useState(ride.departureTime);
  const [totalSeats, setTotalSeats] = useState(ride.totalSeats);
  const [notes, setNotes] = useState(ride.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      departure,
      destination,
      departureTime,
      totalSeats: parseInt(totalSeats),
      availableSeats: parseInt(totalSeats) - (ride.totalSeats - ride.availableSeats),
      notes
    });
  };

  return (
    <div className="scrollable-popup">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="departure">{t('departure')}</Label>
        <Input
          id="departure"
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="destination">{t('destination')}</Label>
        <Input
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="departureTime">{t('departureTime')}</Label>
        <Input
          id="departureTime"
          type="time"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="totalSeats">{t('totalSeats')}</Label>
        <Input
          id="totalSeats"
          type="number"
          min="1"
          max="8"
          value={totalSeats}
          onChange={(e) => setTotalSeats(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('additionalNotes')}
        />
      </div>
      
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('loading') : t('save')}
        </Button>
      </form>
    </div>
  );
}

function RideCard({ ride, onRequestJoin, isRequestingJoin, currentUser, onModifyRide }: { 
  ride: Ride & { driver: any }, 
  onRequestJoin: (message: string) => void, 
  isRequestingJoin: boolean,
  currentUser?: any,
  onModifyRide?: (ride: any) => void
}) {
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

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {ride.eventDay === 'day1' ? 'Aug 28' : ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}
          </div>

          {(ride as any).passengers && (ride as any).passengers.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Passengers:</p>
              <div className="flex flex-wrap gap-1">
                {(ride as any).passengers.map((passenger: any) => (
                  <span 
                    key={passenger.id}
                    className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs"
                  >
                    {passenger.username}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {ride.notes && (
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
              <MessageSquare className="h-4 w-4 mr-1 mt-0.5" />
              <span className="text-xs">{ride.notes}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            {currentUser && ride.driver.id === currentUser.id && onModifyRide && (
              <Button
                variant="outline"
                onClick={() => onModifyRide(ride)}
                className="flex-1 text-ff-primary border-ff-primary hover:bg-ff-primary hover:text-white"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                {t('modifyRide')}
              </Button>
            )}
            {currentUser && ride.driver.id === currentUser.id && onModifyRide && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (window.confirm(t('deleteRideConfirm'))) {
                    try {
                      await apiRequest('DELETE', `/api/rides/${ride.id}`);
                      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
                    } catch (error) {
                      console.error('Error deleting ride:', error);
                    }
                  }
                }}
                className="flex-1"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('deleteRide')}
              </Button>
            )}
            {(!currentUser || ride.driver.id !== currentUser.id) && (
              <Button 
                onClick={handleRequestJoin} 
                disabled={isRequestingJoin || ride.availableSeats === 0}
                className="flex-1"
                size="sm"
              >
                {ride.availableSeats === 0 ? t('full') : t('requestToJoin')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('requestToJoin')}</DialogTitle>
            <DialogDescription>
              {t('sendJoinRequestDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Trip:</strong> {ride.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
              <p><strong>Route:</strong> {ride.departure} → Massello</p>
              <p><strong>Time:</strong> {ride.departureTime}</p>
              <p><strong>Driver:</strong> {ride.driver.username}</p>
            </div>
            
            <div>
              <Label htmlFor="join-message">{t('joinMessage')}</Label>
              <Textarea
                id="join-message"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder={t('joinMessagePlaceholder')}
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)} className="w-full">
                {t('cancel')}
              </Button>
              <Button onClick={handleConfirmJoin} disabled={isRequestingJoin} className="w-full">
                {t('sendRequest')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestCard({ request, currentUser, userRides, onOfferRide }: { 
  request: RideRequest & { requester: any },
  currentUser: any,
  userRides?: any[],
  onOfferRide?: (requestId: number, selectedRideId?: number) => void 
}) {
  const { t } = useLanguage();
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {request.requester.username}
            </div>
            <div className="flex items-center space-x-2">
              {request.tripType === 'arrival' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Arrival</span>
              )}
              {request.tripType === 'departure' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Departure</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-1" />
            {request.departure} → {request.destination}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {request.eventDay === 'day1' ? 'Aug 28' : request.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}
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
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Status: <span className={`font-medium ${
                request.status === 'accepted' ? 'text-green-600' : 
                request.status === 'declined' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>{request.status}</span>
            </div>
            
            <div className="flex space-x-2">
              {request.status === 'open' && onOfferRide && (
                <Button 
                  size="sm" 
                  onClick={() => setShowOfferDialog(true)}
                  className="flex-1"
                >
                  <Car className="h-4 w-4 mr-1" />
                  {t('offerRide')}
                </Button>
              )}
              {currentUser && request.requesterId === currentUser.id && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (window.confirm(t('deleteRequestConfirm'))) {
                      try {
                        await apiRequest('DELETE', `/api/ride-requests/${request.id}`);
                        queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
                      } catch (error) {
                        console.error('Error deleting request:', error);
                      }
                    }
                  }}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="sm:max-w-md scrollable-popup">
          <DialogHeader>
            <DialogTitle>Select Ride to Offer to {request.requester.username}</DialogTitle>
            <DialogDescription>
              Choose one of your existing rides that matches this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Requested Route:</strong> {request.departure} → {request.destination}</p>
              <p><strong>Trip Type:</strong> {request.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
              <p><strong>Day:</strong> {request.eventDay === 'day1' ? 'Aug 28' : request.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}</p>
              {request.preferredTime && <p><strong>Preferred Time:</strong> {request.preferredTime}</p>}
            </div>
            
            {userRides && userRides.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-secondary-title">{t('selectRide')}:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userRides.map((ride: any) => (
                    <div key={ride.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-secondary-title text-sm">{ride.departure} → {ride.destination}</p>
                          <p className="text-xs text-gray-500">{ride.departureTime} • {ride.availableSeats} seats available</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            onOfferRide!(request.id, ride.id);
                            setShowOfferDialog(false);
                          }}
                          className="ml-2"
                        >
                          {t('selectRide')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {t('noRidesAvailable')}
                </p>
                <Button 
                  onClick={() => {
                    setShowOfferDialog(false);
                    // Navigate to create ride
                  }}
                  className="w-full"
                >
                  {t('createNewRide')}
                </Button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowOfferDialog(false)} className="w-full">
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    eventDay: 'day1' as 'day1' | 'day2' | 'day3',
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
        <DialogDescription>
          {t('offerRideDescription')}
        </DialogDescription>
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
          <Label>Event Day</Label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day1"
                checked={formData.eventDay === 'day1'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day1' }))}
                className="mr-2"
              />
              Aug 28
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day2"
                checked={formData.eventDay === 'day2'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day2' }))}
                className="mr-2"
              />
              Aug 29
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day3"
                checked={formData.eventDay === 'day3'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day3' }))}
                className="mr-2"
              />
              Aug 30
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
    tripType: 'departure' as 'arrival' | 'departure',
    eventDay: 'day1' as 'day1' | 'day2' | 'day3',
    departure: '',
    destination: 'Massello',
    preferredTime: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requestData = {
      ...formData,
      requesterId: 0, // This will be set by the backend
      rideId: null,
    };
    
    // Adjust departure/destination based on trip type
    if (formData.tripType === 'arrival') {
      requestData.destination = 'Massello';
    } else {
      requestData.departure = 'Massello';
    }
    
    onSubmit(requestData);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('requestRide')}</DialogTitle>
        <DialogDescription>
          {t('requestRideDescription')}
        </DialogDescription>
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
          <Label>Event Day</Label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day1"
                checked={formData.eventDay === 'day1'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day1' }))}
                className="mr-2"
              />
              Aug 28
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day2"
                checked={formData.eventDay === 'day2'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day2' }))}
                className="mr-2"
              />
              Aug 29
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventDay"
                value="day3"
                checked={formData.eventDay === 'day3'}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDay: e.target.value as 'day3' }))}
                className="mr-2"
              />
              Aug 30
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

function UserJoinRequestCard({ request }: { request: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      default: return 'Pending';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <div className="flex items-center justify-between">
            <span>Request to Join</span>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Driver:</strong> {request.ride.driver.username}</p>
          <p><strong>Route:</strong> {request.ride.departure} → {request.ride.destination}</p>
          <p><strong>Time:</strong> {request.ride.departureTime}</p>
          <p><strong>Trip Type:</strong> {request.ride.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
          <p><strong>Day:</strong> {request.ride.eventDay === 'day1' ? 'Aug 28' : request.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}</p>
        </div>
        
        {request.message && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Your message:</strong> {request.message}
            </p>
          </div>
        )}
        
        {request.respondedAt && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Response received: {new Date(request.respondedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}