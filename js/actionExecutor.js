import { state } from './state.js';
import * as C from './config.js';
import { nextDay } from './gameLogic.js'; // <-- ИЗМЕНЕНИЕ: checkHormoneUnlock удалён
import { log } from './ui.js';
import { actions } from './actions.js';
import { t } from './i18n.js';

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

    if (action.cost > 0 && state.money < action.cost) {
        console.warn(`Действие ${actionId} вызвано при нехватке денег. UI должен был это предотвратить.`);
        return;
    }

    if (action.cost > 0) {
        state.money -= action.cost;
    }

    switch (actionId) {
        case 'work':
            state.money += C.WORK_INCOME;
            nextDay();
            log(t('log.work_success', { playerName: state.playerName, income: C.WORK_INCOME, currency: C.CURRENCY_SYMBOL }), 'money-gain');
            break;

        case 't_blocker':
            state.t_blocker_active_days = C.T_BLOCKER_DURATION_DAYS;
            state.natural_t_multiplier = C.T_BLOCKER_SUPPRESSION_FACTOR;
            nextDay();
            log(t('log.t_blocker_success', { duration: C.T_BLOCKER_DURATION_DAYS }), 'hormone-change');
            break;

        case 't_pill':
            state.testosterone = Math.min(C.MAX_HORMONE_LEVEL, state.testosterone + C.T_PILL_EFFECT);
            nextDay();
            log(t('log.t_pill_success'), 'hormone-change');
            break;

        case 'e_pill':
            state.estrogen = Math.min(C.MAX_HORMONE_LEVEL, state.estrogen + C.E_PILL_EFFECT_E);
            state.testosterone = Math.max(C.BASE_T, state.testosterone - C.E_PILL_EFFECT_T_REDUCTION);
            nextDay();
            log(t('log.e_pill_success'), 'hormone-change');
            break;

        case 'read_book':
            // Теперь это действие просто повышает общий прогресс феминизации
            state.progress = Math.min(C.MAX_PROGRESS, state.progress + C.BOOK_PROGRESS_GAIN);
            log(t('log.read_book_progress', { gain: C.BOOK_PROGRESS_GAIN }), 'progress-change');
            nextDay();
            break;

        case 'browse_internet':
            // Аналогично
            const progressGain = C.INTERNET_PROGRESS_GAIN;
            state.progress = Math.min(C.MAX_PROGRESS, state.progress + progressGain);
            log(t('log.browse_internet_progress', { gain: progressGain }), 'progress-change');
            nextDay();
            break;

        case 'rest':
            state.testosterone = Math.max(C.BASE_T, state.testosterone * C.REST_HORMONE_DECAY_MULTIPLIER);
            state.estrogen = Math.max(C.BASE_E, state.estrogen * C.REST_HORMONE_DECAY_MULTIPLIER);
            nextDay();
            log(t('log.rest_success'), 'default');
            break;
    }
}