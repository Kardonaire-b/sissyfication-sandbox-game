import { state } from './state.js';
import * as C from './config.js';
import { log } from './ui/log.js';
import { updateStats, renderEvent } from './ui.js';
import { gameEvents } from './gameData/events.js';
import { gameTasks } from './gameData/tasks.js';
import { t } from './i18n.js';
import { eventBus } from './eventBus.js';

function checkAndTriggerEvents() {
    if (state.gameState !== 'normal') return;

    const availableEvents = gameEvents.filter(event => {
        if (event.oneTime && state.completedTasks.includes(event.id)) {
            return false;
        }
        return event.trigger && event.trigger(state);
    });

    if (availableEvents.length > 0) {
        startEventById(availableEvents[0].id);
    }
}

export function nextDay() {
    state.day++;

    if (state.activeTaskId) {
        const task = gameTasks[state.activeTaskId];
        if (task && task.onFail && !task.isCompleted(state)) {
            task.onFail(state);
            state.activeTaskId = null;
        }
    }

    checkAndTriggerEvents();

   if (state.gameState !== 'normal') {
        updateStats();
        return;
    }

    if (state.t_blocker_active_days > 0) {
        state.t_blocker_active_days--;
        if (state.t_blocker_active_days === 0) {
            state.natural_t_multiplier = 1.0;
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


/**
 * Назначает игроку новое активное задание.
 * @param {string} taskId ID задания из gameTasks.
 */
function assignTask(taskId) {
    if (gameTasks[taskId]) {
        state.activeTaskId = taskId;
        console.log(`Назначено новое задание: ${taskId}`);
    } else {
        console.error(`Попытка назначить несуществующее задание: ${taskId}`);
    }
}
eventBus.on('assignTask', taskId => assignTask(taskId));

/**
 * Проверяет, выполнено ли текущее активное задание.
 * Если да, выполняет его onComplete и очищает activeTaskId.
 */
function checkActiveTaskCompletion() {
    console.log(`[DEBUG] checkActiveTaskCompletion: Проверка... activeTaskId = ${state.activeTaskId}`);
    if (!state.activeTaskId) return;

    const task = gameTasks[state.activeTaskId];
    if (task) {
        console.log(`[DEBUG] checkActiveTaskCompletion: Задание найдено. Проверка условия isCompleted... Результат: ${task.isCompleted(state)}`);
    }

    if (task && task.isCompleted(state)) {
        console.log(`Задание ${task.id} выполнено!`);
        
        const result = task.onComplete(state);
        
        state.completedTasks.push(state.activeTaskId);
        state.activeTaskId = null;
        
        if (result && result.nextEventId) {
            console.log(`[DEBUG] checkActiveTaskCompletion: Задание выполнено. Запускаем следующее событие: ${result.nextEventId}`);
            setTimeout(() => startEventById(result.nextEventId), 100);
        }
    }
}

eventBus.on('actionCompleted', () => {
    checkActiveTaskCompletion();
});

export function startEventById(eventId) {
    console.log(`[DEBUG] startEventById: ПОЛУЧЕНА КОМАНДА ЗАПУСТИТЬ СОБЫТИЕ: ${eventId}`);
    const eventToRun = gameEvents.find(e => e.id === eventId);
    if (!eventToRun) {
        console.error(`Попытка запустить несуществующее событие: ${eventId}`);
        return;
    }

    if (eventToRun.oneTime && state.completedTasks.includes(eventToRun.id)) {
        console.warn(`Попытка повторно запустить одноразовое событие: ${eventId}`);
        return;
    }

    state.gameState = 'event';
    if (eventToRun.oneTime) {
        state.completedTasks.push(eventToRun.id);
    }
    console.log("Принудительный запуск события:", eventToRun.id);
    renderEvent(eventToRun);
}