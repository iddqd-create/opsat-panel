/**
 * Rosalind Watts Connectedness Scale (WCS) Interactive Clinical Tool
 * Multilingual implementation in Russian (ru), English (en), and Bulgarian (bg).
 */

const WCS_QUESTIONS_I18N = {
    ru: [
        // БЛОК I. Связь с собой
        { id: 1, block: 'self', text: 'Я нахожусь в ясном контакте со своими истинными чувствами и эмоциями' },
        { id: 2, block: 'self', text: 'Я хорошо чувствую сигналы своего тела (напряжение, усталость, дыхание, тепло)' },
        { id: 3, block: 'self', text: 'Я отношусь к себе с искренним состраданием и добротой, даже когда ошибаюсь' },
        { id: 4, block: 'self', text: 'Я живу своей подлинной жизнью, а не следую навязанным извне ожиданиям' },
        { id: 5, block: 'self', text: 'Я доверяю своей интуиции и внутреннему голосу при принятии решений' },
        { id: 6, block: 'self', text: 'Я принимаю свои темные или уязвимые стороны без стыда и самобичевания' },
        { id: 7, block: 'self', text: 'Внутри меня есть устойчивое чувство собственного достоинства и ценности' },
        // БЛОК II. Связь с другими
        { id: 8, block: 'others', text: 'Я чувствую искреннюю душевную теплоту и эмпатию к окружающим людям' },
        { id: 9, block: 'others', text: 'В моих отношениях с близкими есть пространство для честной уязвимости' },
        { id: 10, block: 'others', text: 'Я ощущаю себя частью человеческого сообщества, а не одиноким изгоем' },
        { id: 11, block: 'others', text: 'Мне легко искренне слушать другого человека, не оценивая и не осуждая его' },
        { id: 12, block: 'others', text: 'Я способен прощать прошлые обиды и отпускать эмоциональный груз' },
        { id: 13, block: 'others', text: 'Я чувствую, что меня видят, слышат и принимают те, кто мне дорог' },
        { id: 14, block: 'others', text: 'Я ощущаю доверие к миру людей в целом' },
        // БЛОК III. Связь с миром
        { id: 15, block: 'world', text: 'Контакт с природой (лес, небо, вода, земля) наполняет меня силой и покоем' },
        { id: 16, block: 'world', text: 'Я ощущаю благоговение перед красотой и сложностью жизни вокруг' },
        { id: 17, block: 'world', text: 'Я чувствую себя неотъемлемой частью планетарной экосистемы и Вселенной' },
        { id: 18, block: 'world', text: 'Моя жизнь наполнена глубинным смыслом и ориентирами' },
        { id: 19, block: 'world', text: 'Я ощущаю спокойное принятие естественного течения жизни, перемен и смерти' },
        { id: 20, block: 'world', text: 'Я замечаю чудеса и тонкости в повседневных вещах' },
        { id: 21, block: 'world', text: 'Я чувствую гармонию с ритмами окружающего мира' }
    ],

    en: [
        // BLOCK I. Connection to Self
        { id: 1, block: 'self', text: 'I am in clear contact with my true feelings and emotions' },
        { id: 2, block: 'self', text: 'I clearly sense signals from my body (tension, fatigue, breathing, warmth)' },
        { id: 3, block: 'self', text: 'I treat myself with genuine compassion and kindness, even when I make mistakes' },
        { id: 4, block: 'self', text: 'I live an authentic life rather than conforming to outside expectations' },
        { id: 5, block: 'self', text: 'I trust my intuition and inner voice when making decisions' },
        { id: 6, block: 'self', text: 'I accept my shadowy or vulnerable parts without shame and self-blame' },
        { id: 7, block: 'self', text: 'I hold an abiding sense of my own innate dignity and worth' },
        // BLOCK II. Connection to Others
        { id: 8, block: 'others', text: 'I feel genuine warmth and empathy towards other people' },
        { id: 9, block: 'others', text: 'In my close relationships, there is room for authentic vulnerability' },
        { id: 10, block: 'others', text: 'I feel part of the human community, rather than an isolated outcast' },
        { id: 11, block: 'others', text: 'I find it natural to deeply listen to others without judgment or appraisal' },
        { id: 12, block: 'others', text: 'I am able to forgive past grievances and release emotional burdens' },
        { id: 13, block: 'others', text: 'I feel genuinely seen, heard, and accepted by those who matter to me' },
        { id: 14, block: 'others', text: 'I feel a fundamental sense of trust toward fellow human beings' },
        // BLOCK III. Connection to Nature & World
        { id: 15, block: 'world', text: 'Contact with nature (trees, sky, water, earth) fills me with strength and peace' },
        { id: 16, block: 'world', text: 'I feel awe and reverence for the beauty and complexity of life around me' },
        { id: 17, block: 'world', text: 'I feel an integral part of the planetary ecosystem and the wider universe' },
        { id: 18, block: 'world', text: 'My life feels filled with deep meaning and orientation' },
        { id: 19, block: 'world', text: 'I feel calm acceptance of the natural cycles of life, change, and death' },
        { id: 20, block: 'world', text: 'I notice wonder and subtlety in everyday ordinary things' },
        { id: 21, block: 'world', text: 'I feel in harmony with the natural rhythms of the surrounding world' }
    ],

    bg: [
        // БЛОК I. Връзка със себе си
        { id: 1, block: 'self', text: 'Намирам се в ясен контакт с истинските си чувства и емоции' },
        { id: 2, block: 'self', text: 'Усещам добре сигналите на тялото си (напрежение, умора, дишане, топлина)' },
        { id: 3, block: 'self', text: 'Отнасям се към себе си с искрено състрадание и доброта, дори когато греша' },
        { id: 4, block: 'self', text: 'Живея автентичен собствен живот, а не следвам наложени отвън очаквания' },
        { id: 5, block: 'self', text: 'Доверявам се на интуицията и вътрешния си глас при вземане на решения' },
        { id: 6, block: 'self', text: 'Приемам своите уязвими или тъмни страни без срам и себебичуване' },
        { id: 7, block: 'self', text: 'Вътре в мен има устойчиво чувство за собствено достойнство и стойност' },
        // БЛОК II. Връзка с другите
        { id: 8, block: 'others', text: 'Изпитвам искрена душевна топлота и емпатия към хората около мен' },
        { id: 9, block: 'others', text: 'В отношенията ми с близките има пространство за честна уязвимост' },
        { id: 10, block: 'others', text: 'Чувствам се част от човешката общност, а не самотен аутсайдер' },
        { id: 11, block: 'others', text: 'Лесно ми е да изслушвам другия искрено, без да го съдя или оценявам' },
        { id: 12, block: 'others', text: 'Способен съм да прощавам минали обиди и да освобождавам емоционален товар' },
        { id: 13, block: 'others', text: 'Чувствам се видян, чут и приет от онези, които са важни за мен' },
        { id: 14, block: 'others', text: 'Изпитвам доверие към света на хората като цяло' },
        // БЛОК III. Връзка със света и природата
        { id: 15, block: 'world', text: 'Контактът с природата (гора, небе, вода, земя) ме изпълва със сила и покой' },
        { id: 16, block: 'world', text: 'Изпитвам благоговение пред красотата и сложността на живота наоколо' },
        { id: 17, block: 'world', text: 'Чувствам се неделима част от планетарната екосистема и Вселената' },
        { id: 18, block: 'world', text: 'Животът ми е изпълнен с дълбок смисъл и ориентири' },
        { id: 19, block: 'world', text: 'Изпитвам спокойно приемане на естествения ход на живота, промените и смъртта' },
        { id: 20, block: 'world', text: 'Забелязвам чудеса и фини детайли в ежедневните обикновени неща' },
        { id: 21, block: 'world', text: 'Чувствам хармония с ритмите на заобикалящия ме свят' }
    ]
};

let wcsAnswers = {};

function getWcsQuestions() {
    const lang = window.currentLang || localStorage.getItem('ospat_lang') || 'ru';
    return WCS_QUESTIONS_I18N[lang] || WCS_QUESTIONS_I18N['ru'];
}

function initWcsTool() {
    const container = document.getElementById('wcsQuestionsContainer');
    if (!container) return;

    const questions = getWcsQuestions();

    // Preserve existing answers if any, or initialize to 3
    if (Object.keys(wcsAnswers).length === 0) {
        questions.forEach(q => wcsAnswers[q.id] = 3);
    }

    const lang = window.currentLang || 'ru';
    const blockTitles = {
        ru: {
            self: { title: "Блок I. Связь с собой (Connection to Self)", sub: "Оценка контакта с эмоциями, телом, самопринятием и внутренней правдой" },
            others: { title: "Блок II. Связь с другими людьми (Connection to Others)", sub: "Качество эмпатии, открытости, способности к уязвимости и чувства общности" },
            world: { title: "Блок III. Связь с миром и природой (Connection to Nature & World)", sub: "Переживание сопричастности к жизни, эстетическое благоговение и смысл бытия" }
        },
        en: {
            self: { title: "Block I. Connection to Self", sub: "Contact with inner truth, somatic awareness, and self-compassion" },
            others: { title: "Block II. Connection to Others", sub: "Empathy, relational vulnerability, and sense of human belonging" },
            world: { title: "Block III. Connection to Nature & World", sub: "Sense of cosmic belonging, aesthetic awe, and existential meaning" }
        },
        bg: {
            self: { title: "Блок I. Връзка със себе си (Connection to Self)", sub: "Оценка на контакта с емоциите, тялото, себеприемането и вътрешната истина" },
            others: { title: "Блок II. Връзка с другите (Connection to Others)", sub: "Качество на емпатията, откритостта, уязвимостта и чувството за общност" },
            world: { title: "Блок III. Връзка със света и природата (Connection to Nature)", sub: "Преживяване на съпричастност към живота, естетическо благоговение и смисъл" }
        }
    };

    const b = blockTitles[lang] || blockTitles['ru'];

    let html = `
        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.self.title}</h3>
                    <small class="text-muted">${b.self.sub}</small>
                </div>
                <span class="badge badge-prep" id="blockScoreSelfBadge">21 / 42</span>
            </div>
            ${renderBlockQuestions('self')}
        </div>

        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.others.title}</h3>
                    <small class="text-muted">${b.others.sub}</small>
                </div>
                <span class="badge badge-session" id="blockScoreOthersBadge">21 / 42</span>
            </div>
            ${renderBlockQuestions('others')}
        </div>

        <div class="wcs-block-card">
            <div class="wcs-block-header">
                <div>
                    <h3>${b.world.title}</h3>
                    <small class="text-muted">${b.world.sub}</small>
                </div>
                <span class="badge badge-integ" id="blockScoreWorldBadge">21 / 42</span>
            </div>
            ${renderBlockQuestions('world')}
        </div>
    `;

    container.innerHTML = html;
    updateWcsTotals();
}

function renderBlockQuestions(blockName) {
    const questions = getWcsQuestions().filter(q => q.block === blockName);
    return questions.map(q => {
        const val = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 3;
        return `
            <div class="wcs-q-row">
                <div class="wcs-q-text">
                    <strong>№${q.id}.</strong> ${q.text}
                </div>
                <div class="wcs-scale-radios" id="q_radios_${q.id}">
                    ${[0, 1, 2, 3, 4, 5, 6].map(score => `
                        <button type="button" class="scale-btn ${score === val ? 'selected' : ''}" 
                                onclick="setWcsScore(${q.id}, ${score})">
                            ${score}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function setWcsScore(questionId, score) {
    wcsAnswers[questionId] = score;

    const container = document.getElementById(`q_radios_${questionId}`);
    if (container) {
        const buttons = container.querySelectorAll('.scale-btn');
        buttons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === score);
        });
    }

    updateWcsTotals();
}

function updateWcsTotals() {
    const questions = getWcsQuestions();
    let scoreSelf = 0;
    let scoreOthers = 0;
    let scoreWorld = 0;

    questions.forEach(q => {
        const val = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 3;
        if (q.block === 'self') scoreSelf += val;
        else if (q.block === 'others') scoreOthers += val;
        else if (q.block === 'world') scoreWorld += val;
    });

    const total = scoreSelf + scoreOthers + scoreWorld;

    const elSelf = document.getElementById('wcsScoreSelf');
    const elOthers = document.getElementById('wcsScoreOthers');
    const elWorld = document.getElementById('wcsScoreWorld');
    const elTotal = document.getElementById('wcsScoreTotal');
    const elLevel = document.getElementById('wcsScoreLevel');

    if (elSelf) elSelf.innerText = scoreSelf;
    if (elOthers) elOthers.innerText = scoreOthers;
    if (elWorld) elWorld.innerText = scoreWorld;
    if (elTotal) elTotal.innerText = total;

    const bSelf = document.getElementById('blockScoreSelfBadge');
    const bOthers = document.getElementById('blockScoreOthersBadge');
    const bWorld = document.getElementById('blockScoreWorldBadge');
    if (bSelf) bSelf.innerText = `${scoreSelf} / 42`;
    if (bOthers) bOthers.innerText = `${scoreOthers} / 42`;
    if (bWorld) bWorld.innerText = `${scoreWorld} / 42`;

    if (elLevel) {
        elLevel.className = 'wcs-badge-level';
        if (total <= 45) {
            elLevel.innerText = window.t ? window.t('wcs_lvl_disconn') : 'Отчуждение';
        } else if (total <= 85) {
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
    let scoreSelf = 0, scoreOthers = 0, scoreWorld = 0;
    questions.forEach(q => {
        const val = wcsAnswers[q.id] !== undefined ? wcsAnswers[q.id] : 3;
        if (q.block === 'self') scoreSelf += val;
        else if (q.block === 'others') scoreOthers += val;
        else if (q.block === 'world') scoreWorld += val;
    });
    const total = scoreSelf + scoreOthers + scoreWorld;

    const payload = {
        client_id: parseInt(clientId),
        assessment_type: 'wcs',
        stage: stageSelect ? stageSelect.value : 'baseline',
        score_self: scoreSelf,
        score_others: scoreOthers,
        score_world: scoreWorld,
        score_total: total,
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
            const successMsg = window.currentLang === 'en' ? `✅ WCS Assessment saved!\nTotal Score: ${total} / 126` : window.currentLang === 'bg' ? `✅ Замерването по WCS е запазено успешно!\nОбщ резултат: ${total} / 126` : `✅ Замер шкалы WCS успешно сохранен!\nОбщий балл: ${total} / 126`;
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
