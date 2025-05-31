import { el } from './domUtils.js';
import { state } from './state.js';
import * as C from './config.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { equipItem, unequipItem } from './wardrobeLogic.js';


export function log(msg, type = 'default') {
    el.actionLogOutput.textContent = msg;
    el.actionLogOutput.className = 'log-default'; // Reset class
    if (type === 'money-gain') el.actionLogOutput.classList.add('log-money-gain');
    else if (type === 'money-loss') el.actionLogOutput.classList.add('log-money-loss');
    else if (type === 'hormone-change') el.actionLogOutput.classList.add('log-hormone-change');
    else if (type === 'progress-change') el.actionLogOutput.classList.add('log-progress-change');
    else if (type === 'discovery') el.actionLogOutput.classList.add('log-discovery');
    else if (type === 'important') el.actionLogOutput.classList.add('log-important');
}

export function updateTabsVisibility() {
    let tabSwitched = false;
    el.tabs.forEach(btn => {
        if (btn.dataset.tab === 'hormone') {
            const isHormoneTabVisible = state.hormonesUnlocked;
            btn.style.display = isHormoneTabVisible ? '' : 'none';

            if (!isHormoneTabVisible && state.tab === 'hormone') {
                state.tab = 'income';
                tabSwitched = true; // Флаг, что таб был переключен
            }
        }
    });
    // Если таб был переключен, обновить выделение
    if (tabSwitched) {
        el.tabs.forEach(tb => tb.classList.toggle('selected', tb.dataset.tab === state.tab));
    }
}

export function updateProgressDisplay() {
    if (!state.hormonesUnlocked) {
        el.progressTitle.textContent = "Открытия";
        el.progressIcon.textContent = "💡";
        el.prog.textContent = state.discoveryPoints;
        el.pbar.style.width = (state.discoveryPoints / C.MAX_DISCOVERY_POINTS * 100) + '%';
    } else {
        el.progressTitle.textContent = "Прогресс";
        el.progressIcon.textContent = "📈";
        el.prog.textContent = state.progress + '%';
        el.pbar.style.width = (state.progress / C.MAX_PROGRESS * 100) + '%';
    }
}

export function getCurrentOutfitDescription() {
    const outfit = state.currentOutfit;
    const wornItemsDescriptions = [];
    let hasFullBody = false;

    // Сначала проверяем, есть ли full_body одежда, она имеет приоритет в описании
    if (outfit[CLOTHING_SLOTS.FULL_BODY]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.FULL_BODY]];
        if (item) {
            wornItemsDescriptions.push(`ты полностью одета в: ${item.name.toLowerCase()}`);
            hasFullBody = true;
        }
    }

    // Если нет full_body, описываем верх и низ
    if (!hasFullBody) {
        if (outfit[CLOTHING_SLOTS.TOP]) {
            const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.TOP]];
            if (item) wornItemsDescriptions.push(`на тебе надета ${item.name.toLowerCase()}`);
        }
        if (outfit[CLOTHING_SLOTS.BOTTOM]) {
            const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.BOTTOM]];
            if (item) {
                if (wornItemsDescriptions.length > 0 && outfit[CLOTHING_SLOTS.TOP]) { // Если уже есть описание верха
                    wornItemsDescriptions.push(`и ${item.name.toLowerCase()}`);
                } else {
                    wornItemsDescriptions.push(`на тебе надета ${item.name.toLowerCase()}`);
                }
            }
        }
    }

    // Описываем нижнее белье, если оно есть и не скрыто full_body одеждой (или если мы хотим его всегда упоминать)
    // Для простоты пока будем упоминать, если надето.
    // Более сложная логика может учитывать, видно ли белье.
    if (outfit[CLOTHING_SLOTS.UNDERWEAR_TOP]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.UNDERWEAR_TOP]];
        if (item) {
            const connector = wornItemsDescriptions.length > 0 ? ", а под одеждой" : "Под одеждой";
            // Проверка, чтобы не дублировать "под одеждой", если уже есть и бюстгальтер и трусики
            if (!wornItemsDescriptions.some(desc => desc.includes("под одеждой"))) {
                 wornItemsDescriptions.push(`${connector} у тебя ${item.name.toLowerCase()}`);
            } else {
                 wornItemsDescriptions.push(`и ${item.name.toLowerCase()}`);
            }
        }
    }
    if (outfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]];
        if (item) {
            const connector = wornItemsDescriptions.length > 0 ? ", а под одеждой" : "Под одеждой";
            if (!wornItemsDescriptions.some(desc => desc.includes("под одеждой"))) {
                 wornItemsDescriptions.push(`${connector} у тебя ${item.name.toLowerCase()}`);
            } else if (!outfit[CLOTHING_SLOTS.UNDERWEAR_TOP] && wornItemsDescriptions.length > 0){ // если нет бюстгальтера, но есть другая одежда
                wornItemsDescriptions.push(`${connector} у тебя ${item.name.toLowerCase()}`);
            }
            else { // если есть бюстгальтер или другая одежда, и это не первое упоминание белья
                 wornItemsDescriptions.push(`и ${item.name.toLowerCase()}`);
            }
        }
    }
    
    // Обувь
    if (outfit[CLOTHING_SLOTS.SHOES]) {
        const item = CLOTHING_ITEMS[outfit[CLOTHING_SLOTS.SHOES]];
        if (item) {
            const connector = wornItemsDescriptions.length > 0 ? ", на ногах - " : "На ногах - ";
            wornItemsDescriptions.push(`${connector}${item.name.toLowerCase()}`);
        }
    }


    if (wornItemsDescriptions.length === 0) {
        return "👕 Наряд: Ты сейчас ни во что не одета."; // Или "Ты в своей обычной домашней одежде."
    }

    // Собираем строку, делаем первую букву заглавной
    let finalDescription = wornItemsDescriptions.join(' ').trim();
    if (finalDescription.startsWith("и ")) finalDescription = finalDescription.substring(2); // Убираем начальное "и "
    
    // Более аккуратное соединение для элементов белья, если они единственные "под одеждой"
    finalDescription = finalDescription.replace(", а под одеждой у тебя , и", ", а под одеждой у тебя также");
    finalDescription = finalDescription.replace("под одеждой у тебя и", "под одеждой у тебя также");


    // Добавляем точку в конце, если ее нет
    if (!finalDescription.endsWith('.') && !finalDescription.endsWith('!') && !finalDescription.endsWith('?')) {
        finalDescription += '.';
    }
    
    return `👕 Наряд: ${finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1)}`;
}


export function updateBody() {
    const T = state.emaT, E = state.emaE, P = state.hormonesUnlocked ? state.progress : 0;
    const T_is_dominant = T > E + 10;
    const E_is_dominant = E > T + 5;
    const hormonalBalanceFactor = Math.max(0, Math.min(100, (E - T + C.MAX_HORMONE_LEVEL) / 2));

    let lines = [];
    if (!state.hormonesUnlocked) {
        lines.push("Ты продолжаешь исследовать себя и окружающий мир. Какие-то смутные желания и мысли иногда посещают тебя, но пока неясно, к чему они ведут.");
        lines.push(`Твои текущие ощущения: ${state.discoveryPoints > 15 ? "Любопытство растет, ты находишь все больше интересной информации." : "Обычный день, обычные мысли."}`);
        if (state.discoveryPoints > 0 && state.discoveryPoints < C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES) {
             lines.push(`Очки открытий: ${state.discoveryPoints}/${C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES}`);
        } else if (state.discoveryPoints >= C.DISCOVERY_POINTS_TO_UNLOCK_HORMONES) {
             lines.push(`Кажется, ты на пороге важного открытия! (Очки открытий: ${state.discoveryPoints})`);
        }
    } else {
        // Голос
        let voicePitch = C.VOICE_PITCH_BASE_HZ - (T - E) * C.VOICE_PITCH_HORMONE_FACTOR;
        voicePitch = Math.max(80, Math.min(300, voicePitch));
        let voiceDesc = `🎤 Голос: ${voicePitch.toFixed(0)} Гц. `;
        if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_2 && P > C.VOICE_P_THRESHOLD_FOR_CHANGE_2) voiceDesc += "Звучит заметно выше, нежнее, почти неузнаваемо.";
        else if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_1) voiceDesc += "Становится мягче и выше, теряет грубые нотки.";
        else if (T - E > C.VOICE_T_DOMINANT_THRESHOLD) voiceDesc += "Низкий, с бархатными мужскими обертонами.";
        else voiceDesc += "Тембр на грани, андрогинный, интригующий.";
        lines.push(voiceDesc);
        // Кожа
        let skinDesc = "💧 Кожа: ";
        if (E_is_dominant && E > C.SKIN_E_DOMINANT_THRESHOLD_FOR_SOFTNESS) {
            skinDesc += P > C.SKIN_P_THRESHOLD_SOFT_2 ? "Невероятно гладкая, шелковистая на ощупь, поры почти невидимы. Лёгкий румянец." :
                P > C.SKIN_P_THRESHOLD_SOFT_1 ? "Становится ощутимо мягче, нежнее, уходит жирный блеск." :
                "Появляется мягкость, менее жирная.";
            if (E > C.SKIN_E_THRESHOLD_FOR_THINNING && P > C.SKIN_P_THRESHOLD_FOR_THINNING) skinDesc += " Кажется тоньше, венки на запястьях и груди могут быть видны отчетливее.";
        } else if (T_is_dominant && T > C.SKIN_T_DOMINANT_THRESHOLD_FOR_ROUGHNESS) {
            skinDesc += "Плотная, возможно, более склонная к жирности и акне. Поры заметны.";
        } else {
            skinDesc += "Обычная, но ты начинаешь замечать тонкие изменения в её текстуре.";
        }
        lines.push(skinDesc);
        // Волосы на теле/лице
        let bodyHairDesc = "🌿 Волосы на теле/лице: ";
        if (E_is_dominant && E > C.BODYHAIR_E_DOMINANT_THRESHOLD_FOR_REDUCTION && P > C.BODYHAIR_P_THRESHOLD_FOR_REDUCTION) {
            bodyHairDesc += "Рост волос на теле замедлился, они стали тоньше и светлее. ";
            if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_PUBESCENCE && P > C.BODYHAIR_P_THRESHOLD_FOR_FACIAL_PUBESCENCE) bodyHairDesc += "Щетина на лице почти не растет, или стала пушковой.";
            else if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_SLOWDOWN) bodyHairDesc += "Рост щетины замедлен, бритьё требуется реже.";
        } else if (T_is_dominant && T > C.BODYHAIR_T_DOMINANT_THRESHOLD_FOR_THICK) {
            bodyHairDesc += "Активный рост волос на теле и лице, густая щетина.";
        } else {
            bodyHairDesc += "Без особых изменений.";
        }
        lines.push(bodyHairDesc);
        // Грудь
        let breastDesc = "🍈 Грудь: ";
        let breastDevStageRaw = 0;
        if (E > C.BREAST_E_THRESHOLD_START_BUDDING && P > C.BREAST_P_THRESHOLD_START_BUDDING) {
            breastDevStageRaw = 1 + (Math.max(0, E - C.BREAST_E_THRESHOLD_START_BUDDING) / C.BREAST_E_UNITS_PER_STAGE) *
                (C.BREAST_PROGRESS_FACTOR_BASE + P / C.BREAST_PROGRESS_FACTOR_SCALE);
        }
        const currentBreastDevStage = Math.min(C.BREAST_MAX_DEV_STAGE, Math.floor(breastDevStageRaw));
        if (currentBreastDevStage === 0) breastDesc += "Абсолютно плоская.";
        else if (currentBreastDevStage === 1) breastDesc += `Появились болезненные уплотнения под сосками (E:${E.toFixed(0)}, P:${P}%).`;
        else if (currentBreastDevStage === 2) breastDesc += `Небольшая, но оформленная (размер A). Соски увеличились. (E:${E.toFixed(0)}, P:${P}%).`;
        else if (currentBreastDevStage === 3) breastDesc += `Среднего размера, упругая (ближе к B). (E:${E.toFixed(0)}, P:${P}%).`;
        else breastDesc += `Пышная, мягкая, соблазнительная (размер C+!). (E:${E.toFixed(0)}, P:${P}%).`;
        lines.push(breastDesc);
        // Фигура и Жир
        let figureDesc = "🍑 Фигура: ";
        const whr_change_potential = C.FIGURE_WHR_BASE - C.FIGURE_WHR_TARGET_FEMALE;
        let whr_progress_to_female_target = 0;
        if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) {
            whr_progress_to_female_target = Math.min(1, (E - C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) / C.FIGURE_E_UNITS_FOR_WHR_PROGRESS) * (P / C.MAX_PROGRESS);
        }
        const current_whr = (C.FIGURE_WHR_BASE - whr_change_potential * whr_progress_to_female_target).toFixed(2);
        figureDesc += `Талия/бедра: ${current_whr}. `;
        if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_FAT_REDISTRIBUTION && P > C.FIGURE_P_THRESHOLD_FOR_FAT_REDISTRIBUTION) {
            figureDesc += "Жир перераспределяется на бедра и ягодицы. Талия изящнее.";
        } else if (T_is_dominant && T > C.FIGURE_T_DOMINANT_THRESHOLD_FOR_MALE_FAT) {
            figureDesc += "Жир в области живота, фигура маскулинная.";
        } else if (P > C.FIGURE_P_THRESHOLD_FOR_SUBTLE_SOFTENING) {
            figureDesc += "Контуры тела неуловимо смягчаются.";
        }
        lines.push(figureDesc);
        // Мышцы
        let muscleDesc = "💪 Мышцы: ";
        if (T > C.MUSCLE_T_HIGH_THRESHOLD_FOR_BULK && !E_is_dominant) muscleDesc += P < C.MUSCLE_P_THRESHOLD_FOR_BULK_SOFTENING ? "Развитые, рельефные." : "Крепкие, но теряют твердость.";
        else if (T > C.MUSCLE_T_MID_THRESHOLD_FOR_TONE && !E_is_dominant) muscleDesc += "Умеренно развиты, в тонусе.";
        else if (E_is_dominant && E > C.MUSCLE_E_DOMINANT_THRESHOLD_FOR_LOSS) muscleDesc += `Уменьшились, стали мягче. Сила снизилась (T:${T.toFixed(0)}).`;
        else muscleDesc += `Слабые, без рельефа. (T:${T.toFixed(0)})`;
        lines.push(muscleDesc);
        // Гениталии
        let penisShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_PENIS_E_SHRINK_FACTOR + Math.max(0, 50 - T) * C.GENITAL_PENIS_LOW_T_SHRINK_FACTOR) *
            (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
        penisShrinkageFactor = Math.max(0, penisShrinkageFactor);
        const penisLengthCm = Math.max(C.GENITAL_PENIS_MIN_CM, C.GENITAL_PENIS_BASE_CM - penisShrinkageFactor).toFixed(1);
        let erectionQuality = 'нормальная';
        if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_ALMOST_NONE && E_is_dominant && P > C.GENITAL_ERECTION_P_LOW_THRESHOLD_ALMOST_NONE) erectionQuality = 'почти отсутствует';
        else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_VERY_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_VERY_WEAK)) erectionQuality = 'очень слабая';
        else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_WEAK)) erectionQuality = 'снижена, менее твердая';
        let penisDesc = `🍆 Клити/Пенис: ${penisLengthCm} см. `;
        if (P > C.GENITAL_P_THRESHOLD_FOR_CLIT_TEXT && E_is_dominant && parseFloat(penisLengthCm) < C.GENITAL_PENIS_CLIT_TRANSITION_CM) {
            penisDesc = `🎀 Клитор: ${penisLengthCm} см. Стал очень маленьким и чувствительным. `;
        }
        penisDesc += `Эрекция: ${erectionQuality}.`;
        lines.push(penisDesc);
        // Яички
        let testicleShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_TESTICLES_E_SHRINK_FACTOR + Math.max(0, 40 - T) * C.GENITAL_TESTICLES_LOW_T_SHRINK_FACTOR) *
            (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
        testicleShrinkageFactor = Math.max(0, testicleShrinkageFactor);
        const testicleVolume = Math.max(C.GENITAL_TESTICLES_MIN_VOL_ML, C.GENITAL_TESTICLES_BASE_VOL_ML - testicleShrinkageFactor).toFixed(1);
        const testicleTexture = (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_SOFT_TEXTURE && P > C.GENITAL_TESTICLES_P_THRESHOLD_SOFT_TEXTURE) ? 'мягкие, уменьшившиеся' : 'упругие';
        let testiclesDesc = `🥚 Яички: объём ~${testicleVolume} мл, ${testicleTexture}. `;
        if (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_ATROPHY && P > C.GENITAL_TESTICLES_P_THRESHOLD_ATROPHY && parseFloat(testicleVolume) < C.GENITAL_TESTICLES_ATROPHY_VOL_ML) {
            testiclesDesc += "Почти атрофировались.";
        }
        lines.push(testiclesDesc);
        // Ощущения и Общее
        let feelingDesc = "✨ Ощущения: ";
        if (P > C.FEELING_P_THRESHOLD_PERFECT_SISSY && E_is_dominant && E > C.FEELING_E_THRESHOLD_PERFECT_SISSY) feelingDesc += "Воплощение женственности. Гармония.";
        else if (P > C.FEELING_P_THRESHOLD_REAL_SISSY && E_is_dominant) feelingDesc += "Чувствуешь себя настоящей сисси. Уверенность растет.";
        else if (P > C.FEELING_P_THRESHOLD_TRANSFORMATION_FULL_SWING && (E_is_dominant || hormonalBalanceFactor > C.FEELING_HORMONAL_BALANCE_THRESHOLD_TRANSFORMATION_FULL_SWING)) feelingDesc += "Трансформация идет полным ходом! Прилив сисси-энергии.";
        else if (P > C.FEELING_P_THRESHOLD_FIRST_WHISPERS) feelingDesc += "Первые шепоты изменений. Тело меняется, это волнует.";
        else feelingDesc += "Самое начало пути. Ветерок перемен едва коснулся.";
        lines.push(feelingDesc);
        // Наряд
        lines.push(getCurrentOutfitDescription());
    }
    el.bodyDesc.textContent = lines.join('\n\n');
}

export function renderWardrobeUI() {
    console.log("renderWardrobeUI: Начало. state.currentOutfit:", 
        JSON.parse(JSON.stringify(state.currentOutfit)), "state.ownedClothes:", 
        JSON.parse(JSON.stringify(state.ownedClothes)));
    el.choices.innerHTML = ''; // Очищаем контейнер для кнопок действий

    const wardrobeContainer = document.createElement('div');
    wardrobeContainer.id = 'wardrobe-interface';

    // --- Секция "Сейчас надето" ---
    const equippedSection = document.createElement('div');
    equippedSection.className = 'wardrobe-section';
    const equippedTitle = document.createElement('h3');
    equippedTitle.textContent = 'Сейчас надето:';
    equippedSection.appendChild(equippedTitle);

    let anythingEquipped = false;
    console.log("renderWardrobeUI: Проверка 'Сейчас надето'");
    for (const slot in state.currentOutfit) {
        const itemId = state.currentOutfit[slot];
        console.log(`renderWardrobeUI: Слот '${slot}', itemId: '${itemId}'`);
        if (itemId) {
            anythingEquipped = true;
            const item = CLOTHING_ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wardrobe-item-display';
            
            const itemName = document.createElement('span');
            itemName.textContent = `${item.name} (слот: ${slot})`; // Показываем и слот для ясности
            itemDiv.appendChild(itemName);

            const unequipButton = document.createElement('button');
            unequipButton.textContent = 'Снять';
            unequipButton.className = 'choice-button wardrobe-button'; // Добавляем класс для стилизации, если нужно
            unequipButton.onclick = () => unequipItem(slot);
            itemDiv.appendChild(unequipButton);
            
            equippedSection.appendChild(itemDiv);
        }
    }
    if (!anythingEquipped) {
        console.log("renderWardrobeUI: В 'Сейчас надето' ничего нет, выводим сообщение.");
        const p = document.createElement('p');
        p.textContent = 'Ничего не надето.';
        equippedSection.appendChild(p);
    }
    wardrobeContainer.appendChild(equippedSection);

    // --- Секция "В шкафу" (доступные для надевания) ---
    const ownedSection = document.createElement('div');
    ownedSection.className = 'wardrobe-section';
    const ownedTitle = document.createElement('h3');
    ownedTitle.textContent = 'В шкафу:';
    ownedSection.appendChild(ownedTitle);

    let anythingInClosetToWear = false;
    const currentlyWornItemIds = Object.values(state.currentOutfit).filter(id => id !== null);
    console.log("renderWardrobeUI: Проверка 'В шкафу'. currentlyWornItemIds:", currentlyWornItemIds);

    state.ownedClothes.forEach(itemId => {
        console.log(`renderWardrobeUI: Проверяем для шкафа itemId '${itemId}'. Надет ли: ${currentlyWornItemIds.includes(itemId)}`);
        if (!currentlyWornItemIds.includes(itemId)) { // Показываем только то, что не надето
            anythingInClosetToWear = true;
            const item = CLOTHING_ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wardrobe-item-display';

            const itemName = document.createElement('span');
            itemName.textContent = `${item.name} (слот: ${item.slot})`;
            itemDiv.appendChild(itemName);

            const equipButton = document.createElement('button');
            equipButton.textContent = 'Надеть';
            equipButton.className = 'choice-button wardrobe-button';
            equipButton.onclick = () => equipItem(itemId);
            itemDiv.appendChild(equipButton);

            ownedSection.appendChild(itemDiv);
        }
    });

    if (!anythingInClosetToWear && state.ownedClothes.length === currentlyWornItemIds.length && state.ownedClothes.length > 0) {
         console.log("renderWardrobeUI: Вся доступная одежда уже надета.");
         const p = document.createElement('p');
         p.textContent = 'Вся доступная одежда уже надета или в шкафу пусто.';
         ownedSection.appendChild(p);
    } else if (state.ownedClothes.length === 0) {
        console.log("renderWardrobeUI: Шкаф пуст.");
        const p = document.createElement('p');
        p.textContent = 'В шкафу пока пусто.';
        ownedSection.appendChild(p);
    } else if (!anythingInClosetToWear && state.ownedClothes.length > 0) { // Если есть вещи, но все надеты
        console.log("renderWardrobeUI: В шкафу есть вещи, но все они сейчас надеты (или для них нет места).");
        // Тут можно тоже какое-то сообщение вывести, если это не покрывается предыдущим.
        // Или предыдущее условие "Вся доступная одежда уже надета" должно это покрыть.
    }


    wardrobeContainer.appendChild(equippedSection);
    wardrobeContainer.appendChild(ownedSection);
    el.choices.appendChild(wardrobeContainer);
    console.log("renderWardrobeUI: Конец отрисовки, wardrobeContainer добавлен в el.choices");
}

export function renderChoices(actionsArray) {
    console.log("renderChoices: Начало отрисовки кнопок действий");
    el.choices.innerHTML = '';
    actionsArray.filter(action => {
        if (action.tab === 'hormone' && !state.hormonesUnlocked) {
            return false;
        }
        return action.tab === state.tab;
    }).forEach(action => {
        if (action.displayCondition && !action.displayCondition()) {
            return;
        }

        const b = document.createElement('button');
        b.className = 'choice-button';

        let baseText = typeof action.text === 'function' ? action.text() : action.text;
        let currentText = '';
        let icon = '';

        // Иконки на основе ID действия
        switch (action.id) {
            case 'work': icon = '💼 '; break;
            case 't_blocker': icon = '💊 '; break;
            case 't_pill': icon = '♂️ '; break;
            case 'e_pill': icon = '♀️ '; break;
            case 'read_book': icon = state.hormonesUnlocked ? '📖 ' : '📚 '; break;
            case 'browse_internet': icon = '🌐 '; break; // Теперь это основной источник иконки
            case 'rest': icon = '😴 '; break;
            // default: можно оставить пустым, если мы уверены, что все actions имеют ID
            // и соответствующий case. Если нет, можно добавить резервную логику
            // или выводить предупреждение о неизвестном action.id
        }

        currentText = icon + baseText; // Простое присвоение иконки и текста

        // Убедимся, что у "Искать информацию" иконка есть, если она не в action.text
        if (action.id === 'browse_internet' && !baseText.startsWith('🌐')) {
            currentText = '🌐 ' + baseText;
        } else {
            currentText = icon + baseText;
        }


        let isDisabled = false;
        if (action.cost > 0 && state.money < action.cost) {
            isDisabled = true;
            currentText += ` (Нужно: ${action.cost}${C.CURRENCY_SYMBOL})`;
        } else if (action.cost > 0) {
            currentText += ` (–${action.cost}${C.CURRENCY_SYMBOL})`;
        } else if (action.id === 'work') {
            currentText += ` (+${C.WORK_INCOME}${C.CURRENCY_SYMBOL})`;
        }

        if (action.condition && !action.condition()) {
            isDisabled = true;
            if (action.id === 't_blocker' && state.t_blocker_active_days > 0) {
                currentText = `${icon}Блокатор Т активен (${state.t_blocker_active_days} дн.)`;
            }
        }

        b.textContent = currentText;
        b.disabled = isDisabled;

        b.addEventListener('click', () => {
            action.handler();
        });
        el.choices.appendChild(b);
    });
}

export function updateStats(actionsArray) { // Принимает actionsArray для передачи в renderChoices
    el.day.textContent = state.day;
    el.money.textContent = state.money + C.CURRENCY_SYMBOL;
    el.test.textContent = state.testosterone.toFixed(0);
    el.est.textContent = state.estrogen.toFixed(0);

    updateProgressDisplay();
    updateTabsVisibility(); // Должна быть вызвана до renderChoices, если она меняет активный таб

    el.tbar.style.width = (state.testosterone / C.MAX_HORMONE_LEVEL * 100) + '%';
    el.ebar.style.width = (state.estrogen / C.MAX_HORMONE_LEVEL * 100) + '%';

    updateBody(); // Обновляем описание тела всегда, когда обновляются статы

    console.log(`updateStats: Текущая вкладка state.tab = '${state.tab}'`);

    // Проверяем текущую активную вкладку и вызываем соответствующую функцию рендеринга
    if (state.tab === 'wardrobe') {
        console.log("Вызов renderWardrobeUI из updateStats");
        renderWardrobeUI(); // Если активна вкладка "Гардероб", перерисовываем её
    } else if (actionsArray) { // Убедимся, что actionsArray передан для других вкладок
        renderChoices(actionsArray); // Для остальных вкладок перерисовываем кнопки действий
    } else if (!actionsArray && state.tab !== 'wardrobe') {
        // Этого не должно происходить, если actionsArray всегда передается, когда он нужен.
        // Очищаем choices, чтобы не оставалось старых кнопок, если что-то пошло не так.
        console.warn(`updateStats вызван для вкладки ${state.tab} без actionsArray.`);
        el.choices.innerHTML = '';
    }

    renderChoices(actionsArray); // Передаем actionsArray
}