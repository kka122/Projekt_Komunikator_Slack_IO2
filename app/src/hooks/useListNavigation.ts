import {useState, type RefObject} from "react";
import {useHotkeys} from "@tanstack/react-hotkeys";
import useModalStore from "../store/useModalStore.ts";

interface UseListNavigationOptions {
  /** Number of items in the navigable list. */
  length: number;
  /** Called when the user confirms the active item with Enter. */
  onSelect: (index: number) => void;
  /** Element the keyboard handlers are scoped to — only fires while focus is inside it. */
  target: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Arrow-key navigation for a vertical list, scoped to `target` so several
// lists (sidebar, messages) can coexist without their hotkeys colliding.
// The stored index is clamped on read, so a shrinking list never needs an
// effect to fix up state.
export function useListNavigation({
  length,
  onSelect,
  target,
  enabled = true,
}: UseListNavigationOptions) {
  const [rawIndex, setRawIndex] = useState(0);
  const isModalOpen = useModalStore((state) => state.isOpen);

  const maxIndex = Math.max(0, length - 1);
  const activeIndex = Math.min(rawIndex, maxIndex);

  const move = (delta: number) => setRawIndex(clamp(activeIndex + delta, 0, maxIndex));
  const setActiveIndex = (index: number) => setRawIndex(clamp(index, 0, maxIndex));

  useHotkeys(
    [
      {hotkey: "ArrowDown", callback: () => move(1)},
      {hotkey: "ArrowUp", callback: () => move(-1)},
      {hotkey: "Home", callback: () => setRawIndex(0)},
      {hotkey: "End", callback: () => setRawIndex(maxIndex)},
      {
        hotkey: "Enter",
        callback: () => {
          if (length > 0) onSelect(activeIndex);
        },
      },
    ],
    {target, enabled: enabled && !isModalOpen, preventDefault: true, ignoreInputs: false},
  );

  return {activeIndex, setActiveIndex};
}
