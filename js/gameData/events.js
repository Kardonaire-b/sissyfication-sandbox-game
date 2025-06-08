import { state } from '../state.js';
import { log } from '../ui.js';
import { t } from '../i18n.js';

/**
 * Коллекция всех игровых событий.
 * Каждое событие имеет:
 * - id: уникальный идентификатор
 * - trigger: функция, которая возвращает true, если событие должно произойти.
 * - scenes: массив сцен, составляющих событие.
 * - oneTime: (опционально) true, если событие должно произойти только один раз.
 */
export const gameEvents = [
    {
        id: 'stepmom_first_gift_panties',
        oneTime: true,
        trigger: (currentState) => {
            // Срабатывает на 3-й день утром
            return currentState.day === 3;
        },
        scenes: [
            {
                id: 'intro',
                dialogue: [
                    { speaker: 'stepmom', text_key: 'events.gift1.dialogue1' }
                ],
                choices: [
                    {
                        text_key: 'events.gift1.choice_accept',
                        action: (currentState) => {
                            currentState.obedience += 5;
                            currentState.stepMotherInfluence += 10;
                            currentState.plotFlags.panty_gift_quest_started = true;
                            // Добавляем трусики в гардероб
                            if (!currentState.ownedClothes.includes('comfy_panties')) {
                                currentState.ownedClothes.push('comfy_panties');
                            }
                            log(t('events.gift1.log_accept'), 'important');
                            return { nextSceneId: 'accepted' }; // Переход к следующей сцене
                        }
                    },
                    {
                        text_key: 'events.gift1.choice_refuse',
                        action: (currentState) => {
                            currentState.rebellion += 5;
                            currentState.stepMotherInfluence += 2; // Даже отказ увеличивает влияние, но меньше
                            currentState.plotFlags.panty_gift_refused = true;
                            log(t('events.gift1.log_refuse'), 'important');
                            return { endEvent: true }; // Завершить событие
                        }
                    }
                ]
            },
            {
                id: 'accepted',
                dialogue: [
                    { speaker: 'stepmom', text_key: 'events.gift1.dialogue2_accepted' }
                ],
                choices: [
                    {
                        text_key: 'events.gift1.choice_ok',
                        action: () => ({ endEvent: true })
                    }
                ]
            }
        ]
    }
];