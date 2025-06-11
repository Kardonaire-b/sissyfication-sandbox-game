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
    const fragment = document.createDocumentFragment();
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
    if (state.logMessages.length === 0) {
        DOM_CACHE.logContainer.textContent = t('ui.log_cleared');
        DOM_CACHE.logContainer.className = 'log-default';
        return;
    }
    const logFragment = document.createDocumentFragment();
    state.logMessages.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = t('ui.log_entry', { day: entry.timestamp, text: entry.text });
        li.className = `log-entry ${LOG_CLASS_MAP.get(entry.type) || LOG_CLASS_MAP.get('default')}`;
        if (index === 0) {
            li.classList.add('log-updated');
        }
        logFragment.appendChild(li);
    });
    ul.appendChild(logFragment);
    fragment.appendChild(ul);
    DOM_CACHE.logContainer.innerHTML = '';
    DOM_CACHE.logContainer.appendChild(fragment);
    const latestEntry = state.logMessages[0];
    if (latestEntry) {
        DOM_CACHE.logContainer.className = `log-container ${LOG_CLASS_MAP.get(latestEntry.type) || LOG_CLASS_MAP.get('default')}`;
    }
} 