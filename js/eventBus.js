const listeners = {};

export const eventBus = {
    /**
     * Подписаться на событие.
     * @param {string} eventName 
     * @param {function} callback
     */
    on(eventName, callback) {
        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }
        listeners[eventName].push(callback);
    },

    /**
     * Отправить (вызвать) событие.
     * @param {string} eventName Имя события.
     * @param {*} data Данные, которые нужно передать обработчику.
     */
    dispatch(eventName, data) {
        if (!listeners[eventName]) {
            return;
        }
        listeners[eventName].forEach(callback => {
            callback(data);
        });
    }
};