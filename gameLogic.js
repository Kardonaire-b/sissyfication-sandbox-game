import { state } from './state.js';
import * as C from './config.js';
import { log, updateTabsVisibility, updateProgressDisplay, updateStats } from './ui.js';

// Проверяет, достаточно ли очков открытий для доступа к гормонам
export function checkHormoneUnlock() {
    if (!state.hormonesUnlocked && state.discoveryPoints >= C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES) {
        state.hormonesUnlocked = true;
        log("✨ Внезапное озарение! Ты нашла информацию о гормональной терапии и пути к женственности. Кажется, это то, что ты искала... Вкладка 'Гормоны' теперь доступна!", 'important');
        updateTabsVisibility();
        updateProgressDisplay();
        return true; // Возвращаем true, если разблокировка произошла
    }
    return false;
}

// Отмечает завершение дня и пересчитывает гормоны
export function nextDay() {
    state.day++;

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
