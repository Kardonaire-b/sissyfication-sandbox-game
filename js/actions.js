import { state } from './state.js';
import * as C from './config.js';
import { saveGame, loadGame, SAVEGAME_KEY } from './saveLoad.js';
import { log } from './ui.js';
import { executeAction } from './actionExecutor.js';
import { t } from './i18n.js';

export const actions = [
   {
        id: 'work',
        // Теперь возвращаем просто ключ
        textKey: 'actions.work.text',
        cost: 0,
        tab: 'income',
        handler: () => executeAction('work')
    },
    {
        id: 't_blocker',
        textKey: 'actions.t_blocker.text',
        cost: C.T_BLOCKER_COST,
        tab: 'hormone',
        // НОВОЕ УСЛОВИЕ
        condition: () => state.plotFlags.hormone_therapy_unlocked && state.t_blocker_active_days === 0,
        handler: () => executeAction('t_blocker')
    },
    {
        id: 't_pill',
        textKey: 'actions.t_pill.text',
        cost: C.HORMONE_PILL_COST,
        tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: () => executeAction('t_pill')
    },
    {
        id: 'e_pill',
        textKey: 'actions.e_pill.text',
        cost: C.HORMONE_PILL_COST,
        tab: 'hormone',
        condition: () => state.hormonesUnlocked,
        handler: () => executeAction('e_pill')
    },
    {
        id: 'read_book',
        textKey: 'actions.read_book.progress', // Всегда один ключ
        cost: 0,
        tab: 'other',
        handler: () => executeAction('read_book')
    },
    {
        id: 'browse_internet',
        textKey: 'actions.browse_internet.progress', // Всегда один ключ
        cost: 0,
        tab: 'other',
        handler: () => executeAction('browse_internet')
    },
    {
        id: 'rest',
        textKey: 'actions.rest.text',
        cost: 0,
        tab: 'other',
        handler: () => executeAction('rest')
    },
    {
        id: 'save_game',
        textKey: 'actions.save_game.text',
        cost: 0,
        tab: 'other',
        handler: () => {
            saveGame();
        }
    },
    {
        id: 'load_game',
        textKey: 'actions.load_game.text',
        cost: 0,
        tab: 'other',
        handler: () => {
            if (localStorage.getItem(SAVEGAME_KEY)) {
                if (window.confirm(t('actions.load_game.confirm'))) {
                    if (loadGame()) {
                        log(t('log.load_reload'), 'important');
                        setTimeout(() => window.location.reload(), 700);
                    }
                } else {
                    log(t('actions.load_game.cancel'), 'default');
                }
            } else {
                log(t('actions.load_game.none'), 'money-loss');
            }
        }
    },
    {
        id: 'reset_game',
        textKey: 'actions.reset_game.text',
        cost: 0,
        tab: 'other',
        handler: () => {
            if (window.confirm(t('actions.reset_game.confirm'))) {
                localStorage.removeItem(SAVEGAME_KEY);
                log(t('log.reset_reload'), 'important');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                log(t('actions.reset_game.cancel'), 'default');
            }
        }
    }
];