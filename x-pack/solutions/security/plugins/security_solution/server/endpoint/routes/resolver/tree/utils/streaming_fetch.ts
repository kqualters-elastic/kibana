/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { from, merge, of, catchError, map, mergeMap, Observable } from 'rxjs';
import type { IScopedClusterClient } from '@kbn/core/server';
import type { AlertsClient } from '@kbn/rule-registry-plugin/server';
import type { ServerSentEvent } from '@kbn/sse-utils/src/events';
import type { ResolverNode, FieldsObject } from '../../../../../../common/endpoint/types';
import { DescendantsQuery } from '../queries/descendants';
import type { NodeID } from '.';
import { LifecycleQuery } from '../queries/lifecycle';
import { StatsQuery } from '../queries/stats';
import {
  Fetcher,
  getIDField,
  getParentField,
  getNameField,
  getLeafNodes,
  type TreeOptions,
} from './fetch';

export interface TreeStreamProgress {
  phase: 'ancestors' | 'descendants' | 'stats' | 'complete';
  nodes: ResolverNode[];
  progress: {
    ancestors: { current: number; total: number };
    descendants: { current: number; total: number };
    total: number;
  };
}

export interface TreeStreamComplete {
  result: ResolverNode[] | { alertIds: string[] | undefined; statsNodes: ResolverNode[] };
  originID: string;
}

export type TreeStreamEvent = ServerSentEvent &
  (
    | { type: 'tree_progress'; data: TreeStreamProgress }
    | { type: 'tree_complete'; data: TreeStreamComplete }
    | { type: 'tree_error'; data: { error: string } }
  );

/**
 * Handles retrieving nodes of a resolver tree with streaming support.
 */
export class StreamingFetcher {
  private alertsClient?: AlertsClient;

  constructor(private readonly client: IScopedClusterClient, alertsClient?: AlertsClient) {
    this.alertsClient = alertsClient;
  }

  /**
   * Streams the resolver tree, emitting incremental updates as nodes are discovered.
   */
  public streamTree(
    options: TreeOptions,
    isInternalRequest: boolean = false
  ): Observable<TreeStreamEvent> {
    try {
      const ancestors$ = this.streamAncestors(options, isInternalRequest);
      const descendants$ = this.streamDescendants(options, isInternalRequest);
      console.log('ancestors$');
      console.log('descendants$');
      const state = {
        allNodes: [] as FieldsObject[],
        ancestorsCount: 0,
        descendantsCount: 0,
        ancestorsComplete: false,
        descendantsComplete: false,
        completeEmitted: false,
      };

      const progressEvents$ = merge(
        ancestors$.pipe(
          map((nodes) => {
            state.allNodes.push(...nodes);
            state.ancestorsCount += nodes.length;
            if (state.ancestorsCount >= options.ancestors || nodes.length === 0) {
              state.ancestorsComplete = true;
            }
            return {
              phase: 'ancestors' as const,
              nodes: this.formatNodes(nodes, options),
            };
          })
        ),
        descendants$.pipe(
          map((nodes) => {
            state.allNodes.push(...nodes);
            state.descendantsCount += nodes.length;
            if (state.descendantsCount >= options.descendants || nodes.length === 0) {
              state.descendantsComplete = true;
            }
            return {
              phase: 'descendants' as const,
              nodes: this.formatNodes(nodes, options),
            };
          })
        )
      ).pipe(
        map(({ phase, nodes }) => {
          const shouldComplete =
            state.ancestorsComplete && state.descendantsComplete && !state.completeEmitted;

          return {
            type: 'tree_progress' as const,
            data: {
              phase,
              nodes,
              progress: {
                ancestors: {
                  current: state.ancestorsCount,
                  total: options.ancestors,
                },
                descendants: {
                  current: state.descendantsCount,
                  total: options.descendants,
                },
                total: state.ancestorsCount + state.descendantsCount,
              },
            },
            shouldComplete,
          };
        })
      );
      console.log('progressEvents$');
      return progressEvents$.pipe(
        mergeMap(async (event) => {
          const events: TreeStreamEvent[] = [
            {
              type: event.type,
              data: event.data,
            },
          ];

          if (event.shouldComplete && !state.completeEmitted) {
            state.completeEmitted = true;
            const formattedResponse = await this.formatResponse(
              state.allNodes,
              options,
              isInternalRequest
            );
            const originID = options.nodes[0]?.toString() || '';

            events.push({
              type: 'tree_complete' as const,
              data: {
                result: formattedResponse,
                originID,
              },
            });
          }

          return from(events);
        }),
        mergeMap((events) => events),
        catchError((error) => {
          return of({
            type: 'tree_error' as const,
            data: { error: error.message || String(error) },
          });
        })
      );
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }

  private streamAncestors(
    options: TreeOptions,
    isInternalRequest: boolean
  ): Observable<FieldsObject[]> {
    const query = new LifecycleQuery({
      schema: options.schema,
      indexPatterns: options.indexPatterns,
      timeRange: options.timeRange,
      isInternalRequest,
      shouldExcludeColdAndFrozenTiers: !!options.shouldExcludeColdAndFrozenTiers,
      agentId: options.agentId,
    });

    const client = this.client;
    return new Observable<FieldsObject[]>((subscriber) => {
      const processBatch = async () => {
        let nodes = options.nodes;
        let numLevelsLeft = options.ancestors;

        try {
          while (numLevelsLeft > 0) {
            const batch: FieldsObject[] = await query.search(client, nodes);

            if (batch.length <= 0) {
              subscriber.complete();
              return;
            }

            subscriber.next(batch);
            numLevelsLeft -= batch.length;
            nodes = Fetcher.getNextAncestorsToFind(batch, options.schema, numLevelsLeft);
          }
          subscriber.complete();
        } catch (error) {
          console.error('streamAncestors error', error);
          subscriber.error(error);
        }
      };

      void processBatch();
    });
  }

  private streamDescendants(
    options: TreeOptions,
    isInternalRequest: boolean
  ): Observable<FieldsObject[]> {
    const query = new DescendantsQuery({
      schema: options.schema,
      indexPatterns: options.indexPatterns,
      timeRange: options.timeRange,
      isInternalRequest,
      shouldExcludeColdAndFrozenTiers: !!options.shouldExcludeColdAndFrozenTiers,
      agentId: options.agentId,
    });

    const client = this.client;
    return new Observable<FieldsObject[]>((subscriber) => {
      const processBatch = async () => {
        let nodes: NodeID[] = options.nodes;
        let numNodesLeftToRequest: number = options.descendants;
        let levelsLeftToRequest: number = options.descendantLevels;
        console.log('processBatch', nodes, numNodesLeftToRequest, levelsLeftToRequest);
        try {
          while (
            numNodesLeftToRequest > 0 &&
            (options.schema.ancestry !== undefined || levelsLeftToRequest > 0)
          ) {
            const batch: FieldsObject[] = await query.search(client, nodes, numNodesLeftToRequest);

            if (batch.length <= 0) {
              subscriber.complete();
              return;
            }

            subscriber.next(batch);
            nodes = getLeafNodes(batch, nodes, options.schema);
            numNodesLeftToRequest -= batch.length;
            levelsLeftToRequest -= 1;
          }
          subscriber.complete();
        } catch (error) {
          console.error('streamDescendants error', error);
          subscriber.error(error);
        }
      };

      void processBatch();
    });
  }

  private formatNodes(nodes: FieldsObject[], options: TreeOptions): ResolverNode[] {
    return nodes
      .map((node) => {
        const id = getIDField(node, options.schema);
        const parent = getParentField(node, options.schema);
        const name = getNameField(node, options.schema);

        if (id !== undefined) {
          return {
            id,
            parent,
            name,
            data: node,
            stats: { total: 0, byCategory: {} },
          } as ResolverNode;
        }
        return null;
      })
      .filter((node): node is ResolverNode => node !== null);
  }

  private async formatResponse(
    treeNodes: FieldsObject[],
    options: TreeOptions,
    isInternalRequest: boolean
  ): Promise<ResolverNode[] | { alertIds: string[] | undefined; statsNodes: ResolverNode[] }> {
    const statsIDs: NodeID[] = [];
    for (const node of treeNodes) {
      const id = getIDField(node, options.schema);
      if (id) {
        statsIDs.push(id);
      }
    }

    const query = new StatsQuery({
      indexPatterns: options.indexPatterns,
      schema: options.schema,
      timeRange: options.timeRange,
      isInternalRequest,
      agentId: options.agentId,
    });

    const { eventStats, alertIds } = await query.search(
      this.client,
      statsIDs,
      this.alertsClient,
      options.includeHits ?? false
    );

    const statsNodes: ResolverNode[] = [];
    for (const node of treeNodes) {
      const id = getIDField(node, options.schema);
      const parent = getParentField(node, options.schema);
      const name = getNameField(node, options.schema);

      if (id !== undefined) {
        const stats = (eventStats && eventStats[id]) ?? { total: 0, byCategory: {} };
        statsNodes.push({
          id,
          parent,
          name,
          data: node,
          stats,
        });
      }
    }

    if (options.includeHits) {
      return { alertIds, statsNodes };
    } else {
      return statsNodes;
    }
  }
}
