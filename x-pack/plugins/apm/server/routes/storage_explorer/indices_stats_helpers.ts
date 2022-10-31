/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { uniq, values, sumBy } from 'lodash';
import { IndicesStatsIndicesStats } from '@elastic/elasticsearch/lib/api/types';
import { Setup } from '../../lib/helpers/setup_request';
import { ApmPluginRequestHandlerContext } from '../typings';

export async function getTotalIndicesStats({
  context,
  setup,
}: {
  context: ApmPluginRequestHandlerContext;
  setup: Setup;
}) {
  const index = getApmIndicesCombined(setup);
  const esClient = (await context.core).elasticsearch.client;
  const totalStats = await esClient.asCurrentUser.indices.stats({ index });
  return totalStats;
}

export function getEstimatedSizeForDocumentsInIndex({
  allIndicesStats,
  indexName,
  numberOfDocs,
}: {
  allIndicesStats: Record<string, IndicesStatsIndicesStats>;
  indexName: string;
  numberOfDocs: number;
}) {
  const indexStats = allIndicesStats[indexName];
  const indexTotalSize = indexStats?.total?.store?.size_in_bytes ?? 0;
  const indexTotalDocCount = indexStats?.total?.docs?.count;

  const estimatedSize = indexTotalDocCount
    ? (numberOfDocs / indexTotalDocCount) * indexTotalSize
    : 0;

  return estimatedSize;
}

export async function getApmDiskSpacedUsedPct(
  context: ApmPluginRequestHandlerContext
) {
  const esClient = (await context.core).elasticsearch.client;
  const { nodes: diskSpacePerNode } = await esClient.asCurrentUser.nodes.stats({
    metric: 'fs',
    filter_path: 'nodes.*.fs.total.total_in_bytes',
  });

  const totalDiskSpace = sumBy(
    values(diskSpacePerNode),
    (node) => node?.fs?.total?.total_in_bytes ?? 0
  );

  return totalDiskSpace;
}

export async function getIndicesLifecycleStatus({
  context,
  setup,
}: {
  context: ApmPluginRequestHandlerContext;
  setup: Setup;
}) {
  const index = getApmIndicesCombined(setup);
  const esClient = (await context.core).elasticsearch.client;
  const { indices } = await esClient.asCurrentUser.ilm.explainLifecycle({
    index,
    filter_path: 'indices.*.phase',
  });

  return indices;
}

export async function getIndicesInfo({
  context,
  setup,
}: {
  context: ApmPluginRequestHandlerContext;
  setup: Setup;
}) {
  const index = getApmIndicesCombined(setup);
  const esClient = (await context.core).elasticsearch.client;
  const indicesInfo = await esClient.asCurrentUser.indices.get({
    index,
    filter_path: [
      '*.settings.index.number_of_shards',
      '*.settings.index.number_of_replicas',
      '*.data_stream',
    ],
    features: ['settings'],
  });

  return indicesInfo;
}

export function getApmIndicesCombined(setup: Setup) {
  const {
    indices: { transaction, span, metric, error },
  } = setup;

  return uniq([transaction, span, metric, error]).join();
}
