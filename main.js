import { state } from './state.js';
import { el } from './domUtils.js';
import { actions } from './actions.js';
import { nextDay } from './gameLogic.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderChoices, renderWardrobeUI } from './ui.js';

function initializeGame() {
    updateTabsVisibility();
    updateProgressDisplay();

    el.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log(`Tab clicked: ${btn.dataset.tab}. Предыдущий state.tab: ${state.tab}`);

            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;

            state.tab = btn.dataset.tab;
            console.log(`Новый state.tab: ${state.tab}`);
            el.tabs.forEach(b => b.classList.toggle('selected', b === btn));

            // В зависимости от вкладки, вызываем нужную функцию рендеринга
            if (state.tab === 'wardrobe') {
                console.log("Вызов renderWardrobeUI из обработчика табов");
                renderWardrobeUI(); // Новая функция для вкладки "Гардероб"
            } else {
                console.log("Вызов renderChoices из обработчика табов");
                renderChoices(); // Для всех остальных вкладок
            }
        });
    });

    nextDay();
    log("✨ Ты стоишь на пороге чего-то нового... ✨ Что будешь делать?", 'important');

}

// Запускаем игру после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initializeGame);