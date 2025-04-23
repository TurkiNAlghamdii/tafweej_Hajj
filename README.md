# Tafweej Hajj - Smart Crowd Management System

Tafweej is an innovative pilgrimage management system designed to optimize the Hajj experience by providing real-time crowd density information, smart route suggestions, and safety alerts.

## Features

### 1. Real-time Crowd Density Map
- Visual heat map showing crowd concentration at key Hajj locations
- Color-coded density indicators (low, medium, high, critical)
- Location-specific crowd details

### 2. Smart Route Planning
- Personalized route suggestions considering real-time crowd density
- Intelligent pathfinding that avoids congested areas
- Estimated travel times adjusted for crowd conditions
- Safety-first routing recommendations

### 3. Safety Alerts
- Real-time notifications for critical crowd situations
- Important announcements from authorities
- Weather alerts and health advisories

## Technical Implementation

### Crowd Density Calculation
The system uses a combination of simulated data (for prototype purposes) and could be extended to use:
- Cellular network density data
- WiFi connection counts
- Computer vision from surveillance cameras
- IoT sensor networks

### Route Optimization Algorithm
Routes are calculated using:
- Graph-based pathfinding between key locations
- Weighted edges based on current crowd density
- Speed adjustments according to congestion levels
- Safety parameters to avoid hazardous conditions

### Architecture
- Next.js frontend with React components
- Supabase database for data storage
- Server API endpoints for route calculations and crowd density

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/tafweej_Hajj.git
cd tafweej_Hajj
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
Create a `.env.local` file with the following:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## Future Enhancements
- Mobile app with offline functionality
- Multi-language support
- Integration with official Hajj services
- Personalized itinerary planning
- Group tracking features for families and tours
- AI-powered crowd prediction