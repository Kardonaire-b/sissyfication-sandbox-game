import { state } from './state.js';
import { log, updateStats, updateTabsVisibility, updateProgressDisplay } from './ui.js';

const SAVEGAME_KEY = 'sissySandboxSave_v1.0'; // Ключ для localStorage
export function saveGame() {
    try {
        const stateToSave = JSON.stringify(state);
        localStorage.setItem(SAVEGAME_KEY, stateToSave);
        log('💾 Игра успешно сохранена!', 'important');
    } catch (error) {
        console.error("Ошибка при сохранении игры:", error);
        log('❌ Ошибка при сохранении игры. Подробности в консоли.', 'money-loss');
        // Можно добавить более детальное сообщение для пользователя, если ошибка связана с квотой localStorage
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

            // Очищаем текущий объект state от всех его свойств
            for (const key in state) {
                if (Object.prototype.hasOwnProperty.call(state, key)) {
                    delete state[key];
                }
            }

            // Копируем все свойства из загруженного объекта в текущий state
            // Это сохраняет ссылку на оригинальный объект state для всех модулей
            for (const key in loadedStateObject) {
                if (Object.prototype.hasOwnProperty.call(loadedStateObject, key)) {
                    state[key] = loadedStateObject[key];
                }
            }
            
            // После загрузки необходимо полностью обновить UI,
            // так как состояние могло кардинально измениться.

            // Важно: Эти функции должны быть вызваны ДО updateStats,
            // если updateStats на них полагается для корректного рендеринга чего-либо,
            // или если они сами не вызываются изнутри updateStats с нужной логикой.
            // В нашем случае updateStats вызывает updateTabsVisibility и updateProgressDisplay,
            // но вызов их здесь явно перед updateStats не повредит и гарантирует порядок.
            updateTabsVisibility(); 
            updateProgressDisplay(); 

            updateStats(); // Эта функция должна каскадно обновить все остальное: статы, описание тела, кнопки действий
            
            log('📂 Игра успешно загружена!', 'important');
        } else {
            log('🤔 Сохраненная игра не найдена. Начните новую игру или сохраните текущую.', 'default');
        }
    } catch (error) {
        console.error("Ошибка при загрузке игры:", error);
        log('❌ Ошибка при загрузке игры. Возможно, данные сохранения повреждены. Подробности в консоли.', 'money-loss');
    }
}