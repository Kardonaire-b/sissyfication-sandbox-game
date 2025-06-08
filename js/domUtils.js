export function $(selector) {
    const id = selector.startsWith('#') ? selector.slice(1) : selector;
    return document.getElementById(id);
}

export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export const el = {
    // --- Элементы вступления ---
    introScreen: $('intro-screen'),
    playerNameInput: $('playerNameInput'),
    playerSurnameInput: $('playerSurnameInput'),
    bodyTypeSelect: $('bodyTypeSelect'),
    beginJourneyButton: $('beginJourneyButton'),
    gameContainer: $('game-container'), // Для скрытия/показа
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
