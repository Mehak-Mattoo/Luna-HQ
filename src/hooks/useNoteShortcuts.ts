import { useEffect } from "react";

type UseNoteShortcutsProps = {
  onDelete: () => void;
  onSearch: () => void;
  onCloseModals: () => void;
  enabled: boolean;
};

export function useNoteShortcuts({  onDelete, onSearch, onCloseModals, enabled = true }: UseNoteShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;

      // Don't fire shortcuts while typing in inputs/contentEditable
      const target = event.target as HTMLElement;
      const isTyping =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA";

    
      
      if (event.key === "Escape") {
        onCloseModals();
        return;
        }
        
        if (isMod && event.key.toLowerCase() === "k") {
          event.preventDefault();
          onSearch();
          return;
        }

      if (!isTyping && event.key === "Delete") {
        onDelete();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onDelete, onSearch, onCloseModals]);
}
