import { el } from '../domUtils.js';
import { state } from '../state.js';
import { queueStateUpdate } from './stats.js';

// Оптимизация: Улучшенная работа с вкладками
const TAB_CACHE = {
    currentTab: null,
    tabElements: new Map()
};

export function updateTabsVisibility() {
    if (!Array.isArray(el.tabs)) return;

    const isHormoneTabVisible = state.plotFlags.hormone_therapy_unlocked;
    
    // Инициализация кэша вкладок при первом вызове
    if (TAB_CACHE.tabElements.size === 0) {
        el.tabs.forEach(btn => {
            if (btn && btn.dataset && btn.dataset.tab) {
                TAB_CACHE.tabElements.set(btn.dataset.tab, btn);
            }
        });
    }

    const hormoneTab = TAB_CACHE.tabElements.get('hormone');
    if (hormoneTab) {
        hormoneTab.style.display = isHormoneTabVisible ? '' : 'none';
    }

    if (!isHormoneTabVisible && state.tab === 'hormone') {
        state.tab = 'income';
        queueStateUpdate(() => renderCurrentTabContent());
    }

    // Обновляем только если вкладка изменилась
    if (TAB_CACHE.currentTab !== state.tab) {
        TAB_CACHE.currentTab = state.tab;
        el.tabs.forEach(btn => {
            if (btn && btn.dataset && btn.dataset.tab) {
                btn.classList.toggle('selected', btn.dataset.tab === state.tab);
            }
        });
    }
}

function renderCurrentTabContent() {
    // Здесь будет логика рендеринга содержимого вкладки
    // Это будет зависеть от того, какая вкладка активна
    // Например, если активна вкладка 'income', то нужно отобразить список действий, связанных с доходом
    // Если активна вкладка 'hormone', то нужно отобразить список действий, связанных с гормонами
    // И так далее
    console.log('Рендеринг содержимого вкладки:', state.tab);
} 