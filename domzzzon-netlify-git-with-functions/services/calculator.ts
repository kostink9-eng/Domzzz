
import { WindowType } from '../types';

/**
 * ФОРМУЛА:
 * 1) Первый метр всегда = 7500 ₽.
 * 2) Дополнительная длина extra = max(0, L - 1).
 * 3) Тариф за доп. метр:
 *    - Прямой и Угловой: 3600 ₽/м
 *    - Эркерный и Дуговой: 4300 ₽/м
 * 4) Базовая стоимость по длине:
 *    cost_length = 7500 + extra * add_per_m
 * 5) Для Углового добавить:
 *    cost = cost_length + U * 1500
 * 6) Округление: до целого рубля.
 */
export const calculateCost = (length: number, type: WindowType, corners: number): number => {
  const baseFirstMeter = 7500;
  const extraLength = Math.max(0, length - 1);
  
  let pricePerExtraMeter = 3600;
  if (type === WindowType.Bay || type === WindowType.Arc) {
    pricePerExtraMeter = 4300;
  }

  const costByLength = baseFirstMeter + (extraLength * pricePerExtraMeter);
  
  let totalCost = costByLength;
  if (type === WindowType.Angled) {
    totalCost += corners * 1500;
  }

  return Math.round(totalCost);
};

export const getPricePerExtraMeter = (type: WindowType): number => {
  return (type === WindowType.Bay || type === WindowType.Arc) ? 4300 : 3600;
};
