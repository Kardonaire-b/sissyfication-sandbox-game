import { el } from '../domUtils.js';

/**
 * Состояние модального окна
 */
export const MODAL_STATE = {
    isOpen: false,
    currentEvent: null
};

/**
 * Открывает модальное окно подробностей тела
 */
export function openBodyDetailsModal() {
    if (!el.modalOverlay || !el.modalBodyDetailsContent) {
        return;
    }
    if (MODAL_STATE.isOpen) return;
    el.modalBodyDetailsContent.innerHTML = window.fullBodyDescriptionForModalStore?.replace(/\n/g, '<br>') || '';
    el.modalOverlay.classList.add('active');
    MODAL_STATE.isOpen = true;
    // Добавляем обработчик для закрытия по клику вне модального окна
    const closeOnOutsideClick = (e) => {
        if (e.target === el.modalOverlay) {
            closeBodyDetailsModal();
        }
    };
    el.modalOverlay.addEventListener('click', closeOnOutsideClick);
}

/**
 * Закрывает модальное окно подробностей тела
 */
export function closeBodyDetailsModal() {
    if (!el.modalOverlay) {
        return;
    }
    if (!MODAL_STATE.isOpen) return;
    el.modalOverlay.classList.remove('active');
    MODAL_STATE.isOpen = false;
} 