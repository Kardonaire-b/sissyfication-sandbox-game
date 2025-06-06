import { state } from './state.js';
import * as C from './config.js';
import { saveGame, loadGame, SAVEGAME_KEY } from './saveLoad.js';
import { log } from './ui.js';
import { executeAction } from './actionExecutor.js'; // Наш новый исполнитель!

export const actions = [
   {
        id: 'work',
        text: `Работать`, cost: 0, tab: 'income',
        handler: () => executeAction('work')
    },
    {
        id: 't_blocker',
        text: `Блокатор Т (${C.T_BLOCKER_DURATION_DAYS} дн.)`, cost: C.T_BLOCKER_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked && state.t_blocker_active_days === 0,
        handler: () => executeAction('t_blocker')
    },
    {
        id: 't_pill',
        text: `Таблетка T (+${C.T_PILL_EFFECT} T)`, cost: C.HORMONE_PILL_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: () => executeAction('t_pill')
    },
    {
        id: 'e_pill',
        text: `Таблетка E (+${C.E_PILL_EFFECT_E} E, -${C.E_PILL_EFFECT_T_REDUCTION} T)`, cost: C.HORMONE_PILL_COST, tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: () => executeAction('e_pill')
    },
    {
        id: 'read_book',
        text: () => state.hormonesUnlocked ? `Читать книгу (углубление)` : `Читать книгу (самопознание)`,
        cost: 0, tab: 'other',
        handler: () => executeAction('read_book')
    },
    {
        id: 'browse_internet',
        text: () => state.hormonesUnlocked ? 'Искать информацию (углубление)' : 'Искать информацию в интернете',
        cost: 0, tab: 'other',
        handler: () => executeAction('browse_internet')
    },
    {
        id: 'rest',
        text: 'Отдых', cost: 0, tab: 'other',
        handler: () => executeAction('rest')
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
            // ИЗМЕНЕНИЕ: Улучшаем обработчик загрузки
            if (localStorage.getItem(SAVEGAME_KEY)) { // Проверяем, есть ли сохранение
                if (window.confirm("Загрузить сохраненную игру? Текущий несохраненный прогресс будет потерян.")) {
                    if (loadGame()) { // loadGame из saveLoad.js возвращает true при успехе
                        log('🔄 Загрузка сохраненной игры...', 'important');
                        // Небольшая задержка, чтобы лог успел отобразиться перед перезагрузкой
                        setTimeout(() => {
                            window.location.reload();
                        }, 700); 
                    }
                    // Сообщение об ошибке загрузки обрабатывается внутри loadGame
                } else {
                    log('Загрузка игры отменена.', 'default');
                }
            } else {
                log('❌ Нет сохраненной игры для загрузки.', 'money-loss');
            }
        }
    },
    {
        id: 'reset_game',
        text: 'Начать игру заново (сброс)', // Более понятный текст
        cost: 0, 
        tab: 'other',
        handler: () => {
            if (window.confirm("Вы уверены, что хотите сбросить весь прогресс и начать игру заново? Это действие необратимо!")) {
                log('🔄 Прогресс сброшен. Перезагрузка для начала новой игры...', 'important');
                localStorage.removeItem(SAVEGAME_KEY);
                // Небольшая задержка, чтобы лог успел отобразиться перед перезагрузкой
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // 1.5 секунды
            } else {
                log('Сброс игры отменен.', 'default');
            }
        }
    }
];
