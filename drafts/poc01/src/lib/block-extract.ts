// export type BlockMetaDataType = 1
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

export type BlockMetaDataStrType = `${number}-${string}-END` | `${number}-${string}-START`;
export type CommentAnchor = Comment & { nData?: BlockMetaDataType };

// comments should be in the format of: {1|2|3|4}-id-END
function getNData(node: (Comment | Node) & { nData?: BlockMetaDataType }): BlockMetaDataType | undefined {
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
		type,
		id,
	} satisfies BlockMetaDataType;
	return node.nData;
}

function openGroupComment(metaData: BlockMetaDataType) {
	const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-START` satisfies BlockMetaDataStrType);
	(comment as any).nData = metaData;
	return comment;
}

function closeGroupComment(metaData: BlockMetaDataType) {
	const comment = document.createComment(`${metaData.type}-${metaData.id || ""}-END` satisfies BlockMetaDataStrType);
	(comment as any).nData = {
		type: metaData.type,
		id: metaData.id,
		iter: "end",
	};
	return comment;
}

// block extract will get a parent and a index and will return an array of nodes that are managed by that block
// this will be used to extract the nodes managed by a block (like a list or a when) for hydration and diffing purposes
type ParentAnchorItemType = Comment & { nData: BlockMetaDataType; nItems: Array<WeakRef<Node>> };
export function extractBlock(
	parent: HTMLElement & { nAnchors: ParentAnchorItemType[] },
	index: number,
) {
	const nData = getNData(parent.childNodes[index]);
	if (!nData) {
		return parent.childNodes[index] || null;
	}

	// text
	if (nData.type === BlockTypeEnum.TEXT) {
		const text = parent.childNodes[index].nextSibling;
		if (!text || text.nodeType !== Node.TEXT_NODE) {
			return null;
		}
		return parent.childNodes[index].nextSibling;
	}

	// list
	// if (nData.type === BlockTypeEnum.LIST) {
		parent.nAnchors = [parent.childNodes[index] as ParentAnchorItemType] as ParentAnchorItemType[];
		let itemIndex = index + 1;
		// get items
		while (itemIndex < parent.childNodes.length) {
			const child = parent.childNodes[itemIndex];
			if (child.nodeType === Node.COMMENT_NODE) {
				const nData = getNData(child);
				if (nData?.isEnd) {
					break;
				}
			}

			if (child.nodeType === Node.ELEMENT_NODE) {
				anchors[anchors.length - 1].nItems.push(new WeakRef(child));
			} else if (child.nodeType === Node.COMMENT_NODE) {
				const childData = getNData(child);
				// if (childData && childData.type === BlockTypeEnum.LIST && childData.id === nData.id) {
				// 	anchor.nItems.push(new WeakRef(child));
				// } else {
				// 	break;
				// }
			}
			itemIndex += 1;
		}
	// }
	// 	while (itemIndex < parent.childNodes.length) {
	// 		const child = parent.childNodes[itemIndex];
	// 		if (child.nodeType === Node.ELEMENT_NODE) {
	// 			items.push(new WeakRef(child));
	// 		} else if (child.nodeType === Node.COMMENT_NODE) {
	// 			const childData = getNData(child);
	// 			if (childData && childData.type === BlockTypeEnum.LIST_ITEM) {
	// 				items.push(new WeakRef(child));
	// 			} else {
	// 				break;
	// 			}
	// 		}
	// 		itemIndex++;
	// 	}
	// 	anchor.items = items;
	// 	return anchor;
	// }
}
