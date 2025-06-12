import { state } from './state.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { updateStats } from './ui.js';
import { eventBus } from './eventBus.js';
import { log } from './ui/log.js';

/**
 * Внутренняя функция для снятия предмета без вызова обновлений.
 * @param {string} slotToUnequip - Слот для очистки.
 */
function unequipItemInternal(slotToUnequip) {
    const itemToRemoveId = state.currentOutfit[slotToUnequip];
    if (itemToRemoveId) {
        state.currentOutfit[slotToUnequip] = null;
    }
}

export function equipItem(itemId) {
    const itemToEquip = CLOTHING_ITEMS[itemId];

    if (!itemToEquip) {
        console.error(`Предмет с ID ${itemId} не найден.`);
        return;
    }
    if (!state.ownedClothes.includes(itemId)) {
        console.warn(`Попытка надеть предмет (${itemId}), которого нет в гардеробе.`);
        return;
    }

    const currentOutfit = state.currentOutfit;
    const slotToOccupy = itemToEquip.slot;

    eventBus.dispatch('actionCompleted');
    console.debug('[Wardrobe] DISPATCH actionCompleted', {
    equipped: itemId,
    slot: slotToOccupy,
    outfitNow: { ...state.currentOutfit }
    });

    if (slotToOccupy === CLOTHING_SLOTS.FULL_BODY) {
        if (currentOutfit[CLOTHING_SLOTS.TOP]) unequipItemInternal(CLOTHING_SLOTS.TOP);
        if (currentOutfit[CLOTHING_SLOTS.BOTTOM]) unequipItemInternal(CLOTHING_SLOTS.BOTTOM);
    } else if (slotToOccupy === CLOTHING_SLOTS.TOP || slotToOccupy === CLOTHING_SLOTS.BOTTOM) {
        if (currentOutfit[CLOTHING_SLOTS.FULL_BODY]) {
            unequipItemInternal(CLOTHING_SLOTS.FULL_BODY);
        }
    }
    
    if (currentOutfit[slotToOccupy]) {
        unequipItemInternal(slotToOccupy);
    }

    currentOutfit[slotToOccupy] = itemId;
    
    updateStats();
    eventBus.dispatch('actionCompleted');
}

export function unequipItem(slotToUnequip) {
    const itemToRemoveId = state.currentOutfit[slotToUnequip];

    if (!itemToRemoveId) {
        console.warn(`Слот ${slotToUnequip} уже пуст.`);
        return;
    }
    
    unequipItemInternal(slotToUnequip);

    updateStats();
    eventBus.dispatch('actionCompleted');
}