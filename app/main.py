"""
OSPAT Psilocybin-Assisted Therapy Web Application - FastAPI Backend
Provides full REST APIs, material dispatching to Telegram, real-time session tracking, and clinical tools.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import database
from . import telegram_service

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ospat_app")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Initialize DB on load
database.init_db()

app = FastAPI(title="OSPAT Therapy Control Center", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------- MODELS ----------------

class SettingUpdate(BaseModel):
    key: str
    value: str

class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    telegram_id: Optional[str] = ""
    telegram_username: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    stage: Optional[str] = "preparation"
    medical_notes: Optional[str] = ""
    intention: Optional[str] = ""
    notes: Optional[str] = ""

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    emergency_contact: Optional[str] = None
    stage: Optional[str] = None
    medical_notes: Optional[str] = None
    intention: Optional[str] = None
    notes: Optional[str] = None

class SessionCreate(BaseModel):
    client_id: int
    session_date: Optional[str] = ""
    substance: Optional[str] = "Псилоцибин (сухие плодовые тела)"
    dose: Optional[str] = "2.5 - 3.5 г"
    intention: Optional[str] = ""
    notes: Optional[str] = ""

class SessionUpdate(BaseModel):
    phase: Optional[str] = None
    status: Optional[str] = None
    dose: Optional[str] = None
    substance: Optional[str] = None
    intention: Optional[str] = None
    notes: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class SessionLogCreate(BaseModel):
    session_id: int
    elapsed_seconds: int
    phase: str
    event_type: str
    note: str

class AssessmentCreate(BaseModel):
    client_id: int
    assessment_type: str  # 'wcs_baseline', 'wcs_integration', 'screening'
    stage: str
    score_self: float = 0
    score_others: float = 0
    score_world: float = 0
    score_total: float = 0
    data: Dict[str, Any] = {}

class TelegramSendRequest(BaseModel):
    client_id: Optional[int] = None
    chat_id: str
    material_id: Optional[str] = None
    custom_text: Optional[str] = None
    caption: Optional[str] = None
    lang: Optional[str] = "ru"  # Language code: ru / en / bg


# ---------------- ROUTES: FRONTEND ----------------

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(TEMPLATES_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>OSPAT Therapy Web App</h1><p>Template not found.</p>"


# ---------------- ROUTES: SETTINGS & TELEGRAM ----------------

@app.get("/api/settings")
async def get_settings():
    return database.get_all_settings()

@app.post("/api/settings")
async def save_setting(item: SettingUpdate):
    database.set_setting(item.key, item.value)
    return {"status": "ok", "key": item.key}

@app.get("/api/telegram/status")
async def check_telegram_status():
    token = database.get_setting("telegram_bot_token", "")
    if not token:
        return {"configured": False, "connected": False, "message": "Токен бота не настроен"}
    
    ok, info = await telegram_service.check_bot_token(token)
    if ok:
        return {
            "configured": True,
            "connected": True,
            "bot_username": info.get("username", ""),
            "bot_name": info.get("first_name", ""),
            "bot_id": info.get("id", "")
        }
    else:
        return {
            "configured": True,
            "connected": False,
            "error": info.get("error", "Не удалось связаться с Telegram")
        }

@app.get("/api/telegram/recent-chats")
async def get_recent_telegram_chats():
    token = database.get_setting("telegram_bot_token", "")
    if not token:
        return []
    return await telegram_service.get_recent_chats(token)

@app.get("/api/telegram/history")
async def get_telegram_history():
    return database.get_telegram_history(limit=50)

@app.post("/api/telegram/send")
async def send_to_telegram(req: TelegramSendRequest):
    token = database.get_setting("telegram_bot_token", "")
    if not token:
        raise HTTPException(status_code=400, detail="Токен Telegram бота не настроен. Перейдите во вкладку 'Telegram' и сохраните токен.")

    chat_id = req.chat_id.strip()
    if not chat_id:
        raise HTTPException(status_code=400, detail="Не указан Chat ID получателя.")

    # If sending a catalog material
    if req.material_id:
        materials = get_materials_catalog(lang=req.lang or "ru")
        material = next((m for m in materials if m["id"] == req.material_id), None)
        if not material:
            raise HTTPException(status_code=404, detail="Материал не найден в каталоге")
        
        file_path = material.get("file_path")
        caption = req.caption or material.get("default_caption") or material.get("title")

        if file_path and os.path.exists(file_path):
            ok, msg = await telegram_service.send_document(token, chat_id, file_path, caption=caption)
            status = "success" if ok else "error"
            database.log_telegram_message(
                client_id=req.client_id,
                chat_id=chat_id,
                message_type="document",
                file_name=os.path.basename(file_path),
                caption=caption,
                status=status,
                error="" if ok else msg
            )
            if not ok:
                raise HTTPException(status_code=400, detail=msg)
            return {"status": "ok", "message": msg}
        elif material.get("type") == "post" or material.get("type") == "guide":
            # Send as formatted text if it's a markdown post
            content_path = material.get("file_path")
            with open(content_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
            
            # Send message text
            clean_text = f"<b>{material.get('title')}</b>\n\n{raw_text[:3800]}"
            ok, msg = await telegram_service.send_message(token, chat_id, clean_text)
            status = "success" if ok else "error"
            database.log_telegram_message(
                client_id=req.client_id,
                chat_id=chat_id,
                message_type="text",
                file_name=material.get("id"),
                caption=material.get("title"),
                status=status,
                error="" if ok else msg
            )
            if not ok:
                raise HTTPException(status_code=400, detail=msg)
            return {"status": "ok", "message": msg}

    # If sending custom text
    elif req.custom_text:
        ok, msg = await telegram_service.send_message(token, chat_id, req.custom_text)
        database.log_telegram_message(
            client_id=req.client_id,
            chat_id=chat_id,
            message_type="text",
            file_name="custom_message",
            caption=req.custom_text[:50],
            status="success" if ok else "error",
            error="" if ok else msg
        )
        if not ok:
            raise HTTPException(status_code=400, detail=msg)
        return {"status": "ok", "message": msg}

    raise HTTPException(status_code=400, detail="Не указан ни материал, ни текст для отправки.")


# ---------------- ROUTES: CLIENTS ----------------

@app.get("/api/clients")
async def list_clients():
    return database.get_clients()

@app.get("/api/clients/{client_id}")
async def get_client_detail(client_id: int):
    client = database.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    sessions = database.get_sessions(client_id=client_id)
    assessments = database.get_assessments(client_id=client_id)
    return {
        "client": client,
        "sessions": sessions,
        "assessments": assessments
    }

@app.post("/api/clients")
async def add_client(c: ClientCreate):
    cid = database.create_client(
        name=c.name,
        phone=c.phone or "",
        telegram_id=c.telegram_id or "",
        telegram_username=c.telegram_username or "",
        emergency_contact=c.emergency_contact or "",
        stage=c.stage or "preparation",
        medical_notes=c.medical_notes or "",
        intention=c.intention or "",
        notes=c.notes or ""
    )
    return {"status": "ok", "id": cid}

@app.put("/api/clients/{client_id}")
async def edit_client(client_id: int, c: ClientUpdate):
    data = {k: v for k, v in c.dict().items() if v is not None}
    database.update_client(client_id, **data)
    return {"status": "ok"}

@app.delete("/api/clients/{client_id}")
async def remove_client(client_id: int):
    database.delete_client(client_id)
    return {"status": "ok"}


# ---------------- ROUTES: SESSIONS ----------------

@app.get("/api/sessions")
async def list_sessions(client_id: Optional[int] = None):
    return database.get_sessions(client_id=client_id)

@app.get("/api/sessions/{session_id}")
async def get_session_detail(session_id: int):
    sess = database.get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    logs = database.get_session_logs(session_id)
    return {"session": sess, "logs": logs}

@app.post("/api/sessions")
async def start_session(s: SessionCreate):
    sid = database.create_session(
        client_id=s.client_id,
        session_date=s.session_date or "",
        substance=s.substance or "Псилоцибин",
        dose=s.dose or "",
        intention=s.intention or "",
        notes=s.notes or ""
    )
    # Log session start
    database.add_session_log(
        session_id=sid,
        elapsed_seconds=0,
        phase="ascent",
        event_type="Начало сессии",
        note="Сессия официально начата. Фаза входа (Ascent)."
    )
    # Update client stage
    database.update_client(s.client_id, stage="session_day")
    return {"status": "ok", "id": sid}

@app.put("/api/sessions/{session_id}")
async def edit_session(session_id: int, s: SessionUpdate):
    data = {k: v for k, v in s.dict().items() if v is not None}
    database.update_session(session_id, **data)
    return {"status": "ok"}

@app.post("/api/sessions/{session_id}/log")
async def add_log(session_id: int, log_item: SessionLogCreate):
    lid = database.add_session_log(
        session_id=session_id,
        elapsed_seconds=log_item.elapsed_seconds,
        phase=log_item.phase,
        event_type=log_item.event_type,
        note=log_item.note
    )
    return {"status": "ok", "id": lid}

@app.get("/api/sessions/{session_id}/logs")
async def get_logs(session_id: int):
    return database.get_session_logs(session_id)


# ---------------- ROUTES: ASSESSMENTS (WCS, ETC.) ----------------

@app.get("/api/assessments")
async def list_assessments(client_id: Optional[int] = None):
    return database.get_assessments(client_id=client_id)

@app.post("/api/assessments")
async def save_assessment_record(a: AssessmentCreate):
    aid = database.save_assessment(
        client_id=a.client_id,
        assessment_type=a.assessment_type,
        stage=a.stage,
        score_self=a.score_self,
        score_others=a.score_others,
        score_world=a.score_world,
        score_total=a.score_total,
        data=a.data
    )
    return {"status": "ok", "id": aid}


# ---------------- ROUTES: MATERIALS & CLINICAL REPO ----------------

def get_materials_catalog(lang: str = "ru") -> List[Dict[str, Any]]:
    """
    Catalog of all documents, guides, PDFs and educational posts ready to be viewed or sent.
    Returns localized file paths and metadata for the requested language (ru / en / bg).
    """
    # Language-specific sub-directories for translated text materials
    text_subdir = {
        "en": "en",
        "bg": "bg",
        "ru": ""  # Russian originals are in root folders
    }.get(lang, "")

    def post_path(filename: str) -> str:
        if text_subdir:
            p = os.path.join(BASE_DIR, "telegram-posts", text_subdir, filename)
            if os.path.exists(p):
                return p
        return os.path.join(BASE_DIR, "telegram-posts", filename)

    def guide_path(filename: str) -> str:
        if text_subdir:
            p = os.path.join(BASE_DIR, "session-materials", text_subdir, filename)
            if os.path.exists(p):
                return p
        return os.path.join(BASE_DIR, "session-materials", filename)

    # ---- Localized metadata ----
    META = {
        "ru": {
            "screening_pdf": {
                "title": "Анкета предварительного скрининга (PDF)",
                "category": "Подготовка / Скрининг",
                "caption": "📄 <b>Анкета скрининга и соматической безопасности</b>\n\nПожалуйста, заполните эту форму до нашей первой подготовительной встречи.",
                "description": "Скрининг соматических рисков, сердечно-сосудистых факторов, психиатрического анамнеза и принимаемых медикаментов."
            },
            "checklist_pdf": {
                "title": "Чек-лист готовности к сессии (PDF)",
                "category": "Подготовка / Сеттинг",
                "caption": "📋 <b>Чек-лист готовности к сессии</b>\n\nПамятка по подготовке за 3-5 дней, накануне и утром в день сессии.",
                "description": "Двусторонний чеклист для участника и терапевта."
            },
            "wcs_pdf": {
                "title": "Опросник связности Розалинд Уоттс WCS (PDF)",
                "category": "Диагностика и Интеграция",
                "caption": "📊 <b>Шкала связанности Watts Connectedness Scale (WCS)</b>\n\nОпросник для замера уровня связанности с собой, другими и миром.",
                "description": "Клинический опросник Rosalind Watts (Imperial College London) на 21 пункт."
            },
            "post_01_difficult": {
                "title": "Памятка: Работа со сложными переживаниями (Dive In)",
                "category": "Обучение клиента",
                "caption": "🌪️ <b>Что делать со сложными переживаниями: «In and Through»</b>",
                "description": "Принцип «Не убегай, шагни навстречу и спроси: кто ты?»."
            },
            "post_02_framing": {
                "title": "Памятка: Доверяй, Отпускай, Будь открыт",
                "category": "Обучение клиента",
                "caption": "⚓ <b>Золотая триада навигации: Trust, Let Go, Be Open</b>",
                "description": "Снятие невротического контроля, переход от эго-ожиданий к намерению."
            },
            "post_03_music": {
                "title": "Статья: Музыка как скрытый фармакологический агент",
                "category": "Сеттинг и Музыка",
                "caption": "🎧 <b>Музыка — это не фон. Это скрытый фармакологический агент</b>",
                "description": "Архитектура звуковой волны: Ascent, Peak, Descent."
            },
            "post_04_neuroplasticity": {
                "title": "Памятка: Окно нейропластичности и интеграция",
                "category": "Интеграция",
                "caption": "🌱 <b>Окно нейропластичности: почему сессия начинается после сессии</b>",
                "description": "Снижение ригидности DMN, окно 14-28 дней, 4 уровня интеграции."
            },
            "post_05_holding": {
                "title": "Статья: Недирективное удержание пространства",
                "category": "Методология",
                "caption": "🛡️ <b>Искусство недирективного присутствия (Holding Space)</b>",
                "description": "Почему терапевт молчит 95% времени."
            },
            "guide_prep": {
                "title": "Гайд терапевта: Подготовительные встречи",
                "category": "Клиническое руководство",
                "caption": "📖 <b>Гайд проводника: Подготовительная фаза</b>",
                "description": "Полный полевой протокол: раппорт, unpriming, соматика, touch consent."
            },
            "guide_nav": {
                "title": "Гайд терапевта: День сессии и кризисная навигация",
                "category": "Клиническое руководство",
                "caption": "🧭 <b>Гайд проводника: День сессии</b>",
                "description": "Фазовая динамика, кризисные сценарии, правила выхода."
            },
            "guide_integ": {
                "title": "Гайд терапевта: Послесессионная интеграция",
                "category": "Клиническое руководство",
                "caption": "🌿 <b>Гайд проводника: Интеграция</b>",
                "description": "4 уровня интеграции, правило 14/30 дней, работа с WCS."
            }
        },
        "en": {
            "screening_pdf": {
                "title": "Pre-Session Screening Questionnaire (PDF)",
                "category": "Preparation / Screening",
                "caption": "📄 <b>Intake Screening & Somatic Safety Questionnaire</b>\n\nPlease complete this form before our first preparatory meeting.",
                "description": "Screens somatic risks, cardiovascular factors, psychiatric history, and current medications."
            },
            "checklist_pdf": {
                "title": "Session Readiness Checklist (PDF)",
                "category": "Preparation / Setting",
                "caption": "📋 <b>Session Readiness Checklist</b>\n\nGuide for 3–5 days before, the evening prior, and the morning of your session.",
                "description": "Bilateral checklist for participant and therapist: diet, info detox, clothing, sleep, logistics."
            },
            "wcs_pdf": {
                "title": "Watts Connectedness Scale WCS (PDF)",
                "category": "Diagnostics & Integration",
                "caption": "📊 <b>Watts Connectedness Scale (WCS)</b>\n\nQuestionnaire measuring connectedness to self, others, and the world (complete before and 7–14 days after the session).",
                "description": "Clinical 21-item questionnaire by Rosalind Watts (Imperial College London)."
            },
            "post_01_difficult": {
                "title": "Guide: Working with Difficult Experiences (Dive In)",
                "category": "Client Education",
                "caption": "🌪️ <b>How to Work with Difficult Experiences: \u201cIn and Through\u201d</b>",
                "description": "The principle: don't run — step toward it and ask: who are you?"
            },
            "post_02_framing": {
                "title": "Guide: Trust, Let Go, Be Open",
                "category": "Client Education",
                "caption": "⚓ <b>The Golden Navigation Triad: Trust, Let Go, Be Open</b>",
                "description": "Releasing neurotic control, shifting from ego-expectations to processual intention."
            },
            "post_03_music": {
                "title": "Article: Music as a Hidden Pharmacological Agent",
                "category": "Setting & Music",
                "caption": "🎧 <b>Music Is Not Background — It Is a Hidden Pharmacological Agent</b>",
                "description": "Session sound-wave architecture: Ascent, Peak, Descent."
            },
            "post_04_neuroplasticity": {
                "title": "Guide: The Neuroplasticity Window & Integration",
                "category": "Integration",
                "caption": "🌱 <b>The Neuroplasticity Window: Why Everything Begins After the Session</b>",
                "description": "DMN flexibility, 14–28 day window, 4 levels of integration."
            },
            "post_05_holding": {
                "title": "Article: Non-Directive Spaceholding",
                "category": "Methodology",
                "caption": "🛡️ <b>The Art of Non-Directive Presence (Holding Space)</b>",
                "description": "Why the therapist is silent 95% of the time."
            },
            "guide_prep": {
                "title": "Facilitator Guide: Preparation Meetings",
                "category": "Clinical Protocol",
                "caption": "📖 <b>Facilitator Field Guide: Preparation Phase</b>",
                "description": "Full field protocol: rapport, unpriming, somatics, touch consent."
            },
            "guide_nav": {
                "title": "Facilitator Guide: Session Day & Crisis Navigation",
                "category": "Clinical Protocol",
                "caption": "🧭 <b>Facilitator Field Guide: Session Day</b>",
                "description": "Phase dynamics, crisis protocols, exit criteria."
            },
            "guide_integ": {
                "title": "Facilitator Guide: Post-Session Integration",
                "category": "Clinical Protocol",
                "caption": "🌿 <b>Facilitator Field Guide: Integration Phase</b>",
                "description": "4 levels of integration, 14/30-day rules, WCS follow-up."
            }
        },
        "bg": {
            "screening_pdf": {
                "title": "Анкета за предварителен скрининг (PDF)",
                "category": "Подготовка / Скрининг",
                "caption": "📄 <b>Анкета за скрининг и соматична безопасност</b>\n\nМоля, попълнете тази форма преди нашата първа подготвителна среща.",
                "description": "Скрининг на соматични рискове, сърдечно-съдови фактори, психиатрична анамнеза и медикаменти."
            },
            "checklist_pdf": {
                "title": "Чек-лист за готовност за сесия (PDF)",
                "category": "Подготовка / Обстановка",
                "caption": "📋 <b>Чек-лист за готовност за сесия</b>\n\nПамятка за 3–5 дни преди, вечерта преди и сутринта на сесията.",
                "description": "Двустранен чек-лист за участника и терапевта."
            },
            "wcs_pdf": {
                "title": "Скала за свързаност на Розалинд Уотс WCS (PDF)",
                "category": "Диагностика и Интеграция",
                "caption": "📊 <b>Скала за свързаност Watts Connectedness Scale (WCS)</b>\n\nВъпросник за измерване на свързаността със себе си, другите и света.",
                "description": "Клиничен въпросник от 21 точки на Розалинд Уотс (Imperial College London)."
            },
            "post_01_difficult": {
                "title": "Памятка: Работа с трудни преживявания (Dive In)",
                "category": "Обучение на клиента",
                "caption": "🌪️ <b>Как да работим с трудни преживявания: \u201eНавътре и отвъд\u201c</b>",
                "description": "Принципът: не бягай — стъпи напред и попитай: кой си ти?"
            },
            "post_02_framing": {
                "title": "Памятка: Доверявай се, Отпусни, Бъди отворен",
                "category": "Обучение на клиента",
                "caption": "⚓ <b>Златната триада: Trust, Let Go, Be Open</b>",
                "description": "Освобождаване от невротичен контрол, преход към процесуално намерение."
            },
            "post_03_music": {
                "title": "Статия: Музиката като скрит фармакологичен агент",
                "category": "Обстановка и Музика",
                "caption": "🎧 <b>Музиката не е фон — тя е скрит фармакологичен агент</b>",
                "description": "Архитектура на звуковата вълна: Ascent, Peak, Descent."
            },
            "post_04_neuroplasticity": {
                "title": "Памятка: Прозорецът на невропластичността и интеграция",
                "category": "Интеграция",
                "caption": "🌱 <b>Прозорецът на невропластичността: защо всичко започва след сесията</b>",
                "description": "Гъвкавост на DMN, 14–28-дневен прозорец, 4 нива на интеграция."
            },
            "post_05_holding": {
                "title": "Статия: Недирективно удържане на пространството",
                "category": "Методология",
                "caption": "🛡️ <b>Изкуството на недирективното присъствие (Holding Space)</b>",
                "description": "Защо терапевтът мълчи 95% от времето."
            },
            "guide_prep": {
                "title": "Ръководство за терапевта: Подготвителни срещи",
                "category": "Клиничен протокол",
                "caption": "📖 <b>Пътеводител на водещия: Фаза на подготовка</b>",
                "description": "Пълен полеви протокол: рапорт, unpriming, соматика, touch consent."
            },
            "guide_nav": {
                "title": "Ръководство за терапевта: Ден на сесията и навигация",
                "category": "Клиничен протокол",
                "caption": "🧭 <b>Пътеводител на водещия: Денят на сесията</b>",
                "description": "Фазова динамика, кризисни сценарии, критерии за приключване."
            },
            "guide_integ": {
                "title": "Ръководство за терапевта: Следсесийна интеграция",
                "category": "Клиничен протокол",
                "caption": "🌿 <b>Пътеводител на водещия: Интеграция</b>",
                "description": "4 нива на интеграция, правила 14/30 дни, работа с WCS."
            }
        }
    }

    meta = META.get(lang, META["ru"])

    return [
        {
            "id": "screening_pdf",
            "title": meta["screening_pdf"]["title"],
            "category": meta["screening_pdf"]["category"],
            "type": "pdf",
            "file_path": os.path.join(BASE_DIR, "session_screening_questionnaire.pdf"),
            "default_caption": meta["screening_pdf"]["caption"],
            "description": meta["screening_pdf"]["description"]
        },
        {
            "id": "checklist_pdf",
            "title": meta["checklist_pdf"]["title"],
            "category": meta["checklist_pdf"]["category"],
            "type": "pdf",
            "file_path": os.path.join(BASE_DIR, "session-materials", "session_readiness_checklist.pdf"),
            "default_caption": meta["checklist_pdf"]["caption"],
            "description": meta["checklist_pdf"]["description"]
        },
        {
            "id": "wcs_pdf",
            "title": meta["wcs_pdf"]["title"],
            "category": meta["wcs_pdf"]["category"],
            "type": "pdf",
            "file_path": os.path.join(BASE_DIR, "session-materials", "watts_connectedness_scale.pdf"),
            "default_caption": meta["wcs_pdf"]["caption"],
            "description": meta["wcs_pdf"]["description"]
        },
        {
            "id": "post_01_difficult",
            "title": meta["post_01_difficult"]["title"],
            "category": meta["post_01_difficult"]["category"],
            "type": "post",
            "file_path": post_path("post_01_difficult_experiences.md"),
            "default_caption": meta["post_01_difficult"]["caption"],
            "description": meta["post_01_difficult"]["description"]
        },
        {
            "id": "post_02_framing",
            "title": meta["post_02_framing"]["title"],
            "category": meta["post_02_framing"]["category"],
            "type": "post",
            "file_path": post_path("post_02_framing_and_priming.md"),
            "default_caption": meta["post_02_framing"]["caption"],
            "description": meta["post_02_framing"]["description"]
        },
        {
            "id": "post_03_music",
            "title": meta["post_03_music"]["title"],
            "category": meta["post_03_music"]["category"],
            "type": "post",
            "file_path": post_path("post_03_music_architecture.md"),
            "default_caption": meta["post_03_music"]["caption"],
            "description": meta["post_03_music"]["description"]
        },
        {
            "id": "post_04_neuroplasticity",
            "title": meta["post_04_neuroplasticity"]["title"],
            "category": meta["post_04_neuroplasticity"]["category"],
            "type": "post",
            "file_path": post_path("post_04_neuroplasticity_integration.md"),
            "default_caption": meta["post_04_neuroplasticity"]["caption"],
            "description": meta["post_04_neuroplasticity"]["description"]
        },
        {
            "id": "post_05_holding",
            "title": meta["post_05_holding"]["title"],
            "category": meta["post_05_holding"]["category"],
            "type": "post",
            "file_path": post_path("post_05_non_directive_spaceholding.md"),
            "default_caption": meta["post_05_holding"]["caption"],
            "description": meta["post_05_holding"]["description"]
        },
        {
            "id": "guide_prep",
            "title": meta["guide_prep"]["title"],
            "category": meta["guide_prep"]["category"],
            "type": "guide",
            "file_path": guide_path("therapist_field_guide_preparation.md"),
            "default_caption": meta["guide_prep"]["caption"],
            "description": meta["guide_prep"]["description"]
        },
        {
            "id": "guide_nav",
            "title": meta["guide_nav"]["title"],
            "category": meta["guide_nav"]["category"],
            "type": "guide",
            "file_path": guide_path("therapist_field_guide_navigation.md"),
            "default_caption": meta["guide_nav"]["caption"],
            "description": meta["guide_nav"]["description"]
        },
        {
            "id": "guide_integ",
            "title": meta["guide_integ"]["title"],
            "category": meta["guide_integ"]["category"],
            "type": "guide",
            "file_path": guide_path("therapist_field_guide_integration.md"),
            "default_caption": meta["guide_integ"]["caption"],
            "description": meta["guide_integ"]["description"]
        }
    ]

@app.get("/api/materials")
async def list_materials(lang: str = "ru"):
    materials = get_materials_catalog(lang=lang)
    # Check existence of each file
    for m in materials:
        m["exists"] = os.path.exists(m.get("file_path", ""))
        m["size_bytes"] = os.path.getsize(m["file_path"]) if m["exists"] else 0
    return materials

@app.get("/api/materials/{material_id}/content")
async def get_material_content(material_id: str, lang: str = "ru"):
    materials = get_materials_catalog(lang=lang)
    m = next((item for item in materials if item["id"] == material_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Материал не найден")
    
    file_path = m.get("file_path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл материала не найден на диске")
    
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    return {"id": m["id"], "title": m["title"], "content": content}

@app.get("/api/materials/{material_id}/download")
async def download_material(material_id: str):
    materials = get_materials_catalog()
    m = next((item for item in materials if item["id"] == material_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Материал не найден")
    
    file_path = m.get("file_path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(file_path, filename=os.path.basename(file_path))


# ---------------- ROUTES: SUMMARY REPORT EXPORT ----------------

@app.get("/api/clients/{client_id}/report")
async def generate_client_report(client_id: int):
    client = database.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    sessions = database.get_sessions(client_id=client_id)
    assessments = database.get_assessments(client_id=client_id)
    
    detailed_sessions = []
    for s in sessions:
        logs = database.get_session_logs(s["id"])
        detailed_sessions.append({
            "session": s,
            "logs": logs
        })
    
    return {
        "client": client,
        "sessions": detailed_sessions,
        "assessments": assessments
    }
