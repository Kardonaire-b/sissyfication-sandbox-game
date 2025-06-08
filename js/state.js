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
        if (item.ownedByDefault && outfit[item.slot] === null) {
            outfit[item.slot] = item.id;
            if (item.slot === CLOTHING_SLOTS.FULL_BODY) {
                outfit[CLOTHING_SLOTS.TOP] = null;
                outfit[CLOTHING_SLOTS.BOTTOM] = null;
            }
        }
    });
    return outfit;
}

export const state = {
    // Основные игровые параметры
    introCompleted: false,
    playerName: "Райан",
    playerSurname: "Коллстон",
    playerBodyType: "average",
    day: 0,
    money: 50,
    tab: 'income',
    gameState: 'normal', // 'normal', 'event', 'dialogue'

    // Параметры тела
    testosterone: 50,
    estrogen: BASE_E,
    emaT: 50,
    emaE: BASE_E,
    progress: 0, // Этот параметр остаётся как общая мера феминизации
    t_blocker_active_days: 0,
    natural_t_multiplier: 1.0,

    // Гардероб
    ownedClothes: getInitialOwnedClothes(),
    currentOutfit: getInitialOutfit(),

    // Вспомогательные данные для UI
    previousBodyParams: {},
    recentBodyChanges: [],
    logMessages: [],
    maxLogMessages: 10, // Увеличим немного для диалогов

    // --- НОВЫЕ СТРУКТУРЫ ДЛЯ СЮЖЕТА И ПРОГРЕССИИ ---
    
    // Психологические параметры
    obedience: 0,
    rebellion: 0,
    stepMotherInfluence: 0,

    // Система Заданий
    activeTaskId: null,
    completedTasks: [],

    // Система Навыков
    skills: {},

    // --- СЮЖЕТНЫЕ ФЛАГИ ---
    // Эти флаги будут управлять доступностью контента, заменяя 'hormonesUnlocked'
    plotFlags: {
        // Пример:
        // 'hormone_therapy_started': false,
        // 'panty_gift_accepted': false,
    }
};