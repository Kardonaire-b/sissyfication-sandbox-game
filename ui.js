import { actions } from './actions.js';
import { el } from './domUtils.js';
import { state } from './state.js';
import * as C from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { equipItem, unequipItem } from './wardrobeLogic.js';

// Модуль управления пользовательским интерфейсом

let fullBodyDescriptionForModalStore = "";
let choiceButtonCache = {};


export function log(msg, type = 'default') {
    // 1. Создаем объект сообщения
    const newLogEntry = {
        text: msg,
        type: type,
        timestamp: state.day // Или более точное время, если нужно
    };

    // 2. Добавляем новое сообщение в начало массива
    state.logMessages.unshift(newLogEntry);

    // 3. Ограничиваем количество сообщений
    if (state.logMessages.length > state.maxLogMessages) {
        state.logMessages.length = state.maxLogMessages; // Обрезаем массив до максимальной длины
    }

    // 4. Рендерим лог
    renderLog();
}

function renderLog() {
    el.actionLogOutput.innerHTML = ''; // Очищаем предыдущее содержимое

    if (state.logMessages.length === 0) {
        el.actionLogOutput.textContent = "Журнал пуст."; // Или какое-то стартовое сообщение
        el.actionLogOutput.className = 'log-default'; // Сброс классов
        return;
    }

    // Создаем список для сообщений (семантически лучше, чем просто div'ы)
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none'; // Убираем маркеры списка
    ul.style.padding = '0';
    ul.style.margin = '0';


    state.logMessages.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `День ${entry.timestamp}: ${entry.text}`; // Добавляем день к сообщению

        // Применяем стили в зависимости от типа сообщения
        // Сначала сбрасываем на дефолтный, потом применяем нужный
        li.className = 'log-entry log-default'; // Базовый класс для стилизации отдельных записей, если нужно

        if (entry.type === 'money-gain') li.classList.replace('log-default', 'log-money-gain');
        else if (entry.type === 'money-loss') li.classList.replace('log-default', 'log-money-loss');
        else if (entry.type === 'hormone-change') li.classList.replace('log-default', 'log-hormone-change');
        else if (entry.type === 'progress-change') li.classList.replace('log-default', 'log-progress-change');
        else if (entry.type === 'discovery') li.classList.replace('log-default', 'log-discovery');
        else if (entry.type === 'important') li.classList.replace('log-default', 'log-important');
        
        // Добавляем анимацию только для самой новой записи
        if (index === 0) {
             li.classList.add('log-updated'); // Используем существующий класс для анимации
             setTimeout(() => {
                li.classList.remove('log-updated');
             }, 300); // Время должно совпадать с анимацией в CSS
        }

        ul.appendChild(li);
    });
    el.actionLogOutput.appendChild(ul);
    
    const latestEntry = state.logMessages[0];
    const classesToRemove = Array.from(el.actionLogOutput.classList).filter(
        cls => cls.startsWith('log-') && cls !== 'log-default' && !cls.includes('entry') // не удаляем entry-специфичные классы
    );
    el.actionLogOutput.classList.remove(...classesToRemove);
    el.actionLogOutput.classList.add('log-default'); // Сначала базовый

    if (latestEntry) { // Проверка, что массив не пуст
        if (latestEntry.type === 'money-gain') el.actionLogOutput.classList.replace('log-default','log-money-gain');
        else if (latestEntry.type === 'money-loss') el.actionLogOutput.classList.replace('log-default','log-money-loss');
        // ... и так далее для всех типов ...
        else if (latestEntry.type === 'important') el.actionLogOutput.classList.replace('log-default','log-important');
    }

}


export function updateTabsVisibility() {
    if (!Array.isArray(el.tabs)) {
        console.error('el.tabs is not an array');
        return;
    }

    let tabSwitched = false;
    const DEFAULT_TAB = 'income';

    el.tabs.forEach(btn => {
        if (btn.dataset.tab === 'hormone') {
            const isHormoneTabVisible = state.hormonesUnlocked;
            btn.style.display = isHormoneTabVisible ? '' : 'none';

            if (!isHormoneTabVisible && state.tab === 'hormone') {
                state.tab = DEFAULT_TAB;
                tabSwitched = true;
            }
        }
        
        // Обновляем классы сразу в том же цикле
        if (tabSwitched) {
            btn.classList.toggle('selected', btn.dataset.tab === state.tab);
        }
    });
}

export function updateProgressDisplay() {
    if (!state.hormonesUnlocked) {
        el.progressTitle.textContent = "Открытия";
        el.progressIcon.textContent = "💡";
        el.prog.textContent = `${state.discoveryPoints} / ${C.MAX_DISCOVERY_POINTS}`;
        el.pbar.style.width = (state.discoveryPoints / C.MAX_DISCOVERY_POINTS * 100) + '%';
    } else {
        el.progressTitle.textContent = "Прогресс";
        el.progressIcon.textContent = "📈";
        el.prog.textContent = `${state.progress}% / ${C.MAX_PROGRESS}%`;
        el.pbar.style.width = (state.progress / C.MAX_PROGRESS * 100) + '%';
    }
}

export function getCurrentOutfitDescription() {
    const outfit = state.currentOutfit;
    const wornItemsDescriptions = [];
    let hasFullBody = false;

    if (outfit[CLOTHING_SLOTS.FULL_BODY]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.FULL_BODY]];
        if (item) {
            wornItemsDescriptions.push(`ты полностью одета в: ${item.name.toLowerCase()}`);
            hasFullBody = true;
        }
    }

    if (!hasFullBody) {
        if (outfit[CLOTHING_SLOTS.TOP]) {
            const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.TOP]];
            if (item) wornItemsDescriptions.push(`на тебе надета ${item.name.toLowerCase()}`);
        }
        if (outfit[CLOTHING_SLOTS.BOTTOM]) {
            const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.BOTTOM]];
            if (item) {
                if (wornItemsDescriptions.length > 0 && outfit[CLOTHING_SLOTS.TOP]) {
                    wornItemsDescriptions.push(`и ${item.name.toLowerCase()}`);
                } else {
                    wornItemsDescriptions.push(`на тебе надета ${item.name.toLowerCase()}`);
                }
            }
        }
    }
    
    const underwearDescriptions = [];
    if (outfit[CLOTHING_SLOTS.UNDERWEAR_TOP]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.UNDERWEAR_TOP]];
        if (item) underwearDescriptions.push(item.name.toLowerCase());
    }
    if (outfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]];
        if (item) underwearDescriptions.push(item.name.toLowerCase());
    }

    if (underwearDescriptions.length > 0) {
        let underwearString = "";
        if (underwearDescriptions.length === 1) {
            underwearString = underwearDescriptions[0];
        } else {
            underwearString = underwearDescriptions.slice(0, -1).join(', ') + ' и ' + underwearDescriptions.slice(-1);
        }
        const connector = wornItemsDescriptions.length > 0 ? ", а под одеждой" : "Под одеждой";
        wornItemsDescriptions.push(`${connector} у тебя ${underwearString}`);
    }
    
    if (outfit[CLOTHING_SLOTS.SHOES]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.SHOES]];
        if (item) {
            const connector = wornItemsDescriptions.length > 0 ? ", на ногах - " : "На ногах - ";
            wornItemsDescriptions.push(`${connector}${item.name.toLowerCase()}`);
        }
    }

    if (wornItemsDescriptions.length === 0) {
        return "👕 Наряд: Ты сейчас ни во что не одета."; 
    }

    let finalDescription = wornItemsDescriptions.join(' ').trim();
    if (finalDescription.startsWith("и ")) finalDescription = finalDescription.substring(2).trim();
    if (finalDescription.startsWith(", ")) finalDescription = finalDescription.substring(1).trim();
    
    if (!finalDescription.endsWith('.') && !finalDescription.endsWith('!') && !finalDescription.endsWith('?')) {
        finalDescription += '.';
    }
    
    return `👕 Наряд: ${finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1)}`;
}

// --- Функции для генерации описаний частей тела ---
/**
 * Генерирует описание голоса.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @returns {string} Описание голоса.
 */
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

/**
 * Генерирует описание кожи.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @param {boolean} T_is_dominant - Флаг доминирования тестостерона.
 * @returns {string} Описание кожи.
 */
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

/**
 * Генерирует описание волос на теле/лице.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @param {boolean} T_is_dominant - Флаг доминирования тестостерона.
 * @returns {string} Описание волос.
 */
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

/**
 * Генерирует описание груди.
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @returns {string} Описание груди.
 */
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

/**
 * Генерирует описание фигуры.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @param {boolean} T_is_dominant - Флаг доминирования тестостерона.
 * @returns {string} Описание фигуры.
 */
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

/**
 * Генерирует описание мышц.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @returns {string} Описание мышц.
 */
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

/**
 * Генерирует описание пениса/клитора.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @returns {string} Описание пениса/клитора.
 */
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

/**
 * Генерирует описание яичек.
 * @param {number} T - Уровень тестостерона (EMA).
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @returns {string} Описание яичек.
 */
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

/**
 * Генерирует описание ощущений.
 * @param {number} E - Уровень эстрогена (EMA).
 * @param {number} P - Уровень прогресса.
 * @param {boolean} E_is_dominant - Флаг доминирования эстрогена.
 * @param {number} hormonalBalanceFactor - Фактор гормонального баланса.
 * @returns {string} Описание ощущений.
 */
function getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor) {
    let feelingDesc = "✨ Ощущения: ";
    if (P > C.FEELING_P_THRESHOLD_PERFECT_SISSY && E_is_dominant && E > C.FEELING_E_THRESHOLD_PERFECT_SISSY) feelingDesc += "Воплощение женственности. Гармония.";
    else if (P > C.FEELING_P_THRESHOLD_REAL_SISSY && E_is_dominant) feelingDesc += "Чувствуешь себя настоящей сисси. Уверенность растет.";
    else if (P > C.FEELING_P_THRESHOLD_TRANSFORMATION_FULL_SWING && (E_is_dominant || hormonalBalanceFactor > C.FEELING_HORMONAL_BALANCE_THRESHOLD_TRANSFORMATION_FULL_SWING)) feelingDesc += "Трансформация идет полным ходом! Прилив сисси-энергии.";
    else if (P > C.FEELING_P_THRESHOLD_FIRST_WHISPERS) feelingDesc += "Первые шепоты изменений. Тело меняется, это волнует.";
    else feelingDesc += "Самое начало пути. Ветерок перемен едва коснулся.";
    return feelingDesc;
}
// --- Конец функций для генерации описаний частей тела ---

export function updateBody() {
    const T = state.emaT, E = state.emaE;
    const P = state.hormonesUnlocked ? state.progress : 0;
    const T_is_dominant = T > E + 10;
    const E_is_dominant = E > T + 5;
    const hormonalBalanceFactor = Math.max(0, Math.min(100, (E - T + C.MAX_HORMONE_LEVEL) / 2));

    let allBodyLines = [];
    state.recentBodyChanges = []; // Очищаем перед каждым обновлением

    if (!state.hormonesUnlocked) {
        let preUnlockLines = [];
        preUnlockLines.push("Ты продолжаешь исследовать себя и окружающий мир. Какие-то смутные желания и мысли иногда посещают тебя, но пока неясно, к чему они ведут.");
        preUnlockLines.push(`Твои текущие ощущения: ${state.discoveryPoints > 15 ? "Любопытство растет, ты находишь все больше интересной информации." : "Обычный день, обычные мысли."}`);
        if (state.discoveryPoints > 0 && state.discoveryPoints < C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES) {
            preUnlockLines.push(`Очки открытий: ${state.discoveryPoints}/${C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES}`);
        } else if (state.discoveryPoints >= C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES && !state.hormonesUnlocked) {
            preUnlockLines.push(`Кажется, ты на пороге важного открытия! (Очки открытий: ${state.discoveryPoints})`);
        }
        el.bodyDesc.textContent = preUnlockLines.join('\n\n');
        fullBodyDescriptionForModalStore = preUnlockLines.join('\n\n');
        return;
    }

    // --- Вызов новых функций для генерации описаний ---
    allBodyLines.push(generateBodyParameterDescription('voice', getVoiceDescription(T, E, P), state.previousBodyParams.voice, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('skin', getSkinDescription(T, E, P, E_is_dominant, T_is_dominant), state.previousBodyParams.skin, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('bodyHair', getBodyHairDescription(T, E, P, E_is_dominant, T_is_dominant), state.previousBodyParams.bodyHair, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('breast', getBreastDescription(E, P), state.previousBodyParams.breast, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('figure', getFigureDescription(T, E, P, E_is_dominant, T_is_dominant), state.previousBodyParams.figure, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('muscle', getMuscleDescription(T, E, P, E_is_dominant), state.previousBodyParams.muscle, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('genitalsPenis', getPenisDescription(T, E, P, E_is_dominant), state.previousBodyParams.genitalsPenis, state.recentBodyChanges));
    allBodyLines.push(generateBodyParameterDescription('genitalsTesticles', getTesticlesDescription(T, E, P, E_is_dominant), state.previousBodyParams.genitalsTesticles, state.recentBodyChanges));

    // Ощущения и наряд
    const feelingDesc = getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor);
    allBodyLines.push(feelingDesc);

    const outfitDesc = getCurrentOutfitDescription();
    allBodyLines.push(outfitDesc);

    // --- Формирование текста для модального окна и сводки ---
    fullBodyDescriptionForModalStore = allBodyLines.join('\n\n');

    let summaryLines = [];
    summaryLines.push(feelingDesc);
    summaryLines.push(outfitDesc);

    if (state.recentBodyChanges.length > 0) {
        summaryLines.push("\n❗ Ключевые изменения за последний день:");
        const maxChangesToShowInSummary = 3;
        state.recentBodyChanges.slice(0, maxChangesToShowInSummary).forEach(change => {
            summaryLines.push(`  - ${change}`);
        });
        if (state.recentBodyChanges.length > maxChangesToShowInSummary) {
            summaryLines.push(`  ... и еще ${state.recentBodyChanges.length - maxChangesToShowInSummary} изм.`);
        }
    } else if (state.day > 1 && Object.keys(state.previousBodyParams).length > 0) {
        summaryLines.push("\nЗаметных физических изменений за последний день не произошло.");
    }
    
    // --- Отображение в DOM ---
    el.bodyDesc.innerHTML = '';
    summaryLines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        if (line.startsWith("  - ") || line.startsWith("\n❗") || line.startsWith("\nЗаметных")) {
            p.style.whiteSpace = 'pre-wrap';
            if (line.startsWith("  - ")) p.style.marginLeft = "1em";
            if (line.startsWith("\n❗") || line.startsWith("\nЗаметных")) p.style.marginTop = "0.5em";
        }
        el.bodyDesc.appendChild(p);
    });

    let modalButton = el.bodyDesc.querySelector('#open-body-details-button');
    if (!modalButton) {
        modalButton = document.createElement('button');
        modalButton.id = 'open-body-details-button';
        modalButton.className = 'choice-button'; 
        modalButton.textContent = '🔍 Подробный осмотр тела';
        modalButton.style.marginTop = '15px'; 
        modalButton.onclick = openBodyDetailsModal; 
        el.bodyDesc.appendChild(modalButton);
    }
}

export function renderWardrobeUI() {
    el.choices.innerHTML = ''; 

    const wardrobeContainer = document.createElement('div');
    wardrobeContainer.id = 'wardrobe-interface';

    const equippedSection = document.createElement('div');
    equippedSection.className = 'wardrobe-section';
    const equippedTitle = document.createElement('h3');
    equippedTitle.textContent = 'Сейчас надето:';
    equippedSection.appendChild(equippedTitle);

    let anythingEquipped = false;
    for (const slotName in state.currentOutfit) {
        const itemId = state.currentOutfit[slotName];
        if (itemId) {
            anythingEquipped = true;
            const item = CLOTHING_ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wardrobe-item-display';
            
            const itemNameSpan = document.createElement('span');
            const userFriendlySlotName = Object.keys(CLOTHING_SLOTS).find(key => CLOTHING_SLOTS[key] === slotName) || slotName;
            itemNameSpan.textContent = `${item.name} (слот: ${userFriendlySlotName})`; 
            itemDiv.appendChild(itemNameSpan);

            const unequipButton = document.createElement('button');
            unequipButton.textContent = 'Снять';
            unequipButton.className = 'choice-button wardrobe-button'; 
            unequipButton.onclick = () => unequipItem(slotName);
            itemDiv.appendChild(unequipButton);
            
            equippedSection.appendChild(itemDiv);
        }
    }
    if (!anythingEquipped) {
        const p = document.createElement('p');
        p.textContent = 'Ничего не надето.';
        equippedSection.appendChild(p);
    }
    wardrobeContainer.appendChild(equippedSection);


    const ownedSection = document.createElement('div');
    ownedSection.className = 'wardrobe-section';
    const ownedTitle = document.createElement('h3');
    ownedTitle.textContent = 'В шкафу:';
    ownedSection.appendChild(ownedTitle);

    let anythingInClosetToWear = false;
    const currentlyWornItemIds = Object.values(state.currentOutfit).filter(id => id !== null);

    state.ownedClothes.forEach(itemId => {
        if (!currentlyWornItemIds.includes(itemId)) { 
            anythingInClosetToWear = true;
            const item = CLOTHING_ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wardrobe-item-display';

            const itemNameSpan = document.createElement('span');
            const slotKeyName = Object.keys(CLOTHING_SLOTS).find(key => CLOTHING_SLOTS[key] === item.slot);
            itemNameSpan.textContent = `${item.name} (слот: ${slotKeyName || item.slot})`;
            itemDiv.appendChild(itemNameSpan);

            const equipButton = document.createElement('button');
            equipButton.textContent = 'Надеть';
            equipButton.className = 'choice-button wardrobe-button';
            equipButton.onclick = () => equipItem(itemId);
            itemDiv.appendChild(equipButton);

            ownedSection.appendChild(itemDiv);
        }
    });

    if (state.ownedClothes.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'В шкафу пока пусто.';
        ownedSection.appendChild(p);
    } else if (!anythingInClosetToWear && state.ownedClothes.length > 0) {
        const p = document.createElement('p');
        p.textContent = 'Вся доступная одежда уже надета.';
        ownedSection.appendChild(p);
    }
    
    wardrobeContainer.appendChild(ownedSection);
    el.choices.appendChild(wardrobeContainer);
}

export function renderChoices() {
    el.choices.innerHTML = ''; 

    const actionsToDisplay = actions.filter(action => {
        if (action.tab !== state.tab) {
            return false;
        }
        if (action.tab === 'hormone' && !state.hormonesUnlocked) {
            return false;
        }
        if (action.displayCondition && !action.displayCondition.call(action)) {
            return false;
        }
        return true;
    });

    actionsToDisplay.forEach(action => {
        let buttonElement;

        if (!choiceButtonCache[action.id]) {
            buttonElement = document.createElement('button');
            buttonElement.className = 'choice-button';
            buttonElement.addEventListener('click', action.handler.bind(action));
            choiceButtonCache[action.id] = { buttonElement: buttonElement };
        } else {
            buttonElement = choiceButtonCache[action.id].buttonElement;
        }

        let baseText = typeof action.text === 'function' ? action.text.call(action) : action.text;
        let icon = '';
        switch (action.id) {
            case 'work': icon = '💼 '; break;
            case 't_blocker': icon = '💊 '; break;
            case 't_pill': icon = '♂️ '; break;
            case 'e_pill': icon = '♀️ '; break;
            case 'read_book': icon = state.hormonesUnlocked ? '📖 ' : '📚 '; break;
            case 'browse_internet': icon = '🌐 '; break;
            case 'rest': icon = '😴 '; break;
            case 'save_game': icon = '💾 '; break;
            case 'load_game': icon = '📂 '; break; 
        }

        let currentText = icon + baseText;
        let isDisabled = false;

        if (action.cost > 0) {
            if (state.money < action.cost) {
                isDisabled = true;
                currentText += ` (Нужно: ${action.cost}${C.CURRENCY_SYMBOL})`;
            } else {
                currentText += ` (–${action.cost}${C.CURRENCY_SYMBOL})`;
            }
        } else if (action.id === 'work') { 
            currentText += ` (+${C.WORK_INCOME}${C.CURRENCY_SYMBOL})`;
        }
        
        if (action.condition && !action.condition.call(action)) {
            isDisabled = true;
            if (action.id === 't_blocker' && state.t_blocker_active_days > 0) {
                currentText = `${icon}Блокатор Т активен (${state.t_blocker_active_days} дн.)`;
            }
        }

        buttonElement.textContent = currentText;
        buttonElement.disabled = isDisabled;

        el.choices.appendChild(buttonElement);
    });
}


export function updateStats() {
    el.day.textContent = state.day;
    el.money.textContent = state.money + C.CURRENCY_SYMBOL;
    el.test.textContent = `${state.testosterone.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;
    el.est.textContent = `${state.estrogen.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;

    updateProgressDisplay(); 
    updateTabsVisibility(); 

    el.tbar.style.width = (state.testosterone / C.MAX_HORMONE_LEVEL * 100) + '%';
    el.ebar.style.width = (state.estrogen / C.MAX_HORMONE_LEVEL * 100) + '%';

    updateBody(); 

    if (state.tab === 'wardrobe') {
        renderWardrobeUI();
    } else { 
        renderChoices(); 
    }
}

export function openBodyDetailsModal() {
    if (el.modalOverlay && el.modalBodyDetailsContent) {
        el.modalBodyDetailsContent.innerHTML = fullBodyDescriptionForModalStore.replace(/\n/g, '<br>');
        el.modalOverlay.classList.add('active');
    } else {
        console.error("Modal elements (overlay or content) not found in el object.");
    }
}

export function closeBodyDetailsModal() {
    if (el.modalOverlay) {
        el.modalOverlay.classList.remove('active');
    }
}

function generateBodyParameterDescription(paramKey, currentValue, previousValue, changeTexts) {
    if (currentValue !== previousValue && previousValue !== undefined && previousValue !== "") {
        const changeDescriptionPart = currentValue.substring(currentValue.indexOf(':') + 1).trim();
        const parameterTitle = currentValue.substring(0, currentValue.indexOf(':')).trim(); 

        if (changeDescriptionPart) {
             const formattedChangeDesc = changeDescriptionPart.charAt(0).toLowerCase() + changeDescriptionPart.slice(1);
             changeTexts.push(`${parameterTitle}: ${formattedChangeDesc}`);
        }
    }
    state.previousBodyParams[paramKey] = currentValue;
    return currentValue;
}
