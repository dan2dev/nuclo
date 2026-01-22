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
};
export type BlockMetaDataResponseType = BlockMetaDataType & { isEnd?: true | undefined };

export type NucloAnchor = Comment & { nData?: BlockMetaDataResponseType; nItems?: Array<WeakRef<Node>> };
export type BlockMetaDataStrType = `${number}-${string}-END` | `${number}-${string}-START`;

// comments should be in the format of: {1|2|3|4}-{id}-{START|END}
// getAnchorData
export function getAnchorData(
	comment: (Comment | Node) & { nData?: BlockMetaDataResponseType },
): BlockMetaDataResponseType | undefined {
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
		isEnd,
	} satisfies BlockMetaDataResponseType;
	return comment.nData;
}

// createOpenAnchorComment
export function createOpenAnchorComment(metaData: BlockMetaDataType) {
	const comment = document.createComment(
		`${metaData.type}-${metaData.id || ""}-START` satisfies BlockMetaDataStrType,
	) as NucloAnchor;
	comment.nData = { ...metaData };
	return comment;
}

// createClosingAnchorComment
export function createClosingAnchorComment(metaData: BlockMetaDataType) {
	const comment = document.createComment(
		`${metaData.type}-${metaData.id || ""}-END` satisfies BlockMetaDataStrType,
	) as NucloAnchor;
	comment.nData = {
		...metaData,
		isEnd: true,
	} satisfies BlockMetaDataResponseType;
	return comment;
}

// fill anchors with nested nodes between start and end comments with same id
// if there is "internal" anchors, this will be consider a nested structure
// nested anchors will be processed recursively
// each node belongs to only one anchor - nested anchor's content nodes belong only to the nested anchor
export function fillAnchorItems(anchor: NucloAnchor) {
	const nData = getAnchorData(anchor);
	if (!nData || !nData.id) {
		return;
	}
	anchor.nItems = [];
	let currentNode = anchor.nextSibling;
	while (currentNode) {
		if (currentNode.nodeType === Node.COMMENT_NODE) {
			const currentData = getAnchorData(currentNode as NucloAnchor);

			// Check if this is the END comment for THIS anchor
			if (currentData && currentData.id === nData.id && currentData.isEnd) {
				// Found the matching END comment for this anchor - stop here
				break;
			}

			// Check if this is a START comment for a nested anchor
			if (currentData && currentData.id && !currentData.isEnd) {
				// Add the nested START comment to parent's items
				anchor.nItems.push(new WeakRef(currentNode));

				// Process the nested anchor recursively (this fills the nested anchor's own nItems)
				fillAnchorItems(currentNode as NucloAnchor);

				// Skip all content nodes inside the nested anchor (they belong only to the nested anchor)
				currentNode = currentNode.nextSibling;
				while (currentNode) {
					if (currentNode.nodeType === Node.COMMENT_NODE) {
						const checkData = getAnchorData(currentNode as NucloAnchor);
						// Found the END of the nested anchor
						if (checkData && checkData.id === currentData.id && checkData.isEnd) {
							// Add the nested END comment to parent's items
							anchor.nItems.push(new WeakRef(currentNode));
							currentNode = currentNode.nextSibling;
							break;
						}
					}
					// Skip this node - it belongs to the nested anchor, not the parent
					currentNode = currentNode.nextSibling;
				}
				continue;
			}
		}
		// Add regular nodes to the parent's items
		anchor.nItems.push(new WeakRef(currentNode));
		currentNode = currentNode.nextSibling;
	}
}

export function hydrate(el: HTMLHtmlElement) {
	for (const child of el.children) {
		if (child.nodeType === Node.COMMENT_NODE) {
			fillAnchorItems(child as unknown as Comment);
		}
	}
}
