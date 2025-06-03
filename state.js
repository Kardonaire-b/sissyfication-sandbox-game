import { BASE_E } from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js'; // Импортируем для инициализации

// Функция для получения начального списка одежды
function getInitialOwnedClothes() {
    const initialClothes = [];
    for (const itemId in CLOTHING_ITEMS) {
        if (CLOTHING_ITEMS[itemId].ownedByDefault) {
            initialClothes.push(itemId);
        }
    }
    return initialClothes;
}

// Функция для установки начального наряда
function getInitialOutfit() {
    const outfit = {};
    // Инициализируем все слоты как null
    for (const slotKey in CLOTHING_SLOTS) {
        outfit[CLOTHING_SLOTS[slotKey]] = null;
    }

    // Надеваем предметы по умолчанию
    getInitialOwnedClothes().forEach(itemId => {
        const item = CLOTHING_ITEMS[itemId];
        if (item.ownedByDefault) { // Дополнительная проверка, хотя getInitialOwnedClothes уже это делает
            // Простая логика: если слот свободен, надеваем.
            // Более сложная логика (конфликты full_body с top/bottom) будет при equipItem.
            if (outfit[item.slot] === null) {
                 outfit[item.slot] = item.id;
            }
            // Если это full_body, то очистим top и bottom, если они были как-то по ошибке установлены ранее.
            // На старте это не должно быть проблемой.
            if (item.slot === CLOTHING_SLOTS.FULL_BODY) {
                outfit[CLOTHING_SLOTS.TOP] = null;
                outfit[CLOTHING_SLOTS.BOTTOM] = null;
                // Можно также очищать и белье, если FULL_BODY его заменяет
                // outfit[CLOTHING_SLOTS.UNDERWEAR_TOP] = null;
                // outfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM] = null;
            }
        }
    });
    return outfit;
}

export const state = {
  day: 0,
  money: 50,
  testosterone: 50,
  estrogen: BASE_E,
  emaT: 50,
  emaE: BASE_E,
  progress: 0,
  discoveryPoints: 0,
  hormonesUnlocked: false,
  tab: 'income',
  t_blocker_active_days: 0,
  natural_t_multiplier: 1.0,

  ownedClothes: getInitialOwnedClothes(), // Массив ID купленных вещей
  currentOutfit: getInitialOutfit(),       // Объект { slot: itemId } для надетой одежды

  // --- Последние описания аспектов тела ---
  previousBodyParams: {},
  recentBodyChanges: [], // Массив строк ["Изменился голос: стал выше.", "Кожа стала мягче."]
  // Ощущения и наряд не будем сюда включать, т.к. они всегда в сводке

  logMessages: [], // Массив для хранения сообщений лога
  maxLogMessages: 5, // Максимальное количество сообщений для отображения (можно вынести в config.js)
};
