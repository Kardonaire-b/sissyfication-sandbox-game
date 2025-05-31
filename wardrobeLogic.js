import { state } from './state.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { updateStats } from './ui.js'; // Понадобится для обновления UI после действий

export function equipItem(itemId) {
    console.log(`wardrobeLogic: equipItem вызван. Текущий state.tab = '${state.tab}'`);
    console.log(`Попытка надеть: ${itemId}`);
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

    // --- Логика конфликтов слотов ---
    // 1. Если надеваем FULL_BODY:
    if (slotToOccupy === CLOTHING_SLOTS.FULL_BODY) {
        // Снимаем все, что конфликтует (TOP, BOTTOM, возможно UNDERWEAR)
        if (currentOutfit[CLOTHING_SLOTS.TOP]) unequipItemInternal(CLOTHING_SLOTS.TOP);
        if (currentOutfit[CLOTHING_SLOTS.BOTTOM]) unequipItemInternal(CLOTHING_SLOTS.BOTTOM);
        // Реши, нужно ли снимать белье при надевании full_body. Зависит от типа одежды.
        // if (currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP]) unequipItemInternal(CLOTHING_SLOTS.UNDERWEAR_TOP);
        // if (currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]) unequipItemInternal(CLOTHING_SLOTS.UNDERWEAR_BOTTOM);
    } else {
        // 2. Если надеваем TOP или BOTTOM, а надет FULL_BODY:
        if (slotToOccupy === CLOTHING_SLOTS.TOP || slotToOccupy === CLOTHING_SLOTS.BOTTOM) {
            if (currentOutfit[CLOTHING_SLOTS.FULL_BODY]) {
                unequipItemInternal(CLOTHING_SLOTS.FULL_BODY);
            }
        }
        // 3. Если надеваем что-то в слот, который уже занят (кроме FULL_BODY, он обрабатывается выше):
        // Например, надеваем другую футболку, если уже есть одна.
        // Или другие трусики.
        if (currentOutfit[slotToOccupy] && currentOutfit[slotToOccupy] !== itemId) {
             unequipItemInternal(slotToOccupy);
        }
    }

    // Надеваем новый предмет
    currentOutfit[slotToOccupy] = itemId;

    // TODO: Добавить/обновить state.totalFeelingBonus или подобное, если есть feelingBonus у предмета

    console.log('Текущий наряд:', JSON.parse(JSON.stringify(state.currentOutfit)));
    
    updateStats();
}

// Внутренняя функция для снятия без полного обновления UI (используется для разрешения конфликтов)
function unequipItemInternal(slotToUnequip) {
    console.log(`wardrobeLogic: unequipItem вызван. Текущий state.tab = '${state.tab}'`);
    const itemToRemoveId = state.currentOutfit[slotToUnequip];
    if (itemToRemoveId) {
        // const itemToRemove = CLOTHING_ITEMS[itemToRemoveId];
        // TODO: Вычесть feelingBonus, если есть
        state.currentOutfit[slotToUnequip] = null;
        console.log(`Снято (внутренне): ${itemToRemoveId} из слота ${slotToUnequip}`);
    }
}

export function unequipItem(slotToUnequip) {
    console.log(`Попытка снять из слота: ${slotToUnequip}`);
    const itemToRemoveId = state.currentOutfit[slotToUnequip];

    if (!itemToRemoveId) {
        console.warn(`Слот ${slotToUnequip} уже пуст.`);
        return;
    }
    
    unequipItemInternal(slotToUnequip); // Используем внутреннюю функцию для основной логики снятия

    // TODO: Можно добавить логику авто-надевания базовой одежды, если это необходимо.
    // Например, если сняли последнюю футболку, надеть стартовую мужскую, если нечего больше.

    updateStats();
}