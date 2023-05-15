/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { RiskScoreEntity, RiskScoreFields } from '../../../../common/search_strategy';
import type { RiskSeverity } from '../../../../common/search_strategy';
import { DEFAULT_TABLE_ACTIVE_PAGE } from '../../../common/store/constants';

import type { HostsModel, Queries } from './model';
import { HostsTableType, HostsType } from './model';

export const generateSeverityFilter = (
  severitySelection: RiskSeverity[],
  entity: RiskScoreEntity
) =>
  severitySelection.length > 0
    ? [
        {
          query: {
            bool: {
              should: severitySelection.map((query) => ({
                match_phrase: {
                  [entity === RiskScoreEntity.user
                    ? RiskScoreFields.userRisk
                    : RiskScoreFields.hostRisk]: {
                    query,
                  },
                },
              })),
            },
          },
          meta: {
            alias: null,
            disabled: false,
            negate: false,
          },
        },
      ]
    : [];
