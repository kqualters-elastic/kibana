/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { firstValueFrom } from 'rxjs';
import type { RequestHandler } from '@kbn/core/server';
import type { TypeOf } from '@kbn/config-schema';
import type { RuleRegistryPluginStartContract } from '@kbn/rule-registry-plugin/server';
import type { LicensingPluginStart } from '@kbn/licensing-plugin/server';
import type { Logger } from '@kbn/logging';
import { observableIntoEventSourceStream } from '@kbn/sse-utils-server';
import { EXCLUDE_COLD_AND_FROZEN_TIERS_IN_ANALYZER } from '../../../../../common/constants';

import type { validateTree } from '../../../../../common/endpoint/schema/resolver';
import { featureUsageService } from '../../../services/feature_usage';
import { StreamingFetcher } from './utils/streaming_fetch';

export function handleTreeStreaming(
  getRuleRegistry: () => Promise<RuleRegistryPluginStartContract>,
  getLicensing: () => Promise<LicensingPluginStart>,
  logger: Logger
): RequestHandler<unknown, unknown, TypeOf<typeof validateTree.body>> {
  return async (context, req, res) => {
    const abortController = new AbortController();
    req.events.aborted$.subscribe(() => {
      abortController.abort();
    });
    console.log('handleTreeStreaming', req.body);
    const client = (await context.core).elasticsearch.client;
    const licensing = await getLicensing();
    const license = await firstValueFrom(licensing.license$);
    const hasAccessToInsightsRelatedByProcessAncestry = license.hasAtLeast('platinum');
    const shouldExcludeColdAndFrozenTiers = await (
      await context.core
    ).uiSettings.client.get<boolean>(EXCLUDE_COLD_AND_FROZEN_TIERS_IN_ANALYZER);

    if (hasAccessToInsightsRelatedByProcessAncestry) {
      featureUsageService.notifyUsage('ALERTS_BY_PROCESS_ANCESTRY');
    }

    const alertsClient = hasAccessToInsightsRelatedByProcessAncestry
      ? await (await getRuleRegistry()).getRacClientWithRequest(req)
      : undefined;
    const fetcher = new StreamingFetcher(client, alertsClient);
    console.log('fetcher created');
    const stream$ = fetcher.streamTree({ ...req.body, shouldExcludeColdAndFrozenTiers }, false);

    console.log('stream$ created');
    return res.ok({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'X-Accel-Buffering': 'no',
      },
      body: observableIntoEventSourceStream(stream$, {
        signal: abortController.signal,
        logger,
        flushThrottleMs: 100,
      }),
    });
  };
}
