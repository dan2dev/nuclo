// export type BlockMetaDataType = 1
export const BlockTypeEnum = {
  TEXT: 1,
  LIST: 2,
  WHEN: 3,
  PLACEHOLDER: 4,
} as const;
export type BlockTypeEnum = typeof BlockTypeEnum[keyof typeof BlockTypeEnum];
export type BlockMetaDataType = {
  type: BlockTypeEnum;
  id?: string;
};

export type BlockMetaDataStrType = `${number}-${string}-END` | `${number}-${string}-START`;
export type commentGroup = Node & { nData?: BlockMetaDataType };


// comments should be in the format of: {1|2|3|4}-id-END
function getNData(node: Comment & { nData?: BlockMetaDataType }): BlockMetaDataType | undefined {
  if (node.nodeType !== Node.COMMENT_NODE) {
    return undefined;
  }
  if (node.nData) {
    return node.nData;
  }
  const vArray = String(node.nodeValue).split("-");
  const type = parseInt(vArray[0], 10) as BlockMetaDataType["type"];
  const id = vArray[1];
  const isEnd = Boolean(vArray[vArray.length - 1] === "END");
  if (isEnd) {
    return undefined;
  }
  node.nData = {
    type, id,
  } satisfies BlockMetaDataType;
  return node.nData;
}

function openGroupComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(
    `${metaData.type}-${metaData.id || ""}-START` satisfies BlockMetaDataStrType,
  );
  (comment as any).nData = metaData;
  return comment;
}

function closeGroupComment(metaData: BlockMetaDataType) {
  const comment = document.createComment(
    `${metaData.type}-${metaData.id || ""}-END` satisfies BlockMetaDataStrType,
  );
  (comment as any).nData = {
    type: metaData.type,
    id: metaData.id,
    iter: "end",
  };
  return comment;
}

// block extract will get a parent and a index and will return an array of nodes that are managed by that block
// this will be used to extract the nodes managed by a block (like a list or a when) for hydration and diffing purposes
export function extractBlock(parent: HTMLElement, index: number) {
  // get the marker node at the specified index
  const node = parent.childNodes[index];
  if (!node) {
    return null;
  }
  if (node?.nodeType !== Node.COMMENT_NODE) {
    const blockMetaData = getBlockMetaData(node as Comment);

    const items = new Array<Node>();
    // if blockIter === "start", needs get all nodes until comment with blockIter "end"
    if (blockMetaData.iter === "start") {
      let nextNode = node.nextSibling;
      while (nextNode) {
        break;
      }
    }

    // return Array.from(parent.childNodes).slice(index, index + blockSize);
  } else {
    return [node];
  }
}
