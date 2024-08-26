/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { orderByTime } from '../process_event';
import type { IndexedProcessTree } from '../../types';
import type { ResolverNode } from '../../../../common/endpoint/types';
import {
  levelOrder as baseLevelOrder,
  calculateGenerationsAndDescendants,
} from '../../lib/tree_sequencers';
import * as nodeModel from '../../../../common/endpoint/models/node';

function calculateGenerationsAndDescendantsFromOrigin(
  origin: ResolverNode | undefined,
  descendants: Map<string | undefined, ResolverNode[]>
): { generations: number; descendants: number } | undefined {
  if (!origin) {
    return;
  }

  return calculateGenerationsAndDescendants({
    node: origin,
    currentLevel: 0,
    totalDescendants: 0,
    children: (parentNode: ResolverNode): ResolverNode[] =>
      descendants.get(nodeModel.nodeID(parentNode)) ?? [],
  });
}

function parentInternal(node: ResolverNode, idToNode: Map<string, ResolverNode>) {
  const uniqueParentId = nodeModel.parentId(node);
  if (uniqueParentId === undefined) {
    return undefined;
  } else {
    return idToNode.get(uniqueParentId);
  }
}

/**
 * Returns the number of ancestors nodes (including the origin) in the graph.
 */
function countAncestors(
  originID: string | undefined,
  idToNode: Map<string, ResolverNode>
): number | undefined {
  if (!originID) {
    return;
  }

  // include the origin
  let total = 1;
  let current: ResolverNode | undefined = idToNode.get(originID);
  while (current !== undefined && parentInternal(current, idToNode) !== undefined) {
    total++;
    current = parentInternal(current, idToNode);
  }
  return total;
}

/**
 * Create a new IndexedProcessTree from an array of ProcessEvents.
 * siblings will be ordered by timestamp
 */
export function factory(
  // Array of processes to index as a tree
  nodes: ResolverNode[],
  originID: string | undefined
): IndexedProcessTree {
  const idToChildren = new Map<string | undefined, ResolverNode[]>();
  const idToValue = new Map<string, ResolverNode>();

  for (const node of nodes) {
    const nodeID: string | undefined = nodeModel.nodeID(node);
    if (nodeID !== undefined) {
      idToValue.set(nodeID, node);

      const uniqueParentId: string | undefined = nodeModel.parentId(node);

      let childrenWithTheSameParent = idToChildren.get(uniqueParentId);
      if (!childrenWithTheSameParent) {
        childrenWithTheSameParent = [];
        idToChildren.set(uniqueParentId, childrenWithTheSameParent);
      }
      childrenWithTheSameParent.push(node);
    }
  }

  // sort the children of each node
  for (const siblings of idToChildren.values()) {
    siblings.sort(orderByTime);
  }

  let generations: number | undefined;
  let descendants: number | undefined;
  if (originID) {
    const originNode = idToValue.get(originID);
    const treeGenerationsAndDescendants = calculateGenerationsAndDescendantsFromOrigin(
      originNode,
      idToChildren
    );
    generations = treeGenerationsAndDescendants?.generations;
    descendants = treeGenerationsAndDescendants?.descendants;
  }

  const ancestors = countAncestors(originID, idToValue);

  return {
    idToChildren,
    idToNode: idToValue,
    originID,
    generations,
    descendants,
    ancestors,
  };
}

/**
 * Merge a second process tree into the current tree
 */
export function mergeTree(
  baseTree: IndexedProcessTree,
  newTree: IndexedProcessTree,
  attachmentNodeId: string
): IndexedProcessTree {
  const mergedTree: IndexedProcessTree = {
    idToChildren: new Map(baseTree.idToChildren),
    idToNode: new Map(baseTree.idToNode),
    originID: baseTree.originID,
    generations: baseTree.generations,
    descendants: baseTree.descendants,
    ancestors: baseTree.ancestors,
  };
  const rootId = root(newTree)?.id;

  // Merge idToChildren
  // eslint-disable-next-line @typescript-eslint/no-shadow
  for (const [parentId, children] of newTree.idToChildren) {
    const existingChildren = mergedTree.idToChildren.get(parentId) || [];
    const newChildren = [...new Set([...existingChildren, ...children].map((node) => node.id))]
      .map(
        (id) =>
          existingChildren.find((node) => node.id === id) || children.find((node) => node.id === id)
      )
      .filter((node) => node !== undefined) as ResolverNode[];
    mergedTree.idToChildren.set(parentId, newChildren);
  }

  // Merge idToNode
  for (const [nodeId, node] of newTree.idToNode) {
    mergedTree.idToNode.set(nodeId, node);
  }
  if (rootId) {
    // Connect the new tree to the attachment point
    const attachmentNode = mergedTree.idToNode.get(String(rootId));
    if (attachmentNode) {
      // Create a new node with updated parent instead of modifying the existing one
      const updatedNewRootNode = {
        ...attachmentNode,
        parent: attachmentNodeId,
      };

      // Update the node in the idToNode map
      mergedTree.idToNode.set(String(rootId), updatedNewRootNode);

      // Add the updated new root as a child of the attachment node
      const attachmentChildren = mergedTree.idToChildren.get(attachmentNodeId) || [];
      const newAttachmentChildren = [...attachmentChildren, updatedNewRootNode];
      mergedTree.idToChildren.set(attachmentNodeId, newAttachmentChildren);
    }
  }

  // Recalculate generations, descendants, and ancestors
  const recalculatedTree = factory(Array.from(mergedTree.idToNode.values()), mergedTree.originID);
  mergedTree.generations = recalculatedTree.generations;
  mergedTree.descendants = recalculatedTree.descendants;
  mergedTree.ancestors = recalculatedTree.ancestors;

  return mergedTree;
}

/**
 * Returns an array with any children `ProcessEvent`s of the passed in `process`
 */
export function children(tree: IndexedProcessTree, parentID: string | undefined): ResolverNode[] {
  const currentSiblings = tree.idToChildren.get(parentID);
  return currentSiblings === undefined ? [] : currentSiblings;
}

/**
 * Get the indexed process event for the ID
 */
export function treeNode(tree: IndexedProcessTree, entityID: string): ResolverNode | null {
  return tree.idToNode.get(entityID) ?? null;
}

/**
 * Returns the parent ProcessEvent, if any, for the passed in `childProcess`
 */
export function parent(
  tree: IndexedProcessTree,
  childNode: ResolverNode
): ResolverNode | undefined {
  return parentInternal(childNode, tree.idToNode);
}

/**
 * Number of processes in the tree
 */
export function size(tree: IndexedProcessTree) {
  return tree.idToNode.size;
}

/**
 * Return the root process
 */
export function root(tree: IndexedProcessTree) {
  if (size(tree) === 0) {
    return null;
  }
  // any node will do
  let current: ResolverNode = tree.idToNode.values().next().value;

  // iteratively swap current w/ its parent
  while (parent(tree, current) !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    current = parent(tree, current)!;
  }
  return current;
}

/**
 * Yield processes in level order
 */
export function* levelOrder(tree: IndexedProcessTree) {
  const rootNode = root(tree);
  if (rootNode !== null) {
    yield* baseLevelOrder(rootNode, (parentNode: ResolverNode): ResolverNode[] =>
      children(tree, nodeModel.nodeID(parentNode))
    );
  }
}
