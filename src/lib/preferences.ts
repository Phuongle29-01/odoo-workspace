'use client';
import { useQueryClient } from '@tanstack/react-query';
import { api, useData } from './client';
export type UiPreferences = {
  focusMode?: boolean;
  view?: 'list' | 'kanban' | 'tree';
  navWidth?: number;
  collabWidth?: number;
  navOpen?: boolean;
  collabOpen?: boolean;
};
export function useUiPreferences() {
  const cache = useQueryClient(),
    query = useData<UiPreferences>('ui-preferences', true, false);
  async function save(value: UiPreferences) {
    const before = cache.getQueryData<UiPreferences>(['ui-preferences']) || {};
    cache.setQueryData(['ui-preferences'], { ...before, ...value });
    try {
      await api('ui-preferences', { method: 'POST', body: JSON.stringify(value) });
    } catch (e) {
      cache.setQueryData(['ui-preferences'], before);
      throw e;
    }
  }
  return { value: query.data || {}, save, error: query.error };
}
