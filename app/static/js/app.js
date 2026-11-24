/**
 * OSPAT Clinical Control Center - Main JavaScript
 * Handles routing, clients CRM, materials dispatching to Telegram, settings, and library.
 * Multilingual support (RU, EN, BG).
 */

let clientsList = [];
let selectedClientId = null;
let materialsCatalog = [];
let currentViewingMaterial = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();
    initApp();
});

async function initApp() {
    initTheme();
    initTabs();
    initLanguageSwitcher();
    await checkTelegramConnection();
    await loadClients();
    await loadMaterials();
    await loadTelegramHistory();
    initWcsTool();
    updateDashboardStats();

    // Apply saved language
    const savedLang = localStorage.getItem('ospat_lang') || 'ru';
    setLanguage(savedLang);
}

// ---------------- THEME SWITCHER ----------------

function initTheme() {
    const savedTheme = localStorage.getItem('ospat_theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    if (normalized === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('ospat_theme', normalized);
    updateThemeToggleUI();
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
}

function updateThemeToggleUI() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const iconName = isDark ? 'sun' : 'moon';
    const labelKey = isDark ? 'theme_light' : 'theme_dark';
    const fallback = isDark ? 'Светлая тема' : 'Тёмная тема';
    btn.innerHTML = `<i data-lucide="${iconName}" id="themeToggleIcon"></i> <span id="themeToggleLabel" data-i18n="${labelKey}">${window.t ? window.t(labelKey, fallback) : fallback}</span>`;
    if (window.lucide) window.lucide.createIcons();
}

window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.updateThemeToggleUI = updateThemeToggleUI;

// ---------------- LANGUAGE SWITCHER ----------------

function initLanguageSwitcher() {
    const savedLang = localStorage.getItem('ospat_lang') || 'ru';
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === savedLang);
        btn.addEventListener('click', (e) => {
            const lang = e.currentTarget.dataset.lang;
            setLanguage(lang);
        });
    });
}

// ---------------- TAB NAVIGATION ----------------

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchTab(target);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
    });

    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    if (tabName === 'telegram-hub') {
        loadRecentTgChats();
        loadTelegramHistory();
    }
}

function openProtocolPhase(phase) {
    switchTab('protocol');
    switchProtocolSub(phase === 'prep' ? 'prep' : phase === 'nav' ? 'session' : 'integ');
}

function switchProtocolSub(sub) {
    document.querySelectorAll('.protocol-step-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.protocol-nav-btns button').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`protocol-sub-${sub}`);
    if (target) target.classList.add('active');
}

function switchToolSub(tool) {
    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tool-switch-btns button').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tool-sub-${tool}`);
    if (target) target.classList.add('active');
}


// ---------------- TELEGRAM CONNECTION & SETTINGS ----------------

async function checkTelegramConnection() {
    const pill = document.getElementById('tgHeaderPill');
    const text = document.getElementById('tgStatusText');

    try {
        const res = await fetch('/api/telegram/status');
        const data = await res.json();

        if (data.connected) {
            pill.className = 'tg-status-pill connected';
            const template = window.t('tg_connected', 'Бот @{bot} активен');
            text.innerText = template.replace('{bot}', data.bot_username || '');
        } else if (data.configured) {
            pill.className = 'tg-status-pill disconnected';
            text.innerText = window.t('tg_error', 'Ошибка связи с ботом');
        } else {
            pill.className = 'tg-status-pill';
            text.innerText = window.t('tg_not_configured', 'Telegram не настроен');
        }
    } catch (e) {
        if (pill) pill.className = 'tg-status-pill disconnected';
        if (text) text.innerText = 'Offline';
    }
}

async function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        document.getElementById('settingBotToken').value = settings['telegram_bot_token'] || '';
        document.getElementById('settingTherapistName').value = settings['therapist_name'] || '';
    } catch (e) {
        console.error(e);
    }

    modal.classList.add('active');
}

function closeSettingsModal() {
    document.getElementById('settingsModal')?.classList.remove('active');
}

async function saveSettings() {
    const token = document.getElementById('settingBotToken').value.trim();
    const name = document.getElementById('settingTherapistName').value.trim();

    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'telegram_bot_token', value: token })
        });
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'therapist_name', value: name })
        });

        closeSettingsModal();
        await checkTelegramConnection();
        const successMsg = window.currentLang === 'en' ? 'Settings saved successfully!' : window.currentLang === 'bg' ? 'Настройките са запазени успешно!' : 'Настройки успешно сохранены!';
        alert(successMsg);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}


// ---------------- CLIENTS MANAGEMENT ----------------

async function loadClients() {
    try {
        const res = await fetch('/api/clients');
        clientsList = await res.json();

        renderClientsList();
        populateClientDropdowns();
        updateDashboardStats();
    } catch (e) {
        console.error('Error loading clients:', e);
    }
}

function renderClientsList(filtered = null) {
    const list = filtered || clientsList;
    const container = document.getElementById('clientsCardsContainer');
    const dashList = document.getElementById('dashboardClientsList');

    if (!container) return;

    if (list.length === 0) {
        const emptyMsg = window.currentLang === 'en' ? 'No clients yet. Add your first client above.' : window.currentLang === 'bg' ? 'Няма въведени клиенти. Добавете първи клиент от бутона горе.' : 'Нет клиентов. Добавьте первого клиента по кнопке выше.';
        container.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
        if (dashList) dashList.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
        return;
    }

    container.innerHTML = list.map(c => `
        <div class="client-item-card ${selectedClientId == c.id ? 'active' : ''}" onclick="selectClient(${c.id})">
            <h4>${c.name}</h4>
            <div class="client-item-sub">
                <span>${stageBadge(c.stage)}</span>
                <span>${c.phone || (c.telegram_username ? '@' + c.telegram_username : (window.currentLang === 'en' ? 'No contact' : window.currentLang === 'bg' ? 'Няма контакт' : 'Без контакта'))}</span>
            </div>
        </div>
    `).join('');

    if (dashList) {
        const sessWord = window.currentLang === 'en' ? 'Sessions' : window.currentLang === 'bg' ? 'Сесии' : 'Сессий';
        dashList.innerHTML = list.slice(0, 5).map(c => `
            <div class="client-item-card" onclick="switchTab('clients'); selectClient(${c.id});">
                <h4>${c.name}</h4>
                <div class="client-item-sub">
                    <span>${stageBadge(c.stage)}</span>
                    <span>${sessWord}: ${c.sessions_count || 0} | WCS: ${c.assessments_count || 0}</span>
                </div>
            </div>
        `).join('');
    }
}

function stageBadge(stage) {
    const lang = window.currentLang || 'ru';
    const labels = {
        ru: { preparation: 'Подготовка', ready_for_session: 'Готов к сессии', session_day: 'Сессия', integration: 'Интеграция', completed: 'Завершен' },
        en: { preparation: 'Preparation', ready_for_session: 'Ready for Session', session_day: 'Session Day', integration: 'Integration', completed: 'Completed' },
        bg: { preparation: 'Подготовка', ready_for_session: 'Готов за сесия', session_day: 'Сесия', integration: 'Интеграция', completed: 'Завършен' }
    };
    const dict = labels[lang] || labels['ru'];

    switch (stage) {
        case 'preparation':
            return `<span class="badge badge-prep">${dict.preparation}</span>`;
        case 'ready_for_session':
            return `<span class="badge badge-session">${dict.ready_for_session}</span>`;
        case 'session_day':
            return `<span class="badge badge-session">${dict.session_day}</span>`;
        case 'integration':
            return `<span class="badge badge-integ">${dict.integration}</span>`;
        case 'completed':
            return `<span class="badge badge-integ">${dict.completed}</span>`;
        default:
            return '<span class="badge">In progress</span>';
    }
}

function filterClients() {
    const q = document.getElementById('clientSearchInput')?.value.toLowerCase() || '';
    const filtered = clientsList.filter(c => 
        c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.telegram_username && c.telegram_username.toLowerCase().includes(q))
    );
    renderClientsList(filtered);
}

function populateClientDropdowns() {
    const selects = ['sessionClientSelect', 'tgClientSelect', 'wcsClientSelect'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const currentVal = el.value;
        const defaultOption = el.options[0].outerHTML;
        el.innerHTML = defaultOption + clientsList.map(c => `
            <option value="${c.id}">${c.name} ${c.telegram_id ? `(TG ID: ${c.telegram_id})` : ''}</option>
        `).join('');
        el.value = currentVal;
    });
}

async function selectClient(clientId) {
    selectedClientId = clientId;
    renderClientsList();
    await loadClientDossier(clientId);
}

async function loadClientDossier(clientId) {
    const emptyView = document.getElementById('clientDossierEmpty');
    const contentView = document.getElementById('clientDossierContent');

    try {
        const res = await fetch(`/api/clients/${clientId}`);
        const data = await res.json();
        const client = data.client;
        const sessions = data.sessions || [];
        const assessments = data.assessments || [];

        emptyView.style.display = 'none';
        contentView.style.display = 'block';

        const notUnlinked = window.currentLang === 'en' ? 'Telegram not linked' : window.currentLang === 'bg' ? 'Няма Telegram' : 'Telegram не привязан';
        const noPhone = window.currentLang === 'en' ? 'Phone not set' : window.currentLang === 'bg' ? 'Няма телефон' : 'Телефон не указан';

        document.getElementById('dossierName').innerText = client.name;
        document.getElementById('dossierTg').innerText = client.telegram_username ? `@${client.telegram_username} (ID: ${client.telegram_id || '—'})` : (client.telegram_id ? `TG ID: ${client.telegram_id}` : notUnlinked);
        document.getElementById('dossierPhone').innerText = client.phone ? `${client.phone}` : noPhone;
        document.getElementById('dossierStageBadge').outerHTML = `<span id="dossierStageBadge">${stageBadge(client.stage)}</span>`;

        document.getElementById('dossierIntention').innerText = client.intention || '—';
        document.getElementById('dossierMedical').innerText = client.medical_notes || '—';
        document.getElementById('dossierEmergency').innerText = client.emergency_contact || '—';
        document.getElementById('dossierNotes').innerText = client.notes || '—';

        // Render Sessions
        const sessList = document.getElementById('dossierSessionsList');
        if (sessions.length === 0) {
            sessList.innerHTML = `<p class="text-muted">${window.currentLang === 'en' ? 'No sessions launched for this client yet.' : window.currentLang === 'bg' ? 'Все още няма проведени сесии за този клиент.' : 'Для этого клиента еще не запускались сессии.'}</p>`;
        } else {
            sessList.innerHTML = sessions.map(s => `
                <div class="card" style="margin-bottom: 12px;">
                    <div class="card-header">
                        <strong>Session #${s.id} — ${s.session_date || s.created_at?.slice(0, 10)}</strong>
                        <span class="badge badge-${s.status === 'completed' ? 'integ' : 'session'}">${s.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>${window.currentLang === 'en' ? 'Substance / Dose:' : window.currentLang === 'bg' ? 'Вещество / Доза:' : 'Препарат / доза:'}</strong> ${s.substance} (${s.dose})</p>
                        <p><strong>${window.currentLang === 'en' ? 'Phase Status:' : window.currentLang === 'bg' ? 'Статус на фазата:' : 'Статус фазы:'}</strong> ${s.phase}</p>
                    </div>
                </div>
            `).join('');
        }

        // Render WCS Comparison
        const wcsContainer = document.getElementById('dossierWcsContainer');
        const wcsList = assessments.filter(a => a.assessment_type === 'wcs');
        if (wcsList.length === 0) {
            wcsContainer.innerHTML = `<p class="text-muted">${window.currentLang === 'en' ? 'No WCS assessments recorded yet. Use the Tools tab to conduct an assessment.' : window.currentLang === 'bg' ? 'Все още няма WCS замервания. Отворете таб Инструменти за тестване.' : 'Замеры WCS еще не проводились. Перейдите во вкладку «Инструменты» для тестирования.'}</p>`;
        } else {
            const baseline = wcsList.find(a => a.stage === 'baseline');
            const integration = wcsList.find(a => a.stage === 'integration');

            let deltaHtml = '';
            if (baseline && integration) {
                const delta = integration.score_total - baseline.score_total;
                const sign = delta >= 0 ? '+' : '';
                const deltaLabel = window.currentLang === 'en' ? `Integration Dynamics (Delta): Total score changed by <strong>${sign}${delta} points</strong> (from ${baseline.score_total} to ${integration.score_total}).` : window.currentLang === 'bg' ? `Динамика на интеграцията (Делта): Общият сбор се промени с <strong>${sign}${delta} точки</strong> (от ${baseline.score_total} на ${integration.score_total}).` : `Динамика интеграции (Дельта): Общий балл изменился на <strong>${sign}${delta} баллов</strong> (с ${baseline.score_total} до ${integration.score_total}).`;
                deltaHtml = `
                    <div class="alert alert-info" style="margin-top: 14px;">
                        ${deltaLabel}
                    </div>
                `;
            }

            const lblBase = window.currentLang === 'en' ? 'Baseline (Before)' : window.currentLang === 'bg' ? 'Базово ниво (Преди)' : 'Базовый уровень (До)';
            const lblInteg = window.currentLang === 'en' ? 'Integration (After)' : window.currentLang === 'bg' ? 'Интеграция (След)' : 'Интеграция (После)';

            wcsContainer.innerHTML = `
                <div class="wcs-score-dashboard">
                    ${wcsList.map(item => `
                        <div class="wcs-score-card">
                            <span class="wcs-score-label">${item.stage === 'baseline' ? lblBase : lblInteg}</span>
                            <div class="wcs-score-val">${item.score_total} / 126</div>
                            <small class="text-muted">Self: ${item.score_self} | Others: ${item.score_others} | World: ${item.score_world}</small>
                        </div>
                    `).join('')}
                </div>
                ${deltaHtml}
            `;
        }
    } catch (e) {
        console.error('Error loading dossier:', e);
    }
}

function switchDossierTab(tab, evt) {
    document.querySelectorAll('.d-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dossier-section').forEach(s => s.classList.remove('active'));

    const btn = evt ? evt.currentTarget : (typeof event !== 'undefined' && event?.target ? event.target : null);
    if (btn) btn.classList.add('active');
    document.getElementById(`dossier-view-${tab}`)?.classList.add('active');
}

function openNewClientModal() {
    document.getElementById('editClientId').value = '';
    document.getElementById('clientModalTitle').innerHTML = `<i data-lucide="user-plus"></i> <span>${window.t('btn_add_client')}</span>`;
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientPhoneInput').value = '';
    document.getElementById('clientUsernameInput').value = '';
    document.getElementById('clientChatIdInput').value = '';
    document.getElementById('clientStageSelect').value = 'preparation';
    document.getElementById('clientEmergencyInput').value = '';
    document.getElementById('clientIntentionInput').value = '';
    document.getElementById('clientMedicalInput').value = '';
    document.getElementById('clientNotesInput').value = '';

    document.getElementById('clientModal')?.classList.add('active');
}

function openEditClientModal() {
    const c = clientsList.find(x => x.id == selectedClientId);
    if (!c) return;

    document.getElementById('editClientId').value = c.id;
    document.getElementById('clientModalTitle').innerHTML = `<i data-lucide="pencil"></i> <span>${window.t('btn_edit')}</span>`;
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('clientNameInput').value = c.name || '';
    document.getElementById('clientPhoneInput').value = c.phone || '';
    document.getElementById('clientUsernameInput').value = c.telegram_username || '';
    document.getElementById('clientChatIdInput').value = c.telegram_id || '';
    document.getElementById('clientStageSelect').value = c.stage || 'preparation';
    document.getElementById('clientEmergencyInput').value = c.emergency_contact || '';
    document.getElementById('clientIntentionInput').value = c.intention || '';
    document.getElementById('clientMedicalInput').value = c.medical_notes || '';
    document.getElementById('clientNotesInput').value = c.notes || '';

    document.getElementById('clientModal')?.classList.add('active');
}

function closeClientModal() {
    document.getElementById('clientModal')?.classList.remove('active');
}

async function saveClientForm() {
    const id = document.getElementById('editClientId').value;
    const name = document.getElementById('clientNameInput').value.trim();
    if (!name) {
        alert(window.currentLang === 'en' ? 'Please enter client name' : window.currentLang === 'bg' ? 'Въведете име на клиента' : 'Введите имя клиента');
        return;
    }

    const payload = {
        name: name,
        phone: document.getElementById('clientPhoneInput').value.trim(),
        telegram_username: document.getElementById('clientUsernameInput').value.trim().replace('@', ''),
        telegram_id: document.getElementById('clientChatIdInput').value.trim(),
        stage: document.getElementById('clientStageSelect').value,
        emergency_contact: document.getElementById('clientEmergencyInput').value.trim(),
        intention: document.getElementById('clientIntentionInput').value.trim(),
        medical_notes: document.getElementById('clientMedicalInput').value.trim(),
        notes: document.getElementById('clientNotesInput').value.trim()
    };

    try {
        if (id) {
            await fetch(`/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            selectedClientId = data.id;
        }

        closeClientModal();
        await loadClients();
        if (selectedClientId) {
            selectClient(selectedClientId);
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteCurrentClient() {
    if (!selectedClientId) return;
    const confirmDel = window.currentLang === 'en' ? 'Are you sure you want to delete this client and all associated sessions?' : window.currentLang === 'bg' ? 'Сигурни ли сте, че искате да изтриете този клиент и свързаните сесии?' : 'Вы действительно хотите удалить этого клиента и все связанные сессии?';
    if (!confirm(confirmDel)) return;

    try {
        await fetch(`/api/clients/${selectedClientId}`, { method: 'DELETE' });
        selectedClientId = null;
        document.getElementById('clientDossierContent').style.display = 'none';
        document.getElementById('clientDossierEmpty').style.display = 'block';
        await loadClients();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}


// ---------------- TELEGRAM DISPATCHER & MATERIALS ----------------

const MATERIALS_I18N = {
    en: {
        screening_pdf: { title: "Pre-Session Screening Questionnaire (PDF)", category: "Preparation" },
        checklist_pdf: { title: "Session Readiness Checklist (PDF)", category: "Setting" },
        wcs_pdf: { title: "Rosalind Watts Connectedness Scale WCS (PDF)", category: "Diagnostics" },
        post_01_difficult: { title: "Field Guide: Difficult Experiences (Dive In)", category: "Client Education" },
        post_02_framing: { title: "Priming: Trust, Let Go, Be Open", category: "Client Education" },
        post_03_music: { title: "Music as a Hidden Pharmacological Agent", category: "Setting & Sound" },
        post_04_neuroplasticity: { title: "Neuroplasticity Window & Integration", category: "Integration" },
        post_05_holding: { title: "Non-Directive Spaceholding Guide", category: "Methodology" },
        guide_prep: { title: "Facilitator Guide: Preparation Meetings", category: "Clinical Protocol" },
        guide_nav: { title: "Facilitator Guide: Session Day & Navigation", category: "Clinical Protocol" },
        guide_integ: { title: "Facilitator Guide: Post-Session Integration", category: "Clinical Protocol" }
    },
    bg: {
        screening_pdf: { title: "Анкета за предварителен скрининг (PDF)", category: "Подготовка" },
        checklist_pdf: { title: "Чек-лист за готовност за сесия (PDF)", category: "Обстановка" },
        wcs_pdf: { title: "Скала за свързаност на Розалинд Уотс WCS (PDF)", category: "Диагностика" },
        post_01_difficult: { title: "Памятка: Работа с трудни преживявания (Dive In)", category: "Обучение" },
        post_02_framing: { title: "Нагласа: Доверявай се, Отпусни контрола", category: "Обучение" },
        post_03_music: { title: "Музиката като скрит фармакологичен агент", category: "Музика & Звук" },
        post_04_neuroplasticity: { title: "Прозорец на невропластичност и интеграция", category: "Интеграция" },
        post_05_holding: { title: "Недирективно задържане на пространството", category: "Методология" },
        guide_prep: { title: "Ръководство: Подготвителни срещи", category: "Клиничен протокол" },
        guide_nav: { title: "Ръководство: Ден на сесията и навигация", category: "Клиничен протокол" },
        guide_integ: { title: "Ръководство: Послесесийна интеграция", category: "Клиничен протокол" }
    }
};

async function loadMaterials() {
    try {
        const lang = window.currentLang || 'ru';
        const res = await fetch(`/api/materials?lang=${lang}`);
        materialsCatalog = await res.json();

        const localizedDict = MATERIALS_I18N[lang] || {};

        materialsCatalog.forEach(m => {
            if (localizedDict[m.id]) {
                m.display_title = localizedDict[m.id].title;
                m.display_category = localizedDict[m.id].category;
            } else {
                m.display_title = m.title;
                m.display_category = m.category;
            }
        });

        const select = document.getElementById('tgMaterialSelect');
        if (select) {
            select.innerHTML = `<option value="">${window.t('opt_choose_mat')}</option>` +
                materialsCatalog.map(m => `
                    <option value="${m.id}">[${m.display_category}] ${m.display_title}</option>
                `).join('');
        }

        renderLibraryMenu();
    } catch (e) {
        console.error('Error loading materials:', e);
    }
}

function onTgClientSelected() {
    const cid = document.getElementById('tgClientSelect')?.value;
    if (!cid) return;
    const client = clientsList.find(c => c.id == cid);
    if (client && client.telegram_id) {
        document.getElementById('tgChatIdInput').value = client.telegram_id;
    } else if (client && client.telegram_username) {
        document.getElementById('tgChatIdInput').value = client.telegram_username;
    }
}

function onTgMaterialSelected() {
    const mid = document.getElementById('tgMaterialSelect')?.value;
    if (!mid) return;
    const mat = materialsCatalog.find(m => m.id === mid);
    if (mat && mat.default_caption) {
        document.getElementById('tgCaptionInput').value = mat.default_caption;
    }
}

function applyCaptionTemplate(type) {
    const field = document.getElementById('tgCaptionInput');
    if (!field) return;
    const lang = window.currentLang || 'ru';

    const templates = {
        ru: {
            screening: 'Здравствуйте! Отправляю вам анкету предварительного скрининга. Пожалуйста, внимательно заполните ее и отправьте мне до нашей первой встречи.',
            checklist: 'Здравствуйте! Направляю вам памятку и чек-лист подготовки к сессии. Обратите особое внимание на правила за 3-5 дней и вечер накануне.',
            navigation: 'Памятка по внутреннему состоянию на сессии: «Trust, Let Go, Be Open». Если встретится страх или чудовище — сделайте шаг навстречу.',
            integration: 'Памятка по послесессионной интеграции: забота о теле, правило моратория 30 дней и опросник связанности Watts (WCS).'
        },
        en: {
            screening: 'Hello! I am sending you the preliminary intake and screening questionnaire. Please complete it thoroughly before our first preparatory session.',
            checklist: 'Hello! Here is the session readiness checklist and preparation guide. Please pay special attention to the guidelines 3–5 days prior and the evening before.',
            navigation: 'Session mindset guide: "Trust, Let Go, Be Open". If fear or intimidating imagery arises — take a courageous step forward into it.',
            integration: 'Post-session integration guide: somatic grounding, the 30-day moratorium rule, and the Watts Connectedness Scale (WCS).'
        },
        bg: {
            screening: 'Здравейте! Изпращам ви въпросника за предварителен скрининг. Моля, попълнете го внимателно преди нашата първа подготвителна среща.',
            checklist: 'Здравейте! Изпращам ви памятката и чек-листа за подготовка за сесията. Обърнете специално внимание на насоките за 3–5 дни преди това и вечерта преди сесията.',
            navigation: 'Памятка за вътрешното състояние по време на сесията: «Trust, Let Go, Be Open». Ако се появи страх — направете крачка право към него.',
            integration: 'Памятка за интеграция след сесията: грижа за тялото, правилото за 30-дневен мораториум и въпросника за свързаност на Розалинд Уотс (WCS).'
        }
    };

    const dict = templates[lang] || templates['ru'];
    if (dict[type]) {
        field.value = dict[type];
    }
}

async function loadRecentTgChats() {
    const container = document.getElementById('recentChatsList');
    if (!container) return;
    const searchMsg = window.currentLang === 'en' ? 'Searching for Telegram users...' : window.currentLang === 'bg' ? 'Търсене на потребители в Telegram...' : 'Поиск пользователей Telegram...';
    container.innerHTML = `<div class="empty-state text-muted">${searchMsg}</div>`;

    try {
        const res = await fetch('/api/telegram/recent-chats');
        const chats = await res.json();

        if (chats.length === 0) {
            const noChatsMsg = window.currentLang === 'en' ? 'No recent chats. Ask the client to open your bot and click /start.' : window.currentLang === 'bg' ? 'Няма скорошни чатове. Помолете клиента да отвори бота и да натисне /start.' : 'Новых диалогов нет. Попросите клиента открыть вашего бота и нажать /start.';
            container.innerHTML = `<div class="empty-state text-muted">${noChatsMsg}</div>`;
            return;
        }

        const pickWord = window.currentLang === 'en' ? 'Select' : window.currentLang === 'bg' ? 'Избери' : 'Выбрать';

        container.innerHTML = chats.map(c => `
            <div class="chat-item" onclick="pickChatId('${c.chat_id}', '${c.username || ''}')">
                <div class="chat-info">
                    <strong>${c.display_name}</strong>
                    <small>Chat ID: <code>${c.chat_id}</code> ${c.username ? '(@' + c.username + ')' : ''}</small>
                </div>
                <span class="btn-link">${pickWord}</span>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div class="empty-state text-muted">Telegram API Error</div>';
    }
}

function pickChatId(chatId, username) {
    document.getElementById('tgChatIdInput').value = chatId;

    if (selectedClientId) {
        const confirmMsg = window.currentLang === 'en' ? `Link this Telegram ID (${chatId}) to the selected client?` : window.currentLang === 'bg' ? `Свържи този Telegram ID (${chatId}) с избрания клиент?` : `Привязать этот Telegram ID (${chatId}) к выбранному клиенту?`;
        if (confirm(confirmMsg)) {
            fetch(`/api/clients/${selectedClientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: chatId,
                    telegram_username: username
                })
            }).then(() => {
                loadClients();
                selectClient(selectedClientId);
            });
        }
    }
}

async function executeTelegramSend() {
    const chatId = document.getElementById('tgChatIdInput')?.value.trim();
    const materialId = document.getElementById('tgMaterialSelect')?.value;
    const caption = document.getElementById('tgCaptionInput')?.value.trim();
    const statusEl = document.getElementById('tgSendStatus');

    if (!chatId) {
        alert(window.currentLang === 'en' ? 'Please specify recipient Telegram Chat ID!' : window.currentLang === 'bg' ? 'Моля, въведете Telegram Chat ID на получателя!' : 'Укажите Telegram Chat ID получателя!');
        return;
    }
    if (!materialId && !caption) {
        alert(window.currentLang === 'en' ? 'Select a file to send or write a message!' : window.currentLang === 'bg' ? 'Изберете файл за изпращане или напишете съобщение!' : 'Выберите файл для отправки или напишите текст сообщения!');
        return;
    }

    const sendingMsg = window.currentLang === 'en' ? 'Sending via Telegram...' : window.currentLang === 'bg' ? 'Изпращане в Telegram...' : 'Отправка в Telegram...';
    statusEl.innerHTML = `<span style="color: var(--accent-light);"><i data-lucide="loader-2" class="inline-icon"></i>${sendingMsg}</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
        const res = await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: selectedClientId ? parseInt(selectedClientId) : null,
                chat_id: chatId,
                material_id: materialId || null,
                caption: caption || null,
                custom_text: (!materialId && caption) ? caption : null,
                lang: window.currentLang || 'ru'
            })
        });

        const data = await res.json();
        if (res.ok && data.status === 'ok') {
            const successMsg = window.currentLang === 'en' ? 'Successfully delivered!' : window.currentLang === 'bg' ? 'Успешно изпратено!' : 'Успешно отправлено!';
            statusEl.innerHTML = `<span style="color: var(--color-success);"><i data-lucide="check-circle-2" class="inline-icon"></i>${successMsg}</span>`;
            if (window.lucide) window.lucide.createIcons();
            loadTelegramHistory();
            setTimeout(() => { statusEl.innerHTML = ''; }, 4000);
        } else {
            statusEl.innerHTML = `<span style="color: var(--color-danger);"><i data-lucide="x-circle" class="inline-icon"></i>${data.detail || 'Send failed'}</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) {
        statusEl.innerHTML = `<span style="color: var(--color-danger);"><i data-lucide="x-circle" class="inline-icon"></i>${e.message}</span>`;
        if (window.lucide) window.lucide.createIcons();
    }
}

function quickSend(materialId) {
    switchTab('telegram-hub');
    const matSelect = document.getElementById('tgMaterialSelect');
    if (matSelect) {
        matSelect.value = materialId;
        onTgMaterialSelected();
    }
    if (selectedClientId) {
        const cSelect = document.getElementById('tgClientSelect');
        if (cSelect) {
            cSelect.value = selectedClientId;
            onTgClientSelected();
        }
    }
}

function quickSendForCurrentClient() {
    if (!selectedClientId) return;
    quickSend('screening_pdf');
}

async function loadTelegramHistory() {
    const listEl = document.getElementById('tgHistoryList');
    if (!listEl) return;

    try {
        const res = await fetch('/api/telegram/history');
        const history = await res.json();

        if (history.length === 0) {
            const emptyHistoryMsg = window.currentLang === 'en' ? 'No dispatches recorded yet' : window.currentLang === 'bg' ? 'Все още няма изпратени файлове' : 'Отправок еще не было';
            listEl.innerHTML = `<div class="empty-state text-muted">${emptyHistoryMsg}</div>`;
            return;
        }

        listEl.innerHTML = history.map(h => `
            <div class="history-item">
                <div class="history-item-top">
                    <strong>${h.client_name || h.chat_id}</strong>
                    <span class="badge badge-${h.status === 'success' ? 'integ' : 'prep'}">${h.status}</span>
                </div>
                <div>${h.file_name || 'Message'}</div>
                <small class="text-muted">${h.sent_at?.slice(0, 16).replace('T', ' ')}</small>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}


// ---------------- CLINICAL LIBRARY ----------------

function renderLibraryMenu() {
    const container = document.getElementById('libraryItemsList');
    if (!container) return;

    container.innerHTML = materialsCatalog.map(m => `
        <button class="library-item-btn ${currentViewingMaterial?.id === m.id ? 'active' : ''}" 
                onclick="viewMaterial('${m.id}')">
            <i data-lucide="${m.type === 'pdf' ? 'file-text' : m.type === 'post' ? 'file-edit' : 'book-open'}"></i>
            <span>${m.display_title || m.title}</span>
        </button>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
}

async function viewMaterial(materialId) {
    const mat = materialsCatalog.find(m => m.id === materialId);
    if (!mat) return;
    currentViewingMaterial = mat;
    renderLibraryMenu();

    const titleEl = document.getElementById('libraryDocTitle');
    const actionsEl = document.getElementById('libraryDocActions');
    const contentEl = document.getElementById('libraryDocContent');

    titleEl.innerText = mat.display_title || mat.title;
    actionsEl.style.display = 'flex';

    document.getElementById('btnDownloadDoc').onclick = () => {
        window.open(`/api/materials/${mat.id}/download`, '_blank');
    };
    document.getElementById('btnSendDocTg').onclick = () => {
        quickSend(mat.id);
    };

    if (mat.type === 'pdf') {
        const descText = window.currentLang === 'en' ? 'Clinical PDF Document ready for printing or direct delivery via Telegram.' : window.currentLang === 'bg' ? 'Клиничен PDF документ за печат или директно изпращане в Telegram.' : 'PDF документ готов для печати или отправки клиенту в Telegram.';
        const dlBtn = window.currentLang === 'en' ? 'Download PDF' : window.currentLang === 'bg' ? 'Изтегли PDF' : 'Открыть / Скачать PDF';
        const tgBtn = window.currentLang === 'en' ? 'Send via Telegram' : window.currentLang === 'bg' ? 'Изпрати в Telegram' : 'Отправить клиенту через Telegram';

        contentEl.innerHTML = `
            <div class="alert alert-info">
                <strong>PDF:</strong> ${mat.description}
            </div>
            <p>${descText}</p>
            <div style="margin-top: 20px; display: flex; gap: 12px;">
                <a href="/api/materials/${mat.id}/download" class="btn btn-primary" target="_blank"><i data-lucide="download"></i> ${dlBtn}</a>
                <button class="btn btn-secondary" onclick="quickSend('${mat.id}')"><i data-lucide="send"></i> ${tgBtn}</button>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    } else {
        try {
            const lang = window.currentLang || 'ru';
            const res = await fetch(`/api/materials/${mat.id}/content?lang=${lang}`);
            const data = await res.json();
            contentEl.innerHTML = formatMarkdownText(data.content);
        } catch (e) {
            contentEl.innerHTML = `<p class="text-muted">Could not load document text.</p>`;
        }
    }
}

function formatMarkdownText(md) {
    if (!md) return '';
    let html = md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\n\n/gim, '<br><br>');
    return html;
}

function openWcsForClient() {
    switchTab('tools');
    switchToolSub('wcs');
    if (selectedClientId) {
        const el = document.getElementById('wcsClientSelect');
        if (el) el.value = selectedClientId;
    }
}

function updateDashboardStats() {
    const elClients = document.getElementById('statClientsCount');
    const elSessions = document.getElementById('statSessionsCount');
    const elWcs = document.getElementById('statWCSCount');

    if (elClients) elClients.innerText = clientsList.length;

    fetch('/api/sessions').then(r => r.json()).then(sessions => {
        if (elSessions) elSessions.innerText = sessions.length;
    }).catch(() => {});

    fetch('/api/assessments').then(r => r.json()).then(assessments => {
        if (elWcs) elWcs.innerText = assessments.filter(a => a.assessment_type === 'wcs').length;
    }).catch(() => {});
}

// Global exposure
window.switchTab = switchTab;
window.openProtocolPhase = openProtocolPhase;
window.switchProtocolSub = switchProtocolSub;
window.switchToolSub = switchToolSub;
window.checkTelegramConnection = checkTelegramConnection;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
window.selectClient = selectClient;
window.filterClients = filterClients;
window.switchDossierTab = switchDossierTab;
window.openNewClientModal = openNewClientModal;
window.openEditClientModal = openEditClientModal;
window.closeClientModal = closeClientModal;
window.saveClientForm = saveClientForm;
window.deleteCurrentClient = deleteCurrentClient;
window.onTgClientSelected = onTgClientSelected;
window.onTgMaterialSelected = onTgMaterialSelected;
window.applyCaptionTemplate = applyCaptionTemplate;
window.loadRecentTgChats = loadRecentTgChats;
window.pickChatId = pickChatId;
window.executeTelegramSend = executeTelegramSend;
window.quickSend = quickSend;
window.quickSendForCurrentClient = quickSendForCurrentClient;
window.loadTelegramHistory = loadTelegramHistory;
window.loadMaterials = loadMaterials;
window.viewMaterial = viewMaterial;
window.openWcsForClient = openWcsForClient;
