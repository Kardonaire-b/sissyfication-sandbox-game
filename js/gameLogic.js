import { state } from './state.js';
import * as C from './config.js';
import { log, updateStats } from './ui.js';
import { gameEvents } from './gameData/events.js';
import { renderEvent } from './ui.js';

function checkAndTriggerEvents() {
    if (state.gameState !== 'normal') return;

    const availableEvents = gameEvents.filter(event => {
        // Проверяем, что событие одноразовое и еще не было завершено
        if (event.oneTime && state.completedTasks.includes(event.id)) {
            return false;
        }
        // Проверяем триггер
        return event.trigger(state);
    });

    if (availableEvents.length > 0) {
        const eventToRun = availableEvents[0];
        state.gameState = 'event'; // Блокируем игру
        state.completedTasks.push(eventToRun.id); // Сразу отмечаем как выполненное, чтобы не запускалось повторно
        console.log("Запуск события:", eventToRun.id);
        renderEvent(eventToRun); // Передаем управление в UI
    }
}

export function nextDay() {
    state.day++;

    // Сначала обрабатываем логику событий нового дня
    checkAndTriggerEvents();
    if (state.gameState !== 'normal') {
        // Если событие началось, оно может прервать обычный ход дня.
        // Дальнейшая логика (изменение гормонов и т.д.) может быть поставлена на паузу
        // или обработана внутри самого события. Пока просто выходим.
        updateStats(); // Обновляем UI, чтобы показать, что день сменился.
        return;
    }

    // Обычная логика дня (если не было событий)
    if (state.t_blocker_active_days > 0) {
        state.t_blocker_active_days--;
        if (state.t_blocker_active_days === 0) {
            state.natural_t_multiplier = 1.0;
            // TODO: Перевести в локаль
            log("Действие блокатора тестостерона закончилось.", "hormone-change");
        }
    }

    const estrogenSuppressionFactor = Math.max(0.05, 1 - (state.estrogen / C.ESTROGEN_SUPPRESSION_THRESHOLD));
    const currentNaturalTProduction = (C.NATURAL_T_BASE_PRODUCTION * state.natural_t_multiplier) * estrogenSuppressionFactor;

    state.testosterone = state.testosterone * (1 - C.DECAY_RATE) + currentNaturalTProduction;
    state.testosterone = Math.max(C.BASE_T, Math.min(C.MAX_HORMONE_LEVEL, state.testosterone));

    let newE = state.estrogen * (1 - C.DECAY_RATE);
    newE += state.testosterone * C.AROMATIZATION_RATE;
    state.estrogen = Math.max(C.BASE_E, Math.min(C.MAX_HORMONE_LEVEL, newE));

    state.emaT = C.EMA_ALPHA * state.testosterone + (1 - C.EMA_ALPHA) * state.emaT;
    state.emaE = C.EMA_ALPHA * state.estrogen + (1 - C.EMA_ALPHA) * state.emaE;

    updateStats();
}