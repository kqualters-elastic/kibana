/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Client } from '@elastic/elasticsearch';
import type { AxiosResponse } from 'axios';
import type { DeleteByQueryResponse } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import type { KbnClient } from '@kbn/test';
import type { Agent, FleetServerAgent, GetOneAgentResponse } from '@kbn/fleet-plugin/common';
import { AGENT_API_ROUTES, API_VERSIONS } from '@kbn/fleet-plugin/common';
import type { HostMetadata } from '../types';
import { FleetAgentGenerator } from '../data_generators/fleet_agent_generator';
import { wrapErrorAndRejectPromise } from './utils';

const defaultFleetAgentGenerator = new FleetAgentGenerator();

export interface IndexedFleetAgentResponse {
  agents: Array<Agent & FleetServerAgent>;
  fleetAgentsIndex: string;
}

/**
 * Indexes a Fleet Agent
 * (NOTE: ensure that fleet is setup first before calling this loading function)
 *
 * @param esClient
 * @param kbnClient
 * @param endpointHost
 * @param agentPolicyId
 * @param [kibanaVersion]
 * @param [fleetAgentGenerator]
 */
export const indexFleetAgentForHost = async (
  esClient: Client,
  kbnClient: KbnClient,
  endpointHost: HostMetadata,
  agentPolicyId: string,
  kibanaVersion: string = '8.0.0',
  fleetAgentGenerator: FleetAgentGenerator = defaultFleetAgentGenerator
): Promise<IndexedFleetAgentResponse> => {
  const agentDoc = fleetAgentGenerator.generateEsHit({
    _id: endpointHost.agent.id,
    _source: {
      agent: {
        id: endpointHost.agent.id,
        version: endpointHost.agent.version,
      },
      local_metadata: {
        elastic: {
          agent: {
            id: endpointHost.agent.id,
            version: kibanaVersion,
          },
        },
        host: {
          ...endpointHost.host,
        },
        os: {
          ...endpointHost.host.os,
        },
      },
      policy_id: agentPolicyId,
    },
  });

  const createdFleetAgent = await esClient
    .index<FleetServerAgent>({
      index: agentDoc._index,
      id: agentDoc._id,
      body: agentDoc._source,
      op_type: 'create',
      refresh: 'wait_for',
    })
    .catch(wrapErrorAndRejectPromise);

  return {
    fleetAgentsIndex: agentDoc._index,
    agents: [
      await fetchFleetAgent(kbnClient, createdFleetAgent._id).catch(wrapErrorAndRejectPromise),
    ],
  };
};

const fetchFleetAgent = async (kbnClient: KbnClient, agentId: string): Promise<Agent> => {
  return (
    (await kbnClient
      .request({
        path: AGENT_API_ROUTES.INFO_PATTERN.replace('{agentId}', agentId),
        method: 'GET',
        headers: { 'elastic-api-version': API_VERSIONS.public.v1 },
      })
      .catch(wrapErrorAndRejectPromise)) as AxiosResponse<GetOneAgentResponse>
  ).data.item;
};

export interface DeleteIndexedFleetAgentsResponse {
  agents: DeleteByQueryResponse | undefined;
}

export const deleteIndexedFleetAgents = async (
  esClient: Client,
  indexedData: IndexedFleetAgentResponse
): Promise<DeleteIndexedFleetAgentsResponse> => {
  const response: DeleteIndexedFleetAgentsResponse = {
    agents: undefined,
  };

  if (indexedData.agents.length) {
    response.agents = await esClient
      .deleteByQuery({
        index: `${indexedData.fleetAgentsIndex}-*`,
        wait_for_completion: true,
        body: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    'local_metadata.elastic.agent.id': indexedData.agents.map(
                      (agent) => agent.local_metadata.elastic.agent.id
                    ),
                  },
                },
              ],
            },
          },
        },
      })
      .catch(wrapErrorAndRejectPromise);
  }

  return response;
};
