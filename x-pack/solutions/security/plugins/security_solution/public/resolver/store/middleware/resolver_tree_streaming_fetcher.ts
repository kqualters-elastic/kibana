/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Dispatch, MiddlewareAPI } from 'redux';
import type { Subscription } from 'rxjs';
import type {
  ResolverEntityIndex,
  NewResolverTree,
  ResolverSchema,
} from '../../../../common/endpoint/types';
import type { DataAccessLayer } from '../../types';
import * as selectors from '../selectors';
import { firstNonNullValue } from '../../../../common/endpoint/models/ecs_safety_helpers';
import { ancestorsRequestAmount, descendantsRequestAmount } from '../../models/resolver_tree';

import {
  appRequestedResolverData,
  serverFailedToReturnResolverData,
  appAbortedResolverDataRequest,
  serverStreamingTreeProgress,
  serverStreamingTreeComplete,
} from '../data/action';
import type { State } from '../../../common/store/types';

/**
 * A function that handles syncing ResolverTree data w/ the current entity ID using streaming.
 * This will make a streaming request anytime the entityID changes (to something other than undefined.)
 * If the entity ID changes while a request is in progress, the in-progress request will be cancelled.
 * Call the returned function after each state transition.
 * This is a factory because it is stateful and keeps that state in closure.
 */
export function ResolverTreeStreamingFetcher(
  dataAccessLayer: DataAccessLayer,
  api: MiddlewareAPI<Dispatch, State>
): (id: string) => void {
  let lastSubscription: Subscription | undefined;
  // Call this after each state change.
  // This fetches the ResolverTree for the current entityID using streaming
  return (id: string) => {
    const state = api.getState();
    let databaseParameters = selectors.treeParametersToFetch(state.analyzer[id]);
    if (selectors.treeRequestParametersToAbort(state.analyzer[id]) && lastSubscription) {
      lastSubscription.unsubscribe();
      lastSubscription = undefined;
    } else if (databaseParameters !== null) {
      let entityIDToFetch: string | undefined;
      let dataSource: string | undefined;
      let dataSourceSchema: ResolverSchema | undefined;
      let dataSourceAgentId: string | undefined;
      const timeRangeFilters = selectors.timeRangeFilters(state.analyzer[id]);
      // Inform the state that we've made the request. Without this, the middleware will try to make the request again
      // immediately.
      api.dispatch(appRequestedResolverData({ id, parameters: databaseParameters }));

      const processStream = async () => {
        if (databaseParameters === null) {
          return;
        }
        try {
          const matchingEntities: ResolverEntityIndex = await dataAccessLayer.entities({
            _id: databaseParameters.databaseDocumentID,
            indices: databaseParameters.indices,
            signal: new AbortController().signal,
          });

          if (matchingEntities.length < 1) {
            api.dispatch(
              serverFailedToReturnResolverData({
                id,
                parameters: databaseParameters,
              })
            );
            return;
          }
          ({
            id: entityIDToFetch,
            schema: dataSourceSchema,
            name: dataSource,
            agentId: dataSourceAgentId,
          } = matchingEntities[0]);

          databaseParameters = {
            ...databaseParameters,
            agentId: dataSourceAgentId ?? '',
          };

          const stream$ = dataAccessLayer.resolverTreeStream({
            dataId: entityIDToFetch,
            schema: dataSourceSchema,
            timeRange: timeRangeFilters,
            indices: databaseParameters.indices,
            ancestors: ancestorsRequestAmount(dataSourceSchema),
            descendants: descendantsRequestAmount(),
            agentId: databaseParameters.agentId,
          });

          lastSubscription = stream$.subscribe({
            next: (event) => {
              if (event.type === 'tree_progress') {
                api.dispatch(
                  serverStreamingTreeProgress({
                    id,
                    nodes: event.data.nodes,
                    phase: event.data.phase,
                    progress: event.data.progress,
                  })
                );
              } else if (event.type === 'tree_complete') {
                const result = event.data.result;
                const nodes = Array.isArray(result) ? result : result.statsNodes;
                const resolverTree: NewResolverTree = {
                  originID: event.data.originID,
                  nodes,
                };

                if (resolverTree.nodes.length === 0) {
                  api.dispatch(
                    serverStreamingTreeComplete({
                      id,
                      result: resolverTree,
                      dataSource: dataSource ?? '',
                      schema: dataSourceSchema,
                      parameters: databaseParameters,
                    })
                  );
                } else {
                  const timestamps = resolverTree.nodes
                    .map((node) => firstNonNullValue(node.data['@timestamp']))
                    .filter((ts): ts is string | number => ts !== undefined)
                    .sort();
                  const detectedBounds =
                    timestamps.length > 0
                      ? {
                          from: String(timestamps[0]),
                          to: String(timestamps[timestamps.length - 1]),
                        }
                      : undefined;

                  api.dispatch(
                    serverStreamingTreeComplete({
                      id,
                      result: resolverTree,
                      dataSource,
                      schema: dataSourceSchema,
                      parameters: databaseParameters,
                      detectedBounds,
                    })
                  );
                }
              } else if (event.type === 'tree_error') {
                api.dispatch(
                  serverFailedToReturnResolverData({
                    id,
                    parameters: databaseParameters,
                  })
                );
              }
            },
            error: (error) => {
              if (error.name === 'AbortError' || error.name === 'DOMException') {
                api.dispatch(
                  appAbortedResolverDataRequest({
                    id,
                    parameters: databaseParameters,
                  })
                );
              } else {
                api.dispatch(
                  serverFailedToReturnResolverData({
                    id,
                    parameters: databaseParameters,
                  })
                );
              }
            },
            complete: () => {
              lastSubscription = undefined;
            },
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            api.dispatch(
              appAbortedResolverDataRequest({
                id,
                parameters: databaseParameters,
              })
            );
          } else {
            api.dispatch(
              serverFailedToReturnResolverData({
                id,
                parameters: databaseParameters,
              })
            );
          }
        }
      };

      void processStream();
    }
  };
}
