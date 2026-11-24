# OSPAT — Open Source Psychedelic-Assisted Therapy
### Clinical Control Center for Facilitators & Therapists

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Interface Languages](https://img.shields.io/badge/Languages-EN%20%7C%20RU%20%7C%20BG-informational.svg)](#multilingual-support)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20Storage-success.svg)](#privacy--data-security)

**OSPAT (Open Source Psychedelic-Assisted Therapy)** is a private, offline-first clinical workstation built for facilitators, therapists, and guides conducting evidence-based psilocybin-assisted therapy sessions.

It streamlines the complete therapeutic journey across **Preparation**, **Session Day Navigation**, and **Integration**, providing live chronometry, emergency crisis protocols, psychometric evaluation, and direct client material dispatching via Telegram.

---

## 🌟 Key Features

- **3-Phase Structured Workflow:**
  - **Preparation (Weeks -2 to 0):** Psychiatric/medical exclusion checks, intention setting, unpriming rigid expectations, and touch consent protocol.
  - **Session Day (0 to 6+ Hours):** Non-directive space holding, musical trajectory tracking, somatic discharge logging, and emergency grounding scripts.
  - **Integration (Days 1 to 28):** 30-day decision moratorium, somatic restoration, meaning translation, and actionable behavioral anchors.
- **Real-Time Session Event Logger:** Record dosage administration, vitals, emotional releases, somatic shifts, and client statements with precise elapsed timestamps.
- **Crisis Intervention Quick Cards:** Instant guidance for common challenging session dynamics (panic loops, somatic purging, ego dissolution resistance).
- **Automated Client Document Delivery:** Transmit PDF preparation checklists, screening questionnaires, and guidance sheets straight to clients' Telegram accounts.
- **Multilingual UI (EN / RU / BG):** Instant single-click language toggle across all panels, assessment scales, and forms.
- **Strict Local Privacy:** Operates entirely on your local machine using SQLite. No client records or session notes are ever transmitted to third-party clouds.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher installed.

### Option 1: 1-Click Launch (Windows)
Double-click the **`start_app.bat`** file in the root folder.  
The launcher will start the local server and automatically open your default browser at:
```
http://127.0.0.1:8000
```

### Option 2: Command Line (Windows / macOS / Linux)

1. Clone or download the repository:
   ```bash
   git clone https://github.com/your-username/ospat.git
   cd ospat
   ```

2. (Recommended) Create and activate a virtual environment:
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the application:
   ```bash
   python run_app.py
   ```
   Navigate to `http://127.0.0.1:8000` in your web browser.

---

## ⚙️ Telegram Bot Integration Setup

To enable one-click document dispatching to clients:

1. **Obtain a Bot Token:**
   - Open Telegram and message [@BotFather](https://t.me/BotFather).
   - Send `/newbot`, name your bot, and copy the HTTP API token provided.

2. **Configure in OSPAT:**
   - In the top-right corner of the OSPAT dashboard, click **⚙️ Settings**.
   - Paste your **Telegram Bot Token** and click **Save**.
   - The status indicator in the sidebar will turn green (`Bot Active`).

3. **Client Pairing & Material Dispatch:**
   - Have your client start your bot by pressing **Start** in Telegram.
   - Navigate to the **Send to TG** tab in OSPAT and click **Recent Chats**.
   - Select the participant, choose the material (e.g. *Screening Questionnaire*, *Session Readiness Checklist*, or *Integration Guide*), and click **Send Document**.

---

## 📁 Repository Structure

```
OSPAT-main/
├── app/
│   ├── database.py             # SQLite data access layer
│   ├── main.py                 # FastAPI backend endpoints & routing
│   ├── telegram_service.py     # Asynchronous Telegram Bot API client
│   ├── static/
│   │   ├── css/styles.css      # Dark clinical dashboard styling
│   │   └── js/
│   │       ├── app.js          # Core UI logic & tab switching
│   │       ├── i18n.js         # Multilingual translations (EN, RU, BG)
│   │       ├── session_timer.js# Session chronometer & curve tracker
│   │       └── wcs_tool.js     # Connectedness psychometric calculator
│   └── templates/
│       └── index.html          # Single-page clinical application template
├── clinical-materials/         # Reference manuals and screening templates
├── session-materials/          # Multilingual PDF checklists and field guides
├── docs/
│   └── screenshots/            # Working panel screenshots
├── run_app.py                  # Python launcher with automatic browser opening
├── start_app.bat               # Windows 1-click batch launcher
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

---

## 🔒 Privacy & Data Security

- **Local Storage Only:** All patient records, session notes, and evaluation results are saved in a local SQLite file (`ospat_therapy.db`).
- **Zero Third-Party Telemetry:** No analytics or external trackers are embedded in the application.
- **Secure Telegram Dispatch:** Document requests are sent directly from your computer to Telegram's secure HTTPS Bot API endpoint without intermediate relays.

---

## ⚠️ Clinical Disclaimer

This software is designed solely as an organizational and educational support system for qualified therapists, licensed clinicians, and authorized researchers conducting sessions in jurisdictions where permitted by law, or within approved clinical trial settings.

The creators and contributors do not promote or encourage the unsupervised or illicit use of controlled substances.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
