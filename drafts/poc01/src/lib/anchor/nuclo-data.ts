export const BlockTypeEnum = {
  TEXT: 1,
  LIST: 2,
  WHEN: 3,
  PLACEHOLDER: 4,
} as const;
export type BlockTypeEnum = (typeof BlockTypeEnum)[keyof typeof BlockTypeEnum];
export type BlockMetaDataType = {
  type: BlockTypeEnum;
  id?: string;
  isEnd?: true | undefined;
};

export type NucloAnchor = Comment & { nData?: BlockMetaDataType, nItems?: Array<WeakRef<Node>> };
export type BlockMetaDataStrType = `${number}-${string}-END` | `${number}-${string}-START`;
// comments should be in the format of: {1|2|3|4}-{id}-{START|END}
export function getAnchorData(node: (Comment | Node) & { nData?: BlockMetaDataType }): BlockMetaDataType | undefined {
  if (node.nodeType !== Node.COMMENT_NODE) {
    return undefined;
  }
  if (node.nData) {
    return node.nData;
  }
  const vArray: string[] = String(node.nodeValue).split("-");
  const type: BlockMetaDataType["type"] = parseInt(vArray[0], 10) as BlockMetaDataType["type"];
  const id: string = vArray[1];
  const isEnd: boolean = Boolean(vArray[vArray.length - 1] === "END");
  if (isEnd) {
    return undefined;
  }
  node.nData = {
    type,
    id,
  } satisfies BlockMetaDataType;
  return node.nData;
}

export function createOpenAnchorComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-START` satisfies BlockMetaDataStrType) as NucloAnchor;
  comment.nData = { ...metaData };
  return comment;
}

export function createClosingAnchorComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-END` satisfies BlockMetaDataStrType) as NucloAnchor;
  comment.nData = {
    type: metaData.type,
    id: metaData.id,
    isEnd: true,
  };
  return comment;
}
