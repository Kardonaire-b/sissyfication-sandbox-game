// --- START OF FILE js/descriptions.js ---

import * as C from './config.js';
import { state } from './state.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';

// Обрати внимание на 'export' перед каждой функцией, которую будет использовать ui.js

export function getVoiceDescription(T, E, P) {
    let voicePitch = C.VOICE_PITCH_BASE_HZ - (T - E) * C.VOICE_PITCH_HORMONE_FACTOR;
    voicePitch = Math.max(80, Math.min(300, voicePitch));
    let specificDesc = "";
    if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_2 && P > C.VOICE_P_THRESHOLD_FOR_CHANGE_2) {
        specificDesc = "Звучит заметно выше, нежнее, почти неузнаваемо.";
    } else if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_1) {
        specificDesc = "Становится мягче и выше, теряет грубые нотки.";
    } else if (T - E > C.VOICE_T_DOMINANT_THRESHOLD) {
        specificDesc = "Низкий, с бархатными мужскими обертонами.";
    } else {
        specificDesc = "Тембр на грани, андрогинный, интригующий.";
    }
    return `🎤 Голос: ${voicePitch.toFixed(0)} Гц. ${specificDesc}`;
}

export function getSkinDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let skinDescText = "💧 Кожа: ";
    if (E_is_dominant && E > C.SKIN_E_DOMINANT_THRESHOLD_FOR_SOFTNESS) {
        skinDescText += P > C.SKIN_P_THRESHOLD_SOFT_2 ? "Невероятно гладкая, шелковистая на ощупь, поры почти невидимы. Лёгкий румянец." :
            P > C.SKIN_P_THRESHOLD_SOFT_1 ? "Становится ощутимо мягче, нежнее, уходит жирный блеск." :
            "Появляется мягкость, менее жирная.";
        if (E > C.SKIN_E_THRESHOLD_FOR_THINNING && P > C.SKIN_P_THRESHOLD_FOR_THINNING) {
            skinDescText += " Кажется тоньше, венки на запястьях и груди могут быть видны отчетливее.";
        }
    } else if (T_is_dominant && T > C.SKIN_T_DOMINANT_THRESHOLD_FOR_ROUGHNESS) {
        skinDescText += "Плотная, возможно, более склонная к жирности и акне. Поры заметны.";
    } else {
        skinDescText += "Обычная, но ты начинаешь замечать тонкие изменения в её текстуре.";
    }
    return skinDescText;
}

export function getBodyHairDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let bodyHairDescText = "🌿 Волосы на теле/лице: ";
    if (E_is_dominant && E > C.BODYHAIR_E_DOMINANT_THRESHOLD_FOR_REDUCTION && P > C.BODYHAIR_P_THRESHOLD_FOR_REDUCTION) {
        bodyHairDescText += "Рост волос на теле замедлился, они стали тоньше и светлее. ";
        if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_PUBESCENCE && P > C.BODYHAIR_P_THRESHOLD_FOR_FACIAL_PUBESCENCE) {
            bodyHairDescText += "Щетина на лице почти не растет, или стала пушковой.";
        } else if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_SLOWDOWN) {
            bodyHairDescText += "Рост щетины замедлен, бритьё требуется реже.";
        }
    } else if (T_is_dominant && T > C.BODYHAIR_T_DOMINANT_THRESHOLD_FOR_THICK) {
        bodyHairDescText += "Активный рост волос на теле и лице, густая щетина.";
    } else {
        bodyHairDescText += "Без особых изменений.";
    }
    return bodyHairDescText;
}

export function getBreastDescription(E, P) {
    let breastDescText = "🍈 Грудь: ";
    let breastDevStageRaw = 0;
    if (E > C.BREAST_E_THRESHOLD_START_BUDDING && P > C.BREAST_P_THRESHOLD_START_BUDDING) {
        breastDevStageRaw = 1 + (Math.max(0, E - C.BREAST_E_THRESHOLD_START_BUDDING) / C.BREAST_E_UNITS_PER_STAGE) *
            (C.BREAST_PROGRESS_FACTOR_BASE + P / C.BREAST_PROGRESS_FACTOR_SCALE);
    }
    const currentBreastDevStage = Math.min(C.BREAST_MAX_DEV_STAGE, Math.floor(breastDevStageRaw));
    if (currentBreastDevStage === 0) breastDescText += "Абсолютно плоская.";
    else if (currentBreastDevStage === 1) breastDescText += `Появились болезненные уплотнения под сосками (E:${E.toFixed(0)}, P:${P}%).`;
    else if (currentBreastDevStage === 2) breastDescText += `Небольшая, но оформленная (размер A). Соски увеличились. (E:${E.toFixed(0)}, P:${P}%).`;
    else if (currentBreastDevStage === 3) breastDescText += `Среднего размера, упругая (ближе к B). (E:${E.toFixed(0)}, P:${P}%).`;
    else breastDescText += `Пышная, мягкая, соблазнительная (размер C+!). (E:${E.toFixed(0)}, P:${P}%).`;
    return breastDescText;
}

export function getFigureDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let figureDescText = "🍑 Фигура: ";
    const whr_change_potential = C.FIGURE_WHR_BASE - C.FIGURE_WHR_TARGET_FEMALE;
    let whr_progress_to_female_target = 0;
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) {
        whr_progress_to_female_target = Math.min(1, (E - C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) / C.FIGURE_E_UNITS_FOR_WHR_PROGRESS) * (P / C.MAX_PROGRESS);
    }
    const current_whr = (C.FIGURE_WHR_BASE - whr_change_potential * whr_progress_to_female_target).toFixed(2);
    figureDescText += `Талия/бедра: ${current_whr}. `;
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_FAT_REDISTRIBUTION && P > C.FIGURE_P_THRESHOLD_FOR_FAT_REDISTRIBUTION) {
        figureDescText += "Жир перераспределяется на бедра и ягодицы. Талия изящнее.";
    } else if (T_is_dominant && T > C.FIGURE_T_DOMINANT_THRESHOLD_FOR_MALE_FAT) {
        figureDescText += "Жир в области живота, фигура маскулинная.";
    } else if (P > C.FIGURE_P_THRESHOLD_FOR_SUBTLE_SOFTENING) {
        figureDescText += "Контуры тела неуловимо смягчаются.";
    }
    return figureDescText;
}

export function getMuscleDescription(T, E, P, E_is_dominant) {
    let muscleDescText = "💪 Мышцы: ";
    if (T > C.MUSCLE_T_HIGH_THRESHOLD_FOR_BULK && !E_is_dominant) {
        muscleDescText += P < C.MUSCLE_P_THRESHOLD_FOR_BULK_SOFTENING ? "Развитые, рельефные." : "Крепкие, но теряют твердость.";
    } else if (T > C.MUSCLE_T_MID_THRESHOLD_FOR_TONE && !E_is_dominant) {
        muscleDescText += "Умеренно развиты, в тонусе.";
    } else if (E_is_dominant && E > C.MUSCLE_E_DOMINANT_THRESHOLD_FOR_LOSS) {
        muscleDescText += `Уменьшились, стали мягче. Сила снизилась (T:${T.toFixed(0)}).`;
    } else {
        muscleDescText += `Слабые, без рельефа. (T:${T.toFixed(0)})`;
    }
    return muscleDescText;
}

export function getPenisDescription(T, E, P, E_is_dominant) {
    let penisShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_PENIS_E_SHRINK_FACTOR + Math.max(0, 50 - T) * C.GENITAL_PENIS_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    penisShrinkageFactor = Math.max(0, penisShrinkageFactor);
    const penisLengthCm = Math.max(C.GENITAL_PENIS_MIN_CM, C.GENITAL_PENIS_BASE_CM - penisShrinkageFactor).toFixed(1);
    let erectionQuality = 'нормальная';
    if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_ALMOST_NONE && E_is_dominant && P > C.GENITAL_ERECTION_P_LOW_THRESHOLD_ALMOST_NONE) erectionQuality = 'почти отсутствует';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_VERY_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_VERY_WEAK)) erectionQuality = 'очень слабая';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_WEAK)) erectionQuality = 'снижена, менее твердая';
    let penisDescText;
    if (P > C.GENITAL_P_THRESHOLD_FOR_CLIT_TEXT && E_is_dominant && parseFloat(penisLengthCm) < C.GENITAL_PENIS_CLIT_TRANSITION_CM) {
        penisDescText = `🎀 Клитор: ${penisLengthCm} см. Стал очень маленьким и чувствительным. `;
    } else {
        penisDescText = `🍆 Пенис: ${penisLengthCm} см. `;
    }
    penisDescText += `Эрекция: ${erectionQuality}.`;
    return penisDescText;
}

export function getTesticlesDescription(T, E, P, E_is_dominant) {
    let testicleShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_TESTICLES_E_SHRINK_FACTOR + Math.max(0, 40 - T) * C.GENITAL_TESTICLES_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    testicleShrinkageFactor = Math.max(0, testicleShrinkageFactor);
    const testicleVolume = Math.max(C.GENITAL_TESTICLES_MIN_VOL_ML, C.GENITAL_TESTICLES_BASE_VOL_ML - testicleShrinkageFactor).toFixed(1);
    const testicleTexture = (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_SOFT_TEXTURE && P > C.GENITAL_TESTICLES_P_THRESHOLD_SOFT_TEXTURE) ? 'мягкие, уменьшившиеся' : 'упругие';
    let testiclesDescText = `🥚 Яички: объём ~${testicleVolume} мл, ${testicleTexture}. `;
    if (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_ATROPHY && P > C.GENITAL_TESTICLES_P_THRESHOLD_ATROPHY && parseFloat(testicleVolume) < C.GENITAL_TESTICLES_ATROPHY_VOL_ML) {
        testiclesDescText += "Почти атрофировались.";
    }
    return testiclesDescText;
}

export function getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor) {
    let feelingDesc = "✨ Ощущения: ";
    if (P > C.FEELING_P_THRESHOLD_PERFECT_SISSY && E_is_dominant && E > C.FEELING_E_THRESHOLD_PERFECT_SISSY) feelingDesc += "Воплощение женственности. Гармония.";
    else if (P > C.FEELING_P_THRESHOLD_REAL_SISSY && E_is_dominant) feelingDesc += "Чувствуешь себя настоящей сисси. Уверенность растет.";
    else if (P > C.FEELING_P_THRESHOLD_TRANSFORMATION_FULL_SWING && (E_is_dominant || hormonalBalanceFactor > C.FEELING_HORMONAL_BALANCE_THRESHOLD_TRANSFORMATION_FULL_SWING)) feelingDesc += "Трансформация идет полным ходом! Прилив сисси-энергии.";
    else if (P > C.FEELING_P_THRESHOLD_FIRST_WHISPERS) feelingDesc += "Первые шепоты изменений. Тело меняется, это волнует.";
    else feelingDesc += "Самое начало пути. Ветерок перемен едва коснулся.";
    return feelingDesc;
}

export function getCurrentOutfitDescription() {
    const { currentOutfit } = state;
    const descriptions = [];

    if (currentOutfit[CLOTHING_SLOTS.FULL_BODY]) {
        descriptions.push(`ты полностью одета в: ${CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.FULL_BODY]].name.toLowerCase()}`);
    } else {
        const top = currentOutfit[CLOTHING_SLOTS.TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.TOP]].name.toLowerCase() : null;
        const bottom = currentOutfit[CLOTHING_SLOTS.BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.BOTTOM]].name.toLowerCase() : null;
        if (top && bottom) descriptions.push(`на тебе надета ${top} и ${bottom}`);
        else if (top) descriptions.push(`на тебе надета ${top}`);
        else if (bottom) descriptions.push(`на тебе надета ${bottom}`);
    }

    const underwearTop = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP]].name.toLowerCase() : null;
    const underwearBottom = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]].name.toLowerCase() : null;
    let underwearDesc = "";
    if (underwearTop && underwearBottom) underwearDesc = `${underwearTop} и ${underwearBottom}`;
    else if (underwearTop) underwearDesc = underwearTop;
    else if (underwearBottom) underwearDesc = underwearBottom;

    if (underwearDesc) {
        const connector = descriptions.length > 0 ? ", а под одеждой" : "Под одеждой";
        descriptions.push(`${connector} у тебя ${underwearDesc}`);
    }

    if (currentOutfit[CLOTHING_SLOTS.SHOES]) {
        const shoes = CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.SHOES]].name.toLowerCase();
        const connector = descriptions.length > 0 ? ", на ногах -" : "На ногах -";
        descriptions.push(`${connector} ${shoes}`);
    }

    if (descriptions.length === 0) {
        return "👕 Наряд: Ты сейчас ни во что не одета.";
    }

    let finalDescription = descriptions.join(' ').trim();
    finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1) + '.';
    return `👕 Наряд: ${finalDescription}`;
}