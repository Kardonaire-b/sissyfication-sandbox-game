import { state } from './state.js';
import * as C from './config.js';
import { nextDay, checkHormoneUnlock } from './gameLogic.js';
import { log } from './ui.js';
import { saveGame, loadGame } from './saveLoad.js';

export const actions = [
    {
        id: 'work',
        text: `Работать`, cost: 0, tab: 'income',
        handler: () => {
            state.money += C.WORK_INCOME;
            nextDay();
            log(`Ты поработала и заработала ${C.WORK_INCOME}${C.CURRENCY_SYMBOL}!`, 'money-gain');
        }
    },
    {
        id: 't_blocker',
        text: `Блокатор Т (${C.T_BLOCKER_DURATION_DAYS} дн.)`, cost: C.T_BLOCKER_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked && state.t_blocker_active_days === 0,
        handler: function() {
            if (state.money >= C.T_BLOCKER_COST) {
                state.money -= C.T_BLOCKER_COST;
                state.t_blocker_active_days = C.T_BLOCKER_DURATION_DAYS;
                state.natural_t_multiplier = C.T_BLOCKER_SUPPRESSION_FACTOR;
                nextDay();
                log(`💊 Блокатор тестостерона активирован на ${C.T_BLOCKER_DURATION_DAYS} дней!`, 'hormone-change');
            } else {
                console.warn(`Действие ${this.id || 't_blocker'} вызвано при нехватке денег. UI должен был это предотвратить.`);
            }
        }
    },
    {
        id: 't_pill',
        text: `Таблетка T (+${C.T_PILL_EFFECT} T)`, cost: C.HORMONE_PILL_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: function() {
            if (state.money >= C.HORMONE_PILL_COST) {
                state.money -= C.HORMONE_PILL_COST;
                state.testosterone = Math.min(C.MAX_HORMONE_LEVEL, state.testosterone + C.T_PILL_EFFECT);
                nextDay();
                log('♂️ Тестостерон повышен.', 'hormone-change');
            } else {
                console.warn(`Действие ${this.id || 't_pill'} вызвано при нехватке денег. UI должен был это предотвратить.`);
            }
        }
    },
    {
        id: 'e_pill',
        text: `Таблетка E (+${C.E_PILL_EFFECT_E} E, -${C.E_PILL_EFFECT_T_REDUCTION} T)`, cost: C.HORMONE_PILL_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: function() {
            if (state.money >= C.HORMONE_PILL_COST) {
                state.money -= C.HORMONE_PILL_COST;
                state.estrogen = Math.min(C.MAX_HORMONE_LEVEL, state.estrogen + C.E_PILL_EFFECT_E);
                state.testosterone = Math.max(C.BASE_T, state.testosterone - C.E_PILL_EFFECT_T_REDUCTION);
                nextDay();
                log('♀️ Эстроген повышен.', 'hormone-change');
            } else {
                console.warn(`Действие ${this.id || 'e_pill'} вызвано при нехватке денег. UI должен был это предотвратить.`);
            }
        }
    },
    {
        id: 'read_book',
        text: () => state.hormonesUnlocked ? `Читать книгу (углубление)` : `Читать книгу (самопознание)`,
        cost: 0, tab: 'other',
        handler: () => {
            if (!state.hormonesUnlocked) {
                state.discoveryPoints = Math.min(C.MAX_DISCOVERY_POINTS, state.discoveryPoints + C.BOOK_DISCOVERY_GAIN);
                log(`Чтение помогает отвлечься и узнать что-то новое о себе. (Очки Открытий +${C.BOOK_DISCOVERY_GAIN})`, 'discovery');
                checkHormoneUnlock();
            } else {
                state.progress = Math.min(C.MAX_PROGRESS, state.progress + C.BOOK_PROGRESS_GAIN);
                log(`📖 Знания о пути сисси углубляются. Прогресс +${C.BOOK_PROGRESS_GAIN}%.`, 'progress-change');
            }
            nextDay();
        }
    },
     {
        id: 'browse_internet',
        text: () => state.hormonesUnlocked ? 'Искать информацию (углубление)' : 'Искать информацию в интернете',
        cost: 0, tab: 'other',
        handler: () => {
            if (!state.hormonesUnlocked) {
                state.discoveryPoints = Math.min(C.MAX_DISCOVERY_POINTS, state.discoveryPoints + C.INTERNET_DISCOVERY_GAIN);
                let msg = `Ты провел(а) время в сети, исследуя разные темы. (Очки Открытий +${C.INTERNET_DISCOVERY_GAIN})`;
                if (state.discoveryPoints > 15 && Math.random() < 0.25 && !state.hormonesUnlocked) {
                    msg += " Некоторые обсуждения о гендерной идентичности и самовыражении показались особенно интересными...";
                }
                log(msg, 'discovery');
                checkHormoneUnlock();
            } else {
                const progressGain = C.BOOK_PROGRESS_GAIN;
                state.progress = Math.min(C.MAX_PROGRESS, state.progress + progressGain);
                log(`🌐 Поиск в интернете расширяет твое понимание трансформации. Прогресс +${progressGain}%.`, 'progress-change');
            }
            nextDay();
        }
    },
    {
        id: 'rest',
        text: 'Отдых', cost: 0, tab: 'other',
        handler: () => {
            state.testosterone = Math.max(C.BASE_T, state.testosterone * C.REST_HORMONE_DECAY_MULTIPLIER);
            state.estrogen = Math.max(C.BASE_E, state.estrogen * C.REST_HORMONE_DECAY_MULTIPLIER);
            nextDay();
            log('Тело отдыхает. Гормоны слегка снизились.', 'default');
        }
    },
    {
        id: 'save_game',
        text: 'Сохранить игру', cost: 0, tab: 'other',
        handler: () => {
            saveGame();
        }
    },
    {
        id: 'load_game',
        text: 'Загрузить игру', cost: 0, tab: 'other',
        handler: () => {
            loadGame();
        }
    }
];
