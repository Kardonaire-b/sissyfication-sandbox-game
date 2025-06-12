import { state } from './state.js';
import { el } from './domUtils.js';
import { state as initialState } from './state.js';
import { nextDay } from './gameLogic.js';
import { 
    updateStats, 
    updateTabsVisibility, 
    updateProgressDisplay, 
    renderChoices, 
    renderWardrobeUI, 
    openBodyDetailsModal, 
    closeBodyDetailsModal,
    DOM_CACHE,
    initDOMCache
} from './ui.js';
import { saveGame, loadGame } from './saveLoad.js';
import * as C from './config.js';
import { t } from './i18n.js';
import './taskManager.js';
import './storyEvents.js';
import { log, renderLog } from './ui/log.js';

function proceedToGame() {
    if (!DOM_CACHE.playerNameInput || !DOM_CACHE.playerSurnameInput) {
        console.error('Не найдены поля ввода имени и фамилии');
        return;
    }

    state.playerName = DOM_CACHE.playerNameInput.value.trim() || state.playerName;
    state.playerSurname = DOM_CACHE.playerSurnameInput.value.trim() || state.playerSurname;
    state.introCompleted = true;

    state.playerBodyType = el.bodyTypeSelect.value;

    
    let baseT = initialState.testosterone; 
    let baseE = initialState.estrogen;

    switch (state.playerBodyType) {
        case 'slim':
            state.testosterone = Math.max(C.BASE_T, baseT - 10);
            state.estrogen = Math.min(C.MAX_HORMONE_LEVEL, baseE + 5);
            break;
        case 'athletic':
            state.testosterone = Math.min(C.MAX_HORMONE_LEVEL, baseT + 10);
            state.estrogen = Math.max(C.BASE_E, baseE - 2);
            break;
        case 'average':
        default:
            state.testosterone = baseT;
            state.estrogen = baseE;
            break;
    }
    state.testosterone = Math.max(C.BASE_T, Math.min(C.MAX_HORMONE_LEVEL, state.testosterone));
    state.estrogen = Math.max(C.BASE_E, Math.min(C.MAX_HORMONE_LEVEL, state.estrogen));
    
    state.emaT = state.testosterone; 
    state.emaE = state.estrogen;     

    el.introScreen.style.display = 'none';
    el.gameContainer.style.display = 'block';

    initializeGame();
}

function showIntro() {
    initDOMCache();

    if (!DOM_CACHE.introScreen || !DOM_CACHE.gameContainer) {
        console.error('Критические элементы интерфейса не найдены');
        return;
    }

    DOM_CACHE.introScreen.style.display = 'flex';
    DOM_CACHE.gameContainer.style.display = 'none';
    
    if (DOM_CACHE.playerNameInput) DOM_CACHE.playerNameInput.value = state.playerName;
    if (DOM_CACHE.playerSurnameInput) DOM_CACHE.playerSurnameInput.value = state.playerSurname;
    if (DOM_CACHE.bodyTypeSelect) DOM_CACHE.bodyTypeSelect.value = state.playerBodyType;
    
    if (DOM_CACHE.beginJourneyButton) {
        const newButton = DOM_CACHE.beginJourneyButton.cloneNode(true);
        DOM_CACHE.beginJourneyButton.parentNode.replaceChild(newButton, DOM_CACHE.beginJourneyButton);
        DOM_CACHE.beginJourneyButton = newButton; 
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
            if (btn.dataset.tab === 'hormone' && !state.hormonesUnlocked) return;
            
            state.tab = btn.dataset.tab;
            
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
                stepmomComment = ` "Ты такой худенький, ${state.playerName}, надо бы тебя откормить немного! Но фигурка у тебя изящная, это хорошо."`;
                break;
            case 'athletic':
                stepmomComment = ` "Ого, ${state.playerName}, да ты в отличной форме! Мышцы так и играют. Но не переживай, мы найдем применение и такой энергии."`;
                break;
            case 'average':
            default:
                stepmomComment = ` "Ну что ж, ${state.playerName}, сложение у тебя обычное, есть над чем поработать, хе-хе."`;
                break;
        }

        log(`Ты, ${state.playerName} ${state.playerSurname}, стоишь посреди своей новой комнаты, окруженная коробками. Мачеха, ${C.STEPMOM_NAME}, кажется, уже успела добавить несколько... "женственных" штрихов в интерьер.`, 'important');
        log(`"Не стесняйся, располагайся, ${state.playerName}!" – доносится ее голос из кухни. – "Я тут приготовила твой любимый чай... и кое-что еще, думаю, тебе понравится."${stepmomComment} Её тон вызывает смешанные чувства любопытства и легкой тревоги.`, 'stepmom-dialogue'); 
    }
    
    renderLog();
    updateStats();
}

function applyLocale() {
    document.querySelector('.intro-content h1').textContent = t('intro.title');
    const introParagraphs = document.querySelectorAll('.intro-content p');
    introParagraphs[0].textContent = t('intro.p1');
    introParagraphs[1].childNodes[0].textContent = t('intro.p2_dialogue');
    introParagraphs[1].childNodes[1].textContent = t('intro.p2');
    introParagraphs[1].childNodes[2].textContent = t('intro.p2_dialogue2');
    introParagraphs[2].textContent = t('intro.section_name');
    document.querySelector('label[for="playerNameInput"]').textContent = t('intro.label_player_name');
    el.playerNameInput.placeholder = t('intro.placeholder_player_name');
    document.querySelector('label[for="playerSurnameInput"]').textContent = t('intro.label_player_surname');
    el.playerSurnameInput.placeholder = t('intro.placeholder_player_surname');
    introParagraphs[3].textContent = t('intro.section_body');
    document.querySelector('label[for="bodyTypeSelect"]').textContent = t('intro.label_body_type');
    const bodyTypeOptions = el.bodyTypeSelect.options;
    bodyTypeOptions[0].textContent = t('intro.body_type_average');
    bodyTypeOptions[1].textContent = t('intro.body_type_slim');
    bodyTypeOptions[2].textContent = t('intro.body_type_athletic');
    el.beginJourneyButton.textContent = t('intro.begin_button');

    el.tabs.find(b => b.dataset.tab === 'income').textContent = t('ui.income');
    el.tabs.find(b => b.dataset.tab === 'hormone').textContent = t('ui.hormones');
    el.tabs.find(b => b.dataset.tab === 'other').textContent = t('ui.other');
    el.tabs.find(b => b.dataset.tab === 'wardrobe').textContent = t('ui.wardrobe');

    document.querySelector('.stat:nth-child(1) .stat-title').innerHTML = `<span class="icon">🗓️</span>${t('ui.day')}`;
    document.querySelector('.stat:nth-child(2) .stat-title').innerHTML = `<span class="icon">💰</span>${t('ui.money')}`;
    document.querySelector('.stat:nth-child(3) .stat-title').innerHTML = `<span class="icon">♂️</span>${t('ui.testosterone')}`;
    document.querySelector('.stat:nth-child(4) .stat-title').innerHTML = `<span class="icon">♀️</span>${t('ui.estrogen')}`;

    document.getElementById('modal-body-details').querySelector('h2').textContent = t('ui.body_details_title');
}


document.addEventListener('DOMContentLoaded', () => {
    initDOMCache();

    try {
        applyLocale();
    } catch(e) {
        console.error("Ошибка применения локализации:", e);
    }
    
    let loadedSuccessfully = false;
    try {
        loadedSuccessfully = loadGame();
    } catch (e) {
        console.error("Ошибка при вызове loadGame():", e);
    }

    if (loadedSuccessfully && state.introCompleted) {
        DOM_CACHE.introScreen.style.display = 'none';
        DOM_CACHE.gameContainer.style.display = 'block';
        initializeGame();
    } else {
        showIntro();
    }
});