/**
 * Watts Connectedness Scale (WCS-19) Interactive Clinical Tool
 * Based on: Watts R. et al. (2022) Psychopharmacology — 19 items, 0-100 VAS.
 * Reverse-scored items: 1 (R), 8 (R), 12 (R), 13 (R).
 * Subscales: CTS (items 2-7), CTO (items 1R,8R,9,10,12R,13R), CTW (items 11,14-19).
 * Multilingual: Russian (ru), English (en), Bulgarian (bg).
 */

const WCS_QUESTIONS_I18N = {
    ru: [
        // CTO — Связь с другими (reverse-scored)
        { id: 1, block: 'others', text: 'Мне трудно сопереживать другим людям', reverse: true },
        // CTS — Связь с собой
        { id: 2, block: 'self', text: 'Я чувствую себя в контакте со своими эмоциями', reverse: false },
        { id: 3, block: 'self', text: 'Я ощущаю внутреннее спокойствие и умиротворение', reverse: false },
        { id: 4, block: 'self', text: 'Я принимаю себя таким, какой я есть', reverse: false },
        { id: 5, block: 'self', text: 'Я чувствую, что живу в соответствии со своими ценностями', reverse: false },
        { id: 6, block: 'self', text: 'Я ощущаю, что моя жизнь имеет цель и направление', reverse: false },
        { id: 7, block: 'self', text: 'Я чувствую себя комфортно наедине с собой', reverse: false },
        // CTO — Связь с другими (reverse-scored)
        { id: 8, block: 'others', text: 'Мне сложно доверять другим людям', reverse: true },
        // CTO — Связь с другими (direct)
        { id: 9, block: 'others', text: 'Я чувствую близость и связь с другими людьми', reverse: false },
        { id: 10, block: 'others', text: 'Я чувствую себя частью сообщества', reverse: false },
        // CTW — Связь с миром
        { id: 11, block: 'world', text: 'Я чувствую себя связанным с окружающим миром', reverse: false },
        // CTO — Связь с другими (reverse-scored)
        { id: 12, block: 'others', text: 'Мне сложно быть открытым с другими людьми', reverse: true },
        { id: 13, block: 'others', text: 'Я чувствую себя отрезанным от других людей', reverse: true },
        // CTW — Связь с миром
        { id: 14, block: 'world', text: 'Я чувствую благоговение перед красотой жизни', reverse: false },
        { id: 15, block: 'world', text: 'Я ценю и замечаю простые вещи в жизни', reverse: false },
        { id: 16, block: 'world', text: 'Я чувствую себя частью природного мира', reverse: false },
        { id: 17, block: 'world', text: 'Я чувствую себя частью чего-то большего, чем я сам', reverse: false },
        { id: 18, block: 'world', text: 'Я ощущаю гармонию и связь со всем живым', reverse: false },
        { id: 19, block: 'world', text: 'Я чувствую себя свободным', reverse: false }
    ],

    en: [
        { id: 1, block: 'others', text: 'I find it hard to empathize with other people', reverse: true },
        { id: 2, block: 'self', text: 'I feel in touch with my emotions', reverse: false },
        { id: 3, block: 'self', text: 'I feel an inner calm and peacefulness', reverse: false },
        { id: 4, block: 'self', text: 'I accept myself as I am', reverse: false },
        { id: 5, block: 'self', text: 'I feel I am living in accordance with my values', reverse: false },
        { id: 6, block: 'self', text: 'I feel my life has a sense of purpose and direction', reverse: false },
        { id: 7, block: 'self', text: 'I feel comfortable being alone with myself', reverse: false },
        { id: 8, block: 'others', text: 'I find it difficult to trust other people', reverse: true },
        { id: 9, block: 'others', text: 'I feel close and connected to other people', reverse: false },
        { id: 10, block: 'others', text: 'I feel part of a community', reverse: false },
        { id: 11, block: 'world', text: 'I feel connected to the world around me', reverse: false },
        { id: 12, block: 'others', text: 'I find it hard to be open with other people', reverse: true },
        { id: 13, block: 'others', text: 'I feel cut off from other people', reverse: true },
        { id: 14, block: 'world', text: 'I feel awe at the beauty of life', reverse: false },
        { id: 15, block: 'world', text: 'I appreciate and notice simple things in life', reverse: false },
        { id: 16, block: 'world', text: 'I feel part of the natural world', reverse: false },
        { id: 17, block: 'world', text: 'I feel part of something larger than myself', reverse: false },
        { id: 18, block: 'world', text: 'I feel a sense of harmony and connection with all living things', reverse: false },
        { id: 19, block: 'world', text: 'I feel free', reverse: false }
    ],

    bg: [
        { id: 1, block: 'others', text: 'Трудно ми е да съпреживявам с другите хора', reverse: true },
        { id: 2, block: 'self', text: 'Чувствам се в контакт с емоциите си', reverse: false },
        { id: 3, block: 'self', text: 'Чувствам вътрешен мир и спокойствие', reverse: false },
        { id: 4, block: 'self', text: 'Приемам се такъв, какъвто съм', reverse: false },
        { id: 5, block: 'self', text: 'Чувствам, че живея в съгласие с ценностите си', reverse: false },
        { id: 6, block: 'self', text: 'Чувствам, че животът ми има цел и посока', reverse: false },
        { id: 7, block: 'self', text: 'Чувствам се комфортно сам със себе си', reverse: false },
        { id: 8, block: 'others', text: 'Трудно ми е да се доверявам на другите хора', reverse: true },
        { id: 9, block: 'others', text: 'Чувствам близост и свързаност с другите хора', reverse: false },
        { id: 10, block: 'others', text: 'Чувствам се част от общност', reverse: false },
        { id: 11, block: 'world', text: 'Чувствам се свързан с околния свят', reverse: false },
        { id: 12, block: 'others', text: 'Трудно ми е да бъда открит с другите хора', reverse: true },
        { id: 13, block: 'others', text: 'Чувствам се откъснат от другите хора', reverse: true },
        { id: 14, block: 'world', text: 'Изпитвам благоговение пред красотата на живота', reverse: false },
        { id: 15, block: 'world', text: 'Ценя и забелязвам простите неща в живота', reverse: false },
        { id: 16, block: 'world', text: 'Чувствам се част от природния свят', reverse: false },
        { id: 17, block: 'world', text: 'Чувствам се част от нещо по-голямо от мен', reverse: false },
        { id: 18, block: 'world', text: 'Чувствам хармония и свързаност с всичко живо', reverse: false },
        { id: 19, block: 'world', text: 'Чувствам се свободен', reverse: false }
    ]
};

// Reverse-scored item IDs (Watts et al. 2022)
const WCS_REVERSE_ITEMS = [1, 8, 12, 13];

let wcsAnswers = {};

function getWcsQuestions() {
    const lang = window.currentLang || localStorage.getItem('ospat_lang') || 'ru';
    return WCS_QUESTIONS_I18N[lang] || WCS_QUESTIONS_I18N['ru'];
}

/**
 * Returns the effective score for a question (applying reverse scoring where needed).
 * Raw value is 0-100 VAS. Reverse: 100 - raw.
 */
function getEffectiveScore(questionId, rawValue) {
    if (WCS_REVERSE_ITEMS.includes(questionId)) {
        return 100 - rawValue;
    }
    return rawValue;
}

function initWcsTool() {
    const container = document.getElementById('wcsQuestionsContainer');
    if (!container) return;

    const questions = getWcsQuestions();

    // Initialize answers to 50 (midpoint) if empty
    if (Object.keys(wcsAnswers).length === 0) {
        questions.forEach(q => wcsAnswers[q.id] = 50);
    }

    const lang = window.currentLang || 'ru';
    const blockTitles = {
        ru: {
            self: { title: "Блок I. Связь с собой (CTS)", sub: "Контакт с эмоциями, внутренний покой, самопринятие (пункты 2–7)" },
            others: { title: "Блок II. Связь с другими (CTO)", sub: "Эмпатия, доверие, близость, открытость (пункты 1ᴿ, 8ᴿ, 9, 10, 12ᴿ, 13ᴿ)" },
            world: { title: "Блок III. Связь с миром (CTW)", sub: "Благоговение, природа, смысл, свобода (пункты 11, 14–19)" }
        },
        en: {
            self: { title: "Block I. Connection to Self (CTS)", sub: "Emotional contact, inner peace, self-acceptance (items 2–7)" },
            others: { title: "Block II. Connection to Others (CTO)", sub: "Empathy, trust, closeness, openness (items 1ᴿ, 8ᴿ, 9, 10, 12ᴿ, 13ᴿ)" },
            world: { title: "Block III. Connection to World (CTW)", sub: "Awe, nature, meaning, freedom (items 11, 14–19)" }
        },
        bg: {
            self: { title: "Блок I. Връзка със себе си (CTS)", sub: "Контакт с емоции, вътрешен мир, себеприемане (точки 2–7)" },
            others: { title: "Блок II. Връзка с другите (CTO)", sub: "Емпатия, доверие, близост, откритост (точки 1ᴿ, 8ᴿ, 9, 10, 12ᴿ, 13ᴿ)" },
            world: { title: "Блок III. Връзка със света (CTW)", sub: "Благоговение, природа, смисъл, свобода (точки 11, 14–19)" }
        }
    };

    const b = blockTitles[lang] || blockTitles['ru'];

    const reverseLbl = lang === 'en' ? '(Reverse-scored)' : lang === 'bg' ? '(Обратно оценяван)' : '(Обратный балл)';

    let html = `
        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.self.title}</h3>
                    <small class="text-muted">${b.self.sub}</small>
                </div>
                <span class="badge badge-prep" id="blockScoreSelfBadge">50%</span>
            </div>
            ${renderBlockQuestions('self', reverseLbl)}
        </div>

        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.others.title}</h3>
                    <small class="text-muted">${b.others.sub}</small>
                </div>
                <span class="badge badge-session" id="blockScoreOthersBadge">50%</span>
            </div>
            ${renderBlockQuestions('others', reverseLbl)}
        </div>

        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.world.title}</h3>
                    <small class="text-muted">${b.world.sub}</small>
                </div>
                <span class="badge badge-integ" id="blockScoreWorldBadge">50%</span>
            </div>
            ${renderBlockQuestions('world', reverseLbl)}
        </div>
    `;

    container.innerHTML = html;
    updateWcsTotals();
}

function renderBlockQuestions(blockName, reverseLbl) {
    const questions = getWcsQuestions().filter(q => q.block === blockName);
    const lang = window.currentLang || 'ru';

    const leftAnchor = lang === 'en' ? 'Not at all' : lang === 'bg' ? 'Изобщо не' : 'Совсем нет';
    const rightAnchor = lang === 'en' ? 'Completely' : lang === 'bg' ? 'Напълно' : 'Полностью';

    return questions.map(q => {
        const val = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 50;
        const reverseTag = q.reverse ? ` <span class="wcs-reverse-tag">${reverseLbl}</span>` : '';
        return `
            <div class="wcs-q-row">
                <div class="wcs-q-text">
                    <strong>№${q.id}.</strong> ${q.text}${reverseTag}
                </div>
                <div class="wcs-slider-container">
                    <span class="wcs-anchor-left">${leftAnchor}</span>
                    <input type="range" min="0" max="100" value="${val}" class="wcs-slider"
                           id="wcs_slider_${q.id}"
                           oninput="setWcsScore(${q.id}, parseInt(this.value))">
                    <span class="wcs-anchor-right">${rightAnchor}</span>
                    <span class="wcs-slider-val" id="wcs_val_${q.id}">${val}</span>
                </div>
            </div>
        `;
    }).join('');
}

function setWcsScore(questionId, score) {
    wcsAnswers[questionId] = score;

    const valEl = document.getElementById(`wcs_val_${questionId}`);
    if (valEl) valEl.innerText = score;

    updateWcsTotals();
}

function updateWcsTotals() {
    const questions = getWcsQuestions();

    // Calculate mean effective score per subscale (0-100 scale)
    let selfScores = [];
    let othersScores = [];
    let worldScores = [];

    questions.forEach(q => {
        const raw = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 50;
        const effective = getEffectiveScore(q.id, raw);
        if (q.block === 'self') selfScores.push(effective);
        else if (q.block === 'others') othersScores.push(effective);
        else if (q.block === 'world') worldScores.push(effective);
    });

    const meanSelf = selfScores.length > 0 ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length : 0;
    const meanOthers = othersScores.length > 0 ? othersScores.reduce((a, b) => a + b, 0) / othersScores.length : 0;
    const meanWorld = worldScores.length > 0 ? worldScores.reduce((a, b) => a + b, 0) / worldScores.length : 0;

    const allEffective = [...selfScores, ...othersScores, ...worldScores];
    const meanTotal = allEffective.length > 0 ? allEffective.reduce((a, b) => a + b, 0) / allEffective.length : 0;

    const roundedSelf = Math.round(meanSelf);
    const roundedOthers = Math.round(meanOthers);
    const roundedWorld = Math.round(meanWorld);
    const roundedTotal = Math.round(meanTotal);

    const elSelf = document.getElementById('wcsScoreSelf');
    const elOthers = document.getElementById('wcsScoreOthers');
    const elWorld = document.getElementById('wcsScoreWorld');
    const elTotal = document.getElementById('wcsScoreTotal');
    const elLevel = document.getElementById('wcsScoreLevel');

    if (elSelf) elSelf.innerText = roundedSelf;
    if (elOthers) elOthers.innerText = roundedOthers;
    if (elWorld) elWorld.innerText = roundedWorld;
    if (elTotal) elTotal.innerText = roundedTotal;

    const bSelf = document.getElementById('blockScoreSelfBadge');
    const bOthers = document.getElementById('blockScoreOthersBadge');
    const bWorld = document.getElementById('blockScoreWorldBadge');
    if (bSelf) bSelf.innerText = `${roundedSelf}%`;
    if (bOthers) bOthers.innerText = `${roundedOthers}%`;
    if (bWorld) bWorld.innerText = `${roundedWorld}%`;

    if (elLevel) {
        elLevel.className = 'wcs-badge-level';
        if (roundedTotal <= 33) {
            elLevel.innerText = window.t ? window.t('wcs_lvl_disconn') : 'Отчуждение';
        } else if (roundedTotal <= 66) {
            elLevel.classList.add('moderate');
            elLevel.innerText = window.t ? window.t('wcs_lvl_mod') : 'Умеренная связность';
        } else {
            elLevel.classList.add('high');
            elLevel.innerText = window.t ? window.t('wcs_lvl_high') : 'Высокая интеграция';
        }
    }
}

async function saveWcsAssessment() {
    const clientSelect = document.getElementById('wcsClientSelect');
    const stageSelect = document.getElementById('wcsStageSelect');

    const clientId = clientSelect ? clientSelect.value : null;
    if (!clientId) {
        const msg = window.t ? (window.currentLang === 'en' ? 'Please select a client to save this assessment to their profile.' : window.currentLang === 'bg' ? 'Моля, изберете клиент, за да запазите замерването в досието му.' : 'Пожалуйста, выберите клиента для сохранения замера в его карточку.') : 'Пожалуйста, выберите клиента';
        alert(msg);
        return;
    }

    const questions = getWcsQuestions();
    let selfScores = [], othersScores = [], worldScores = [];

    questions.forEach(q => {
        const raw = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 50;
        const effective = getEffectiveScore(q.id, raw);
        if (q.block === 'self') selfScores.push(effective);
        else if (q.block === 'others') othersScores.push(effective);
        else if (q.block === 'world') worldScores.push(effective);
    });

    const meanSelf = Math.round(selfScores.reduce((a, b) => a + b, 0) / selfScores.length);
    const meanOthers = Math.round(othersScores.reduce((a, b) => a + b, 0) / othersScores.length);
    const meanWorld = Math.round(worldScores.reduce((a, b) => a + b, 0) / worldScores.length);
    const allScores = [...selfScores, ...othersScores, ...worldScores];
    const meanTotal = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    const payload = {
        client_id: parseInt(clientId),
        assessment_type: 'wcs',
        stage: stageSelect ? stageSelect.value : 'baseline',
        score_self: meanSelf,
        score_others: meanOthers,
        score_world: meanWorld,
        score_total: meanTotal,
        data: wcsAnswers
    };

    try {
        const res = await fetch('/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'ok') {
            const successMsg = window.currentLang === 'en' ? `WCS-19 Assessment saved!\nTotal Connectedness: ${meanTotal}%` : window.currentLang === 'bg' ? `Замерването по WCS-19 е запазено!\nОбща свързаност: ${meanTotal}%` : `Замер WCS-19 сохранён!\nОбщая связанность: ${meanTotal}%`;
            alert(successMsg);
            if (window.selectedClientId == clientId && typeof window.loadClientDossier === 'function') {
                window.loadClientDossier(clientId);
            }
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

window.initWcsTool = initWcsTool;
window.setWcsScore = setWcsScore;
window.saveWcsAssessment = saveWcsAssessment;
