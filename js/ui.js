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

// --- Кэши и константы для UI ---
let fullBodyDescriptionForModalStore = "";
const choiceButtonCache = {};

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
    const fragment = document.createDocumentFragment();
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';

    if (state.logMessages.length === 0) {
        el.actionLogOutput.textContent = t('ui.log_cleared');
        el.actionLogOutput.className = 'log-default';
        return;
    }

    state.logMessages.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = t('ui.log_entry', { day: entry.timestamp, text: entry.text });
        li.className = `log-entry ${LOG_CLASS_MAP.get(entry.type) || LOG_CLASS_MAP.get('default')}`;
        
        if (index === 0) {
            li.classList.add('log-updated');
        }
        ul.appendChild(li);
    });

    fragment.appendChild(ul);
    el.actionLogOutput.innerHTML = '';
    el.actionLogOutput.appendChild(fragment);

    const latestEntry = state.logMessages[0];
    if (latestEntry) {
        el.actionLogOutput.className = `log-container ${LOG_CLASS_MAP.get(latestEntry.type) || LOG_CLASS_MAP.get('default')}`;
    }
}

// --- Функции Обновления UI ---

export function updateTabsVisibility() {
    if (!Array.isArray(el.tabs)) return;

    // НОВОЕ УСЛОВИЕ
    const isHormoneTabVisible = state.plotFlags.hormone_therapy_unlocked;

    const hormoneTab = el.tabs.find(btn => btn.dataset.tab === 'hormone');
    if (hormoneTab) {
        hormoneTab.style.display = isHormoneTabVisible ? '' : 'none';
    }

    if (!isHormoneTabVisible && state.tab === 'hormone') {
        state.tab = 'income';
        renderCurrentTabContent(); // Принудительно перерисовываем, т.к. вкладка сменилась
    }

    el.tabs.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tab === state.tab);
    });
}

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
    const fragment = document.createDocumentFragment();

    const equippedSection = createWardrobeSection('Сейчас надето:', state.currentOutfit, 'unequip');
    const currentlyWornItemIds = Object.values(state.currentOutfit).filter(id => id !== null);
    const availableItems = state.ownedClothes.filter(itemId => !currentlyWornItemIds.includes(itemId));
    
    const availableItemsBySlot = {};
    availableItems.forEach(itemId => {
        const item = CLOTHING_ITEMS[itemId];
        if (!availableItemsBySlot[item.slot]) availableItemsBySlot[item.slot] = [];
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

// --- НОВЫЙ РАЗДЕЛ: ДВИЖОК СОБЫТИЙ ---

/**
 * Отображает текущую сцену события, блокируя основной интерфейс.
 * @param {object} eventData - Полный объект события из gameEvents.
 * @param {string} [sceneId='intro'] - ID сцены для отображения.
 */
export function renderEvent(eventData, sceneId = 'intro') {
    const scene = eventData.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error(`Сцена с ID ${sceneId} не найдена в событии ${eventData.id}`);
        endEvent();
        return;
    }

    const choicesContainer = el.choices;
    // Вот здесь очистка, чтобы сцены не накладывались друг на друга.
    choicesContainer.innerHTML = ''; 

    const eventWrapper = document.createElement('div');
    eventWrapper.className = 'event-display';

    // Рендерим диалог
    const dialogueDiv = document.createElement('div');
    dialogueDiv.className = 'event-dialogue';
    scene.dialogue.forEach(line => {
        const p = document.createElement('p');
        const speakerName = (line.speaker === 'stepmom') ? C.STEPMOM_NAME : state.playerName;
        const text = t(line.text_key, { playerName: state.playerName });
        p.innerHTML = `<strong class="speaker-${line.speaker}">${speakerName}:</strong> <em>"${text}"</em>`;
        dialogueDiv.appendChild(p);
    });
    eventWrapper.appendChild(dialogueDiv);

    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'event-choices';
    scene.choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-button event-choice';
        button.textContent = t(choice.text_key);
        button.onclick = () => {
            const result = choice.action(state);
            if (result.endEvent) {
                endEvent();
            } else if (result.nextSceneId) {
                renderEvent(eventData, result.nextSceneId);
            }
        };
        choicesDiv.appendChild(button);
    });
    eventWrapper.appendChild(choicesDiv);
    
    choicesContainer.appendChild(eventWrapper);
}

/**
 * Завершает текущее событие и возвращает игру в нормальное состояние.
 */
function endEvent() {
    state.gameState = 'normal';
    console.log("Событие завершено.");
    updateStats(); // Полностью перерисовываем интерфейс в нормальное состояние
}