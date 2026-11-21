import type { Location } from '../types';

export const location = $state<{ current: Location | null }>({ current: null });
