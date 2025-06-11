import { actions } from './actions.js';
import { el } from './domUtils.js';
import { state } from './state.js';
import * as C from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { equipItem, unequipItem } from './wardrobeLogic.js';
import {
    getVoiceDescription, getSkinDescription, getBodyHairDescription,
    getBreastDescription, getFigureDescription, getMuscleDescription,
    getPenisDescription, getTesticlesDescription, getFeelingDescription,
    getCurrentOutfitDescription
} from './descriptions.js';
import { t } from './i18n.js'; // <-- ИМПОРТ
import { gameTasks } from './gameData/tasks.js';
import { LOG_CLASS_MAP, log, renderLog } from './ui/log.js';

let updateStatsTimeout = null;

// --- Кэши и константы для UI ---
let fullBodyDescriptionForModalStore = "";
const choiceButtonCache = {};

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
};

// Оптимизация: Кэширование DOM-элементов
export const DOM_CACHE = {
    logContainer: null,
    choicesContainer: null,
    bodyDescContainer: null,
    taskContainer: null,
    modalOverlay: null,
    modalBodyDetailsContent: null,
    // Добавляем элементы для главного меню
    introScreen: null,
    gameContainer: null,
    playerNameInput: null,
    playerSurnameInput: null,
    bodyTypeSelect: null,
    beginJourneyButton: null
};

// Оптимизация: Улучшенная работа с модальными окнами
const MODAL_STATE = {
    isOpen: false,
    currentEvent: null
};

// Оптимизация: Кэширование для задач
const TASK_CACHE = {
    currentTask: null,
    lastUpdate: 0
};

// Оптимизация: Улучшенный рендеринг задач
function renderActiveTask() {
    if (!DOM_CACHE.taskContainer) {
        initDOMCache();
    }

    const now = Date.now();
    // Обновляем кэш только если прошло больше 100мс с последнего обновления
    if (now - TASK_CACHE.lastUpdate < 100 && TASK_CACHE.currentTask === state.activeTaskId) {
        return;
    }

    TASK_CACHE.lastUpdate = now;
    TASK_CACHE.currentTask = state.activeTaskId;

    if (!state.activeTaskId) {
        DOM_CACHE.taskContainer.style.display = 'none';
        return;
    }

    const task = gameTasks[state.activeTaskId];
    if (!task) {
        DOM_CACHE.taskContainer.style.display = 'none';
        return;
    }

    // Оптимизация: Используем DocumentFragment для обновления
    const fragment = document.createDocumentFragment();
    
    const titleElement = document.createElement('div');
    titleElement.className = 'task-title';
    titleElement.textContent = t(task.title_key);
    fragment.appendChild(titleElement);

    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'task-description';
    descriptionElement.textContent = t(task.description_key);
    fragment.appendChild(descriptionElement);

    // Очищаем и обновляем за один раз
    DOM_CACHE.taskContainer.innerHTML = '';
    DOM_CACHE.taskContainer.appendChild(fragment);
    DOM_CACHE.taskContainer.style.display = 'block';
}

// Оптимизация: Улучшенная работа с состоянием
const STATE_UPDATE_QUEUE = [];
let isStateUpdating = false;

function processStateUpdateQueue() {
    if (isStateUpdating || STATE_UPDATE_QUEUE.length === 0) return;

    isStateUpdating = true;
    const updates = STATE_UPDATE_QUEUE.splice(0, STATE_UPDATE_QUEUE.length);

    requestAnimationFrame(() => {
        updates.forEach(update => {
            try {
                update();
            } catch (error) {
                console.error('Ошибка при обновлении состояния:', error);
            }
        });
        isStateUpdating = false;

        if (STATE_UPDATE_QUEUE.length > 0) {
            processStateUpdateQueue();
        }
    });
}

export function queueStateUpdate(updateFunction) {
    STATE_UPDATE_QUEUE.push(updateFunction);
    processStateUpdateQueue();
}

// Оптимизация: Улучшенная работа с вкладками
const TAB_CACHE = {
    currentTab: null,
    tabElements: new Map()
};

export function updateTabsVisibility() {
    if (!Array.isArray(el.tabs)) return;

    const isHormoneTabVisible = state.plotFlags.hormone_therapy_unlocked;
    
    // Инициализация кэша вкладок при первом вызове
    if (TAB_CACHE.tabElements.size === 0) {
        el.tabs.forEach(btn => {
            if (btn && btn.dataset && btn.dataset.tab) {
                TAB_CACHE.tabElements.set(btn.dataset.tab, btn);
            }
        });
    }

    const hormoneTab = TAB_CACHE.tabElements.get('hormone');
    if (hormoneTab) {
        hormoneTab.style.display = isHormoneTabVisible ? '' : 'none';
    }

    if (!isHormoneTabVisible && state.tab === 'hormone') {
        state.tab = 'income';
        queueStateUpdate(() => renderCurrentTabContent());
    }

    // Обновляем только если вкладка изменилась
    if (TAB_CACHE.currentTab !== state.tab) {
        TAB_CACHE.currentTab = state.tab;
        el.tabs.forEach(btn => {
            if (btn && btn.dataset && btn.dataset.tab) {
                btn.classList.toggle('selected', btn.dataset.tab === state.tab);
            }
        });
    }
}

// Инициализация кэша DOM-элементов
export function initDOMCache() {
    console.log('Инициализация DOM-кэша...');
    
    // Основные элементы игры
    DOM_CACHE.logContainer = el.actionLogOutput;
    DOM_CACHE.choicesContainer = el.choices;
    DOM_CACHE.bodyDescContainer = el.bodyDesc;
    DOM_CACHE.taskContainer = el.taskContainer;
    DOM_CACHE.modalOverlay = el.modalOverlay;
    DOM_CACHE.modalBodyDetailsContent = el.modalBodyDetailsContent;

    // Элементы главного меню
    DOM_CACHE.introScreen = el.introScreen;
    DOM_CACHE.gameContainer = el.gameContainer;
    DOM_CACHE.playerNameInput = el.playerNameInput;
    DOM_CACHE.playerSurnameInput = el.playerSurnameInput;
    DOM_CACHE.bodyTypeSelect = el.bodyTypeSelect;
    DOM_CACHE.beginJourneyButton = el.beginJourneyButton;

    // Проверяем наличие критических элементов
    const criticalElements = [
        'introScreen',
        'gameContainer',
        'playerNameInput',
        'playerSurnameInput',
        'bodyTypeSelect',
        'beginJourneyButton'
    ];

    const missingElements = criticalElements.filter(element => !DOM_CACHE[element]);
    if (missingElements.length > 0) {
        console.error('Отсутствуют критические элементы:', missingElements);
    } else {
        console.log('DOM-кэш успешно инициализирован');
    }
}

// --- Функции Обновления UI ---

export function updateProgressDisplay() {
    // УПРОЩЕННАЯ ЛОГИКА
    el.progressTitle.textContent = t('ui.progress');
    el.progressIcon.textContent = "📈";
    
    const currentValue = state.progress;
    const maxValue = C.MAX_PROGRESS;
    const unit = '%';

    el.prog.textContent = `${currentValue}${unit} / ${maxValue}${unit}`;
    el.pbar.style.width = `${(currentValue / maxValue) * 100}%`;
}

// Конфигурация для Data-Driven подхода (остается без изменений)
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
    state.previousBodyParams[paramKey] = currentValue;
    return currentValue;
}

export function updateBody() {
    // В будущем эта логика будет сильно изменена или удалена,
    // но пока оставляем для обратной совместимости
    if (!state.hormonesUnlocked) {
        // Мы будем удалять 'discoveryPoints', поэтому этот блок станет не нужен
        const preUnlockLines = [
            "Ты живешь в доме мачехи. Каждый день приносит что-то новое, и ты чувствуешь, что ее внимание к тебе усиливается...",
            `Влияние мачехи: ${state.stepMotherInfluence}`
        ];
        el.bodyDesc.textContent = fullBodyDescriptionForModalStore = preUnlockLines.join('\n\n');
        return;
    }

    const T = state.emaT, E = state.emaE, P = state.progress;
    const T_is_dominant = T > E + 10;
    const E_is_dominant = E > T + 5;
    const hormonalBalanceFactor = Math.max(0, Math.min(100, (E - T + C.MAX_HORMONE_LEVEL) / 2));
    
    state.recentBodyChanges = [];
    
    const allBodyLines = bodyPartDescriptors.map(descriptor => {
        const args = descriptor.args(T, E, P, E_is_dominant, T_is_dominant);
        const currentValue = descriptor.func(...args);
        return trackAndLogChange(descriptor.key, currentValue, state.recentBodyChanges);
    });

    const feelingDesc = getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor);
    allBodyLines.push(feelingDesc);
    allBodyLines.push(getCurrentOutfitDescription());

    fullBodyDescriptionForModalStore = allBodyLines.join('\n\n');

    const summaryLines = [feelingDesc, getCurrentOutfitDescription()];
    if (state.recentBodyChanges.length > 0) {
        // TODO: Перевести строки на ключи локализации
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
    modalButton.textContent = t('ui.body_details_button');
    modalButton.style.marginTop = '15px';
    modalButton.onclick = openBodyDetailsModal;
    summaryFragment.appendChild(modalButton);

    el.bodyDesc.appendChild(summaryFragment);
}

// --- Рендеринг вкладок (Выбор действий и Гардероб) ---

function renderCurrentTabContent() {
    if (state.gameState !== 'normal') {
        // Если идет событие, НЕ ТРОГАЕМ контейнер el.choices.
        // Он сейчас контролируется функцией renderEvent.
        // Просто выходим из функции.
        return;
    }

    // Если же игра в нормальном состоянии, то всё работает как раньше.
    // Сначала очищаем, потом рисуем нужные кнопки.
    el.choices.innerHTML = ''; 

    if (state.tab === 'wardrobe') {
        renderWardrobeUI();
    } else {
        renderChoices();
    }
}

export function renderWardrobeUI() {
    if (!DOM_CACHE.choicesContainer) {
        initDOMCache();
    }

    const fragment = document.createDocumentFragment();
    const currentlyWornItemIds = new Set(Object.values(state.currentOutfit).filter(id => id !== null));
    
    // Оптимизация: Используем Map для быстрого доступа
    const availableItemsBySlot = new Map();
    state.ownedClothes.forEach(itemId => {
        if (!currentlyWornItemIds.has(itemId)) {
            const item = CLOTHING_ITEMS[itemId];
            if (!availableItemsBySlot.has(item.slot)) {
                availableItemsBySlot.set(item.slot, []);
            }
            availableItemsBySlot.get(item.slot).push(itemId);
        }
    });

    const equippedSection = createWardrobeSection('Сейчас надето:', state.currentOutfit, 'unequip');
    const ownedSection = createWardrobeSection('В шкафу:', Object.fromEntries(availableItemsBySlot), 'equip');
    
    fragment.appendChild(equippedSection);
    fragment.appendChild(ownedSection);
    
    // Оптимизация: Очищаем и обновляем за один раз
    DOM_CACHE.choicesContainer.innerHTML = '';
    DOM_CACHE.choicesContainer.appendChild(fragment);
}

function createWardrobeSection(title, items, actionType) {
    const section = document.createElement('div');
    section.className = 'wardrobe-section';
    const h3 = document.createElement('h3');
    h3.textContent = title; // TODO: Перевести в локаль
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
            itemNameSpan.textContent = `${item.name} (слот: ${slotKeyName})`; // TODO: Перевести
            itemDiv.appendChild(itemNameSpan);

            const button = document.createElement('button');
            button.className = 'choice-button wardrobe-button';
            if (actionType === 'equip') {
                button.textContent = 'Надеть'; // TODO: Перевести
                button.onclick = () => equipItem(itemId);
            } else {
                button.textContent = 'Снять'; // TODO: Перевести
                button.onclick = () => unequipItem(item.slot);
            }
            itemDiv.appendChild(button);
            section.appendChild(itemDiv);
        });
    }

    if (!hasItems) {
        const p = document.createElement('p');
        // TODO: Перевести
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

        // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---

        // 1. Получаем иконку
        let icon = ACTION_ICON_MAP[action.id] || '';
        // Особый случай для книги
        if (action.id === 'read_book') {
            icon = state.hormonesUnlocked ? '📖 ' : '📚 ';
        }

        // 2. Получаем базовый текст по ключу
        const key = typeof action.textKey === 'function' ? action.textKey() : action.textKey;
        // Параметры для замены в строке
        const replacements = {
            duration: C.T_BLOCKER_DURATION_DAYS,
            effect: C.T_PILL_EFFECT,
            e_effect: C.E_PILL_EFFECT_E,
            t_reduction: C.E_PILL_EFFECT_T_REDUCTION
        };
        let baseText = t(key, replacements);
        
        let fullButtonText = `${icon}${baseText}`;
        let isDisabled = (action.condition && !action.condition());

        // 3. Добавляем информацию о стоимости или доходе
        if (action.cost > 0) {
            fullButtonText += ` (–${action.cost}${C.CURRENCY_SYMBOL})`;
            if (state.money < action.cost) {
                isDisabled = true;
                // TODO: Перевести в локаль
                fullButtonText += ` (Нужно: ${action.cost}${C.CURRENCY_SYMBOL})`;
            }
        } else if (action.id === 'work') {
            fullButtonText += ` (+${C.WORK_INCOME}${C.CURRENCY_SYMBOL})`;
        }

        // 4. Особый случай для активного блокатора
        if (action.id === 't_blocker' && state.t_blocker_active_days > 0) {
             fullButtonText = `${icon}${t('actions.t_blocker.active', { days: state.t_blocker_active_days })}`;
             isDisabled = true;
        }

        buttonElement.textContent = fullButtonText;
        buttonElement.disabled = isDisabled;
        fragment.appendChild(buttonElement);
    });

    el.choices.innerHTML = '';
    el.choices.appendChild(fragment);
}


// --- Главная функция обновления и модальные окна ---

export function updateStats() {
    if (updateStatsTimeout) {
        clearTimeout(updateStatsTimeout);
    }
    
    updateStatsTimeout = setTimeout(() => {
        el.day.textContent = state.day;
        el.money.textContent = `${state.money}${C.CURRENCY_SYMBOL}`;
        el.test.textContent = `${state.testosterone.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;
        el.est.textContent = `${state.estrogen.toFixed(0)} / ${C.MAX_HORMONE_LEVEL}`;

        el.tbar.style.width = `${(state.testosterone / C.MAX_HORMONE_LEVEL) * 100}%`;
        el.ebar.style.width = `${(state.estrogen / C.MAX_HORMONE_LEVEL) * 100}%`;

        updateProgressDisplay();
        updateTabsVisibility();
        updateBody();
        renderActiveTask();
        renderCurrentTabContent();
    }, 16); // ~60fps
}

export function openBodyDetailsModal() {
    if (!DOM_CACHE.modalOverlay || !DOM_CACHE.modalBodyDetailsContent) {
        initDOMCache();
    }

    if (MODAL_STATE.isOpen) return;

    DOM_CACHE.modalBodyDetailsContent.innerHTML = fullBodyDescriptionForModalStore.replace(/\n/g, '<br>');
    DOM_CACHE.modalOverlay.classList.add('active');
    MODAL_STATE.isOpen = true;

    // Добавляем обработчик для закрытия по клику вне модального окна
    const closeOnOutsideClick = (e) => {
        if (e.target === DOM_CACHE.modalOverlay) {
            closeBodyDetailsModal();
        }
    };
    DOM_CACHE.modalOverlay.addEventListener('click', closeOnOutsideClick);
}

export function closeBodyDetailsModal() {
    if (!DOM_CACHE.modalOverlay) {
        initDOMCache();
    }

    if (!MODAL_STATE.isOpen) return;

    DOM_CACHE.modalOverlay.classList.remove('active');
    MODAL_STATE.isOpen = false;
}

// --- НОВЫЙ РАЗДЕЛ: ДВИЖОК СОБЫТИЙ ---

/**
 * Отображает текущую сцену события, блокируя основной интерфейс.
 * @param {object} eventData - Полный объект события из gameEvents.
 * @param {string} [sceneId='intro'] - ID сцены для отображения.
 */
export function renderEvent(eventData, sceneId = 'intro') {
    if (!DOM_CACHE.choicesContainer) {
        initDOMCache();
    }

    const scene = eventData.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error(`Сцена с ID ${sceneId} не найдена в событии ${eventData.id}`);
        endEvent();
        return;
    }

    MODAL_STATE.currentEvent = eventData;
    DOM_CACHE.choicesContainer.innerHTML = '';

    const eventWrapper = document.createElement('div');
    eventWrapper.className = 'event-display';

    // Оптимизация: Используем DocumentFragment для диалога
    const dialogueFragment = document.createDocumentFragment();
    scene.dialogue.forEach(line => {
        const p = document.createElement('p');
        const speakerName = (line.speaker === 'stepmom') ? C.STEPMOM_NAME : state.playerName;
        const textKey = typeof line.text_key === 'function' ? line.text_key(state) : line.text_key;
        const text = t(textKey, { playerName: state.playerName });
        p.innerHTML = `<strong class="speaker-${line.speaker}">${speakerName}:</strong> <em>"${text}"</em>`;
        dialogueFragment.appendChild(p);
    });

    const dialogueDiv = document.createElement('div');
    dialogueDiv.className = 'event-dialogue';
    dialogueDiv.appendChild(dialogueFragment);
    eventWrapper.appendChild(dialogueDiv);

    // Оптимизация: Используем DocumentFragment для кнопок выбора
    const choicesFragment = document.createDocumentFragment();
    scene.choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-button event-choice';
        button.textContent = t(choice.text_key);
        
        // Оптимизация: Используем замыкание для сохранения контекста
        button.onclick = (() => {
            const currentChoice = choice;
            return () => {
                const result = currentChoice.action(state);
                if (result.endEvent) {
                    endEvent();
                } else if (result.nextSceneId) {
                    renderEvent(eventData, result.nextSceneId);
                }
            };
        })();
        
        choicesFragment.appendChild(button);
    });

    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'event-choices';
    choicesDiv.appendChild(choicesFragment);
    eventWrapper.appendChild(choicesDiv);
    
    DOM_CACHE.choicesContainer.appendChild(eventWrapper);
}

/**
 * Завершает текущее событие и возвращает игру в нормальное состояние.
 */
function endEvent() {
    state.gameState = 'normal';
    MODAL_STATE.currentEvent = null;
    console.log("Событие завершено.");
    
    // Используем requestAnimationFrame для плавного обновления UI
    requestAnimationFrame(() => {
        updateStats();
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем кэш DOM-элементов
    initDOMCache();
    
    // Проверяем наличие необходимых элементов
    if (!DOM_CACHE.introScreen || !DOM_CACHE.gameContainer) {
        console.error('Критические элементы интерфейса не найдены');
        return;
    }
});