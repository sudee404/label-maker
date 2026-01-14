# ShipHub – Bulk Shipping Label Creation Platform

Modern **bulk shipping label creation** web application built for e-commerce merchants and fulfillment teams.

Complete multi-step wizard that allows users to:

- Upload orders via CSV (special multi-row header format)
- Review, edit and fix shipment data
- Apply saved addresses & package presets in bulk
- Select shipping services with simulated rates
- Finalize purchase and generate downloadable labels


## 🚀 Live Demo & Quick Access

**Live Application:**  
https://frontend-8c1r.onrender.com  
*(Free Render tier → first load may take 30–90 seconds due to cold start. Open the backend first if needed: https://backend-pvym.onrender.com)*

### Demo Credentials (already set up)

Use these to log in instantly and explore the full bulk shipping workflow:

- **Email:** `demo@shiphub.com`  
- **Password:** `ChangeMe123!`  

(Or just click on login button as the values are default)

**Quick tip for reviewers:**  
1. Click the live link above  
2. Wait for it to wake up (first load is slowest)  
3. Log in with the credentials above  
4. Jump straight into the "Upload Spreadsheet" flow from the sidebar

No registration needed — enjoy the demo! 🎉


> **Important:** On first visit, **open the backend URL first** to wake it up, then refresh the frontend.

## ✨ Implemented Features (according to PRD)

- Drag & drop CSV upload + file validation
- Smart parsing of Template.csv (2-row header format)
- Full review & edit step with inline + modal editing
- Bulk actions: change sender address / package preset / delete selected
- Pre-populated **saved addresses** and **package presets**
- Simulated shipping rates (Priority Mail / Ground) with running total
- Final purchase flow with label size selection (Letter/A4 or 4x6)
- PDF label generation & download (simulated)
- Responsive design (desktop-first, mobile usable)
- Clean sidebar navigation (only Upload Spreadsheet flow fully implemented)
- Helpful error states & user feedback
- Basic user authentication (login/register – demo credentials)

## 🏗 Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | Next.js 14+ (App Router) • TypeScript           |
| Styling            | Tailwind CSS • shadcn/ui                        |
| Form & Validation  | React Hook Form + Zod                           |
| State Management   | React Context + local state (no Redux)          |
| Icons              | Lucide React                                    |
| Backend            | Django 5 • Django REST Framework                |
| Database           | SQLite (assessment)                             |
| Deployment         | Render (separate static frontend + backend)     |
| Local Dev          | Docker Compose + hot reload                     |
| PDF Generation     | pdf-lib (client-side)                           |

## 🚀 Quick Start (Local Development)

### Recommended – Docker Compose

```bash
git clone https://github.com/sudee404/label-maker.git
cd label-maker

# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start (will build everything)
docker compose up --build
```

Open:  
http://localhost:3000 → Frontend  
http://localhost:8000 → Backend API docs (optional)

### Manual (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
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

## 📂 Project Structure (simplified)

```
label-maker/
├── backend/                  # Django REST API
│   ├── config/
│   ├── shipments/
│   ├── media/
│   └── requirements.txt
├── frontend/                 # Next.js 14+ application
│   ├── app/                  # routes & pages
│   ├── components/           # shadcn/ui + custom
│   ├── lib/                  # utils, schemas
│   ├── hooks/
│   └── public/
├── compose.yml
└── README.md
```

## 🛡️ What was intentionally simplified / omitted (assessment constraints)

- No real carrier API integration (Shippo/EasyPost/etc.)
- No persistent user-specific saved addresses/packages (in-memory + demo data)
- No order history / reprint flow
- No advanced address validation (USPS/UPS style)
- SQLite instead of PostgreSQL
- No comprehensive unit/integration test suite (only basic backend tests)

## 🎯 Assessment Coverage – PRD Checklist

```text
✓ Step 1: Upload Spreadsheet (drag & drop + template link)
✓ Step 2: Review & Edit (table, modals, bulk actions, search)
✓ Saved Addresses & Saved Packages (pre-populated)
✓ Step 3: Select Shipping Provider (simulated rates + bulk change)
✓ Purchase flow (label size + confirmation)
✓ Delete & navigation warnings
✓ Running total price
✓ PDF label download (simulated)
✓ Clean UI/UX with shadcn/ui & Tailwind
✓ Responsive layout
✓ Proper CSV parsing with error handling
```

## 🧪 Testing

Backend tests:

```bash
cd backend
python manage.py test
```

Frontend: mostly manual testing + React Hook Form + Zod validation

## ⚡ Deployment Notes (Render)

- Two separate free-tier services → cold starts are noticeable
- Recommendation: Wake backend first, then frontend
- Static assets are well optimized
- No CDN or caching layer (free tier limitation)

## 🔮 Future / Nice-to-have ideas

- Real carrier integration (Shippo / EasyPost)
- Address verification (USPS / SmartyStreets)
- Batch label PDF merging
- Webhook / order import from Shopify/WooCommerce
- Multi-user organizations
- Rate shopping & insurance options

## 📄 License

[MIT License](./LICENSE)

---
