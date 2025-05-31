import { state } from './state.js';
import { el } from './domUtils.js';
import { actions } from './actions.js';
import { nextDay, initGameLogic } from './gameLogic.js'; // checkHormoneUnlock вызывается из actions
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderChoices, renderWardrobeUI } from './ui.js';

function initializeGame() {
    initGameLogic(actions);

    updateTabsVisibility();
    updateProgressDisplay();

    el.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;

            state.tab = btn.dataset.tab;
            el.tabs.forEach(b => b.classList.toggle('selected', b === btn));

            // В зависимости от вкладки, вызываем нужную функцию рендеринга
            if (state.tab === 'wardrobe') {
                renderWardrobeUI(); // Новая функция для вкладки "Гардероб"
            } else {
                renderChoices(actions); // Для всех остальных вкладок
            }
        });
    });

    nextDay();
    log("✨ Ты стоишь на пороге чего-то нового... ✨ Что будешь делать?", 'important');

    // Начальная отрисовка кнопок для активной вкладки 'income' после первого nextDay
    // Это важно, если nextDay() не перерисовывает choices сам по себе при первой загрузке
    // или если активный таб по умолчанию не 'income'
    if (state.tab === 'income') { // или любой другой таб по умолчанию, где есть actions
        renderChoices(actions);
    } else if (state.tab === 'wardrobe') {
        renderWardrobeUI();
    }
}

// Запускаем игру после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initializeGame);