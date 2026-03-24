# 🚀 LOMIXA - Premium Medical & Pharma Connectivity Portal

<div align="center">
  <img src="/logo.png" alt="Lomixa Logo" width="120" height="120" style="border-radius: 50%" />
</div>

**LOMIXA** is a pioneering, enterprise-grade healthcare platform established to bridge the professional gap between Pharmaceutical Innovators and Medical Healthcare Providers. By decentralizing and organizing representatives' interactions with doctors, LOMIXA drastically enhances clinical workflow harmony through intelligent scheduling, credit-based booking architectures, and encrypted real-time communications.

---

## 🗺️ High-Level System Architecture & Flow

The following diagram illustrates the complete operational lifecycle inside the LOMIXA ecosystem—from initial verification to successful visit completion.

```mermaid
flowchart TD
    %% Core Entities
    Admin([LOMIXA Admin])
    Pharma[Pharma Company]
    Hospital[Hospital/Clinic]
    Rep((Sales Rep))
    Doctor((Doctor))
    
    %% Admin Verification Flow
    Pharma -- Registers --> Admin
    Hospital -- Registers --> Admin
    Admin -- Verifies & Activates --> Pharma
    Admin -- Verifies & Activates --> Hospital

    %% Pharma Internal Flow
    Pharma -- Purchases Bundles --> Credits[(Visit Credits)]
    Pharma -- Creates & Manages --> Rep
    Credits -- Allocates to --> Rep

    %% Hospital Internal Flow
    Hospital -- Onboards & Manages --> Doctor
    
    %% Doctor Flow
    Doctor -- Defines --> Slots[Availability Slots]

    %% The Core Interaction: Booking a Visit
    Rep -- Uses Credits to Book --> Slots
    Slots -- Creates --> Visit{Pending Visit}
    Visit -- Notifies --> Doctor

    %% Visit Lifecycle
    Doctor -- Accepts/Rejects --> Visit
    Visit -- Status Updates --> Rep
    
    %% Post-Visit
    Rep & Doctor -- Executes Meeting --> Visit
    Visit -- Marked as Completed --> Analytics[(Analytics & Reports)]
    Pharma -. Monitors Performance .-> Analytics
    Hospital -. Monitors Engagement .-> Analytics

    classDef admin fill:#f97316,stroke:#c2410c,color:#fff,font-weight:bold;
    classDef pharma fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef rep fill:#0ea5e9,stroke:#0369a1,color:#fff,font-weight:bold;
    classDef hospital fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef doc fill:#14b8a6,stroke:#0f766e,color:#fff,font-weight:bold;
    classDef action fill:#8b5cf6,stroke:#6d28d9,color:#fff;
    classDef db fill:#64748b,stroke:#475569,color:#fff;

    class Admin admin;
    class Pharma pharma;
    class Hospital hospital;
    class Rep rep;
    class Doctor doc;
    class Visit,Slots action;
    class Credits,Analytics db;
```

---

## 🌟 Core Features & Modules

### 👑 LOMIXA Admin Desk
- **Grid Security**: Manually review, vet, and verify newly registered Hospitals and Pharma companies before allowing them onto the network.
- **Ecosystem Oversight**: Control global platform metrics, user densities, and resolve active bundle purchase queries.

### 🏢 Pharma Control Center
- **Subordinate Management**: Create, edit, and organize field Sales Representatives.
- **Credit Economics**: Purchase high-value Visit Bundles utilizing secure virtual transfers, then distribute these allocated credits to individual representatives dynamically.
- **Advanced Analytics**: Monitor rep targets, monthly completion statistics, and general field success pipelines.

### 🏥 Hospital & Clinic Portal
- **Clinical Roster Setup**: Independently rapidly onboard staff Doctors as 'Pre-Verified' network participants, skipping global-admin congestion.
- **Engagement Surveillance**: Track exactly how much time your clinical staff spends interacting with Pharma reps through comprehensive analytics endpoints.

### 🩺 Doctor Hub
- **Availability Matrix**: Fine-tune daily/weekly booking slots precisely defining when Representatives can request an audience.
- **Direct Connectivity**: Accept or decline inbound visits seamlessly; engage via In-Person routing, Video Tele-conferencing, or Phone.

### 💼 Field Representative (Rep) Dashboard
- **Visit Planner**: Search the global network for highly-rated Doctors or target specific Hospitals.
- **Credit-Authorized Booking**: Convert allocated pharma credits into direct, scheduled appointments into a Doctor's open slots.
- **Visit Tracking**: Keep live tabs on Pending, Confirmed, and Completed visits, complete with Post-Visit outcome summaries.

---

## 🛠️ Technology Stack

- **Frontend Application**: React (via Vite compiler)
- **Styling Architecture**: Tailwind CSS v4 & Framer Motion (for highly fluid interactions)
- **Authentication & Backend**: Supabase (PostgreSQL handling RLS, Auth flows, and real-time triggers)
- **Internationalization (i18n)**: `i18next` (Seamless multi-lingual Arabic/English real-time LTR/RTL transitioning)
- **Resilient Data State**: Hardened Hybrid-Local Persistence algorithm that gracefully merges memory-mapped states with live Supabase datasets.
- **Virtual Meetings**: Integrated WebRTC Jitsi components for immediate Video calls.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Active Supabase Project configuration

### Installation

1. **Clone & Install Dependencies**:
   ```bash
   git clone [repository-url]
   cd Lomixa
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file referencing your Supabase project keys:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Database Initialization**:
   Run the provided `supabase_schema.sql` script within your Supabase SQL Editor to rapidly deploy the tables, constraints, and Row Level Security (RLS) policies necessary to operate the multi-role environment.

4. **Launch Application**:
   ```bash
   npm run dev
   ```

---

## 🧪 Security & Quality Verification

Before utilizing LOMIXA in a live healthcare environment, confirm these critical conditions:

- [x] **Role Access Isolation**: A 'Doctor' strictly cannot navigate or fetch endpoints belonging to a 'Pharma'.
- [x] **Row Level Security (RLS)**: The Supabase schema properly asserts that data mutations are restricted purely to authorized hierarchy paths.
- [x] **State Cohesion**: The system successfully prevents overwrite collisions when merging local storage states with cloud states upon rapid rep re-allocations (Zero Credit-loss bugs).
- [x] **Bilingual Completeness**: The interface transitions cleanly between English and Arabic semantics including layout direction.
