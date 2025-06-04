import { state } from './state.js';
import { el } from './domUtils.js';
import { actions } from './actions.js';
import { nextDay } from './gameLogic.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderChoices, renderWardrobeUI } from './ui.js';
import { closeBodyDetailsModal } from './ui.js';

// Основная инициализация приложения
function initializeGame() {
    updateTabsVisibility();
    updateProgressDisplay();

    el.tabs.forEach(btn => {
        btn.addEventListener('click', () => {

            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;

            state.tab = btn.dataset.tab;
            el.tabs.forEach(b => b.classList.toggle('selected', b === btn));

            // В зависимости от вкладки, вызываем нужную функцию рендеринга
            if (state.tab === 'wardrobe') {
                renderWardrobeUI();
            } else {
                renderChoices(); // Для всех остальных вкладок
            }
        });
    });

    if (el.modalCloseButton) {
        el.modalCloseButton.addEventListener('click', closeBodyDetailsModal);
    }
    if (el.modalOverlay) {
        // Закрытие по клику на оверлей (вне контента модалки)
        el.modalOverlay.addEventListener('click', (event) => {
            if (event.target === el.modalOverlay) {
                closeBodyDetailsModal();
            }
        });
    }
    // Закрытие модалки по Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && el.modalOverlay && el.modalOverlay.classList.contains('active')) {
            closeBodyDetailsModal();
        }
    });


    nextDay();
    // Если игра запускается впервые, выводим приветственное сообщение
    if (state.logMessages.length === 0) {
        log("✨ Ты стоишь на пороге чего-то нового... ✨ Что будешь делать?", 'important');
    } else {
        // Показываем сохраненный лог из прошлой игры
        renderLog();
    }
}

// Запускаем игру после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initializeGame);
