import { actions } from './actions.js';
import { el } from './domUtils.js';
import { state } from './state.js';
import * as C from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { equipItem, unequipItem } from './wardrobeLogic.js';

// --- Кэши и константы для UI ---

let fullBodyDescriptionForModalStore = "";
const choiceButtonCache = {};

// Используем Map для быстрой и чистой привязки типа лога к CSS-классу
const LOG_CLASS_MAP = new Map([
    ['default', 'log-default'],
    ['money-gain', 'log-money-gain'],
    ['money-loss', 'log-money-loss'],
    ['hormone-change', 'log-hormone-change'],
    ['progress-change', 'log-progress-change'],
    ['discovery', 'log-discovery'],
    ['important', 'log-important'],
    ['stepmom-dialogue', 'log-stepmom-dialogue'],
]);

// Используем объект для иконок действий, чтобы убрать switch из renderChoices
const ACTION_ICON_MAP = {
    'work': '💼 ',
    't_blocker': '💊 ',
    't_pill': '♂️ ',
    'e_pill': '♀️ ',
    'browse_internet': '🌐 ',
    'rest': '😴 ',
    'save_game': '💾 ',
    'load_game': '📂 ',
    'reset_game': '🔄 '
    // 'read_book' имеет динамическую иконку, оставим ее в логике
};


// --- Функции Логирования ---

export function log(msg, type = 'default') {
    state.logMessages.unshift({
        text: msg,
        type: type,
        timestamp: state.day
    });

    if (state.logMessages.length > state.maxLogMessages) {
        state.logMessages.length = state.maxLogMessages;
    }

    renderLog();
}

export function renderLog() {
    // Используем DocumentFragment для оптимизации DOM-операций
    const fragment = document.createDocumentFragment();
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';

    if (state.logMessages.length === 0) {
        el.actionLogOutput.textContent = "Журнал пуст.";
        el.actionLogOutput.className = 'log-default';
        return;
    }

    state.logMessages.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `День ${entry.timestamp}: ${entry.text}`;
        // Безопасное получение класса из Map
        li.className = `log-entry ${LOG_CLASS_MAP.get(entry.type) || LOG_CLASS_MAP.get('default')}`;
        
        if (index === 0) {
            li.classList.add('log-updated'); // Для анимации
        }
        ul.appendChild(li);
    });

    fragment.appendChild(ul);
    el.actionLogOutput.innerHTML = '';
    el.actionLogOutput.appendChild(fragment);

    // Обновляем класс контейнера для подсветки последнего сообщения
    const latestEntry = state.logMessages[0];
    if (latestEntry) {
        el.actionLogOutput.className = `log-container ${LOG_CLASS_MAP.get(latestEntry.type) || LOG_CLASS_MAP.get('default')}`;
    }
}


// --- Функции Обновления UI ---

export function updateTabsVisibility() {
    if (!Array.isArray(el.tabs)) {
        console.error('el.tabs is not an array');
        return;
    }

    let tabSwitched = false;
    const isHormoneTabVisible = state.hormonesUnlocked;

    // Скрываем/показываем вкладку гормонов
    const hormoneTab = el.tabs.find(btn => btn.dataset.tab === 'hormone');
    if (hormoneTab) {
        hormoneTab.style.display = isHormoneTabVisible ? '' : 'none';
    }

    // Если текущая вкладка стала невидимой, переключаемся на дефолтную
    if (!isHormoneTabVisible && state.tab === 'hormone') {
        state.tab = 'income';
        tabSwitched = true;
    }

    // Обновляем классы для всех вкладок
    el.tabs.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tab === state.tab);
    });
    
    // Если вкладка была переключена программно, нужно перерисовать контент
    if (tabSwitched) {
        renderCurrentTabContent();
    }
}

export function updateProgressDisplay() {
    const isUnlocked = state.hormonesUnlocked;
    el.progressTitle.textContent = isUnlocked ? "Прогресс" : "Открытия";
    el.progressIcon.textContent = isUnlocked ? "📈" : "💡";
    
    const currentValue = isUnlocked ? state.progress : state.discoveryPoints;
    const maxValue = isUnlocked ? C.MAX_PROGRESS : C.MAX_DISCOVERY_POINTS;
    const unit = isUnlocked ? '%' : '';

    el.prog.textContent = `${currentValue}${unit} / ${maxValue}${unit}`;
    el.pbar.style.width = `${(currentValue / maxValue) * 100}%`;
}


// --- Генерация Описаний (Body & Outfit) ---

// Упрощенная и более надежная версия
export function getCurrentOutfitDescription() {
    const { currentOutfit } = state;
    const descriptions = [];

    // Верхняя одежда
    if (currentOutfit[CLOTHING_SLOTS.FULL_BODY]) {
        descriptions.push(`ты полностью одета в: ${CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.FULL_BODY]].name.toLowerCase()}`);
    } else {
        const top = currentOutfit[CLOTHING_SLOTS.TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.TOP]].name.toLowerCase() : null;
        const bottom = currentOutfit[CLOTHING_SLOTS.BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.BOTTOM]].name.toLowerCase() : null;
        if (top && bottom) descriptions.push(`на тебе надета ${top} и ${bottom}`);
        else if (top) descriptions.push(`на тебе надета ${top}`);
        else if (bottom) descriptions.push(`на тебе надета ${bottom}`);
    }

    // Нижнее белье
    const underwearTop = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP]].name.toLowerCase() : null;
    const underwearBottom = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]].name.toLowerCase() : null;
    let underwearDesc = "";
    if (underwearTop && underwearBottom) underwearDesc = `${underwearTop} и ${underwearBottom}`;
    else if (underwearTop) underwearDesc = underwearTop;
    else if (underwearBottom) underwearDesc = underwearBottom;

    if (underwearDesc) {
        const connector = descriptions.length > 0 ? ", а под одеждой" : "Под одеждой";
        descriptions.push(`${connector} у тебя ${underwearDesc}`);
    }

    // Обувь
    if (currentOutfit[CLOTHING_SLOTS.SHOES]) {
        const shoes = CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.SHOES]].name.toLowerCase();
        const connector = descriptions.length > 0 ? ", на ногах -" : "На ногах -";
        descriptions.push(`${connector} ${shoes}`);
    }

    if (descriptions.length === 0) {
        return "👕 Наряд: Ты сейчас ни во что не одета.";
    }

    let finalDescription = descriptions.join(' ').trim();
    finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1) + '.';
    return `👕 Наряд: ${finalDescription}`;
}

// Функции-генераторы описаний, каждая объявлена ОДИН раз.
function getVoiceDescription(T, E, P) {
    let voicePitch = C.VOICE_PITCH_BASE_HZ - (T - E) * C.VOICE_PITCH_HORMONE_FACTOR;
    voicePitch = Math.max(80, Math.min(300, voicePitch));
    let specificDesc = "";
    if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_2 && P > C.VOICE_P_THRESHOLD_FOR_CHANGE_2) {
        specificDesc = "Звучит заметно выше, нежнее, почти неузнаваемо.";
    } else if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_1) {
        specificDesc = "Становится мягче и выше, теряет грубые нотки.";
    } else if (T - E > C.VOICE_T_DOMINANT_THRESHOLD) {
        specificDesc = "Низкий, с бархатными мужскими обертонами.";
    } else {
        specificDesc = "Тембр на грани, андрогинный, интригующий.";
    }
    return `🎤 Голос: ${voicePitch.toFixed(0)} Гц. ${specificDesc}`;
}
function getSkinDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let skinDescText = "💧 Кожа: ";
    if (E_is_dominant && E > C.SKIN_E_DOMINANT_THRESHOLD_FOR_SOFTNESS) {
        skinDescText += P > C.SKIN_P_THRESHOLD_SOFT_2 ? "Невероятно гладкая, шелковистая на ощупь, поры почти невидимы. Лёгкий румянец." :
            P > C.SKIN_P_THRESHOLD_SOFT_1 ? "Становится ощутимо мягче, нежнее, уходит жирный блеск." :
            "Появляется мягкость, менее жирная.";
        if (E > C.SKIN_E_THRESHOLD_FOR_THINNING && P > C.SKIN_P_THRESHOLD_FOR_THINNING) {
            skinDescText += " Кажется тоньше, венки на запястьях и груди могут быть видны отчетливее.";
        }
    } else if (T_is_dominant && T > C.SKIN_T_DOMINANT_THRESHOLD_FOR_ROUGHNESS) {
        skinDescText += "Плотная, возможно, более склонная к жирности и акне. Поры заметны.";
    } else {
        skinDescText += "Обычная, но ты начинаешь замечать тонкие изменения в её текстуре.";
    }
    return skinDescText;
}
function getBodyHairDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let bodyHairDescText = "🌿 Волосы на теле/лице: ";
    if (E_is_dominant && E > C.BODYHAIR_E_DOMINANT_THRESHOLD_FOR_REDUCTION && P > C.BODYHAIR_P_THRESHOLD_FOR_REDUCTION) {
        bodyHairDescText += "Рост волос на теле замедлился, они стали тоньше и светлее. ";
        if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_PUBESCENCE && P > C.BODYHAIR_P_THRESHOLD_FOR_FACIAL_PUBESCENCE) {
            bodyHairDescText += "Щетина на лице почти не растет, или стала пушковой.";
        } else if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_SLOWDOWN) {
            bodyHairDescText += "Рост щетины замедлен, бритьё требуется реже.";
        }
    } else if (T_is_dominant && T > C.BODYHAIR_T_DOMINANT_THRESHOLD_FOR_THICK) {
        bodyHairDescText += "Активный рост волос на теле и лице, густая щетина.";
    } else {
        bodyHairDescText += "Без особых изменений.";
    }
    return bodyHairDescText;
}
function getBreastDescription(E, P) {
    let breastDescText = "🍈 Грудь: ";
    let breastDevStageRaw = 0;
    if (E > C.BREAST_E_THRESHOLD_START_BUDDING && P > C.BREAST_P_THRESHOLD_START_BUDDING) {
        breastDevStageRaw = 1 + (Math.max(0, E - C.BREAST_E_THRESHOLD_START_BUDDING) / C.BREAST_E_UNITS_PER_STAGE) *
            (C.BREAST_PROGRESS_FACTOR_BASE + P / C.BREAST_PROGRESS_FACTOR_SCALE);
    }
    const currentBreastDevStage = Math.min(C.BREAST_MAX_DEV_STAGE, Math.floor(breastDevStageRaw));
    if (currentBreastDevStage === 0) breastDescText += "Абсолютно плоская.";
    else if (currentBreastDevStage === 1) breastDescText += `Появились болезненные уплотнения под сосками (E:${E.toFixed(0)}, P:${P}%).`;
    else if (currentBreastDevStage === 2) breastDescText += `Небольшая, но оформленная (размер A). Соски увеличились. (E:${E.toFixed(0)}, P:${P}%).`;
    else if (currentBreastDevStage === 3) breastDescText += `Среднего размера, упругая (ближе к B). (E:${E.toFixed(0)}, P:${P}%).`;
    else breastDescText += `Пышная, мягкая, соблазнительная (размер C+!). (E:${E.toFixed(0)}, P:${P}%).`;
    return breastDescText;
}
function getFigureDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let figureDescText = "🍑 Фигура: ";
    const whr_change_potential = C.FIGURE_WHR_BASE - C.FIGURE_WHR_TARGET_FEMALE;
    let whr_progress_to_female_target = 0;
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) {
        whr_progress_to_female_target = Math.min(1, (E - C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) / C.FIGURE_E_UNITS_FOR_WHR_PROGRESS) * (P / C.MAX_PROGRESS);
    }
    const current_whr = (C.FIGURE_WHR_BASE - whr_change_potential * whr_progress_to_female_target).toFixed(2);
    figureDescText += `Талия/бедра: ${current_whr}. `;
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_FAT_REDISTRIBUTION && P > C.FIGURE_P_THRESHOLD_FOR_FAT_REDISTRIBUTION) {
        figureDescText += "Жир перераспределяется на бедра и ягодицы. Талия изящнее.";
    } else if (T_is_dominant && T > C.FIGURE_T_DOMINANT_THRESHOLD_FOR_MALE_FAT) {
        figureDescText += "Жир в области живота, фигура маскулинная.";
    } else if (P > C.FIGURE_P_THRESHOLD_FOR_SUBTLE_SOFTENING) {
        figureDescText += "Контуры тела неуловимо смягчаются.";
    }
    return figureDescText;
}
function getMuscleDescription(T, E, P, E_is_dominant) {
    let muscleDescText = "💪 Мышцы: ";
    if (T > C.MUSCLE_T_HIGH_THRESHOLD_FOR_BULK && !E_is_dominant) {
        muscleDescText += P < C.MUSCLE_P_THRESHOLD_FOR_BULK_SOFTENING ? "Развитые, рельефные." : "Крепкие, но теряют твердость.";
    } else if (T > C.MUSCLE_T_MID_THRESHOLD_FOR_TONE && !E_is_dominant) {
        muscleDescText += "Умеренно развиты, в тонусе.";
    } else if (E_is_dominant && E > C.MUSCLE_E_DOMINANT_THRESHOLD_FOR_LOSS) {
        muscleDescText += `Уменьшились, стали мягче. Сила снизилась (T:${T.toFixed(0)}).`;
    } else {
        muscleDescText += `Слабые, без рельефа. (T:${T.toFixed(0)})`;
    }
    return muscleDescText;
}
function getPenisDescription(T, E, P, E_is_dominant) {
    let penisShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_PENIS_E_SHRINK_FACTOR + Math.max(0, 50 - T) * C.GENITAL_PENIS_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    penisShrinkageFactor = Math.max(0, penisShrinkageFactor);
    const penisLengthCm = Math.max(C.GENITAL_PENIS_MIN_CM, C.GENITAL_PENIS_BASE_CM - penisShrinkageFactor).toFixed(1);
    let erectionQuality = 'нормальная';
    if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_ALMOST_NONE && E_is_dominant && P > C.GENITAL_ERECTION_P_LOW_THRESHOLD_ALMOST_NONE) erectionQuality = 'почти отсутствует';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_VERY_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_VERY_WEAK)) erectionQuality = 'очень слабая';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_WEAK)) erectionQuality = 'снижена, менее твердая';
    let penisDescText;
    if (P > C.GENITAL_P_THRESHOLD_FOR_CLIT_TEXT && E_is_dominant && parseFloat(penisLengthCm) < C.GENITAL_PENIS_CLIT_TRANSITION_CM) {
        penisDescText = `🎀 Клитор: ${penisLengthCm} см. Стал очень маленьким и чувствительным. `;
    } else {
        penisDescText = `🍆 Пенис: ${penisLengthCm} см. `;
    }
    penisDescText += `Эрекция: ${erectionQuality}.`;
    return penisDescText;
}
function getTesticlesDescription(T, E, P, E_is_dominant) {
    let testicleShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_TESTICLES_E_SHRINK_FACTOR + Math.max(0, 40 - T) * C.GENITAL_TESTICLES_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    testicleShrinkageFactor = Math.max(0, testicleShrinkageFactor);
    const testicleVolume = Math.max(C.GENITAL_TESTICLES_MIN_VOL_ML, C.GENITAL_TESTICLES_BASE_VOL_ML - testicleShrinkageFactor).toFixed(1);
    const testicleTexture = (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_SOFT_TEXTURE && P > C.GENITAL_TESTICLES_P_THRESHOLD_SOFT_TEXTURE) ? 'мягкие, уменьшившиеся' : 'упругие';
    let testiclesDescText = `🥚 Яички: объём ~${testicleVolume} мл, ${testicleTexture}. `;
    if (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_ATROPHY && P > C.GENITAL_TESTICLES_P_THRESHOLD_ATROPHY && parseFloat(testicleVolume) < C.GENITAL_TESTICLES_ATROPHY_VOL_ML) {
        testiclesDescText += "Почти атрофировались.";
    }
    return testiclesDescText;
}
function getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor) {
    let feelingDesc = "✨ Ощущения: ";
    if (P > C.FEELING_P_THRESHOLD_PERFECT_SISSY && E_is_dominant && E > C.FEELING_E_THRESHOLD_PERFECT_SISSY) feelingDesc += "Воплощение женственности. Гармония.";
    else if (P > C.FEELING_P_THRESHOLD_REAL_SISSY && E_is_dominant) feelingDesc += "Чувствуешь себя настоящей сисси. Уверенность растет.";
    else if (P > C.FEELING_P_THRESHOLD_TRANSFORMATION_FULL_SWING && (E_is_dominant || hormonalBalanceFactor > C.FEELING_HORMONAL_BALANCE_THRESHOLD_TRANSFORMATION_FULL_SWING)) feelingDesc += "Трансформация идет полным ходом! Прилив сисси-энергии.";
    else if (P > C.FEELING_P_THRESHOLD_FIRST_WHISPERS) feelingDesc += "Первые шепоты изменений. Тело меняется, это волнует.";
    else feelingDesc += "Самое начало пути. Ветерок перемен едва коснулся.";
    return feelingDesc;
}

// Конфигурация для Data-Driven подхода
const bodyPartDescriptors = [
    { key: 'voice',           func: getVoiceDescription,         args: (T, E, P) => [T, E, P] },
    { key: 'skin',            func: getSkinDescription,          args: (T, E, P, E_dom, T_dom) => [T, E, P, E_dom, T_dom] },
    { key: 'bodyHair',        func: getBodyHairDescription,      args: (T, E, P, E_dom, T_dom) => [T, E, P, E_dom, T_dom] },
    { key: 'breast',          func: getBreastDescription,        args: (T, E, P) => [E, P] },
    { key: 'figure',          func: getFigureDescription,        args: (T, E, P, E_dom, T_dom) => [T, E, P, E_dom, T_dom] },
    { key: 'muscle',          func: getMuscleDescription,        args: (T, E, P, E_dom) => [T, E, P, E_dom] },
    { key: 'genitalsPenis',     func: getPenisDescription,         args: (T, E, P, E_dom) => [T, E, P, E_dom] },
    { key: 'genitalsTesticles', func: getTesticlesDescription,     args: (T, E, P, E_dom) => [T, E, P, E_dom] },
];

function trackAndLogChange(paramKey, currentValue, changeTexts) {
    const previousValue = state.previousBodyParams[paramKey];
    if (currentValue !== previousValue && previousValue !== undefined && previousValue !== "") {
        const changeDescriptionPart = currentValue.substring(currentValue.indexOf(':') + 1).trim();
        const parameterTitle = currentValue.substring(0, currentValue.indexOf(':')).trim();
        if (changeDescriptionPart) {
            const formattedChangeDesc = changeDescriptionPart.charAt(0).toLowerCase() + changeDescriptionPart.slice(1);
            changeTexts.push(`${parameterTitle}: ${formattedChangeDesc}`);
        }
    }
    state.previousBodyParams[paramKey] = currentValue; // Обновляем предыдущее значение
    return currentValue;
}

export function updateBody() {
    // Начало до разблокировки гормонов
    if (!state.hormonesUnlocked) {
        const preUnlockLines = [
            "Ты продолжаешь исследовать себя и окружающий мир. Какие-то смутные желания и мысли иногда посещают тебя, но пока неясно, к чему они ведут.",
            `Твои текущие ощущения: ${state.discoveryPoints > 15 ? "Любопытство растет, ты находишь все больше интересной информации." : "Обычный день, обычные мысли."}`,
            `Очки открытий: ${state.discoveryPoints}/${C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES}`
        ];
        el.bodyDesc.textContent = fullBodyDescriptionForModalStore = preUnlockLines.join('\n\n');
        return;
    }

    // Рассчитываем общие параметры один раз
    const T = state.emaT, E = state.emaE, P = state.progress;
    const T_is_dominant = T > E + 10;
    const E_is_dominant = E > T + 5;
    const hormonalBalanceFactor = Math.max(0, Math.min(100, (E - T + C.MAX_HORMONE_LEVEL) / 2));
    
    state.recentBodyChanges = [];
    
    // Data-driven генерация описаний
    const allBodyLines = bodyPartDescriptors.map(descriptor => {
        const args = descriptor.args(T, E, P, E_is_dominant, T_is_dominant);
        const currentValue = descriptor.func(...args);
        return trackAndLogChange(descriptor.key, currentValue, state.recentBodyChanges);
    });

    const feelingDesc = getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor);
    allBodyLines.push(feelingDesc);
    allBodyLines.push(getCurrentOutfitDescription());

    // Сохраняем полное описание для модального окна
    fullBodyDescriptionForModalStore = allBodyLines.join('\n\n');

    // Формируем краткое описание для основного экрана
    const summaryLines = [feelingDesc, getCurrentOutfitDescription()];
    if (state.recentBodyChanges.length > 0) {
        summaryLines.push("\n❗ Ключевые изменения за последний день:");
        const maxChangesToShowInSummary = 3;
        state.recentBodyChanges.slice(0, maxChangesToShowInSummary).forEach(change => {
            summaryLines.push(`  - ${change}`);
        });
        if (state.recentBodyChanges.length > maxChangesToShowInSummary) {
            summaryLines.push(`  ... и еще ${state.recentBodyChanges.length - maxChangesToShowInSummary} изм.`);
        }
    } else if (state.day > 1) {
        summaryLines.push("\nЗаметных физических изменений за последний день не произошло.");
    }
    
    // Рендерим краткое описание и кнопку
    el.bodyDesc.innerHTML = '';
    const summaryFragment = document.createDocumentFragment();
    summaryLines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        p.style.whiteSpace = 'pre-wrap';
        if (line.includes('  - ')) p.style.marginLeft = "1em";
        if (line.startsWith("\n❗") || line.startsWith("\nЗаметных")) p.style.marginTop = "0.5em";
        summaryFragment.appendChild(p);
    });
    
    let modalButton = document.createElement('button');
    modalButton.id = 'open-body-details-button';
    modalButton.className = 'choice-button';
    modalButton.textContent = '🔍 Подробный осмотр тела';
    modalButton.style.marginTop = '15px';
    modalButton.onclick = openBodyDetailsModal;
    summaryFragment.appendChild(modalButton);

    el.bodyDesc.appendChild(summaryFragment);
}


// --- Рендеринг вкладок (Выбор действий и Гардероб) ---

function renderCurrentTabContent() {
    if (state.tab === 'wardrobe') {
        renderWardrobeUI();
    } else {
        renderChoices();
    }
}

export function renderWardrobeUI() {
    const fragment = document.createDocumentFragment();

    const equippedSection = createWardrobeSection('Сейчас надето:', state.currentOutfit, 'unequip');
    
    const currentlyWornItemIds = Object.values(state.currentOutfit).filter(id => id !== null);
    
    const availableItems = state.ownedClothes.filter(itemId => !currentlyWornItemIds.includes(itemId));
    
    const availableItemsBySlot = {};
    availableItems.forEach(itemId => {
        const item = CLOTHING_ITEMS[itemId];
        if (!availableItemsBySlot[item.slot]) {
            availableItemsBySlot[item.slot] = [];
        }
        availableItemsBySlot[item.slot].push(itemId);
    });

    const ownedSection = createWardrobeSection('В шкафу:', availableItemsBySlot, 'equip');
    
    fragment.appendChild(equippedSection);
    fragment.appendChild(ownedSection);
    el.choices.innerHTML = '';
    el.choices.appendChild(fragment);
}

function createWardrobeSection(title, items, actionType) {
    const section = document.createElement('div');
    section.className = 'wardrobe-section';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    section.appendChild(h3);

    let hasItems = false;
    for (const slotName in items) {
        const itemOrItems = items[slotName];
        if (!itemOrItems || (Array.isArray(itemOrItems) && itemOrItems.length === 0)) continue;

        const itemsArray = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
        itemsArray.forEach(itemId => {
            hasItems = true;
            const item = CLOTHING_ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wardrobe-item-display';

            const itemNameSpan = document.createElement('span');
            const slotKeyName = Object.keys(CLOTHING_SLOTS).find(key => CLOTHING_SLOTS[key] === item.slot);
            itemNameSpan.textContent = `${item.name} (слот: ${slotKeyName})`;
            itemDiv.appendChild(itemNameSpan);

            const button = document.createElement('button');
            button.className = 'choice-button wardrobe-button';
            if (actionType === 'equip') {
                button.textContent = 'Надеть';
                button.onclick = () => equipItem(itemId);
            } else {
                button.textContent = 'Снять';
                button.onclick = () => unequipItem(item.slot);
            }
            itemDiv.appendChild(button);
            section.appendChild(itemDiv);
        });
    }

    if (!hasItems) {
        const p = document.createElement('p');
        p.textContent = actionType === 'equip' ? 'В шкафу пусто или вся одежда уже надета.' : 'Ничего не надето.';
        section.appendChild(p);
    }
    return section;
}

export function renderChoices() {
    const fragment = document.createDocumentFragment();
    const actionsToDisplay = actions.filter(action => 
        action.tab === state.tab &&
        !(action.tab === 'hormone' && !state.hormonesUnlocked)
    );

    actionsToDisplay.forEach(action => {
        const buttonElement = choiceButtonCache[action.id]?.buttonElement || document.createElement('button');
        if (!choiceButtonCache[action.id]) {
            buttonElement.className = 'choice-button';
            buttonElement.addEventListener('click', action.handler.bind(action));
            choiceButtonCache[action.id] = { buttonElement };
        }

        let baseText = typeof action.text === 'function' ? action.text() : action.text;
        let icon = ACTION_ICON_MAP[action.id] || '';
        if (action.id === 'read_book') {
            icon = state.hormonesUnlocked ? '📖 ' : '📚 ';
        }

        let currentText = icon + baseText;
        let isDisabled = (action.condition && !action.condition());

        if (action.cost > 0) {
            currentText += ` (–${action.cost}${C.CURRENCY_SYMBOL})`;
            if (state.money < action.cost) {
                isDisabled = true;
                currentText += ` (Нужно: ${action.cost}${C.CURRENCY_SYMBOL})`;
            }
        } else if (action.id === 'work') {
            currentText += ` (+${C.WORK_INCOME}${C.CURRENCY_SYMBOL})`;
        }
        
        if (action.id === 't_blocker' && isDisabled) {
             currentText = `${icon}Блокатор Т активен (${state.t_blocker_active_days} дн.)`;
        }

        buttonElement.textContent = currentText;
        buttonElement.disabled = isDisabled;
        fragment.appendChild(buttonElement);
    });
    
    el.choices.innerHTML = '';
    el.choices.appendChild(fragment);
}


// --- Главная функция обновления и модальные окна ---

export function updateStats() {
    el.day.textContent = state.day;
    el.money.textContent = `${state.money}${C.CURRENCY_SYMBOL}`;
    el.test.textContent = `${state.testosterone.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;
    el.est.textContent = `${state.estrogen.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;

    el.tbar.style.width = `${(state.testosterone / C.MAX_HORMONE_LEVEL) * 100}%`;
    el.ebar.style.width = `${(state.estrogen / C.MAX_HORMONE_LEVEL) * 100}%`;

    updateProgressDisplay();
    updateTabsVisibility();
    updateBody();
    renderCurrentTabContent();
}

export function openBodyDetailsModal() {
    if (el.modalOverlay && el.modalBodyDetailsContent) {
        el.modalBodyDetailsContent.innerHTML = fullBodyDescriptionForModalStore.replace(/\n/g, '<br>');
        el.modalOverlay.classList.add('active');
    }
}

export function closeBodyDetailsModal() {
    if (el.modalOverlay) {
        el.modalOverlay.classList.remove('active');
    }
}