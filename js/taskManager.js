// taskManager.js
import { gameTasks }  from './gameData/tasks.js';      // все задания
import { state }      from './state.js';     // актуальное состояние игры
import { eventBus }   from './eventBus.js';  // общий автобус событий
import { CLOTHING_SLOTS } from './wardrobeConfig.js';

/** Проверяем каждое задание и, если условие выполнено, отмечаем и запускаем следующее событие */
function checkTasks() {
    console.debug('[TaskManager] checkTasks fired');

    Object.values(gameTasks).forEach(task => {
        if (task._done) return;                 // уже выполнено раньше

        const completed = task.isCompleted(state);
        console.debug(`[TaskManager] evaluate ${task.id}`, { completed });

        if (completed) {
            task._done = true;
            const res = task.onComplete(state);

            if (res?.nextEventId) {
                eventBus.dispatch('startEvent', res.nextEventId);
            }
        }
    });
}

// 1) проверка прямо при старте игры/загрузке, вдруг условие уже выполнено
checkTasks();

// слушаем любые «законченные действия» игрока
eventBus.on('actionCompleted', checkTasks);
// заодно можно проверять после каждого перехода дня
eventBus.on('nextDay',          checkTasks);

export { checkTasks };