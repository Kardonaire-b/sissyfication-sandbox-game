export const CLOTHING_SLOTS = {
    FULL_BODY: 'full_body',
    TOP: 'top',
    BOTTOM: 'bottom',
    UNDERWEAR_TOP: 'underwear_top',
    UNDERWEAR_BOTTOM: 'underwear_bottom',
    SOCKS: 'socks',
    SHOES: 'shoes',
}; 

export const CLOTHING_ITEMS = {
    'male_start_tshirt': {
        id: 'male_start_tshirt',
        name: 'Старая футболка',
        description: 'Твоя обычная мешковатая футболка.',
        slot: CLOTHING_SLOTS.TOP,
        cost: 0,
        feminizationRequirement: 0,
        ownedByDefault: true,
        feelingBonus: -1
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


    'simple_female_tshirt': {
        id: 'simple_female_tshirt',
        name: 'Простая женская футболка',
        description: 'Мягкая футболка с более женственным кроем.',
        slot: CLOTHING_SLOTS.TOP,
        cost: 25,
        feminizationRequirement: 10,
        ownedByDefault: false,
        feelingBonus: 1
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
        feminizationRequirement: 5,
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
};
