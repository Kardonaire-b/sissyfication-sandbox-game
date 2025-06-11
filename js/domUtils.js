export function $(selector) {
    const id = selector.startsWith('#') ? selector.slice(1) : selector;
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Элемент с id="${id}" не найден`);
    }
    return element;
}

export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

// Инициализация DOM-элементов
console.log('Инициализация DOM-элементов...');

export const el = {
    introScreen: $('intro-screen'),
    playerNameInput: $('playerNameInput'),
    playerSurnameInput: $('playerSurnameInput'),
    bodyTypeSelect: $('bodyTypeSelect'),
    beginJourneyButton: $('beginJourneyButton'),
    gameContainer: $('game-container'),
    taskContainer: $('task-container'),
    taskTitle: $('task-title'),
    taskDescription: $('task-description'),

    day: $('day'),
    money: $('money'),
    test: $('testosterone'),
    est: $('estrogen'),
    prog: $('progress'),
    progressTitle: $('progress-title'),
    progressIcon: $('progress-icon'),
    tbar: $('test-bar'),
    ebar: $('est-bar'),
    pbar: $('progress-bar'),
    tabs: $$('.tab-button'),
    bodyDesc: $('body-desc'),
    choices: $('choices'),
    actionLogOutput: $('action-log-output'),

    modalOverlay: $('modal-overlay'),
    modalBodyDetailsContent: $('modal-body-text-content'),
    modalCloseButton: $('modal-close-button')
};

// Проверяем наличие критических элементов
const criticalElements = [
    'introScreen',
    'gameContainer',
    'playerNameInput',
    'playerSurnameInput',
    'bodyTypeSelect',
    'beginJourneyButton'
];

const missingElements = criticalElements.filter(element => !el[element]);
if (missingElements.length > 0) {
    console.error('Отсутствуют критические элементы:', missingElements);
} else {
    console.log('DOM-элементы успешно инициализированы');
}
