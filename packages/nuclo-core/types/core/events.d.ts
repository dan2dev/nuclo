declare global {
  export type TypedEventListener<
    TElement extends EventTarget,
    TEvent extends Event = Event,
  > = (this: TElement, event: TEvent & { currentTarget: TElement }) => unknown;

  /** Public camel-cased attribute name to native DOM event name. */
  export interface HTMLElementEventAttributeNameMap {
    onAbort: "abort";
    onAnimationCancel: "animationcancel";
    onAnimationEnd: "animationend";
    onAnimationIteration: "animationiteration";
    onAnimationStart: "animationstart";
    onAuxClick: "auxclick";
    onBeforeInput: "beforeinput";
    onBeforeMatch: "beforematch";
    onBeforeToggle: "beforetoggle";
    onBlur: "blur";
    onCancel: "cancel";
    onCanPlay: "canplay";
    onCanPlayThrough: "canplaythrough";
    onChange: "change";
    onClick: "click";
    onClose: "close";
    onCommand: "command";
    onCompositionEnd: "compositionend";
    onCompositionStart: "compositionstart";
    onCompositionUpdate: "compositionupdate";
    onContextLost: "contextlost";
    onContextMenu: "contextmenu";
    onContextRestored: "contextrestored";
    onCopy: "copy";
    onCueChange: "cuechange";
    onCut: "cut";
    onDblClick: "dblclick";
    onDoubleClick: "dblclick";
    onDrag: "drag";
    onDragEnd: "dragend";
    onDragEnter: "dragenter";
    onDragLeave: "dragleave";
    onDragOver: "dragover";
    onDragStart: "dragstart";
    onDrop: "drop";
    onDurationChange: "durationchange";
    onEmptied: "emptied";
    onEnded: "ended";
    onError: "error";
    onFocus: "focus";
    onFocusIn: "focusin";
    onFocusOut: "focusout";
    onFormData: "formdata";
    onFullscreenChange: "fullscreenchange";
    onFullscreenError: "fullscreenerror";
    onGotPointerCapture: "gotpointercapture";
    onInput: "input";
    onInvalid: "invalid";
    onKeyDown: "keydown";
    onKeyPress: "keypress";
    onKeyUp: "keyup";
    onLoad: "load";
    onLoadedData: "loadeddata";
    onLoadedMetadata: "loadedmetadata";
    onLoadStart: "loadstart";
    onLostPointerCapture: "lostpointercapture";
    onMouseDown: "mousedown";
    onMouseEnter: "mouseenter";
    onMouseLeave: "mouseleave";
    onMouseMove: "mousemove";
    onMouseOut: "mouseout";
    onMouseOver: "mouseover";
    onMouseUp: "mouseup";
    onPaste: "paste";
    onPause: "pause";
    onPlay: "play";
    onPlaying: "playing";
    onPointerCancel: "pointercancel";
    onPointerDown: "pointerdown";
    onPointerEnter: "pointerenter";
    onPointerLeave: "pointerleave";
    onPointerMove: "pointermove";
    onPointerOut: "pointerout";
    onPointerOver: "pointerover";
    onPointerRawUpdate: "pointerrawupdate";
    onPointerUp: "pointerup";
    onProgress: "progress";
    onRateChange: "ratechange";
    onReset: "reset";
    onResize: "resize";
    onScroll: "scroll";
    onScrollEnd: "scrollend";
    onSecurityPolicyViolation: "securitypolicyviolation";
    onSeeked: "seeked";
    onSeeking: "seeking";
    onSelect: "select";
    onSelectionChange: "selectionchange";
    onSelectStart: "selectstart";
    onSlotChange: "slotchange";
    onStalled: "stalled";
    onSubmit: "submit";
    onSuspend: "suspend";
    onTimeUpdate: "timeupdate";
    onToggle: "toggle";
    onTouchCancel: "touchcancel";
    onTouchEnd: "touchend";
    onTouchMove: "touchmove";
    onTouchStart: "touchstart";
    onTransitionCancel: "transitioncancel";
    onTransitionEnd: "transitionend";
    onTransitionRun: "transitionrun";
    onTransitionStart: "transitionstart";
    onVolumeChange: "volumechange";
    onWaiting: "waiting";
    onWebkitAnimationEnd: "webkitanimationend";
    onWebkitAnimationIteration: "webkitanimationiteration";
    onWebkitAnimationStart: "webkitanimationstart";
    onWebkitTransitionEnd: "webkittransitionend";
    onWheel: "wheel";
    onEncrypted: "encrypted";
    onWaitingForKey: "waitingforkey";
    onEnterPictureInPicture: "enterpictureinpicture";
    onLeavePictureInPicture: "leavepictureinpicture";
    onAfterPrint: "afterprint";
    onBeforePrint: "beforeprint";
    onBeforeUnload: "beforeunload";
    onGamepadConnected: "gamepadconnected";
    onGamepadDisconnected: "gamepaddisconnected";
    onHashChange: "hashchange";
    onLanguageChange: "languagechange";
    onMessage: "message";
    onMessageError: "messageerror";
    onOffline: "offline";
    onOnline: "online";
    onPageHide: "pagehide";
    onPageReveal: "pagereveal";
    onPageShow: "pageshow";
    onPageSwap: "pageswap";
    onPopState: "popstate";
    onRejectionHandled: "rejectionhandled";
    onStorage: "storage";
    onUnhandledRejection: "unhandledrejection";
    onUnload: "unload";
  }

}

type EventMapForElement<TElement> =
  TElement extends HTMLVideoElement
    ? HTMLVideoElementEventMap
    : TElement extends HTMLMediaElement
      ? HTMLMediaElementEventMap
      : TElement extends HTMLBodyElement
        ? HTMLBodyElementEventMap
        : HTMLElementEventMap;

type NativeHTMLElementEventName =
  | keyof HTMLElementEventMap
  | keyof HTMLMediaElementEventMap
  | keyof HTMLVideoElementEventMap
  | keyof HTMLBodyElementEventMap;

type NativeHTMLElementTagNameForEvent<TEventName extends NativeHTMLElementEventName> =
  TEventName extends keyof HTMLElementEventMap
    ? ElementTagName
    : TEventName extends keyof HTMLMediaElementEventMap
      ? "audio" | "video"
      : TEventName extends keyof HTMLVideoElementEventMap
        ? "video"
        : TEventName extends keyof HTMLBodyElementEventMap
          ? "body"
          : never;

type NativeHTMLElementEventForName<TEventName extends NativeHTMLElementEventName> =
  TEventName extends keyof HTMLElementEventMap
    ? HTMLElementEventMap[TEventName]
    : TEventName extends keyof HTMLMediaElementEventMap
      ? HTMLMediaElementEventMap[TEventName]
      : TEventName extends keyof HTMLVideoElementEventMap
        ? HTMLVideoElementEventMap[TEventName]
        : TEventName extends keyof HTMLBodyElementEventMap
          ? HTMLBodyElementEventMap[TEventName]
          : never;

type EventForAttribute<
  TElement,
  TAttribute extends keyof HTMLElementEventAttributeNameMap,
> = HTMLElementEventAttributeNameMap[TAttribute] extends infer TEventName extends keyof EventMapForElement<TElement>
  ? EventMapForElement<TElement>[TEventName]
  : never;

type EventAttributeValue<
  TElement extends EventTarget,
  TAttribute extends keyof HTMLElementEventAttributeNameMap,
> = [EventForAttribute<TElement, TAttribute>] extends [never]
  ? never
  : EventForAttribute<TElement, TAttribute> extends infer TEvent extends Event
    ? TypedEventListener<TElement, TEvent>
    : never;

declare global {
  /** Every standard event name exposed by an HTML element event map. */
  export type NucloHTMLElementEventName = NativeHTMLElementEventName;

  /** HTML tag names on which a standard event is available. */
  export type NucloHTMLElementTagNameForEvent<
    TEventName extends NucloHTMLElementEventName,
  > = NativeHTMLElementTagNameForEvent<TEventName>;

  /** The native event object inferred from a standard event name. */
  export type NucloHTMLElementEventForName<
    TEventName extends NucloHTMLElementEventName,
  > = NativeHTMLElementEventForName<TEventName>;

  export type CamelCaseEventAttributes<
    TTagName extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  > = {
    [TAttribute in keyof HTMLElementEventAttributeNameMap]?: EventAttributeValue<
      HTMLElementTagNameMap[TTagName],
      TAttribute
    >;
  };
}

export {};
