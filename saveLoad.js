import { state } from './state.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay } from './ui.js';

const SAVEGAME_KEY = 'sissySandboxSave_v1.0';
export function saveGame() {
    try {
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

            for (const key in state) {
                if (Object.prototype.hasOwnProperty.call(state, key)) delete state[key];
            }
            for (const key in loadedStateObject) {
                if (Object.prototype.hasOwnProperty.call(loadedStateObject, key)) {
                    state[key] = loadedStateObject[key];
                }
            }
            
            updateTabsVisibility();
            updateProgressDisplay();

            updateStats();
            
            log('📂 Игра успешно загружена!', 'important');
        } else {
            log('🤔 Сохраненная игра не найдена. Начните новую игру или сохраните текущую.', 'default');
        }
    } catch (error) {
        console.error("Ошибка при загрузке игры:", error);
        log('❌ Ошибка при загрузке игры. Возможно, данные сохранения повреждены. Подробности в консоли.', 'money-loss');
    }
}

