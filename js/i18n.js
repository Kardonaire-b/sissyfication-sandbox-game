import { locale } from './locales/ru.js';

/**
 * Получает текстовую строку по ключу и опционально заменяет плейсхолдеры.
 * @param {string} key - Ключ в формате 'group.subgroup.key'.
 * @param {object} [replacements={}] - Объект для замены плейсхолдеров, например { name: "Анжела" }.
 * @returns {string} - Переведенная строка или ключ, если строка не найдена.
 */
export function t(key, replacements = {}) {
    // Разбиваем ключ 'group.subgroup.key' на массив ['group', 'subgroup', 'key']
    const keys = key.split('.');
    let result = locale;

    // Идем по вложенности объекта locale, используя ключи из массива
    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            // Если ключ не найден, возвращаем его в скобках для легкой отладки
            return `[${key}]`;
        }
    }

    // Если нашли строку, то производим замену плейсхолдеров
    if (typeof result === 'string') {
        for (const placeholder in replacements) {
            // Ищет {placeholder} и заменяет его на значение
            const regex = new RegExp(`{${placeholder}}`, 'g');
            result = result.replace(regex, replacements[placeholder]);
        }
        return result;
    }

    // Если по ключу оказался объект, а не строка, возвращаем ключ
    return `[${key}]`;
}