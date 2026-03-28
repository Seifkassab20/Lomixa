# 🚀 LOMIXA - Premium Medical & Pharma Connectivity Portal

<div align="center">
  <img src="/logo.png" alt="Lomixa Logo" width="120" height="120" style="border-radius: 50%" />
</div>

**LOMIXA** is a pioneering, enterprise-grade healthcare platform established to bridge the professional gap between Pharmaceutical Innovators and Medical Healthcare Providers. By decentralizing and organizing representatives' interactions with doctors, LOMIXA drastically enhances clinical workflow harmony through intelligent scheduling, credit-based booking architectures, and encrypted real-time communications.

---

## 🗺️ High-Level System Architecture & Flow

The following diagram illustrates the complete operational lifecycle inside the LOMIXA ecosystem—from initial verification to successful visit completion and the subsequent quality/feedback loop.

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
    
    %% Post-Visit & Quality Loop
    Rep & Doctor -- Executes Meeting --> Visit
    Visit -- Completed --> Reports([Post-Visit Reports])
    Reports -- Triggers --> Rating([Rating & Peer Review])
    Rating -- High Performance --> TopRep[Top Rep Badge]
    Rating -- Feedback --> Outcome[(Feedback Data)]
    
    %% Notification Layer
    Visit & Rating -- Event --> Notify([Notification Hub])
    Notify -- Real-time Alerts --> Rep & Doctor & Pharma

    %% Analytics
    Visit -- Data Point --> Analytics[(Analytics & TPA Monitoring)]
    Pharma -. Monitors Performance .-> Analytics
    Hospital -. Monitors Engagement .-> Analytics

    classDef admin fill:#f97316,stroke:#c2410c,color:#fff,font-weight:bold;
    classDef pharma fill:#3b82f6,stroke:#1d4ed8,color:#fff,font-weight:bold;
    classDef rep fill:#0ea5e9,stroke:#0369a1,color:#fff,font-weight:bold;
    classDef hospital fill:#10b981,stroke:#047857,color:#fff,font-weight:bold;
    classDef doc fill:#14b8a6,stroke:#0f766e,color:#fff,font-weight:bold;
    classDef action fill:#8b5cf6,stroke:#6d28d9,color:#fff;
    classDef feedback fill:#ec4899,stroke:#be185d,color:#fff;
    classDef db fill:#64748b,stroke:#475569,color:#fff;

    class Admin admin;
    class Pharma pharma;
    class Hospital hospital;
    class Rep rep;
    class Doctor doc;
    class Visit,Slots action;
    class Reports,Rating,Notify feedback;
    class Credits,Analytics,Outcome db;
```

---

## 🌟 Core Features & Modules

### 👑 LOMIXA Admin Desk
- **Grid Security**: Manually review, vet, and verify newly registered Hospitals and Pharma companies before allowing them onto the network.
- **Financial Audit**: Consolidated "Income History" and auditing for global bundle purchases.
- **Ecosystem Oversight**: Control global platform metrics and resolve active entity queries.

### 🏢 Pharma Control Center
- **Balance Synchronization**: Robust, bidirectional data persistence between local state and cloud datasets for Visit Fund management.
- **Subordinate Management**: Create, edit, and organize field Sales Representatives with individual balance allocation.
- **Advanced TPA Analytics**: Monitor Targets vs. Performance (TPA) with real-time completion statistics.

### 🏥 Hospital & Clinic Portal
- **Facility Branding**: Dedicated paths for "Hospital" vs "Clinic" identity with immutable role designations to ensure organizational integrity.
- **Clinical Roster Setup**: Independently rapidly onboard staff Doctors as 'Pre-Verified' network participants.
- **Engagement Surveillance**: Track clinical staff interaction metrics via comprehensive analytics endpoints.

### 🩺 Doctor Hub
- **Availability Matrix**: Fine-tune daily/weekly booking slots precisely defining audience windows.
- **Direct Connectivity**: Accept or decline inbound visits; engage via In-Person routing, Video Tele-conferencing, or Phone.
- **Peer Accountability**: Rate representative professional conduct and provide structured clinical feedback.

### 💼 Field Representative (Rep) Dashboard
- **Optimized Visit Booking**: Search doctors/hospitals via professional select-based interface with automatic credit refunding on rejection.
- **Post-Visit Reporting**: Structured outcome forms to document interaction summaries and follow-up requirements.
- **Target Tracking**: Real-time progress monitoring against monthly performance benchmarks.

### 🔔 Notification Hub
- **Real-time Alerts**: Global notification system for booking requests, status updates, and peer reviews.
- **Transactional Communication**: Integrated automation for critical account and visit events.

---

## 🛠️ Technology Stack

- **Frontend Application**: React (via Vite compiler)
- **Styling Architecture**: Tailwind CSS v4 & Framer Motion (for highly fluid interactions)
- **Authentication & Backend**: Supabase (PostgreSQL handling RLS, Auth flows, and real-time triggers)
- **Email Notifications**: Resend API (Automated transactional emails for system-wide alerts)
- **Internationalization (i18n)**: `i18next` (Seamless multi-lingual Arabic/English real-time LTR/RTL transitioning)
- **Resilient Data State**: Hardened Hybrid-Local Persistence algorithm that gracefully merges memory-mapped states with live Supabase datasets.
- **Virtual Meetings**: Integrated WebRTC Jitsi components for immediate Video calls.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Active Supabase Project configuration
- Resend API key (optional for local dev)

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
   VITE_RESEND_API_KEY=your-resend-key
   ```

3. **Database Initialization**:
   Run the provided `supabase_schema.sql` script within your Supabase SQL Editor to rapidly deploy the tables, constraints, and Row Level Security (RLS) policies.

4. **Launch Application**:
   ```bash
   npm run dev
   ```

---

## 🧪 Security & Quality Verification

- [x] **Role Access Isolation**: A 'Doctor' strictly cannot navigate or fetch endpoints belonging to a 'Pharma'.
- [x] **Authentication Constraints**: Enforced "one email per role" uniqueness across the global network.
- [x] **Row Level Security (RLS)**: Data mutations are restricted purely to authorized hierarchy paths.
- [x] **State Cohesion**: Prevention of overwrite collisions when merging local storage with cloud states.
- [x] **Bilingual Completeness**: Interface transitions cleanly between English and Arabic including layout direction and iconography.
