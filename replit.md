# Overview

This is a full-stack event management application for FroForForno, designed for a three-day conference (August 28-30, 2024). The application enables attendees to register their attendance for various meal periods and overnight stays across the conference days, manage dietary preferences, handle transportation coordination, and includes administrative features for event organizers.

The system features a modern React frontend with shadcn/ui components and a Node.js/Express backend, using PostgreSQL with Drizzle ORM for data persistence. The application supports both regular attendees and administrators, with role-based access control for management features.

## Recent Updates (August 2025)
- **Design System Overhaul**: Implemented striking black and flashing pink color palette with proper typography hierarchy
- **Typography Enhancement**: Hours font for main titles/account names, Montserrat Light for regular text, Montserrat Medium for secondary titles
- **Delete Functionality**: Added ability to delete both ride offers and ride requests with proper authorization
- **Participants List Fix**: Resolved display issues with participants list showing properly
- **Italian Localization**: Extended Italian translations to include attendance details and new UI features
- **Scrollable UI**: Made panels and pop-ups scrollable when content exceeds screen size
- **Interactive Ride System**: Enhanced ride coordination with notifications and modification capabilities
- **Separate Admin System**: Implemented completely independent admin authentication and interface
- **Admin User Management**: Fixed admin user deletion with comprehensive foreign key handling
- **Streamlined Admin Access**: Admin login now requires only password, goes directly to admin panel
- **Simplified Signup**: Removed email field from signup form for streamlined user registration
- **Typography System**: Implemented Hours font for page titles and usernames, Montserrat for other text elements
- **UI Refinements**: Removed main title from header, cleaned up navigation menu, removed text from ride action buttons
- **Dashboard Redesign**: Updated detail panels with pink-black gradient styling and proper font hierarchy
- **Authentication UX**: Removed main title, formatted subtitle on two lines for better visual impact

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for theming
- **State Management**: TanStack React Query for server state management
- **Client-side Routing**: Single-page application with programmatic navigation
- **Theme Support**: Dark/light mode toggle with system preference detection

The frontend follows a component-based architecture with reusable UI components and page-level components for different views (Dashboard, Attendance, Participants, Admin). The application uses a custom query client wrapper for API communication with built-in error handling and authentication flow.

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured endpoint organization
- **Session Management**: Express sessions for user authentication
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development Tools**: Hot reloading with Vite integration in development mode

The backend implements a clean separation of concerns with dedicated modules for database operations (storage layer), route handling, and database configuration. The API supports authentication, attendance management, user management, and administrative functions.

## Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for schema migrations and management
- **Schema Design**: Relational design with users and attendance records tables

The database schema includes a users table for basic user information and role management, and an attendance_records table tracking detailed attendance for each day's meals and overnight stays, plus dietary preferences and transportation details.

## Authentication and Authorization
- **Session-based Authentication**: Server-side sessions with Express
- **User Creation**: Automatic user creation on first login with username
- **Role-based Access**: Admin flag in user records for administrative features
- **Session Persistence**: Session data stored server-side with secure configuration
- **Protected Routes**: Middleware-based protection for authenticated endpoints

The authentication system uses a simple username-based login with automatic account creation, making it easy for attendees to access the system while maintaining security through server-side session management.

## Ride Coordination System
- **Comprehensive Tab Structure**: Available Rides, Ride Requests, Join Requests (for drivers), My Requests (for passengers)
- **Real-time Updates**: Join request notifications for both drivers and passengers
- **Interactive Matching**: Direct ride offering from ride requests with automated route matching
- **Status Tracking**: Complete visibility of join request status with response timestamps
- **User Experience**: Seamless flow from attendance form to dashboard with improved navigation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Connection Pooling**: Neon's connection pooling for efficient database resource management

## UI and Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library providing consistent iconography
- **shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling

## Development and Build Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Additional Libraries
- **TanStack React Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation support
- **Zod**: Runtime type validation and schema validation
- **date-fns**: Date manipulation and formatting utilities
- **clsx/class-variance-authority**: Utility libraries for conditional styling