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