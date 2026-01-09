


// block extract will get a parent and a index and will return an array of nodes that are managed by that block
// this will be used to extract the nodes managed by a block (like a list or a when) for hydration and diffing purposes
// type ParentAnchorItemType = Comment & { nData: BlockMetaDataType; nItems: Array<WeakRef<Node>> };
// function hidrateAnchor(parent: HTMLElement & { nTempAnchorLifo: Anchor[] }, node: Anchor): void {

import type { NucloAnchor } from "./nuclo-data";


// }
export function extractBlock(
  parent: HTMLElement & { nAnchors: NucloAnchor[] },
  index: number,
) {
  // const nData = getAnchorData(parent.childNodes[index]);
  // if (!nData) {
  //   return parent.childNodes[index] || null;
  // }

  // // // text
  // // if (nData.type === BlockTypeEnum.TEXT) {
  // // 	const text = parent.childNodes[index].nextSibling;
  // // 	if (!text || text.nodeType !== Node.TEXT_NODE) {
  // // 		return null;
  // // 	}
  // // 	return parent.childNodes[index].nextSibling;
  // // }

  // // list
  // // if (nData.type === BlockTypeEnum.LIST) {
  // parent.nAnchors = [parent.childNodes[index] as ParentAnchorItemType] as ParentAnchorItemType[];
  // let itemIndex = index + 1;
  // // get items
  // while (itemIndex < parent.childNodes.length) {
  //   const child = parent.childNodes[itemIndex];
  //   if (child.nodeType === Node.COMMENT_NODE) {
  //     const nData = getNData(child);
  //     if (nData?.isEnd) {
  //       break;
  //     }
  //   }

  //   if (child.nodeType === Node.ELEMENT_NODE) {
  //     anchors[anchors.length - 1].nItems.push(new WeakRef(child));
  //   } else if (child.nodeType === Node.COMMENT_NODE) {
  //     const childData = getNData(child);
  //     // if (childData && childData.type === BlockTypeEnum.LIST && childData.id === nData.id) {
  //     // 	anchor.nItems.push(new WeakRef(child));
  //     // } else {
  //     // 	break;
  //     // }
  //   }
  //   itemIndex += 1;
  // }
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
