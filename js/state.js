import { BASE_E } from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';

function getInitialOwnedClothes() {
    const initialClothes = [];
    for (const itemId in CLOTHING_ITEMS) {
        if (CLOTHING_ITEMS[itemId].ownedByDefault) {
            initialClothes.push(itemId);
        }
    }
    return initialClothes;
}

function getInitialOutfit() {
    const outfit = {};
    for (const slotKey in CLOTHING_SLOTS) {
        outfit[CLOTHING_SLOTS[slotKey]] = null;
    }

    getInitialOwnedClothes().forEach(itemId => {
        const item = CLOTHING_ITEMS[itemId];
        if (item.ownedByDefault) {
            if (outfit[item.slot] === null) {
                 outfit[item.slot] = item.id;
            }
            if (item.slot === CLOTHING_SLOTS.FULL_BODY) {
                outfit[CLOTHING_SLOTS.TOP] = null;
                outfit[CLOTHING_SLOTS.BOTTOM] = null;
            }
        }
    });
    return outfit;
}

export const state = {
  introCompleted: false,     // НОВЫЙ: Флаг завершения вступления
  playerName: "Райан",       // НОВЫЙ: Имя игрока (дефолт)
  playerSurname: "Коллстон",   // НОВЫЙ: Фамилия игрока (дефолт)
  playerBodyType: "average",

  day: 0,
  money: 50,
  testosterone: 50,          // Оставим пока без выбора для простоты первой итерации
  estrogen: BASE_E,          // Оставим пока без выбора
  emaT: 50,
  emaE: BASE_E,
  progress: 0,
  discoveryPoints: 0,
  hormonesUnlocked: false,
  tab: 'income',
  t_blocker_active_days: 0,
  natural_t_multiplier: 1.0,

  ownedClothes: getInitialOwnedClothes(),
  currentOutfit: getInitialOutfit(),

  previousBodyParams: {},
  recentBodyChanges: [],

  logMessages: [],
  maxLogMessages: 7, // Можно немного увеличить для сюжетных сообщений
  
  stepMotherInfluence: 0, // НОВЫЙ: Задел на будущее для влияния мачехи
};
