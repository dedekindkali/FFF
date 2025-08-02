export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    attendance: "Attendance",
    participants: "Participants",
    admin: "Admin",
    rides: "Rides",
    logout: "Logout",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    yes: "Yes",
    no: "No",
    
    // Login
    loginTitle: "FroForForno",
    loginSubtitle: "August 28-30, 2024 Conference",
    username: "Username",
    enterUsername: "Enter your username",
    login: "Login",
    
    // Dashboard
    welcomeBack: "Welcome back",
    eventDates: "August 28-30, 2024",
    attendanceSummary: "Attendance Summary",
    quickActions: "Quick Actions",
    updateAttendance: "Update Attendance",
    viewParticipants: "View Participants",
    rideCoordination: "Ride Coordination",
    
    // Attendance
    attendanceTracking: "Attendance Tracking",
    selectMealsActivities: "Select the meals and activities you plan to attend for each day:",
    day: "Day",
    august: "August",
    breakfast: "Breakfast",
    lunch: "Lunch", 
    dinner: "Dinner",
    night: "Night",
    dietaryPreferences: "Dietary Preferences",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    glutenFree: "Gluten Free",
    dairyFree: "Dairy Free",
    allergies: "Allergies",
    allergiesPlaceholder: "Please specify any allergies...",
    additionalNotes: "Additional Notes",
    notesPlaceholder: "Any additional information...",
    saveAttendance: "Save Attendance",
    
    // Rides
    ridesTitle: "Ride Coordination",
    offerRide: "Offer a Ride",
    requestRide: "Request a Ride",
    availableRides: "Available Rides",
    rideRequests: "Ride Requests",
    departure: "Departure",
    destination: "Destination",
    time: "Time",
    seats: "Seats",
    driver: "Driver",
    contact: "Contact",
    notes: "Notes",
    joinRide: "Join Ride",
    
    // Participants
    participantsList: "Participants List",
    totalParticipants: "Total Participants",
    search: "Search",
    searchParticipants: "Search participants...",
    
    // Admin
    adminPanel: "Admin Panel",
    eventOverview: "Event Overview",
    totalRegistered: "Total Registered",
    attendanceStats: "Attendance Statistics",
    exportData: "Export Data",
  },
  
  it: {
    // Navigation
    dashboard: "Dashboard",
    attendance: "Partecipazione",
    participants: "Partecipanti",
    admin: "Admin",
    rides: "Passaggi",
    logout: "Esci",
    
    // Common
    save: "Salva",
    cancel: "Annulla",
    edit: "Modifica",
    delete: "Elimina",
    loading: "Caricamento...",
    yes: "Sì",
    no: "No",
    
    // Login
    loginTitle: "FroForForno",
    loginSubtitle: "Conferenza 28-30 Agosto 2024",
    username: "Nome utente",
    enterUsername: "Inserisci il tuo nome utente",
    login: "Accedi",
    
    // Dashboard
    welcomeBack: "Bentornato",
    eventDates: "28-30 Agosto 2024",
    attendanceSummary: "Riepilogo Partecipazione",
    quickActions: "Azioni Rapide",
    updateAttendance: "Aggiorna Partecipazione",
    viewParticipants: "Vedi Partecipanti",
    rideCoordination: "Coordinamento Passaggi",
    
    // Attendance
    attendanceTracking: "Tracciamento Partecipazione",
    selectMealsActivities: "Seleziona i pasti e le attività a cui prevedi di partecipare per ogni giorno:",
    day: "Giorno",
    august: "Agosto",
    breakfast: "Colazione",
    lunch: "Pranzo",
    dinner: "Cena",
    night: "Notte",
    dietaryPreferences: "Preferenze Alimentari",
    vegetarian: "Vegetariano",
    vegan: "Vegano",
    glutenFree: "Senza Glutine",
    dairyFree: "Senza Latticini",
    allergies: "Allergie",
    allergiesPlaceholder: "Specifica eventuali allergie...",
    additionalNotes: "Note Aggiuntive",
    notesPlaceholder: "Informazioni aggiuntive...",
    saveAttendance: "Salva Partecipazione",
    
    // Rides
    ridesTitle: "Coordinamento Passaggi",
    offerRide: "Offri un Passaggio",
    requestRide: "Richiedi un Passaggio",
    availableRides: "Passaggi Disponibili",
    rideRequests: "Richieste di Passaggio",
    departure: "Partenza",
    destination: "Destinazione",
    time: "Orario",
    seats: "Posti",
    driver: "Autista",
    contact: "Contatto",
    notes: "Note",
    joinRide: "Unisciti al Passaggio",
    
    // Participants
    participantsList: "Lista Partecipanti",
    totalParticipants: "Totale Partecipanti",
    search: "Cerca",
    searchParticipants: "Cerca partecipanti...",
    
    // Admin
    adminPanel: "Pannello Admin",
    eventOverview: "Panoramica Evento",
    totalRegistered: "Totale Registrati",
    attendanceStats: "Statistiche Partecipazione",
    exportData: "Esporta Dati",
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;