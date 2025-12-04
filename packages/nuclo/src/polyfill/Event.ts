export class NucloEvent implements Event {
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  currentTarget: EventTarget | null = null;
  defaultPrevented: boolean = false;
  eventPhase: number = 0;
  isTrusted: boolean = false;
  target: EventTarget | null = null;
  timeStamp: number;
  readonly AT_TARGET: 2 = 2;
  readonly BUBBLING_PHASE: 3 = 3;
  readonly CAPTURING_PHASE: 1 = 1;
  readonly NONE: 0 = 0;
  returnValue: boolean = true;
  srcElement: EventTarget | null = null;
  cancelBubble: boolean = false;
  
  constructor(type: string, eventInitDict?: EventInit) {
    this.type = type;
    this.bubbles = eventInitDict?.bubbles || false;
    this.cancelable = eventInitDict?.cancelable || false;
    this.composed = eventInitDict?.composed || false;
    this.timeStamp = Date.now();
  }
  
  composedPath(): EventTarget[] {
    return [];
  }
  
  initEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean): void {
    // Legacy method - no-op
  }
  
  preventDefault(): void {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }
  
  stopImmediatePropagation(): void {
    this.cancelBubble = true;
  }
  
  stopPropagation(): void {
    this.cancelBubble = true;
  }
}

export class NucloCustomEvent<T = any> extends NucloEvent implements CustomEvent<T> {
  detail: T;
  
  constructor(type: string, eventInitDict?: CustomEventInit<T>) {
    super(type, eventInitDict);
    this.detail = eventInitDict?.detail as T;
  }
  
  initCustomEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean, _detail?: T): void {
    // Legacy method - no-op
  }
}

// Export polyfills if browser globals don't exist
export const Event = globalThis.Event || NucloEvent;
export const CustomEvent = globalThis.CustomEvent || NucloCustomEvent;
