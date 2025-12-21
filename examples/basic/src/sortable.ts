const animateElement = (element: HTMLElement, fromRect: DOMRect, toRect: DOMRect) => {
  const deltaX = fromRect.left - toRect.left;
  const deltaY = fromRect.top - toRect.top;
  
  if (deltaX === 0 && deltaY === 0) return;
  
  element.style.transition = "none";
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  
  requestAnimationFrame(() => {
    element.style.transition = "transform 300ms cubic-bezier(0.215, 0.610, 0.355, 1.000)";
    element.style.transform = "";
  });
};

export const sortable = (onReorder: (fromIndex: number, toIndex: number) => void) => {
  return (element: HTMLElement) => {
    element.style.userSelect = "none";
    
    let draggedElement: HTMLElement | null = null;
    let draggedIndex: number | null = null;
    let currentIndex: number | null = null;
    let isAnimating = false;
    let isPointerDown = false;
    let moveHandler: ((e: PointerEvent) => void) | null = null;
    let upHandler: (() => void) | null = null;
    let downHandler: ((e: PointerEvent) => void) | null = null;
    
    const performSwap = (parent: HTMLElement, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || isAnimating) return;
      
      isAnimating = true;
      
      const siblings = Array.from(parent.children) as HTMLElement[];
      
      const positionsBefore = new Map<HTMLElement, DOMRect>();
      siblings.forEach(sibling => {
        positionsBefore.set(sibling, sibling.getBoundingClientRect());
      });
      
      onReorder(fromIndex, toIndex);
      
      currentIndex = toIndex;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const updatedSiblings = Array.from(parent.children) as HTMLElement[];
          updatedSiblings.forEach(sibling => {
            const before = positionsBefore.get(sibling);
            if (before) {
              const after = sibling.getBoundingClientRect();
              animateElement(sibling, before, after);
            }
          });
          
          setTimeout(() => {
            isAnimating = false;
          }, 150);
        });
      });
    };
    
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      
      // Check if the click originated from a drag handle
      const target = e.target as HTMLElement;
      const handle = target.closest('[data-drag-handle]') as HTMLElement;
      if (!handle || !element.contains(handle)) return;
      
      isPointerDown = true;
      draggedElement = element;
      document.body.style.setProperty("cursor", "grabbing", "important");
      element.style.opacity = "0.5";
      element.style.transition = "opacity 200ms ease";
      
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        draggedIndex = siblings.indexOf(element);
        currentIndex = draggedIndex;
      }
      
      isAnimating = false;
      e.preventDefault();
      
      moveHandler = (e: PointerEvent) => {
        if (!isPointerDown || !draggedElement || currentIndex === null) return;
        
        const parent = draggedElement.parentElement;
        if (!parent) return;
        
        const siblings = Array.from(parent.children) as HTMLElement[];
        const pointerY = e.clientY;
        
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i] as HTMLElement;
          const rect = sibling.getBoundingClientRect();
          
          if (pointerY >= rect.top && pointerY <= rect.bottom) {
            const relativeY = pointerY - rect.top;
            const halfHeight = rect.height / 2;
            
            let targetIndex = i;
            
            if (relativeY > halfHeight && i < currentIndex) {
              targetIndex = i;
            }
            else if (relativeY <= halfHeight && i > currentIndex) {
              targetIndex = i;
            }
            else if (i !== currentIndex) {
              targetIndex = i;
            } else {
              return;
            }
            
            if (targetIndex !== currentIndex) {
              performSwap(parent, currentIndex, targetIndex);
            }
            break;
          }
        }
      };
      
      upHandler = () => {
        if (!isPointerDown) return;
        
        isPointerDown = false;
        
        if (draggedElement) {
          document.body.style.cursor = "";
          draggedElement.style.opacity = "1";
          draggedElement = null;
        }
        
        draggedIndex = null;
        currentIndex = null;
        isAnimating = false;
        
        if (moveHandler) {
          document.removeEventListener("pointermove", moveHandler);
          moveHandler = null;
        }
        if (upHandler) {
          document.removeEventListener("pointerup", upHandler);
          document.removeEventListener("pointercancel", upHandler);
          upHandler = null;
        }
      };
      
      document.addEventListener("pointermove", moveHandler);
      document.addEventListener("pointerup", upHandler);
      document.addEventListener("pointercancel", upHandler);
    };
    
    downHandler = onPointerDown;
    element.addEventListener("pointerdown", downHandler);
    
    // Cleanup function to remove event listeners when element is removed
    // This uses MutationObserver to detect when element is disconnected
    const cleanup = () => {
      // Remove the main pointerdown listener
      if (downHandler) {
        element.removeEventListener("pointerdown", downHandler);
        downHandler = null;
      }
      
      // Clean up any active drag handlers
      if (moveHandler) {
        document.removeEventListener("pointermove", moveHandler);
        moveHandler = null;
      }
      if (upHandler) {
        document.removeEventListener("pointerup", upHandler);
        document.removeEventListener("pointercancel", upHandler);
        upHandler = null;
      }
      
      // Reset state
      if (draggedElement) {
        document.body.style.cursor = "";
        draggedElement.style.opacity = "1";
        draggedElement = null;
      }
      isPointerDown = false;
      draggedIndex = null;
      currentIndex = null;
      isAnimating = false;
      
      // Disconnect the observer
      if (observer) {
        observer.disconnect();
      }
    };
    
    // Create a MutationObserver to watch for element removal
    let observer: MutationObserver | null = null;
    if (element.parentNode) {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.removedNodes) {
            if (node === element || node.contains(element)) {
              cleanup();
              return;
            }
          }
        }
      });
      
      // Observe the parent (or document.body if no parent yet)
      const observeTarget = element.parentNode || document.body;
      observer.observe(observeTarget, { childList: true, subtree: true });
    }
  };
};
