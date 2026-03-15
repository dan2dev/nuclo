export interface UpdateScope {
  roots: ReadonlyArray<Element>;
  contains(node: Node): boolean;
}

