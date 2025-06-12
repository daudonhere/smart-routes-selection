import { create } from 'zustand';
import { AppState } from '@/libs/types';
import { createRouteSlice } from './slices/routeSlice';
import { createSimulationSlice } from './slices/simulationSlice';
import { createUiSlice } from './slices/uiSlice';

export const useRouteStore = create<AppState>()((set, get, store) => ({
  ...createRouteSlice(set, get, store),
  ...createSimulationSlice(set, get, store),
  ...createUiSlice(set, get, store),
}));