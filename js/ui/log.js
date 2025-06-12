import { state } from '../state.js';
import { t } from '../i18n.js';
import { DOM_CACHE } from '../ui.js';

/**
 * Карта классов для разных типов логов
 */
export const LOG_CLASS_MAP = new Map([
    ['default', 'log-default'],
    ['money-gain', 'log-money-gain'],
    ['money-loss', 'log-money-loss'],
    ['hormone-change', 'log-hormone-change'],
    ['progress-change', 'log-progress-change'],
    ['discovery', 'log-discovery'],
    ['important', 'log-important'],
    ['stepmom-dialogue', 'log-stepmom-dialogue'],
]);

/**
 * Метаданные для каждого типа лога: метка и иконка
 */
const LOG_TYPE_META = {
    'default'         : { label: 'Разное',         icon: '📄' },
    'money-gain'      : { label: 'Доход',          icon: '💰' },
    'money-loss'      : { label: 'Траты',          icon: '💸' },
    'hormone-change'  : { label: 'Гормоны',        icon: '⚧️' },
    'progress-change' : { label: 'Прогресс',       icon: '📈' },
    'discovery'       : { label: 'Открытия',       icon: '💡' },
    'important'       : { label: 'Важное',         icon: '❗' },
    'stepmom-dialogue': { label: 'Диалоги',        icon: '💬' }
};

// Текущий фильтр ("all" = показывать всё)
let currentFilter = 'all';

// Сохраняем ссылку на список <ul>, чтобы не пересоздавать лишний раз
let logListElement = null;
let controlsCreated = false;

function ensureControls() {
    if (controlsCreated || !DOM_CACHE.logContainer) return;

    // Очищаем контейнер и создаём под‐контейнеры
    DOM_CACHE.logContainer.innerHTML = '';

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'log-controls';

    // Кнопка «Все»
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Все';
    allBtn.className = 'log-filter-btn selected';
    allBtn.onclick = () => { setFilter('all', allBtn); };
    controlsDiv.appendChild(allBtn);

    // Кнопки отдельных типов
    Object.keys(LOG_TYPE_META).forEach(typeId => {
        const btn = document.createElement('button');
        btn.textContent = LOG_TYPE_META[typeId].icon + ' ' + LOG_TYPE_META[typeId].label;
        btn.className = 'log-filter-btn';
        btn.onclick = () => { setFilter(typeId, btn); };
        controlsDiv.appendChild(btn);
    });

    // Кнопка «Очистить»
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Очистить';
    clearBtn.className = 'log-clear-btn';
    clearBtn.onclick = () => {
        state.logMessages = [];
        renderLog();
    };
    controlsDiv.appendChild(clearBtn);

    DOM_CACHE.logContainer.appendChild(controlsDiv);

    logListElement = document.createElement('ul');
    logListElement.style.listStyleType = 'none';
    logListElement.style.padding = '0';
    logListElement.style.margin = '0';
    logListElement.className = 'log-list';

    DOM_CACHE.logContainer.appendChild(logListElement);

    controlsCreated = true;
}

function setFilter(filterId, btnElement) {
    currentFilter = filterId;
    // Сброс классов selected у всех кнопок
    const allButtons = DOM_CACHE.logContainer.querySelectorAll('.log-filter-btn');
    allButtons.forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    renderLog();
}

/**
 * Добавляет сообщение в лог.
 * @param {string} msg
 * @param {string} [type='default']
 */
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

/**
 * Рендерит лог в DOM.
 */
export function renderLog() {
    if (!DOM_CACHE.logContainer) return;

    ensureControls();

    if (!logListElement) return; // страховка

    // Фильтруем сообщения, если задан фильтр
    const messages = currentFilter === 'all'
        ? state.logMessages
        : state.logMessages.filter(m => m.type === currentFilter);

    // Если нет сообщений, показываем заглушку
    if (messages.length === 0) {
        logListElement.innerHTML = `<li class="log-placeholder">${t('ui.log_cleared')}</li>`;
        return;
    }

    const listFrag = document.createDocumentFragment();

    messages.forEach((entry, index) => {
        const li = document.createElement('li');
        const meta = LOG_TYPE_META[entry.type] || LOG_TYPE_META['default'];
        const icon = meta.icon;
        li.innerHTML = `<span class="log-icon">${icon}</span> ${t('ui.log_entry', { day: entry.timestamp, text: entry.text })}`;
        li.className = `log-entry ${LOG_CLASS_MAP.get(entry.type) || LOG_CLASS_MAP.get('default')}`;
        if (index === 0) li.classList.add('log-updated');
        listFrag.appendChild(li);
    });

    logListElement.innerHTML = '';
    logListElement.appendChild(listFrag);

    // Автопрокрутка к последнему сообщению (верх списка)
    logListElement.scrollTop = 0;
} 