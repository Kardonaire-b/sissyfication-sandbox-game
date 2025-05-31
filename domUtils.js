export function $(selector) {
    const id = selector.startsWith('#') ? selector.slice(1) : selector;
    return document.getElementById(id);
}

export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export const el = {
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

    // Новые элементы для модального окна
    modalOverlay: $('modal-overlay'),
    modalBodyDetailsContent: $('modal-body-text-content'), // Куда вставлять текст
    modalCloseButton: $('modal-close-button')
};