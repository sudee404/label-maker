**# ShipHub – Bulk Shipping Label Creation Platform**

Modern web application for e-commerce merchants and fulfillment teams to **bulk-create shipping labels** efficiently.

Multi-step wizard that allows uploading order data via CSV, reviewing/editing shipments, selecting shipping services, and generating labels.

https://label-maker-frontend.onrender.com  
*(Frontend – Next.js 14+ App Router)*  
Backend API: https://backend-pvym.onrender.com

(Currently using free Render tier – may be slow on first load due to cold starts. Ensure backend loads before frontend for it to work)

## ✨ Features

- Drag & drop CSV upload with validation
- Smart parsing of special multi-row header format (Template.csv)
- Review & edit mode with inline and modal editing
- Bulk actions (change sender address, change package preset, delete selected)
- Saved addresses & saved package presets (demo data included)
- Simulated shipping rate selection (Priority Mail / Ground)
- Running total price calculation
- Final purchase confirmation flow with label size selection
- Clean sidebar navigation (only Upload Spreadsheet flow implemented)
- Responsive design (mobile-friendly but optimized for desktop workflows)

## 🏗️ Tech Stack

| Layer          | Technology                                 |
|----------------|--------------------------------------------|
| Frontend       | Next.js (App Router) • TypeScript       |
| Styling        | Tailwind CSS + shadcn/ui                   |
| State Mgmt     | React Hook Form + Zod            |
| UI Components  | shadcn/ui, Lucide icons          |
| Backend        | Django 5 • Django REST Framework           |
| Database       | SQLite            |
| Deployment     | Render (separate frontend & backend services) |
| Containerization | Docker + docker-compose (local dev)      |

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (with corepack/pnpm)
- Python 3.13 (optional if using docker)

### Using Docker Compose (recommended)

```bash
# 1. Clone repository
git clone https://github.com/sudee404/label-maker.git
cd label-maker

# 2. Create .env files (examples provided in repo)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
```

### Alternative: Run without Docker

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

## 📂 Project Structure

```
label-maker/
├── backend/                    # Django REST API
│   ├── config/
│   ├── shipments/
│   ├── media/
│   └── requirements.txt
│
├── frontend/                   # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── public/
│
├── compose.yml
└── README.md
```

## 🎯 Current Status (Jan 2026)

Implemented almost complete **frontend workflow** according to the technical assessment PRD:

- All three main steps + purchase flow
- Bulk actions & saved presets
- Data validation & helpful error states
- Nice UX with shadcn/ui components
- Export corrected CSV

**Backend currently provides:**

- Basic CRUD endpoints for shipments
- File upload endpoint (optional – most logic lives in frontend for assessment)

## 🛠️ Deployment (Render)

Project is split into two Render services:

- **Frontend** – Next.js static + server components  
  https://frontend-8c1r.onrender.com

- **Backend** – Django + Gunicorn + SQLite  
  https://label-maker-backend.onrender.com

Both are on **free tier** → expect 30–90 second cold start delay

## 🔮 Planned / Nice-to-have (not implemented yet)

- Real carrier API integration (Shippo/EasyPost/Stamps.com)
- PDF label generation & download
- User authentication & multi-account support
- Order history & reprint functionality
- Advanced validation (address verification, zip code format)

## 📄 License

MIT

---

Made with ❤️ for the technical assessment process  
January 2026
