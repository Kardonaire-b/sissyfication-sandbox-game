// main.js
import { state } from './state.js';
import { el } from './domUtils.js';
import { actions } from './actions.js'; 
import { nextDay } from './gameLogic.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderChoices, renderWardrobeUI, renderLog, openBodyDetailsModal, closeBodyDetailsModal } from './ui.js';
import { saveGame, loadGame } from './saveLoad.js';
import * as C from './config.js';

function proceedToGame() {
    state.playerName = el.playerNameInput.value.trim() || state.playerName;
    state.playerSurname = el.playerSurnameInput.value.trim() || state.playerSurname;
    state.introCompleted = true;

    // Сохраняем выбранный тип телосложения
    state.playerBodyType = el.bodyTypeSelect.value; 
    state.introCompleted = true;

    // Применяем стартовые параметры тела на основе выбора
    // Важно: эти изменения должны применяться ДО первого вызова nextDay(),
    // чтобы начальные значения T и E были скорректированы перед первым расчетом.
    
    // Сначала сбросим на дефолтные значения из state.js, если они вдруг были изменены ранее (маловероятно, но для чистоты)
    let baseT = 50; // Исходное "среднее" значение T из state.js
    let baseE = C.BASE_E; // Исходное "среднее" значение E из state.js

    switch (state.playerBodyType) {
        case 'slim':
            state.testosterone = Math.max(C.BASE_T, baseT - 10); // Заметно ниже
            state.estrogen = Math.min(C.MAX_HORMONE_LEVEL, baseE + 5);   // Чуть выше
            break;
        case 'athletic':
            state.testosterone = Math.min(C.MAX_HORMONE_LEVEL, baseT + 10); // Заметно выше
            state.estrogen = Math.max(C.BASE_E, baseE - 2); // Может быть чуть ниже E, если атлетизм "сухой"
            break;
        case 'average':
        default:
            state.testosterone = baseT;
            state.estrogen = baseE;
            break;
    }
    // Убедимся, что значения не выходят за пределы MIN/MAX после модификации
    state.testosterone = Math.max(C.BASE_T, Math.min(C.MAX_HORMONE_LEVEL, state.testosterone));
    state.estrogen = Math.max(C.BASE_E, Math.min(C.MAX_HORMONE_LEVEL, state.estrogen));
    
    // Синхронизируем EMA на старте с уже измененными значениями
    state.emaT = state.testosterone; 
    state.emaE = state.estrogen;     

    el.introScreen.style.display = 'none';
    el.gameContainer.style.display = 'block';

    initializeGame();
}

function showIntro() {
    el.introScreen.style.display = 'flex';
    el.gameContainer.style.display = 'none';
    
    // Устанавливаем значения в поля ввода из state (на случай, если они были загружены, но интро не было завершено)
    if (el.playerNameInput) el.playerNameInput.value = state.playerName;
    if (el.playerSurnameInput) el.playerSurnameInput.value = state.playerSurname;
    if (el.bodyTypeSelect) el.bodyTypeSelect.value = state.playerBodyType;
    
    if (el.beginJourneyButton) {
        const newButton = el.beginJourneyButton.cloneNode(true);
        el.beginJourneyButton.parentNode.replaceChild(newButton, el.beginJourneyButton);
        el.beginJourneyButton = newButton; 
        newButton.addEventListener('click', proceedToGame);
    } else {
        console.error("Кнопка 'beginJourneyButton' не найдена в DOM.");
    }
}

function initializeGame() {
    updateTabsVisibility();
    updateProgressDisplay();

    el.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            // Пропускаем клик по неактивной вкладке
            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;
            
            // 1. Обновляем состояние текущей вкладки
            state.tab = btn.dataset.tab;
            
            // 2. Вызываем главную функцию обновления, которая сделает всё остальное:
            //    - обновит классы вкладок
            //    - перерисует нужный контент (действия или гардероб)
            updateStats();
        });
    });

    if (el.modalCloseButton) {
        el.modalCloseButton.addEventListener('click', closeBodyDetailsModal);
    }
    if (el.modalOverlay) {
        el.modalOverlay.addEventListener('click', (event) => {
            if (event.target === el.modalOverlay) {
                closeBodyDetailsModal();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && el.modalOverlay && el.modalOverlay.classList.contains('active')) {
            closeBodyDetailsModal();
        }
    });

    if (state.day === 0) { 
        nextDay(); 
        
        let stepmomComment = "";
        switch(state.playerBodyType) {
            case 'slim':
                stepmomComment = ` "Ты такой(ая) худенький(ая), ${state.playerName}, надо бы тебя откормить немного! Но фигурка у тебя изящная, это хорошо."`;
                break;
            case 'athletic':
                stepmomComment = ` "Ого, ${state.playerName}, да ты в отличной форме! Мышцы так и играют. Но не переживай, мы найдем применение и такой энергии."`;
                break;
            case 'average':
            default:
                stepmomComment = ` "Ну что ж, ${state.playerName}, располагайся. Сложение у тебя обычное, есть над чем поработать, хе-хе."`;
                break;
        }

        log(`Ты, ${state.playerName} ${state.playerSurname}, стоишь посреди своей новой комнаты, окруженная коробками. Мачеха, ${C.STEPMOM_NAME}, кажется, уже успела добавить несколько... "женственных" штрихов в интерьер.`, 'important');
        // ИЗМЕНЕНИЕ: Меняем тип лога для реплики мачехи
        log(`"Не стесняйся, располагайся, ${state.playerName}!" – доносится ее голос из кухни. – "Я тут приготовила твой любимый чай... и кое-что еще, думаю, тебе понравится."${stepmomComment} Её тон вызывает смешанные чувства любопытства и легкой тревоги.`, 'stepmom-dialogue'); 
    }
    
    renderLog();
    updateStats();
}


// --- Логика запуска игры ---
document.addEventListener('DOMContentLoaded', () => {
    let loadedSuccessfully = false;
    try {
        loadedSuccessfully = loadGame();
    } catch (e) {
        console.error("Ошибка при вызове loadGame():", e);
    }

    if (loadedSuccessfully && state.introCompleted) {
        if (el.introScreen) el.introScreen.style.display = 'none';
        if (el.gameContainer) el.gameContainer.style.display = 'block';
        initializeGame();
    } else {
        // Если нет сохранения, или в сохранении intro не завершено, или загрузка не удалась
        // Сбрасываем introCompleted в false, чтобы гарантированно показать интро
        state.introCompleted = false; 
        // Инициализируем значения полей из state, на случай если это не первый запуск
        // но интро еще не пройдено (например, после сброса игры)
        if (el.playerNameInput && state.playerName) el.playerNameInput.value = state.playerName;
        if (el.playerSurnameInput && state.playerSurname) el.playerSurnameInput.value = state.playerSurname;
        if (el.bodyTypeSelect && state.playerBodyType) el.bodyTypeSelect.value = state.playerBodyType;

        showIntro();
    }
});