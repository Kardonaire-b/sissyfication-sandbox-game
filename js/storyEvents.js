import { eventBus } from './eventBus.js';
import { log } from './ui/log.js';
import { t }   from './i18n.js';
import { state } from './state.js';

const events = {
    stepmom_praise_for_panties: {
        textKey : 'events.stepmom_praise_for_panties.text',
        effect  : (s) => {
            s.stepMotherInfluence += 5;
            s.obedience           += 2;
        }
    },

    /* сюда будут добавляться остальные сюжетные ивенты */
};

function handleStartEvent(id) {
    const ev = events[id];
    if (!ev) {
        console.warn(`[StoryEvents] неизвестный ивент: ${id}`);
        return;
    }

    log(t(ev.textKey), 'stepmom-dialogue');
    ev.effect?.(state);
}

eventBus.on('startEvent', handleStartEvent);
