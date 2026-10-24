'use client';
import { createContext, useContext } from 'react';
import type { Row } from '@/lib/client';
export type Me = {
  user: Row;
  instance: string;
  writesEnabled: boolean;
  hosting: string;
  odooUrl: string;
  authMode: string;
};
export const MeContext = createContext<Me | null>(null);
export const NoticeContext = createContext<(text: string, error?: boolean) => void>(() => {});
export const useMe = () => useContext(MeContext)!;
export const useNotice = () => useContext(NoticeContext);
