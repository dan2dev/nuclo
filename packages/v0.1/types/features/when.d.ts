declare global {
  // When/conditional rendering types
  export type WhenCondition = boolean | (() => boolean);
  export type WhenContent<TTagName extends ElementTagName = ElementTagName> = 
    NodeMod<TTagName> | NodeModFn<TTagName>;
  
  export interface WhenBuilder<TTagName extends ElementTagName = ElementTagName> extends NodeModFn<TTagName> {
    when(condition: WhenCondition, ...content: WhenContent<TTagName>[]): WhenBuilder<TTagName>;
    else(...content: WhenContent<TTagName>[]): WhenBuilder<TTagName>;
  }
  
  export function when<TTagName extends ElementTagName = ElementTagName>(
    condition: WhenCondition, 
    ...content: WhenContent<TTagName>[]
  ): WhenBuilder<TTagName>;
}

export {};