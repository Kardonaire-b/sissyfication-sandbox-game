// File: wardrobeConfig.js

export const CLOTHING_SLOTS = {
    FULL_BODY: 'full_body',         // Для цельных нарядов, как платья или стартовая мужская одежда (если она одним комплектом)
    TOP: 'top',                     // Футболки, блузки, свитера
    BOTTOM: 'bottom',               // Юбки, джинсы, брюки
    UNDERWEAR_TOP: 'underwear_top', // Бюстгальтеры
    UNDERWEAR_BOTTOM: 'underwear_bottom', // Трусики, стринги, боксеры
    SOCKS: 'socks',                 // Носки, чулки (пока опционально, можно добавить позже)
    SHOES: 'shoes',                 // Обувь
    // Можно будет добавить ACCESSORY_HEAD, ACCESSORY_NECK и т.д. позже
};

export const CLOTHING_ITEMS = {
    // Стартовая мужская одежда (разбита на части для гибкости)
    'male_start_tshirt': {
        id: 'male_start_tshirt',
        name: 'Старая футболка',
        description: 'Твоя обычная мешковатая футболка.',
        slot: CLOTHING_SLOTS.TOP,
        cost: 0,
        feminizationRequirement: 0,
        ownedByDefault: true,
        feelingBonus: -1 // Может немного снижать настроение или "ощущения"
    },
    'male_start_jeans': {
        id: 'male_start_jeans',
        name: 'Потертые джинсы',
        description: 'Твои старые джинсы.',
        slot: CLOTHING_SLOTS.BOTTOM,
        cost: 0,
        feminizationRequirement: 0,
        ownedByDefault: true,
        feelingBonus: -1
    },
    'male_start_boxers': {
        id: 'male_start_boxers',
        name: 'Мужские боксеры',
        description: 'Обычные мужские боксеры.',
        slot: CLOTHING_SLOTS.UNDERWEAR_BOTTOM,
        cost: 0,
        feminizationRequirement: 0,
        ownedByDefault: true,
        feelingBonus: 0
    },
    'old_sneakers': {
        id: 'old_sneakers',
        name: 'Старые кроссовки',
        description: 'Поношенные, но все еще удобные кроссовки.',
        slot: CLOTHING_SLOTS.SHOES,
        cost: 0,
        feminizationRequirement: 0,
        ownedByDefault: true,
        feelingBonus: 0
    },

    // Примеры женской одежды и белья
    'simple_female_tshirt': {
        id: 'simple_female_tshirt',
        name: 'Простая женская футболка',
        description: 'Мягкая футболка с более женственным кроем.',
        slot: CLOTHING_SLOTS.TOP,
        cost: 25, // Цены пока условные
        feminizationRequirement: 10, // Требуемый прогресс для покупки/ношения
        ownedByDefault: false,
        feelingBonus: 1 // Небольшой плюс к ощущениям
    },
    'basic_skirt': {
        id: 'basic_skirt',
        name: 'Простая юбка',
        description: 'Незатейливая юбка до колен, хороший старт.',
        slot: CLOTHING_SLOTS.BOTTOM,
        cost: 35,
        feminizationRequirement: 15,
        ownedByDefault: false,
        feelingBonus: 2
    },
    'simple_bra': {
        id: 'simple_bra',
        name: 'Простой бюстгальтер',
        description: 'Базовый бюстгальтер для начальной поддержки и формы.',
        slot: CLOTHING_SLOTS.UNDERWEAR_TOP,
        cost: 20,
        feminizationRequirement: 5, // Можно купить/носить довольно рано
        ownedByDefault: false,
        feelingBonus: 1
    },
    'comfy_panties': {
        id: 'comfy_panties',
        name: 'Удобные трусики',
        description: 'Милые и удобные хлопковые трусики.',
        slot: CLOTHING_SLOTS.UNDERWEAR_BOTTOM,
        cost: 15,
        feminizationRequirement: 5,
        ownedByDefault: false,
        feelingBonus: 1
    },
    // Можно добавить еще предметы, например, платье (full_body), другие виды белья, обувь и т.д.
};

// Минимальный прогресс для доступа к магазину одежды

export const MIN_PROGRESS_FOR_CLOTHING_SHOP = 5;