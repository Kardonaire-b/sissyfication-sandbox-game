import { state } from '../state.js';
import { log } from '../ui/log.js';
import { t } from '../i18n.js';
import { eventBus } from '../eventBus.js';

export const gameEvents = [
    {
        id: 'stepmom_first_gift_panties',
        oneTime: true,
        trigger: (currentState) => {
            return currentState.day === 3 && !currentState.activeTaskId;
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
                            if (!currentState.ownedClothes.includes('comfy_panties')) {
                                currentState.ownedClothes.push('comfy_panties');
                            }
                            log(t('events.gift1.log_accept'), 'important');
                            
                            eventBus.dispatch('assignTask', 'wear_first_panties');

                            return { nextSceneId: 'accepted' };
                        }
                    },
                    {
                        text_key: 'events.gift1.choice_refuse',
                        action: (currentState) => {
                            currentState.rebellion += 5;
                            currentState.stepMotherInfluence += 2;
                            currentState.plotFlags.panty_gift_refused = true;
                            log(t('events.gift1.log_refuse'), 'important');
                            return { endEvent: true };
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
    },
    {
        id: 'stepmom_praise_for_panties',
        oneTime: true,
        trigger: () => false,
        scenes: [
            {
                id: 'praise',
                dialogue: [
                        speaker: 'stepmom', 
                                ? 'events.praise1.dialogue_delayed' 
                                : 'events.praise1.dialogue_immediate';
                        }
                    }
                ],
                choices: [
                    {
                        text_key: 'events.praise1.choice_thanks',
                        action: (currentState) => {
                            currentState.obedience += 2;
                            currentState.stepMotherInfluence += 5;
                            return { endEvent: true };
                        }
                    },
                    {
                        text_key: 'events.praise1.choice_silent',
                        action: (currentState) => {
                            currentState.rebellion += 1;
                            currentState.stepMotherInfluence += 3;
                            return { endEvent: true };
                        }
                    }
                ]
            }
        ]
    }
];