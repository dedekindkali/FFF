import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Plus, MapPin, Clock, Users, MessageSquare, Calendar, User, Edit, Bell, ChevronDown, Trash2, Search, X, Filter } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Ride, RideRequest, InsertRide, InsertRideRequest } from "@shared/schema";

export function Rides({ onNavigate }: { onNavigate?: (view: string, userId?: number) => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [editingRide, setEditingRide] = useState<any>(null);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [eventDayFilter, setEventDayFilter] = useState("all");
  const [rideTypeFilter, setRideTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

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
    mutationFn: async (rideData: InsertRide & { inviteUsers?: number[] }) => {
      // Step 1: Create the ride
      const response = await apiRequest('POST', '/api/rides', rideData);
      const responseData = await response.json();
      const createdRide = responseData.ride;
      
      // Step 2: Send invitations if users were selected
      if (rideData.inviteUsers && rideData.inviteUsers.length > 0) {
        const invitationPromises = rideData.inviteUsers.map(userId => 
          apiRequest('POST', `/api/rides/${createdRide.id}/invite`, {
            userId,
            message: `You've been invited to join this ${rideData.tripType} ride from ${rideData.departure} to ${rideData.destination} on ${rideData.eventDay === 'day1' ? 'Aug 28' : rideData.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'} at ${rideData.departureTime}.`
          })
        );
        
        try {
          await Promise.all(invitationPromises);
        } catch (inviteError) {
          console.warn('Some invitations failed to send:', inviteError);
          // Continue - ride was created successfully
        }
      }
      
      return { ride: createdRide, invitationsSent: rideData.inviteUsers?.length || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ride-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setShowOfferDialog(false);
      toast({
        title: "Success",
        description: result.invitationsSent > 0 
          ? `Ride created successfully! ${result.invitationsSent} invitation${result.invitationsSent > 1 ? 's' : ''} sent.`
          : "Ride offer created successfully!",
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

  const { data: rideInvitationsData } = useQuery({
    queryKey: ['/api/ride-invitations'],
  });

  const joinRequests = (joinRequestsData as any)?.requests || [];
  const userJoinRequests = (userJoinStatusData as any)?.joinRequests || [];
  const rideInvitations = (rideInvitationsData as any)?.invitations || [];

  // Filter functions
  const filterItems = (items: any[], type: 'rides' | 'requests' | 'joinRequests' | 'invitations') => {
    let filtered = items;
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      
      filtered = filtered.filter((item: any) => {
        switch (type) {
          case 'rides':
            return (
              item.departure?.toLowerCase().includes(lowerSearch) ||
              item.destination?.toLowerCase().includes(lowerSearch) ||
              item.driver?.username?.toLowerCase().includes(lowerSearch) ||
              item.notes?.toLowerCase().includes(lowerSearch) ||
              item.eventDay?.toLowerCase().includes(lowerSearch)
            );
          case 'requests':
            // Filter out fulfilled requests
            if (item.status === 'fulfilled') return false;
            return (
              item.departure?.toLowerCase().includes(lowerSearch) ||
              item.destination?.toLowerCase().includes(lowerSearch) ||
              item.requester?.username?.toLowerCase().includes(lowerSearch) ||
              item.notes?.toLowerCase().includes(lowerSearch) ||
              item.eventDay?.toLowerCase().includes(lowerSearch)
            );
          case 'joinRequests':
            return (
              item.ride?.departure?.toLowerCase().includes(lowerSearch) ||
              item.ride?.destination?.toLowerCase().includes(lowerSearch) ||
              item.requester?.username?.toLowerCase().includes(lowerSearch) ||
              item.message?.toLowerCase().includes(lowerSearch)
            );
          case 'invitations':
            return (
              item.ride?.departure?.toLowerCase().includes(lowerSearch) ||
              item.ride?.destination?.toLowerCase().includes(lowerSearch) ||
              item.inviter?.username?.toLowerCase().includes(lowerSearch)
            );
          default:
            return true;
        }
      });
    }
    
    // Apply event day filter
    if (eventDayFilter && eventDayFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        const eventDay = type === 'joinRequests' || type === 'invitations' 
          ? item.ride?.eventDay 
          : item.eventDay;
        return eventDay === eventDayFilter;
      });
    }
    
    // Apply ride type filter (for rides and requests)
    if (rideTypeFilter && rideTypeFilter !== 'all' && (type === 'rides' || type === 'requests')) {
      if (rideTypeFilter === 'offering') {
        filtered = type === 'rides' ? filtered : [];
      } else if (rideTypeFilter === 'requesting') {
        filtered = type === 'requests' ? filtered : [];
      }
    }
    
    // Filter out fulfilled requests from requests tab
    if (type === 'requests') {
      filtered = filtered.filter((item: any) => item.status !== 'fulfilled');
    }
    
    // Apply availability filter (for rides)
    if (availabilityFilter && availabilityFilter !== 'all' && type === 'rides') {
      if (availabilityFilter === 'available') {
        filtered = filtered.filter((item: any) => item.availableSeats > 0 && item.isActive);
      } else if (availabilityFilter === 'full') {
        filtered = filtered.filter((item: any) => item.availableSeats === 0 || !item.isActive);
      }
    }
    
    return filtered;
  };

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

  const respondToRideInvitationMutation = useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: number; status: string }) => 
      apiRequest('PUT', `/api/ride-invitations/${invitationId}/respond`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ride-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ride-join-status'] });
      toast({
        title: "Success",
        description: "Response sent successfully!",
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('ridesTitle')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('offerRide')}</span>
                <span className="sm:hidden">Offer</span>
              </Button>
            </DialogTrigger>
            <OfferRideDialog 
              onSubmit={(data) => offerRideMutation.mutate(data)}
              isLoading={offerRideMutation.isPending}
            />
          </Dialog>

          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('requestRide')}</span>
                <span className="sm:hidden">Request</span>
              </Button>
            </DialogTrigger>
            <RequestRideDialog 
              onSubmit={(data) => requestRideMutation.mutate(data)}
              isLoading={requestRideMutation.isPending}
            />
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchRides')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? "bg-ff-primary text-white" : ""} whitespace-nowrap`}
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('filters')}</span>
              </Button>
              {(searchTerm || (eventDayFilter && eventDayFilter !== 'all') || (rideTypeFilter && rideTypeFilter !== 'all') || (availabilityFilter && availabilityFilter !== 'all')) && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {t('filtersActive')}
                </div>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium">{t('eventDay')}</Label>
                <Select value={eventDayFilter} onValueChange={setEventDayFilter}>
                  <SelectTrigger className="text-xs md:text-sm">
                    <SelectValue placeholder={t('allDays')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allDays')}</SelectItem>
                    <SelectItem value="day1">{t('day1')}</SelectItem>
                    <SelectItem value="day2">{t('day2')}</SelectItem>
                    <SelectItem value="day3">{t('day3')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium">{t('rideType')}</Label>
                <Select value={rideTypeFilter} onValueChange={setRideTypeFilter}>
                  <SelectTrigger className="text-xs md:text-sm">
                    <SelectValue placeholder={t('allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="offering">{t('offeringRides')}</SelectItem>
                    <SelectItem value="requesting">{t('requestingRides')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs md:text-sm font-medium">{t('availability')}</Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="text-xs md:text-sm">
                    <SelectValue placeholder={t('allAvailability')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allAvailability')}</SelectItem>
                    <SelectItem value="available">{t('availableSeats')}</SelectItem>
                    <SelectItem value="full">{t('fullRides')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setEventDayFilter("all");
                    setRideTypeFilter("all");
                    setAvailabilityFilter("all");
                  }}
                  className="text-xs md:text-sm"
                >
                  {t('clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="available" className="relative text-xs md:text-sm p-2 md:p-3">
            <span className="block md:hidden">Available</span>
            <span className="hidden md:block">{t('availableRides')}</span>
            {(() => {
              const availableRides = rides.filter((ride: any) => ride.availableSeats > 0 && ride.isActive);
              return availableRides.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-ff-primary text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {availableRides.length}
                </div>
              );
            })()}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative text-xs md:text-sm p-2 md:p-3">
            <span className="block md:hidden">Requests</span>
            <span className="hidden md:block">{t('requestedRides')}</span>
            {(() => {
              const openRequests = requests.filter((req: any) => req.status === 'open' || (!req.status && req.status !== 'fulfilled'));
              return openRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-ff-primary text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {openRequests.length}
                </div>
              );
            })()}
          </TabsTrigger>
          <TabsTrigger value="join-requests" className="relative text-xs md:text-sm p-2 md:p-3 col-span-2 md:col-span-1">
            <span className="block md:hidden">Join Requests</span>
            <span className="hidden md:block">{t('joinRequests')}</span>
            {(() => {
              const pendingJoinRequests = joinRequests.filter((req: any) => req.status === 'pending');
              return pendingJoinRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-ff-primary text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {pendingJoinRequests.length}
                </div>
              );
            })()}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="relative text-xs md:text-sm p-2 md:p-3">
            <span className="block md:hidden">Invitations</span>
            <span className="hidden md:block">Ride Invitations</span>
            {rideInvitations.filter((inv: any) => inv.status === 'pending').length > 0 && (
              <div className="absolute -top-1 -right-1 bg-ff-primary text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                {rideInvitations.filter((inv: any) => inv.status === 'pending').length}
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="relative text-xs md:text-sm p-2 md:p-3">
            <span className="block md:hidden">My Requests</span>
            <span className="hidden md:block">{t('myRequests')}</span>
            {(() => {
              const pendingUserRequests = userJoinRequests.filter((req: any) => req.status === 'pending');
              return pendingUserRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-ff-primary text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {pendingUserRequests.length}
                </div>
              );
            })()}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(rides, 'rides').map((ride: Ride & { driver: any }) => (
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
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(requests, 'requests').map((request: RideRequest & { requester: any; offerer?: any }) => (
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
                        requestId: request.id, // Include the request ID
                        message: `You've been invited to join this ride based on your request from ${request.departure} to ${request.destination}`
                      });
                      
                      queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/ride-invitations'] });
                      
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
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="join-requests" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(joinRequests, 'joinRequests').map((request: any) => (
              <JoinRequestCard 
                key={request.id} 
                request={request} 
                onRespond={(status) => respondToJoinRequestMutation.mutate({ requestId: request.id, status })}
                isResponding={respondToJoinRequestMutation.isPending}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(rideInvitations, 'invitations').map((invitation: any) => (
              <RideInvitationCard 
                key={invitation.id} 
                invitation={invitation} 
                onRespond={(status) => respondToRideInvitationMutation.mutate({ invitationId: invitation.id, status })}
                isResponding={respondToRideInvitationMutation.isPending}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-3 md:space-y-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filterItems(userJoinRequests, 'joinRequests').map((request: any) => (
              <UserJoinRequestCard 
                key={request.id} 
                request={request} 
                onNavigate={onNavigate}
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
          step="60"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
          className="[&::-webkit-datetime-edit-ampm-field]:hidden"
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

function RideCard({ ride, onRequestJoin, isRequestingJoin, currentUser, onModifyRide, onNavigate }: { 
  ride: Ride & { driver: any }, 
  onRequestJoin: (message: string) => void, 
  isRequestingJoin: boolean,
  currentUser?: any,
  onModifyRide?: (ride: any) => void,
  onNavigate?: (view: string, userId?: number) => void
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
              <button 
                onClick={() => onNavigate?.('profile', ride.driver.id)}
                className="title-font text-ff-primary hover:text-ff-primary/80 transition-colors cursor-pointer"
              >
                {ride.driver.username}
              </button>
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
                className="text-ff-primary border-ff-primary hover:bg-ff-primary hover:text-white"
                size="sm"
              >
                <Edit className="h-4 w-4" />
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
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {(() => {
              // Don't show button if user is the driver
              if (currentUser && ride.driver.id === currentUser.id) return null;
              
              // Check if user is already a passenger
              const isAlreadyPassenger = (ride as any).passengers?.some((passenger: any) => passenger.id === currentUser?.id);
              if (isAlreadyPassenger) {
                return (
                  <Button disabled className="flex-1" size="sm">
                    Already in this ride
                  </Button>
                );
              }
              
              // Check if no seats available
              if (ride.availableSeats === 0) {
                return (
                  <Button disabled className="flex-1" size="sm">
                    {t('full')}
                  </Button>
                );
              }
              
              // Show join button
              return (
                <Button 
                  onClick={handleRequestJoin} 
                  disabled={isRequestingJoin}
                  className="flex-1"
                  size="sm"
                >
                  {isRequestingJoin ? t('requesting') : t('requestToJoin')}
                </Button>
              );
            })()}
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

function RequestCard({ request, currentUser, userRides, onOfferRide, onNavigate }: { 
  request: RideRequest & { requester: any; offerer?: any },
  currentUser: any,
  userRides?: any[],
  onOfferRide?: (requestId: number, selectedRideId?: number) => void,
  onNavigate?: (view: string, userId?: number) => void
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showCreateRideDialog, setShowCreateRideDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <button 
                onClick={() => onNavigate?.('profile', request.requester.id)}
                className="title-font text-ff-primary hover:text-ff-primary/80 transition-colors cursor-pointer"
              >
                {request.requester.username}
              </button>
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
                request.status === 'offered' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {request.status === 'offered' && request.offerer 
                  ? `offered by ${request.offerer.username}` 
                  : request.status}
              </span>
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
              {currentUser && request.requesterId === currentUser.id && request.status !== 'offered' && (
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
                <p className="text-sm font-secondary-title">Select Ride:</p>
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
                          Select Ride
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowOfferDialog(false);
                      setShowCreateRideDialog(true);
                    }}
                    className="w-full"
                  >
                    Create New Ride
                  </Button>
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
                    setShowCreateRideDialog(true);
                  }}
                  className="w-full"
                >
                  Create New Ride
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

      <Dialog open={showCreateRideDialog} onOpenChange={setShowCreateRideDialog}>
        <CreateRideForRequestDialog 
          request={request}
          onSubmit={async (rideData) => {
            let createdRide = null;
            
            try {
              // Step 1: Create the new ride
              console.log('Creating ride with data:', rideData);
              const response = await apiRequest('POST', '/api/rides', rideData);
              const responseData = await response.json();
              console.log('Full API response data:', responseData);
              createdRide = responseData.ride;
              console.log('Ride created successfully:', createdRide);
              
              if (!createdRide) {
                console.error('No ride found in response structure');
                throw new Error('Ride creation failed - no ride returned from API');
              }
              
              // Step 2: Send invitation to the requester
              try {
                console.log('Sending invitation to user:', request.requesterId);
                const inviteResponse = await apiRequest('POST', `/api/rides/${createdRide.id}/invite`, {
                  userId: request.requesterId,
                  requestId: request.id, // Include the request ID
                  message: `You've been invited to join this ride that matches your request from ${request.departure} to ${request.destination}`
                });
                console.log('Invitation sent successfully:', inviteResponse);
              } catch (inviteError) {
                console.warn('Failed to send invitation:', inviteError);
                // Continue - ride was created successfully
              }
              
              // Don't update request status yet - it should remain 'open' until someone actually joins
              // The request will be marked as 'fulfilled' only when an invitation is accepted and someone joins
              
              // Refresh all relevant data
              queryClient.invalidateQueries({ queryKey: ['/api/rides'] });
              queryClient.invalidateQueries({ queryKey: ['/api/ride-requests'] });
              queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
              queryClient.invalidateQueries({ queryKey: ['/api/ride-invitations'] });
              
              setShowCreateRideDialog(false);
              toast({
                title: "Success",
                description: `New ride created successfully! ${createdRide.departure} → ${createdRide.destination}`
              });
              
            } catch (error) {
              console.error('Error in ride creation process:', error);
              
              setShowCreateRideDialog(false);
              toast({
                title: "Error",
                description: "Failed to create ride. Please try again.",
                variant: "destructive"
              });
            }
          }}
          isLoading={false}
        />
      </Dialog>
    </>
  );
}

function CreateRideForRequestDialog({ request, onSubmit, isLoading }: { 
  request: any, 
  onSubmit: (data: InsertRide) => void, 
  isLoading: boolean 
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    tripType: request.tripType as 'arrival' | 'departure',
    eventDay: request.eventDay as 'day1' | 'day2' | 'day3',
    departure: request.departure || '',
    destination: request.destination || '',
    departureTime: request.preferredTime || '',
    totalSeats: 4,
    notes: `Created to match request from ${request.requester.username}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rideData = {
      ...formData,
      availableSeats: formData.totalSeats,
      driverId: 0, // This will be set by the backend
    };
    
    onSubmit(rideData);
  };

  return (
    <DialogContent className="sm:max-w-md scrollable-popup">
      <DialogHeader>
        <DialogTitle>Create Ride for {request.requester.username}</DialogTitle>
        <DialogDescription>
          Create a new ride that matches this user's request
        </DialogDescription>
      </DialogHeader>
      
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-secondary-title mb-2">Matching Request:</p>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Route:</strong> {request.departure} → {request.destination}</p>
          <p><strong>Type:</strong> {request.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
          <p><strong>Day:</strong> {request.eventDay === 'day1' ? 'Aug 28' : request.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}</p>
          {request.preferredTime && <p><strong>Preferred Time:</strong> {request.preferredTime}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="departureTime">{t('time')}</Label>
          <Input
            id="departureTime"
            type="time"
            value={formData.departureTime}
            onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
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
        
        <div className="flex space-x-2">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? t('loading') : 'Create & Invite'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function JoinRequestCard({ request, onRespond, isResponding, onNavigate }: { 
  request: any, 
  onRespond: (status: string) => void, 
  isResponding: boolean,
  onNavigate?: (view: string, userId?: number) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onNavigate?.('profile', request.requester.id)}
              className="title-font text-ff-primary hover:text-ff-primary/80 transition-colors cursor-pointer"
            >
              {request.requester.username}
            </button>
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

function OfferRideDialog({ onSubmit, isLoading }: { onSubmit: (data: InsertRide & { inviteUsers?: number[] }) => void, isLoading: boolean }) {
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch all users for invitation selection
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
  });
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  const currentUser = (authData as any)?.user;
  // Filter out the current user (driver) from the users list
  const users = ((usersData as any)?.users || []).filter((user: any) => user.id !== currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rideData = {
      ...formData,
      availableSeats: formData.totalSeats,
      driverId: 0, // This will be set by the backend
      inviteUsers: selectedUsers, // Include selected users for invitation
    };
    
    // Adjust departure/destination based on trip type
    if (formData.tripType === 'arrival') {
      rideData.destination = 'Massello';
    } else {
      rideData.departure = 'Massello';
    }
    
    onSubmit(rideData);
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
            type="time"
            step="60"
            value={formData.departureTime}
            onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
            required
            className="[&::-webkit-datetime-edit-ampm-field]:hidden"
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

        {/* User Invitation Section */}
        <div>
          <Label>Invite Users (Optional)</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Select users to send ride invitations to when creating this ride
          </p>
          <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user: any) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{user.username}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading users...</p>
            )}
          </div>
          {selectedUsers.length > 0 && (
            <p className="text-sm text-ff-primary mt-1">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected for invitation
            </p>
          )}
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
            type="time"
            step="60"
            value={formData.preferredTime}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
            className="[&::-webkit-datetime-edit-ampm-field]:hidden"
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

function UserJoinRequestCard({ request, onNavigate }: { request: any; onNavigate?: (view: string, userId?: number) => void }) {
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
          <p><strong>Driver:</strong> <button 
            onClick={() => onNavigate?.('profile', request.ride.driver.id)}
            className="title-font text-ff-primary hover:text-ff-primary/80 transition-colors cursor-pointer inline"
          >
            {request.ride.driver.username}
          </button></p>
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

function RideInvitationCard({ invitation, onRespond, isResponding, onNavigate }: { 
  invitation: any; 
  onRespond: (status: string) => void; 
  isResponding: boolean;
  onNavigate?: (view: string, userId?: number) => void;
}) {
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
            <div className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              <span>Ride Offer</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(invitation.status)}`}>
              {getStatusText(invitation.status)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Driver:</strong> <button 
            onClick={() => onNavigate?.('profile', invitation.ride.driver.id)}
            className="title-font text-ff-primary hover:text-ff-primary/80 transition-colors cursor-pointer inline"
          >
            {invitation.ride.driver.username}
          </button></p>
          <p><strong>Route:</strong> {invitation.ride.departure} → {invitation.ride.destination}</p>
          <p><strong>Time:</strong> {invitation.ride.departureTime}</p>
          <p><strong>Trip Type:</strong> {invitation.ride.tripType === 'arrival' ? 'Arrival' : 'Departure'}</p>
          <p><strong>Day:</strong> {invitation.ride.eventDay === 'day1' ? 'Aug 28' : invitation.ride.eventDay === 'day2' ? 'Aug 29' : 'Aug 30'}</p>
          <p><strong>Available Seats:</strong> {invitation.ride.availableSeats}/{invitation.ride.totalSeats}</p>
        </div>
        
        {invitation.ride.notes && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Driver's notes:</strong> {invitation.ride.notes}
            </p>
          </div>
        )}
        
        {invitation.status === 'pending' && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => onRespond('accepted')} 
              disabled={isResponding}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              Accept Offer
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
        
        {invitation.respondedAt && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Response sent: {new Date(invitation.respondedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}