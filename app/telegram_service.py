"""
Telegram Bot API Service for OSPAT Therapy App.
Handles sending files, documents, and messages to clients via Telegram.
Also fetches recent chats that interacted with the bot.
"""

import aiohttp
import os
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("telegram_service")

TELEGRAM_API_BASE = "https://api.telegram.org/bot"

async def check_bot_token(token: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Verifies bot token using getMe endpoint.
    Returns (success, bot_info or error_dict).
    """
    if not token or not token.strip():
        return False, {"error": "Токен бота не указан"}
    
    url = f"{TELEGRAM_API_BASE}{token.strip()}/getMe"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(url) as response:
                data = await response.json()
                if response.status == 200 and data.get("ok"):
                    return True, data.get("result", {})
                else:
                    return False, {"error": data.get("description", "Неверный токен Telegram бота")}
    except Exception as e:
        return False, {"error": f"Ошибка соединения с Telegram API: {str(e)}"}


async def get_recent_chats(token: str) -> List[Dict[str, Any]]:
    """
    Fetches recent updates (/getUpdates) to discover users who have recently
    sent a message or /start to the bot. This allows selecting clients with 1 click.
    """
    if not token or not token.strip():
        return []
    
    url = f"{TELEGRAM_API_BASE}{token.strip()}/getUpdates?limit=50"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(url) as response:
                data = await response.json()
                if not (response.status == 200 and data.get("ok")):
                    return []
                
                updates = data.get("result", [])
                chats = {}
                for u in updates:
                    msg = u.get("message") or u.get("edited_message") or u.get("callback_query", {}).get("message")
                    if msg and "chat" in msg:
                        chat = msg["chat"]
                        chat_id = str(chat.get("id"))
                        first_name = chat.get("first_name", "")
                        last_name = chat.get("last_name", "")
                        username = chat.get("username", "")
                        display_name = f"{first_name} {last_name}".strip() or username or chat_id
                        chats[chat_id] = {
                            "chat_id": chat_id,
                            "display_name": display_name,
                            "username": username,
                            "last_message": msg.get("text", "")
                        }
                return list(chats.values())
    except Exception as e:
        logger.error(f"Error getting recent chats: {e}")
        return []


async def send_message(token: str, chat_id: str, text: str, parse_mode: str = "HTML") -> Tuple[bool, str]:
    """
    Sends a text message to a client Telegram chat.
    """
    if not token or not token.strip():
        return False, "Токен бота не настроен. Перейдите в настройки Telegram."
    if not chat_id or not chat_id.strip():
        return False, "Не указан Telegram Chat ID клиента."

    url = f"{TELEGRAM_API_BASE}{token.strip()}/sendMessage"
    payload = {
        "chat_id": chat_id.strip(),
        "text": text,
        "parse_mode": parse_mode
    }

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            async with session.post(url, json=payload) as response:
                data = await response.json()
                if response.status == 200 and data.get("ok"):
                    return True, "Сообщение успешно отправлено"
                else:
                    return False, data.get("description", "Ошибка отправки сообщения")
    except Exception as e:
        return False, f"Ошибка сети при отправке: {str(e)}"


async def send_document(token: str, chat_id: str, file_path: str, caption: str = "",
                        parse_mode: str = "HTML") -> Tuple[bool, str]:
    """
    Sends a document/file (PDF, checklist, template) to a client Telegram chat.
    """
    if not token or not token.strip():
        return False, "Токен бота не настроен. Перейдите в настройки Telegram."
    if not chat_id or not chat_id.strip():
        return False, "Не указан Telegram Chat ID клиента."
    if not os.path.exists(file_path):
        return False, f"Файл не найден на диске: {file_path}"

    url = f"{TELEGRAM_API_BASE}{token.strip()}/sendDocument"
    file_name = os.path.basename(file_path)

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            data = aiohttp.FormData()
            data.add_field("chat_id", str(chat_id).strip())
            if caption:
                data.add_field("caption", caption)
                data.add_field("parse_mode", parse_mode)
            
            with open(file_path, "rb") as f:
                file_bytes = f.read()
            
            data.add_field("document", file_bytes, filename=file_name)

            async with session.post(url, data=data) as response:
                res_data = await response.json()
                if response.status == 200 and res_data.get("ok"):
                    return True, f"Файл '{file_name}' успешно отправлен"
                else:
                    return False, res_data.get("description", "Ошибка отправки файла в Telegram")
    except Exception as e:
        return False, f"Сетевая ошибка при отправке документа: {str(e)}"
