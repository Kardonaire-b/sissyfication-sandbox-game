import { BASE_E } from './config.js'; // Импортируем BASE_E для инициализации

export const state = {
  day: 0,
  money: 50,
  testosterone: 50,
  estrogen: BASE_E, // Используем импортированную константу
  emaT: 50,         // Начальное значение EMA должно соответствовать начальному T
  emaE: BASE_E,       // Начальное значение EMA должно соответствовать начальному E
  progress: 0,
  discoveryPoints: 0,
  hormonesUnlocked: false,
  tab: 'income',
  t_blocker_active_days: 0,
  natural_t_multiplier: 1.0,
};