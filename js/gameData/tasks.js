import { state } from '../state.js';
import { log } from '../ui/log.js';
import { t } from '../i18n.js';
import { CLOTHING_SLOTS } from '../wardrobeConfig.js';


/**
 * Коллекция всех игровых заданий.
 * Каждое задание имеет:
 * - id: уникальный идентификатор.
 * - title_key: ключ для названия задания в локали.
 * - description_key: ключ для описания задания.
 * - condition: функция, которая возвращает true, если задание выполнено.
 * - onComplete: функция, которая выполняется при завершении задания.
 * - onFail: (опционально) функция, которая выполняется при провале.
 */
export const gameTasks = {
    'wear_first_panties': {
        id: 'wear_first_panties',
        title_key: 'tasks.wear_panties.title',
        description_key: 'tasks.wear_panties.description',
        
        isCompleted: (s) => {
            const id = (s.currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM] || '').trim();                 // убираем пробелы/CR-LF
            return id.startsWith('comfy_panties'); // любой вариант comfy_panties*
        },

        onComplete: (currentState) => {
            log(t('tasks.wear_panties.log_complete'), 'important');
            currentState.obedience += 3;
            currentState.stepMotherInfluence += 5;
            return { nextEventId: 'stepmom_praise_for_panties' };
        }
        
        // Поле onFail полностью удалено для этого задания
    }
};