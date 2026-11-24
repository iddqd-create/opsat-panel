/**
 * OSPAT Live Session Pilot & Timer
 * Real-time phase tracking, event logging, and crisis assistance.
 * Multilingual support (RU, EN, BG).
 */

let activeSessionId = null;
let sessionSeconds = 0;
let timerInterval = null;
let isSessionRunning = false;

const SECONDS_ASCENT = 4500;
const SECONDS_PEAK = 12600;
const SECONDS_FULL = 21600;

const SESSION_PHASES_I18N = {
    ru: {
        not_started: { badge: "ФАЗА: НЕ НАЧАТА", title: "Ожидание старта", hint: "Убедитесь, что клиент удобно уложен, маска и наушники проверены, телефон отключен." },
        ascent: { badge: "ФАЗА I: ВХОД (ASCENT)", title: "Порог входа и вегетативная разрядка", hint: "Поддержите спокойное дыхание с длинным выдохом. Укройте пледом. Маска на глаза, тихий запуск плейлиста." },
        peak: { badge: "ФАЗА II: ПИК (PEAK)", title: "Пиковое погружение (Эго-диссолюция)", hint: "95% ВРЕМЕНИ ТИШИНЫ. Не задавайте вопросов. Держите пространство. Вмешательство ТОЛЬКО при панической петле." },
        descent: { badge: "ФАЗА III: СПАД (DESCENT)", title: "Возвращение и интеграционное заземление", hint: "Музыка становится мягкой и светлой. Предложите воду, теплый чай, фрукты. Не навязывайте интерпретаций." }
    },
    en: {
        not_started: { badge: "PHASE: NOT STARTED", title: "Awaiting Start", hint: "Ensure client is comfortably positioned, mask and headphones checked, phones in airplane mode." },
        ascent: { badge: "PHASE I: ASCENT", title: "Entry Threshold & Somatic Release", hint: "Support calm breathing with prolonged exhalation. Offer blanket. Eye mask on, gentle playlist start." },
        peak: { badge: "PHASE II: PEAK", title: "Peak Immersion (Ego Dissolution)", hint: "95% OF TIME IN SILENCE. Do not ask analytical questions. Hold space. Intervene ONLY during panic loops." },
        descent: { badge: "PHASE III: DESCENT", title: "Return & Grounding", hint: "Music becomes soft and acoustic. Offer water, herbal tea, fruit. Avoid premature interpretations." }
    },
    bg: {
        not_started: { badge: "ФАЗА: НЕ Е СТАРТИРАНА", title: "Очакване на старт", hint: "Уверете се, че клиентът е легнал удобно, маската и слушалките са проверени, телефонът е изключен." },
        ascent: { badge: "ФАЗА I: НАВЛИЗАНЕ (ASCENT)", title: "Праг на навлизане и соматично разтоварване", hint: "Подкрепете бавно дишане с дълго издишване. Завийте с одеяло. Маска на очите, тих старт на музиката." },
        peak: { badge: "ФАЗА II: ПИК (PEAK)", title: "Пиково потапяне (Разтваряне на егото)", hint: "95% ОТ ВРЕМЕТО В ТИШИНА. Не задавайте аналитични въпроси. Задържайте пространството. Намеса САМО при паника." },
        descent: { badge: "ФАЗА III: СПАД (DESCENT)", title: "Завръщане и заземяване", hint: "Музиката става мека и светла. Предложете вода, билков чай, плодове. Без прибързани интерпретации." }
    }
};

function formatHHMMSS(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function getCurrentPhase(seconds) {
    if (seconds === 0 && !isSessionRunning && !activeSessionId) return 'not_started';
    if (seconds <= SECONDS_ASCENT) return 'ascent';
    if (seconds <= SECONDS_PEAK) return 'peak';
    return 'descent';
}

function updateSessionUI() {
    const digits = document.getElementById('sessionTimerDigits');
    if (digits) digits.innerText = formatHHMMSS(sessionSeconds);

    const phase = getCurrentPhase(sessionSeconds);
    const lang = window.currentLang || localStorage.getItem('ospat_lang') || 'ru';
    const dict = (SESSION_PHASES_I18N[lang] || SESSION_PHASES_I18N['ru'])[phase];

    const badge = document.getElementById('pilotPhaseBadge');
    const title = document.getElementById('pilotPhaseTitle');
    const hint = document.getElementById('pilotPhaseHint');

    const fillAscent = document.getElementById('fillAscent');
    const fillPeak = document.getElementById('fillPeak');
    const fillDescent = document.getElementById('fillDescent');

    if (dict) {
        if (badge) badge.innerText = dict.badge;
        if (title) title.innerText = dict.title;
        if (hint) hint.innerText = dict.hint;
    }

    if (sessionSeconds <= SECONDS_ASCENT) {
        const pct = Math.min(100, (sessionSeconds / SECONDS_ASCENT) * 100);
        if (fillAscent) fillAscent.style.width = `${pct}%`;
        if (fillPeak) fillPeak.style.width = '0%';
        if (fillDescent) fillDescent.style.width = '0%';
        if (badge) badge.style.background = 'var(--phase-ascent)';
    } else if (sessionSeconds <= SECONDS_PEAK) {
        if (fillAscent) fillAscent.style.width = '100%';
        const peakSecs = sessionSeconds - SECONDS_ASCENT;
        const peakDuration = SECONDS_PEAK - SECONDS_ASCENT;
        const pct = Math.min(100, (peakSecs / peakDuration) * 100);
        if (fillPeak) fillPeak.style.width = `${pct}%`;
        if (fillDescent) fillDescent.style.width = '0%';
        if (badge) badge.style.background = 'var(--phase-peak)';
    } else {
        if (fillAscent) fillAscent.style.width = '100%';
        if (fillPeak) fillPeak.style.width = '100%';
        const descSecs = sessionSeconds - SECONDS_PEAK;
        const descDuration = SECONDS_FULL - SECONDS_PEAK;
        const pct = Math.min(100, (descSecs / descDuration) * 100);
        if (fillDescent) fillDescent.style.width = `${pct}%`;
        if (badge) badge.style.background = 'var(--phase-descent)';
    }

    const progText = document.getElementById('sessionPhaseProgress');
    if (progText) {
        const fullPct = Math.min(100, Math.round((sessionSeconds / SECONDS_FULL) * 100));
        const lbl = lang === 'en' ? 'Total session progress' : lang === 'bg' ? 'Общ напредък на сесията' : 'Общий прогресс сессии';
        progText.innerText = `${lbl}: ${fullPct}% (${formatHHMMSS(sessionSeconds)})`;
    }
}

async function startOrResumeSession() {
    const clientSelect = document.getElementById('sessionClientSelect');
    const clientId = clientSelect ? clientSelect.value : null;

    if (!clientId) {
        const msg = window.currentLang === 'en' ? 'Please select a client for this session.' : window.currentLang === 'bg' ? 'Моля, изберете клиент за сесията.' : 'Пожалуйста, выберите клиента для начала сессии.';
        alert(msg);
        return;
    }

    if (!activeSessionId) {
        const dose = document.getElementById('sessionDoseInput')?.value || '3.0 g';
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: parseInt(clientId),
                    dose: dose,
                    substance: 'Psilocybin',
                    intention: ''
                })
            });
            const data = await res.json();
            if (data.status === 'ok') {
                activeSessionId = data.id;
            }
        } catch (e) {
            console.error('Error creating session:', e);
        }
    }

    isSessionRunning = true;
    document.getElementById('btnStartSession').disabled = true;
    document.getElementById('btnPauseSession').disabled = false;
    document.getElementById('btnEndSession').disabled = false;
    
    const badge = document.getElementById('sessionStatusBadge');
    badge.innerText = window.t('pilot_status_running');
    badge.className = 'badge badge-session';

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        sessionSeconds++;
        updateSessionUI();
    }, 1000);

    loadSessionLogs();
}

function pauseSession() {
    if (timerInterval) clearInterval(timerInterval);
    isSessionRunning = false;
    const btn = document.getElementById('btnStartSession');
    btn.disabled = false;
    const btnLabel = btn.querySelector('[data-i18n]') || btn;
    btnLabel.innerText = window.t('btn_resume_session');
    document.getElementById('btnPauseSession').disabled = true;

    const badge = document.getElementById('sessionStatusBadge');
    badge.innerText = window.t('pilot_status_paused');
    badge.className = 'badge badge-prep';
}

async function finishSession() {
    const confirmMsg = window.currentLang === 'en' ? 'Are you sure you want to conclude this session? Logs will be permanently saved to the patient dossier.' : window.currentLang === 'bg' ? 'Сигурни ли сте, че искате да приключите сесията? Дневникът ще бъде записан в досието на клиента.' : 'Вы уверены, что хотите завершить сессию? Логи будут зафиксированы в карточке пациента.';
    if (!confirm(confirmMsg)) return;

    if (timerInterval) clearInterval(timerInterval);
    isSessionRunning = false;

    if (activeSessionId) {
        const evNote = window.currentLang === 'en' ? `Duration: ${formatHHMMSS(sessionSeconds)}. Client grounded and discharged to designated companion.` : window.currentLang === 'bg' ? `Продължителност: ${formatHHMMSS(sessionSeconds)}. Клиентът е заземен и предаден на доверено лице.` : `Продолжительность: ${formatHHMMSS(sessionSeconds)}. Пациент заземлен и передан доверенному лицу.`;
        await quickLogEvent('Session Completed', evNote);
        await fetch(`/api/sessions/${activeSessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'completed',
                end_time: new Date().toISOString()
            })
        });
    }

    const btn = document.getElementById('btnStartSession');
    btn.disabled = false;
    const btnLabel = btn.querySelector('[data-i18n]') || btn;
    btnLabel.innerText = window.t('btn_start_session');
    document.getElementById('btnPauseSession').disabled = true;
    document.getElementById('btnEndSession').disabled = true;

    const badge = document.getElementById('sessionStatusBadge');
    badge.innerText = window.t('pilot_status_completed');
    badge.className = 'badge badge-integ';

    const okMsg = window.currentLang === 'en' ? 'Session successfully concluded and saved to database!' : window.currentLang === 'bg' ? 'Сесията е завършена успешно и запазена в базата данни!' : 'Сессия успешно завершена и сохранена в базу данных!';
    alert(okMsg);
    activeSessionId = null;
    sessionSeconds = 0;
    updateSessionUI();
}

async function quickLogEvent(eventType, note) {
    if (!activeSessionId) {
        const msg = window.currentLang === 'en' ? 'Please start the session first!' : window.currentLang === 'bg' ? 'Моля, първо стартирайте сесията!' : 'Сначала запустите сессию!';
        alert(msg);
        return;
    }

    const phase = getCurrentPhase(sessionSeconds);
    try {
        await fetch(`/api/sessions/${activeSessionId}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: activeSessionId,
                elapsed_seconds: sessionSeconds,
                phase: phase,
                event_type: eventType,
                note: note
            })
        });
        loadSessionLogs();
    } catch (e) {
        console.error('Error logging event:', e);
    }
}

async function loadSessionLogs() {
    if (!activeSessionId) return;

    try {
        const res = await fetch(`/api/sessions/${activeSessionId}/logs`);
        const logs = await res.json();
        const tbody = document.getElementById('sessionLogsTbody');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${window.t('log_empty')}</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(l => `
            <tr>
                <td><code>${formatHHMMSS(l.elapsed_seconds)}</code></td>
                <td><span class="badge badge-${l.phase === 'ascent' ? 'prep' : l.phase === 'peak' ? 'session' : 'integ'}">${l.phase}</span></td>
                <td><strong>${l.event_type}</strong></td>
                <td>${l.note}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error loading logs:', e);
    }
}

function promptCustomEvent() {
    if (!activeSessionId) {
        const msg = window.currentLang === 'en' ? 'Please start the session first!' : window.currentLang === 'bg' ? 'Моля, първо стартирайте сесията!' : 'Сначала запустите сессию!';
        alert(msg);
        return;
    }
    const modal = document.getElementById('customEventModal');
    if (modal) modal.classList.add('active');
}

function closeCustomEventModal() {
    const modal = document.getElementById('customEventModal');
    if (modal) modal.classList.remove('active');
}

async function submitCustomEvent() {
    const type = document.getElementById('customEventType')?.value || 'Observation';
    const note = document.getElementById('customEventNote')?.value || '';
    if (!note.trim()) {
        alert(window.currentLang === 'en' ? 'Please enter note text' : window.currentLang === 'bg' ? 'Въведете текст на бележката' : 'Введите текст наблюдения');
        return;
    }
    await quickLogEvent(type, note);
    document.getElementById('customEventNote').value = '';
    closeCustomEventModal();
}

function toggleCrisisItem(element) {
    element.classList.toggle('open');
}

function onSessionClientChanged() {}

window.startOrResumeSession = startOrResumeSession;
window.pauseSession = pauseSession;
window.finishSession = finishSession;
window.quickLogEvent = quickLogEvent;
window.promptCustomEvent = promptCustomEvent;
window.closeCustomEventModal = closeCustomEventModal;
window.submitCustomEvent = submitCustomEvent;
window.toggleCrisisItem = toggleCrisisItem;
window.onSessionClientChanged = onSessionClientChanged;
window.updateSessionUI = updateSessionUI;
