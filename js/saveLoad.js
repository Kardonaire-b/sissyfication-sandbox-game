// saveLoad.js
import { state } from './state.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay, renderLog } from './ui.js'; // renderLog добавлен

export const SAVEGAME_KEY = 'sissySandboxSave_v1.0'; // Используем v1.0, но можем поднять до v1.1, если структура сильно меняется

export function saveGame() {
    try {
        // Убедимся, что introCompleted всегда true перед сохранением, если игра уже идет
        if (state.day > 0 && !state.introCompleted) {
             state.introCompleted = true; // На случай, если игра как-то стартанула без интро
        }
        const stateToSave = JSON.stringify(state);
        localStorage.setItem(SAVEGAME_KEY, stateToSave);
        log('💾 Игра успешно сохранена!', 'important');
    } catch (error) {
        console.error("Ошибка при сохранении игры:", error);
        log('❌ Ошибка при сохранении игры. Подробности в консоли.', 'money-loss');
        if (error.name === 'QuotaExceededError') {
            log('❌ Ошибка: недостаточно места для сохранения игры. Попробуйте очистить localStorage.', 'money-loss');
        }
    }
}

export function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVEGAME_KEY);
        if (savedData) {
            const loadedStateObject = JSON.parse(savedData);

            // Важно: Аккуратно переносим свойства, чтобы не сломать ссылки на объект state,
            // если он используется напрямую в других модулях (хотя импорт всегда дает одну и ту же ссылку).
            // Полное присвоение (state = loadedStateObject) может быть проблематично,
            // лучше обновить свойства существующего объекта state.

            for (const key in state) { // Удаляем старые ключи, которых может не быть в новом state
                if (Object.prototype.hasOwnProperty.call(state, key) && !Object.prototype.hasOwnProperty.call(loadedStateObject, key)) {
                    // delete state[key]; // Это делать аккуратно, если есть дефолтные значения в state.js, которые важны
                }
            }
            for (const key in loadedStateObject) { // Присваиваем загруженные значения
                if (Object.prototype.hasOwnProperty.call(loadedStateObject, key)) {
                    state[key] = loadedStateObject[key];
                }
            }
            
            // Если загружаем старое сохранение без introCompleted, считаем, что оно пройдено,
            // чтобы не показывать интро для уже начатых игр.
            if (typeof state.introCompleted === 'undefined') {
                state.introCompleted = true;
            }
            // Заполняем недостающие поля дефолтными значениями, если их нет в сохранении
            if (typeof state.playerName === 'undefined') state.playerName = "Алекс";
            if (typeof state.playerSurname === 'undefined') state.playerSurname = "Иванов";
            if (typeof state.playerBodyType === 'undefined') state.playerBodyType = "average";
            if (typeof state.stepMotherInfluence === 'undefined') state.stepMotherInfluence = 0;
            if (typeof state.maxLogMessages === 'undefined') state.maxLogMessages = 7;
            if (!Array.isArray(state.logMessages)) state.logMessages = []; // Проверка на массив логов


            // Функции обновления UI и состояния теперь вызываются в main.js после loadGame
            // updateTabsVisibility();
            // updateProgressDisplay();
            // updateStats();
            // renderLog(); // Важно для отображения лога после загрузки
            
            log('📂 Игра успешно загружена!', 'important');
            return true; // Сигнализируем об успешной загрузке
        } else {
            // log('🤔 Сохраненная игра не найдена. Начните новую игру.', 'default'); // Сообщение теперь в main.js
            return false; // Нет сохранения
        }
    } catch (error) {
        console.error("Ошибка при загрузке игры:", error);
        log('❌ Ошибка при загрузке игры. Возможно, данные сохранения повреждены. Подробности в консоли.', 'money-loss');
        return false; // Ошибка загрузки
    }
}