"""
Database module for OSPAT Therapy Web App.
Uses SQLite for zero-configuration, secure, local data storage.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ospat_therapy.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
    )
    """)

    # Clients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        telegram_id TEXT,
        telegram_username TEXT,
        emergency_contact TEXT,
        stage TEXT DEFAULT 'preparation',
        medical_notes TEXT,
        intention TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)

    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        session_date TEXT,
        substance TEXT DEFAULT 'Psilocybin',
        dose TEXT,
        intention TEXT,
        phase TEXT DEFAULT 'not_started',
        status TEXT DEFAULT 'planned',
        start_time TEXT,
        end_time TEXT,
        notes TEXT,
        created_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    )
    """)

    # Session real-time event logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS session_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp TEXT,
        elapsed_seconds INTEGER,
        phase TEXT,
        event_type TEXT,
        note TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    )
    """)

    # Assessments / Questionnaires table (WCS, Screening, etc.)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL,
        stage TEXT NOT NULL,
        score_self REAL DEFAULT 0,
        score_others REAL DEFAULT 0,
        score_world REAL DEFAULT 0,
        score_total REAL DEFAULT 0,
        data_json TEXT,
        created_at TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    )
    """)

    # Checklists table (Readiness checklists)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS checklists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        session_id INTEGER,
        checklist_type TEXT DEFAULT 'session_readiness',
        data_json TEXT,
        completed_at TEXT
    )
    """)

    # Telegram send history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telegram_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        chat_id TEXT NOT NULL,
        message_type TEXT,
        file_name TEXT,
        caption TEXT,
        status TEXT,
        error TEXT,
        sent_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# ---------------- SETTINGS ----------------

def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def set_setting(key: str, value: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    """, (key, value, now))
    conn.commit()
    conn.close()

def get_all_settings() -> Dict[str, str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}


# ---------------- CLIENTS ----------------

def get_clients() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.*, 
           (SELECT COUNT(*) FROM sessions WHERE client_id = c.id) as sessions_count,
           (SELECT COUNT(*) FROM assessments WHERE client_id = c.id) as assessments_count
    FROM clients c
    ORDER BY c.updated_at DESC, c.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_client(client_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_client(name: str, phone: str = "", telegram_id: str = "", telegram_username: str = "",
                  emergency_contact: str = "", stage: str = "preparation", medical_notes: str = "",
                  intention: str = "", notes: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO clients (name, phone, telegram_id, telegram_username, emergency_contact, 
                         stage, medical_notes, intention, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, phone, telegram_id, telegram_username, emergency_contact, stage, medical_notes, intention, notes, now, now))
    client_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return client_id

def update_client(client_id: int, **kwargs) -> bool:
    allowed = ["name", "phone", "telegram_id", "telegram_username", "emergency_contact",
               "stage", "medical_notes", "intention", "notes"]
    fields = []
    values = []
    for k, v in kwargs.items():
        if k in allowed:
            fields.append(f"{k} = ?")
            values.append(v)
    if not fields:
        return False
    
    fields.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(client_id)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE clients SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return True

def delete_client(client_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM clients WHERE id = ?", (client_id,))
    conn.commit()
    conn.close()
    return True


# ---------------- SESSIONS ----------------

def get_sessions(client_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if client_id:
        cursor.execute("""
        SELECT s.*, c.name as client_name 
        FROM sessions s 
        JOIN clients c ON s.client_id = c.id 
        WHERE s.client_id = ? 
        ORDER BY s.id DESC
        """, (client_id,))
    else:
        cursor.execute("""
        SELECT s.*, c.name as client_name 
        FROM sessions s 
        JOIN clients c ON s.client_id = c.id 
        ORDER BY s.id DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_session(session_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, c.name as client_name, c.telegram_id, c.emergency_contact
    FROM sessions s 
    JOIN clients c ON s.client_id = c.id 
    WHERE s.id = ?
    """, (session_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_session(client_id: int, session_date: str, substance: str = "Psilocybin",
                   dose: str = "", intention: str = "", notes: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO sessions (client_id, session_date, substance, dose, intention, phase, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, 'ascent', 'in_progress', ?, ?)
    """, (client_id, session_date or now[:10], substance, dose, intention, now, notes))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id

def update_session(session_id: int, **kwargs) -> bool:
    allowed = ["phase", "status", "start_time", "end_time", "dose", "substance", "intention", "notes"]
    fields = []
    values = []
    for k, v in kwargs.items():
        if k in allowed:
            fields.append(f"{k} = ?")
            values.append(v)
    if not fields:
        return False
    values.append(session_id)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE sessions SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return True

def add_session_log(session_id: int, elapsed_seconds: int, phase: str, event_type: str, note: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO session_logs (session_id, timestamp, elapsed_seconds, phase, event_type, note)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, now, elapsed_seconds, phase, event_type, note))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def get_session_logs(session_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM session_logs WHERE session_id = ? ORDER BY id ASC
    """, (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ---------------- ASSESSMENTS & WCS ----------------

def save_assessment(client_id: int, assessment_type: str, stage: str,
                    score_self: float, score_others: float, score_world: float,
                    score_total: float, data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO assessments (client_id, assessment_type, stage, score_self, score_others, score_world, score_total, data_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (client_id, assessment_type, stage, score_self, score_others, score_world, score_total, json.dumps(data, ensure_ascii=False), now))
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return assessment_id

def get_assessments(client_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if client_id:
        cursor.execute("SELECT * FROM assessments WHERE client_id = ? ORDER BY id DESC", (client_id,))
    else:
        cursor.execute("""
        SELECT a.*, c.name as client_name 
        FROM assessments a 
        JOIN clients c ON a.client_id = c.id 
        ORDER BY a.id DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        if d.get("data_json"):
            try:
                d["data"] = json.loads(d["data_json"])
            except Exception:
                d["data"] = {}
        results.append(d)
    return results


# ---------------- TELEGRAM HISTORY ----------------

def log_telegram_message(client_id: Optional[int], chat_id: str, message_type: str,
                         file_name: str, caption: str, status: str, error: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO telegram_history (client_id, chat_id, message_type, file_name, caption, status, error, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (client_id, chat_id, message_type, file_name, caption, status, error, now))
    conn.commit()
    conn.close()

def get_telegram_history(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT th.*, c.name as client_name
    FROM telegram_history th
    LEFT JOIN clients c ON th.client_id = c.id
    ORDER BY th.id DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
