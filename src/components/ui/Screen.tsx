import { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView edges={['top']} className={`flex-1 bg-surface ${className || ''}`}>
      {children}
    </SafeAreaView>
  );
}
