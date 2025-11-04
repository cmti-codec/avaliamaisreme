import { useEffect } from 'react';

/**
 * Hook para ativar atalho Ctrl+Shift+T (ou Cmd+Shift+T no Mac)
 * para abrir o modal de Modo Teste
 */
export function useTestModeShortcut(onTrigger: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+T (Windows/Linux) ou Cmd+Shift+T (Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTrigger, enabled]);
}
