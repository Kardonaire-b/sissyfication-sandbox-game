// --- START OF FILE js/actionExecutor.js ---

import { state } from './state.js';
import * as C from './config.js';
import { nextDay, checkHormoneUnlock } from './gameLogic.js';
import { log } from './ui.js';
import { actions } from './actions.js'; // Импортируем, чтобы получить доступ к стоимости

/**
 * Централизованно выполняет игровое действие.
 * Проверяет стоимость, вычитает деньги и запускает логику действия.
 * @param {string} actionId Уникальный ID действия.
 */
export function executeAction(actionId) {
    const action = actions.find(a => a.id === actionId);
    if (!action) {
        console.error(`Попытка выполнить несуществующее действие: ${actionId}`);
        return;
    }

    // Централизованная проверка стоимости
    if (action.cost > 0 && state.money < action.cost) {
        console.warn(`Действие ${actionId} вызвано при нехватке денег. UI должен был это предотвратить.`);
        // На всякий случай можно добавить log('Недостаточно денег.', 'money-loss');
        return;
    }

    // Списание стоимости
    if (action.cost > 0) {
        state.money -= action.cost;
    }

    // Основная логика действия
    switch (actionId) {
        case 'work':
            state.money += C.WORK_INCOME;
            nextDay();
            log(`${state.playerName} поработал(а) и заработал(а) ${C.WORK_INCOME}${C.CURRENCY_SYMBOL}!`, 'money-gain');
            break;

        case 't_blocker':
            state.t_blocker_active_days = C.T_BLOCKER_DURATION_DAYS;
            state.natural_t_multiplier = C.T_BLOCKER_SUPPRESSION_FACTOR;
            nextDay();
            log(`💊 Блокатор тестостерона активирован на ${C.T_BLOCKER_DURATION_DAYS} дней!`, 'hormone-change');
            break;

        case 't_pill':
            state.testosterone = Math.min(C.MAX_HORMONE_LEVEL, state.testosterone + C.T_PILL_EFFECT);
            nextDay();
            log('♂️ Тестостерон повышен.', 'hormone-change');
            break;

        case 'e_pill':
            state.estrogen = Math.min(C.MAX_HORMONE_LEVEL, state.estrogen + C.E_PILL_EFFECT_E);
            state.testosterone = Math.max(C.BASE_T, state.testosterone - C.E_PILL_EFFECT_T_REDUCTION);
            nextDay();
            log('♀️ Эстроген повышен.', 'hormone-change');
            break;

        case 'read_book':
            if (!state.hormonesUnlocked) {
                state.discoveryPoints = Math.min(C.MAX_DISCOVERY_POINTS, state.discoveryPoints + C.BOOK_DISCOVERY_GAIN);
                log(`Чтение помогает отвлечься и узнать что-то новое о себе. (Очки Открытий +${C.BOOK_DISCOVERY_GAIN})`, 'discovery');
                checkHormoneUnlock();
            } else {
                state.progress = Math.min(C.MAX_PROGRESS, state.progress + C.BOOK_PROGRESS_GAIN);
                log(`📖 Знания о пути сисси углубляются. Прогресс +${C.BOOK_PROGRESS_GAIN}%.`, 'progress-change');
            }
            nextDay();
            break;

        case 'browse_internet':
            if (!state.hormonesUnlocked) {
                state.discoveryPoints = Math.min(C.MAX_DISCOVERY_POINTS, state.discoveryPoints + C.INTERNET_DISCOVERY_GAIN);
                let msg = `Ты провел(а) время в сети, исследуя разные темы. (Очки Открытий +${C.INTERNET_DISCOVERY_GAIN})`;
                if (state.discoveryPoints > 15 && Math.random() < 0.25 && !state.hormonesUnlocked) {
                    msg += " Некоторые обсуждения о гендерной идентичности и самовыражении показались особенно интересными...";
                }
                log(msg, 'discovery');
                checkHormoneUnlock();
            } else {
                const progressGain = C.INTERNET_PROGRESS_GAIN; 
                state.progress = Math.min(C.MAX_PROGRESS, state.progress + progressGain);
                log(`🌐 Поиск в интернете расширяет твое понимание трансформации. Прогресс +${progressGain}%.`, 'progress-change');
            }
            nextDay();
            break;

        case 'rest':
            state.testosterone = Math.max(C.BASE_T, state.testosterone * C.REST_HORMONE_DECAY_MULTIPLIER);
            state.estrogen = Math.max(C.BASE_E, state.estrogen * C.REST_HORMONE_DECAY_MULTIPLIER);
            nextDay();
            log('Тело отдыхает. Гормоны слегка снизились.', 'default');
            break;
    }
}