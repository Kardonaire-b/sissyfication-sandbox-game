import * as C from './config.js';
import { state } from './state.js';
import { CLOTHING_ITEMS, CLOTHING_SLOTS } from './wardrobeConfig.js';
import { t } from './i18n.js';

export function getVoiceDescription(T, E, P) {
    let voicePitch = C.VOICE_PITCH_BASE_HZ - (T - E) * C.VOICE_PITCH_HORMONE_FACTOR;
    voicePitch = Math.max(80, Math.min(300, voicePitch));
    let specificDesc = "";
    if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_2 && P > C.VOICE_P_THRESHOLD_FOR_CHANGE_2) {
        specificDesc = t('descriptions.voice_desc.high');
    } else if (E - T > C.VOICE_E_DOMINANT_THRESHOLD_FOR_CHANGE_1) {
        specificDesc = t('descriptions.voice_desc.soft');
    } else if (T - E > C.VOICE_T_DOMINANT_THRESHOLD) {
        specificDesc = t('descriptions.voice_desc.low');
    } else {
        specificDesc = t('descriptions.voice_desc.androgynous');
    }
    return t('descriptions.voice', { pitch: voicePitch.toFixed(0), desc: specificDesc });
}

export function getSkinDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let skinDescText = "";
    if (E_is_dominant && E > C.SKIN_E_DOMINANT_THRESHOLD_FOR_SOFTNESS) {
        skinDescText += P > C.SKIN_P_THRESHOLD_SOFT_2 ? t('descriptions.skin_desc.silky') :
            P > C.SKIN_P_THRESHOLD_SOFT_1 ? t('descriptions.skin_desc.soft') :
            t('descriptions.skin_desc.getting_soft');
        if (E > C.SKIN_E_THRESHOLD_FOR_THINNING && P > C.SKIN_P_THRESHOLD_FOR_THINNING) {
            skinDescText += t('descriptions.skin_desc.thinning_add');
        }
    } else if (T_is_dominant && T > C.SKIN_T_DOMINANT_THRESHOLD_FOR_ROUGHNESS) {
        skinDescText += t('descriptions.skin_desc.rough');
    } else {
        skinDescText += t('descriptions.skin_desc.normal');
    }
    return t('descriptions.skin', { desc: skinDescText });
}

export function getBodyHairDescription(T, E, P, E_is_dominant, T_is_dominant) {
    let bodyHairDescText = "";
    if (E_is_dominant && E > C.BODYHAIR_E_DOMINANT_THRESHOLD_FOR_REDUCTION && P > C.BODYHAIR_P_THRESHOLD_FOR_REDUCTION) {
        bodyHairDescText += t('descriptions.body_hair_desc.reduced');
        if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_PUBESCENCE && P > C.BODYHAIR_P_THRESHOLD_FOR_FACIAL_PUBESCENCE) {
            bodyHairDescText += t('descriptions.body_hair_desc.peach_fuzz');
        } else if (T < C.BODYHAIR_T_THRESHOLD_FOR_FACIAL_SLOWDOWN) {
            bodyHairDescText += t('descriptions.body_hair_desc.slowed_shave');
        }
    } else if (T_is_dominant && T > C.BODYHAIR_T_DOMINANT_THRESHOLD_FOR_THICK) {
        bodyHairDescText += t('descriptions.body_hair_desc.thick');
    } else {
        bodyHairDescText += t('descriptions.body_hair_desc.normal');
    }
    return t('descriptions.body_hair', { desc: bodyHairDescText });
}

export function getBreastDescription(E, P) {
    let breastDevStageRaw = 0;
    if (E > C.BREAST_E_THRESHOLD_START_BUDDING && P > C.BREAST_P_THRESHOLD_START_BUDDING) {
        breastDevStageRaw = 1 + (Math.max(0, E - C.BREAST_E_THRESHOLD_START_BUDDING) / C.BREAST_E_UNITS_PER_STAGE) *
            (C.BREAST_PROGRESS_FACTOR_BASE + P / C.BREAST_PROGRESS_FACTOR_SCALE);
    }
    const currentBreastDevStage = Math.min(C.BREAST_MAX_DEV_STAGE, Math.floor(breastDevStageRaw));
    
    let desc;
    const replacements = { E: E.toFixed(0), P: P.toFixed(0) };
    if (currentBreastDevStage === 0) desc = t('descriptions.breast_desc.flat');
    else if (currentBreastDevStage === 1) desc = t('descriptions.breast_desc.budding', replacements);
    else if (currentBreastDevStage === 2) desc = t('descriptions.breast_desc.size_a', replacements);
    else if (currentBreastDevStage === 3) desc = t('descriptions.breast_desc.size_b', replacements);
    else desc = t('descriptions.breast_desc.size_c', replacements);
    
    return t('descriptions.breast', { desc: desc });
}

export function getFigureDescription(T, E, P, E_is_dominant, T_is_dominant) {
    const whr_change_potential = C.FIGURE_WHR_BASE - C.FIGURE_WHR_TARGET_FEMALE;
    let whr_progress_to_female_target = 0;
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) {
        whr_progress_to_female_target = Math.min(1, (E - C.FIGURE_E_DOMINANT_THRESHOLD_FOR_WHR_CHANGE) / C.FIGURE_E_UNITS_FOR_WHR_PROGRESS) * (P / C.MAX_PROGRESS);
    }
    const current_whr = (C.FIGURE_WHR_BASE - whr_change_potential * whr_progress_to_female_target).toFixed(2);
    
    let desc = "";
    if (E_is_dominant && E > C.FIGURE_E_DOMINANT_THRESHOLD_FOR_FAT_REDISTRIBUTION && P > C.FIGURE_P_THRESHOLD_FOR_FAT_REDISTRIBUTION) {
        desc = t('descriptions.figure_desc.redistribution');
    } else if (T_is_dominant && T > C.FIGURE_T_DOMINANT_THRESHOLD_FOR_MALE_FAT) {
        desc = t('descriptions.figure_desc.masculine');
    } else if (P > C.FIGURE_P_THRESHOLD_FOR_SUBTLE_SOFTENING) {
        desc = t('descriptions.figure_desc.softening');
    }
    
    return t('descriptions.figure', { whr: current_whr, desc: desc });
}

export function getMuscleDescription(T, E, P, E_is_dominant) {
    let desc = "";
    const replacements = { T: T.toFixed(0) };
    if (T > C.MUSCLE_T_HIGH_THRESHOLD_FOR_BULK && !E_is_dominant) {
        desc = P < C.MUSCLE_P_THRESHOLD_FOR_BULK_SOFTENING ? t('descriptions.muscle_desc.defined') : t('descriptions.muscle_desc.strong_soft');
    } else if (T > C.MUSCLE_T_MID_THRESHOLD_FOR_TONE && !E_is_dominant) {
        desc = t('descriptions.muscle_desc.toned');
    } else if (E_is_dominant && E > C.MUSCLE_E_DOMINANT_THRESHOLD_FOR_LOSS) {
        desc = t('descriptions.muscle_desc.reduced', replacements);
    } else {
        desc = t('descriptions.muscle_desc.weak', replacements);
    }
    return t('descriptions.muscle', { desc: desc });
}

export function getPenisDescription(T, E, P, E_is_dominant) {
    let penisShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_PENIS_E_SHRINK_FACTOR + Math.max(0, 50 - T) * C.GENITAL_PENIS_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    penisShrinkageFactor = Math.max(0, penisShrinkageFactor);
    const penisLengthCm = Math.max(C.GENITAL_PENIS_MIN_CM, C.GENITAL_PENIS_BASE_CM - penisShrinkageFactor).toFixed(1);

    let qualityKey;
    if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_ALMOST_NONE && E_is_dominant && P > C.GENITAL_ERECTION_P_LOW_THRESHOLD_ALMOST_NONE) qualityKey = 'none';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_VERY_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_VERY_WEAK)) qualityKey = 'very_weak';
    else if (T < C.GENITAL_ERECTION_T_LOW_THRESHOLD_WEAK || (E_is_dominant && E > C.GENITAL_ERECTION_E_HIGH_THRESHOLD_WEAK)) qualityKey = 'weak';
    else qualityKey = 'normal';
    
    const erectionQuality = t(`descriptions.genital_desc.erection_quality.${qualityKey}`);
    const erectionDesc = t('descriptions.genital_desc.erection', { quality: erectionQuality });
    
    let penisDescText;
    if (P > C.GENITAL_P_THRESHOLD_FOR_CLIT_TEXT && E_is_dominant && parseFloat(penisLengthCm) < C.GENITAL_PENIS_CLIT_TRANSITION_CM) {
        penisDescText = t('descriptions.clitoris', { length: penisLengthCm, desc: t('descriptions.genital_desc.penis_sensitive') });
    } else {
        penisDescText = t('descriptions.penis', { length: penisLengthCm, desc: "" });
    }

    return `${penisDescText} ${erectionDesc}`;
}

export function getTesticlesDescription(T, E, P, E_is_dominant) {
    let testicleShrinkageFactor = ((E - C.BASE_E) * C.GENITAL_TESTICLES_E_SHRINK_FACTOR + Math.max(0, 40 - T) * C.GENITAL_TESTICLES_LOW_T_SHRINK_FACTOR) *
        (C.GENITAL_PROGRESS_ACCELERATOR_BASE + P / C.GENITAL_PROGRESS_ACCELERATOR_SCALE);
    testicleShrinkageFactor = Math.max(0, testicleShrinkageFactor);
    const testicleVolume = Math.max(C.GENITAL_TESTICLES_MIN_VOL_ML, C.GENITAL_TESTICLES_BASE_VOL_ML - testicleShrinkageFactor).toFixed(1);
    
    const textureKey = (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_SOFT_TEXTURE && P > C.GENITAL_TESTICLES_P_THRESHOLD_SOFT_TEXTURE) ? 'soft' : 'firm';
    const testicleTexture = t(`descriptions.testicles_desc.texture_${textureKey}`);
    
    let atrophyDesc = "";
    if (E_is_dominant && E > C.GENITAL_TESTICLES_E_THRESHOLD_ATROPHY && P > C.GENITAL_TESTICLES_P_THRESHOLD_ATROPHY && parseFloat(testicleVolume) < C.GENITAL_TESTICLES_ATROPHY_VOL_ML) {
        atrophyDesc = t('descriptions.testicles_desc.atrophied');
    }
    
    return t('descriptions.testicles', { volume: testicleVolume, texture: testicleTexture, desc: atrophyDesc });
}

export function getFeelingDescription(E, P, E_is_dominant, hormonalBalanceFactor) {
    let feelingKey = 'beginning';
    if (P > C.FEELING_P_THRESHOLD_PERFECT_SISSY && E_is_dominant && E > C.FEELING_E_THRESHOLD_PERFECT_SISSY) feelingKey = 'harmony';
    else if (P > C.FEELING_P_THRESHOLD_REAL_SISSY && E_is_dominant) feelingKey = 'sissy';
    else if (P > C.FEELING_P_THRESHOLD_TRANSFORMATION_FULL_SWING && (E_is_dominant || hormonalBalanceFactor > C.FEELING_HORMONAL_BALANCE_THRESHOLD_TRANSFORMATION_FULL_SWING)) feelingKey = 'full_swing';
    else if (P > C.FEELING_P_THRESHOLD_FIRST_WHISPERS) feelingKey = 'whispers';
    
    return t('descriptions.feeling', { desc: t(`descriptions.feeling_desc.${feelingKey}`) });
}

export function getCurrentOutfitDescription() {
    const { currentOutfit } = state;
    const descriptions = [];

    if (currentOutfit[CLOTHING_SLOTS.FULL_BODY]) {
        const itemName = CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.FULL_BODY]].name.toLowerCase();
        descriptions.push(t('descriptions.outfit_desc.full_body', { item: itemName }));
    } else {
        const top = currentOutfit[CLOTHING_SLOTS.TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.TOP]].name.toLowerCase() : null;
        const bottom = currentOutfit[CLOTHING_SLOTS.BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.BOTTOM]].name.toLowerCase() : null;
        if (top && bottom) descriptions.push(t('descriptions.outfit_desc.top_bottom', { top, bottom }));
        else if (top) descriptions.push(t('descriptions.outfit_desc.top_only', { top }));
        else if (bottom) descriptions.push(t('descriptions.outfit_desc.bottom_only', { bottom }));
    }

    const underwearTop = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_TOP]].name.toLowerCase() : null;
    const underwearBottom = currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM] ? CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.UNDERWEAR_BOTTOM]].name.toLowerCase() : null;

    if (underwearTop && underwearBottom) {
        const prefix = t(descriptions.length > 0 ? 'descriptions.outfit_desc.underwear_prefix_and' : 'descriptions.outfit_desc.underwear_prefix_alone');
        descriptions.push(t('descriptions.outfit_desc.underwear_full', { prefix, top: underwearTop, bottom: underwearBottom }));
    } else if (underwearTop || underwearBottom) {
        const prefix = t(descriptions.length > 0 ? 'descriptions.outfit_desc.underwear_prefix_and' : 'descriptions.outfit_desc.underwear_prefix_alone');
        descriptions.push(t('descriptions.outfit_desc.underwear_single', { prefix, item: underwearTop || underwearBottom }));
    }
    
    if (currentOutfit[CLOTHING_SLOTS.SHOES]) {
        const shoes = CLOTHING_ITEMS[currentOutfit[CLOTHING_SLOTS.SHOES]].name.toLowerCase();
        const prefix = t(descriptions.length > 0 ? 'descriptions.outfit_desc.shoes_prefix_and' : 'descriptions.outfit_desc.shoes_prefix_alone');
        descriptions.push(t('descriptions.outfit_desc.shoes', { prefix, item: shoes }));
    }
    
    if (descriptions.length === 0) {
        return t('descriptions.outfit', { desc: t('descriptions.outfit_desc.naked') });
    }

    let finalDescription = descriptions.join(' ').trim();
    finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1) + '.';
    return t('descriptions.outfit', { desc: finalDescription });
}