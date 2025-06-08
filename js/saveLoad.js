// saveLoad.js
import { state } from './state.js';
import { log } from './ui.js';
import { t } from './i18n.js'; // <-- ИМПОРТ

export const SAVEGAME_KEY = 'sissySandboxSave_v1.0';

export function saveGame() {
    try {
        if (state.day > 0 && !state.introCompleted) {
             state.introCompleted = true;
        }
        const stateToSave = JSON.stringify(state);
        localStorage.setItem(SAVEGAME_KEY, stateToSave);
        log(t('log.save_success'), 'important');
    } catch (error) {
        console.error("Ошибка при сохранении игры:", error);
        log(t('log.save_error'), 'money-loss');
        if (error.name === 'QuotaExceededError') {
            log(t('log.save_quota_error'), 'money-loss');
        }
    }
}

export function loadGame() {
    try {
        const savedData = localStorage.getItem(SAVEGAME_KEY);
        if (savedData) {
            const loadedStateObject = JSON.parse(savedData);

            // Аккуратно обновляем существующий объект state, а не заменяем его
            for (const key in loadedStateObject) {
                if (Object.prototype.hasOwnProperty.call(loadedStateObject, key)) {
                    state[key] = loadedStateObject[key];
                }
            }

            // --- ОБЕСПЕЧЕНИЕ СОВМЕСТИМОСТИ СТАРЫХ СОХРАНЕНИЙ ---
            // Добавляем новые поля с дефолтными значениями, если их нет в сохранении
            if (typeof state.introCompleted === 'undefined') state.introCompleted = true;
            if (typeof state.playerName === 'undefined') state.playerName = "Райан";
            if (typeof state.playerSurname === 'undefined') state.playerSurname = "Коллстон";
            if (typeof state.playerBodyType === 'undefined') state.playerBodyType = "average";
            if (typeof state.stepMotherInfluence === 'undefined') state.stepMotherInfluence = 0;
            if (typeof state.maxLogMessages === 'undefined') state.maxLogMessages = 7;
            if (!Array.isArray(state.logMessages)) state.logMessages = [];
            // Новые поля из Этапа 2
            if (typeof state.obedience === 'undefined') state.obedience = 0;
            if (typeof state.rebellion === 'undefined') state.rebellion = 0;
            if (typeof state.activeTaskId === 'undefined') state.activeTaskId = null;
            if (!Array.isArray(state.completedTasks)) state.completedTasks = [];
            if (typeof state.skills === 'undefined') state.skills = {};
            if (typeof state.gameState === 'undefined') state.gameState = 'normal';
            // --------------------------------------------------------

            log(t('log.load_success'), 'important');
            return true; // Успешная загрузка
        } else {
            return false; // Нет сохранения
        }
    } catch (error) {
        console.error("Ошибка при загрузке игры:", error);
        log(t('log.load_error'), 'money-loss');
        return false; // Ошибка загрузки
    }
}