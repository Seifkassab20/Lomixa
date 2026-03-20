# 🚀 LOMIXA - Premium Medical & Pharma Connectivity Portal

<div align="center">
  <img src="/logo.png" alt="Lomixa Logo" width="120" height="120" style="border-radius: 50%" />
</div>

LOMIXA is an enterprise-grade platform designed to seamlessly bridge the gap between pharmaceutical innovators and healthcare providers. With a focus on intelligent scheduling, encrypted data, and advanced analytics, LOMIXA empowers healthcare professionals to connect efficiently and securely.

---

## 🌟 Core Features

### 🏢 Pharma Dashboard

- **Subordinate Management**: Manage sales representatives and their performance.
- **Bundle Access**: Purchase and manage visit credits with tiered plans.
- **Analytics Suite**: Detailed insights into visit effectiveness and rep activities.

### 🏥 Hospital & Clinic Portal

- **Doctor Management**: Coordinate medical staff and their availability.
- **Efficiency Tracking**: Monitor visit density and clinical schedules.

### 🩺 Doctor Hub

- **Availability Control**: Fine-tune scheduling for sales visits.
- **Direct Connectivity**: Accept or decline visits from top-tier pharma reps.

### 💼 Sales Representative (Rep) Tools

- **Visit Planner**: Intelligent booking tools with real-time doctor availability.
- **Visit Tracking**: Manage pending, confirmed, and completed visits on-the-go.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 & Framer Motion
- **Backend**: Supabase (Auth & Realtime DB)
- **Internationalization**: i18next (Full Arabic/English RTL support)
- **State Management**: Optimized local persistence with Cloud Sync
- **Messaging**: Custom Real-time Toast Notification System

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Account

### Installation

1.  **Clone & Install**:

    ```bash
    git clone [repository-url]
    cd Lomixa
    npm install
    ```

2.  **Configure `.env`**:
    Create a `.env` file in the root directory:

    ```env
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

3.  **Run Development**:
    ```bash
    npm run dev
    ```

---

## 🧪 Testing Verification

Before publishing, ensure the following critical paths are verified:

- [ ] **Role Isolation**: Verify that a "Doctor" cannot access "Pharma" dashboards.
- [ ] **Auth Enforcement**: Ensure role mismatch errors prevent incorrect logins.
- [ ] **RTL/LTR Switch**: Check that Arabic (RTL) layout is perfect across all portals.
- [ ] **Realtime Sync**: Confirm that database changes reflect instantly across sessions.

---
