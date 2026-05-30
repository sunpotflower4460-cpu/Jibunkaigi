import { useState } from 'react';

export function useReflectionShelf() {
  const [isOpen, setIsOpen] = useState(false);

  function openShelf() {
    setIsOpen(true);
  }

  function closeShelf() {
    setIsOpen(false);
  }

  return { isOpen, openShelf, closeShelf };
}
