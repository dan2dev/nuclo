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
  // isEnd?: true | undefined;
};
export type BlockMetaDataResponseType = BlockMetaDataType & { isEnd?: true | undefined };


export type NucloAnchor = Comment & { nData?: BlockMetaDataResponseType, nItems?: Array<WeakRef<Node>> };
export type BlockMetaDataStrType = `${number}-${string}-END` | `${number}-${string}-START`;

// comments should be in the format of: {1|2|3|4}-{id}-{START|END}
// getAnchorData
export function getAnchorData(comment: (Comment | Node) & { nData?: BlockMetaDataResponseType }): BlockMetaDataResponseType | undefined {
  if (comment.nodeType !== Node.COMMENT_NODE) {
    return undefined;
  }
  if (comment.nData) {
    return comment.nData;
  }
  const vArray: string[] = String(comment.nodeValue).split("-");
  const type: BlockMetaDataType["type"] = parseInt(vArray[0], 10) as BlockMetaDataType["type"];
  const id: string = vArray[1];
  const isEnd: true | undefined = vArray[vArray.length - 1] === "END" ? true : undefined;
  comment.nData = {
    type,
    id,
    isEnd
  } satisfies BlockMetaDataResponseType;
  return comment.nData;
}

// createOpenAnchorComment
export function createOpenAnchorComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-START` satisfies BlockMetaDataStrType) as NucloAnchor;
  comment.nData = { ...metaData };
  return comment;
}

// createClosingAnchorComment
export function createClosingAnchorComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-END` satisfies BlockMetaDataStrType) as NucloAnchor;
  comment.nData = {
    ...metaData,
    isEnd: true,
  } satisfies BlockMetaDataResponseType;
  return comment;
}
