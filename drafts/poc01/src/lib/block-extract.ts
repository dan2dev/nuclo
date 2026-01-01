function getBlockMetaData(nodeComment: Comment) {
	const commentNodeValues = String(nodeComment.nodeValue).split("-");
	commentNodeValues[2] === "start" ? commentNodeValues[2] : parseInt(commentNodeValues[2], 10);
	(nodeComment as any).metaData = {
		type: commentNodeValues[0],
		id: commentNodeValues[1],
		iter: commentNodeValues[2] === "start" ? commentNodeValues[2] : parseInt(commentNodeValues[2], 10),
	};
	return (nodeComment as any).metaData as {
		type: string;
		id: string;
		iter: "start" | number;
	};
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
