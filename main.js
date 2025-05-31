import { state } from './state.js';
import { el } from './domUtils.js';
import { actions } from './actions.js';
import { nextDay, initGameLogic } from './gameLogic.js'; // checkHormoneUnlock вызывается из actions
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderChoices } from './ui.js';

function initializeGame() {
    initGameLogic(actions); // Инициализируем gameLogic ссылкой на actions

    // Начальная настройка UI до первого вызова nextDay
    updateTabsVisibility();
    updateProgressDisplay();
    // renderChoices(actions); // Первичная отрисовка кнопок для активного таба 'income'

    el.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;

            state.tab = btn.dataset.tab;
            el.tabs.forEach(b => b.classList.toggle('selected', b === btn));
            renderChoices(actions); // Перерисовываем кнопки для нового активного таба
        });
    });

    // Первый "игровой день" и начальное сообщение
    nextDay(); // Это вызовет updateStats(actions), который сделает все нужные обновления UI
    log("✨ Ты стоишь на пороге чего-то нового... ✨ Что будешь делать?", 'important');
    // Если в первый день не должно быть сообщения о блокаторе (если он был бы активен с дня 0)
    // то первое сообщение лога можно поместить после nextDay(). Текущий порядок нормальный.
}

// Запускаем игру после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initializeGame);