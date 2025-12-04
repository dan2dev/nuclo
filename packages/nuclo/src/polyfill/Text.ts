export class NucloText {
  nodeType = 3; // Node.TEXT_NODE
  nodeName = '#text';
  data: string;
  textContent: string;
  parentNode: any = null;
  
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
}
