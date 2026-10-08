import { NO_CHILDREN, siblingOf } from './Node';

export class NucloText {
  nodeType = 3; // Node.TEXT_NODE
  nodeName = '#text';
  data: string;
  textContent: string;
  parentNode: unknown = null;
  
  constructor(data: string) {
    this.data = data;
    this.textContent = data;
  }
  
  get nodeValue(): string {
    return this.data;
  }
  
  set nodeValue(value: string) {
    this.data = value;
    this.textContent = value;
  }

  get childNodes(): NodeListOf<ChildNode> {
    return NO_CHILDREN as unknown as NodeListOf<ChildNode>;
  }

  get nextSibling(): Node | null {
    return siblingOf(this, 1);
  }

  get previousSibling(): Node | null {
    return siblingOf(this, -1);
  }
}
