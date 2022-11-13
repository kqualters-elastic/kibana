/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { noop } from 'lodash/fp';
import deepEqual from 'fast-deep-equal';
import { isCompleteResponse, isErrorResponse } from '@kbn/data-plugin/public';

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { Subscription } from 'rxjs';

import { useHttp, useKibana } from '../../../../lib/kibana';
import { convertKueryToElasticSearchQuery } from '../../../../lib/kuery';
import { useAppToasts } from '../../../../hooks/use_app_toasts';
import { useSourcererDataView } from '../../../../containers/sourcerer';
import type { inputsModel } from '../../../../store';
import type { ESQuery } from '../../../../../../common/typed_json';

import { useTimelineDataFilters } from '../../../../../timelines/containers/use_timeline_data_filters';
import { getDataProvider } from '../../../event_details/table/use_action_cell_data_provider';
import { getEnrichedFieldInfo } from '../../../event_details/helpers';
import type {
  QueryOperator,
  QueryMatch,
  DataProvider,
  DataProvidersAnd,
} from '@kbn/timelines-plugin/common';
import { DataProviderType } from '@kbn/timelines-plugin/common';
import { IS_OPERATOR } from '../../../../../timelines/components/timeline/data_providers/data_provider';
import {
  TimelineEventsQueries,
  TimelineRequestOptionsPaginated,
  TimelineEventsDetailsItem,
} from '../../../../../../common/search_strategy';

export const useInsightDataProviders = ({
  providers,
  scopeId,
  alertData,
  alertId,
}: {
  providers: { [field: string]: { value: string; type: 'parameter' | 'value' } };
  alertData: TimelineEventsDetailsItem[];
}): { dataProviders: DataProvider[] } => {
  function getFieldValue(fields: TimelineEventsDetailsItem[], fieldToFind: string) {
    const alertField = fields.find((dataField) => dataField.field === fieldToFind);
    return alertField?.values ? alertField.values[0] : '*';
  }
  const dataProviders = useMemo(() => {
    if (alertData) {
      return Object.entries(providers).map(([field, { value, type }]) => {
        return {
          and: [],
          enabled: true,
          id: JSON.stringify(field + value + type),
          name: field,
          excluded: false,
          kqlQuery: '',
          type: DataProviderType.default,
          queryMatch: {
            field,
            value: type === 'parameter' ? getFieldValue(alertData, value) : value,
            operator: IS_OPERATOR as QueryOperator,
          },
        };
      });
    } else {
      return Object.entries(providers).map(([field, { value, type }]) => {
        return {
          and: [],
          enabled: true,
          id: JSON.stringify(field + value + type),
          name: field,
          excluded: false,
          kqlQuery: '',
          type: type === 'parameter' ? DataProviderType.template : DataProviderType.default,
          queryMatch: {
            field,
            value: type === 'parameter' ? `{${value}}` : value,
            operator: IS_OPERATOR as QueryOperator,
          },
        };
      });
    }
  }, [alertData, providers]);
  return { dataProviders };
};
