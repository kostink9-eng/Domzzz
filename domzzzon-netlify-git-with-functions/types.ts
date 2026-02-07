
export enum WindowType {
  Straight = 'Straight',
  Angled = 'Angled',
  Bay = 'Bay',
  Arc = 'Arc'
}

export interface CalculationParams {
  length: number;
  type: WindowType;
  corners: number;
}

export interface FormData {
  name: string;
  phone: string;
  comment: string;
  consent: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type: 'consent' | 'policy' | null;
}
