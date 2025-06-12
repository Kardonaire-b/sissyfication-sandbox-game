import { el } from '../domUtils.js';
import { state } from '../state.js';
import * as C from '../config.js';
import { t } from '../i18n.js';

let updateStatsTimeout = null;

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

const statMappings = {
    day: { el: 'day' },
    money: { el: 'money', formatter: (val) => `${val}₽` },
    testosterone: { el: 'testosterone', bar: 'tbar', formatter: (val) => val.toFixed(1) },
    estrogen: { el: 'estrogen', bar: 'ebar', formatter: (val) => val.toFixed(1) },
    progress: { el: 'progress', bar: 'pbar' }
};

function updateStat(key, value) {
    const mapping = statMappings[key];
    if (!mapping) return;

    const element = el[mapping.el];
    if (element) {
        element.textContent = mapping.formatter ? mapping.formatter(value) : value;
    } else {
        console.warn(`[updateStat] Элемент для "${key}" не найден в кеше 'el'.`);
    }

    if (mapping.bar) {
        const barElement = el[mapping.bar];
        if (barElement) {
            const maxValue = (key === 'progress') ? state.maxProgress : C.MAX_HORMONE_LEVEL;
            barElement.style.width = `${(value / maxValue) * 100}%`;
        } else {
            console.warn(`[updateStat] Элемент бара для "${key}" не найден в кеше 'el'.`);
        }
    }
}

export function updateStats() {
    if (!el) {
        console.error("DOM cache 'el' is not initialized.");
        return;
    }
    
    // Обновляем все основные статы
    for (const key in statMappings) {
        if (Object.hasOwnProperty.call(state, key)) {
            updateStat(key, state[key]);
        }
    }

    // Обновляем заголовки и иконки, где это необходимо
    if (el.progressTitle) {
        el.progressTitle.textContent = t(state.progressTitleKey);
    }
    if (el.progressIcon) {
        el.progressIcon.textContent = state.progressIcon;
    }
} 