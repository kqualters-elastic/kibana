/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { set } from '@kbn/safer-lodash-set/fp';
import { get } from 'lodash/fp';
import {
  Direction,
  FlowTarget,
  NetworkDnsFields,
  NetworkTopTablesFields,
  NetworkTlsFields,
  NetworkUsersFields,
} from '../../../../common/search_strategy';
import { DEFAULT_TABLE_ACTIVE_PAGE, DEFAULT_TABLE_LIMIT } from '../../../common/store/constants';

import {
  setNetworkDetailsTablesActivePageToZero,
  setNetworkTablesActivePageToZero,
  updateNetworkTable,
  updateNetworkAnomaliesJobIdFilter,
  updateNetworkAnomaliesInterval,
} from './actions';
import type { NetworkModel } from './model';
import { NetworkType, NetworkDetailsTableType, NetworkTableType } from './model';

export type NetworkState = NetworkModel;

export const initialNetworkState: NetworkState = {
  page: {
    queries: {
      [NetworkTableType.topNFlowSource]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_out,
          direction: Direction.desc,
        },
      },
      [NetworkTableType.topNFlowDestination]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_in,
          direction: Direction.desc,
        },
      },
      [NetworkTableType.dns]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkDnsFields.uniqueDomains,
          direction: Direction.desc,
        },
        isPtrIncluded: false,
      },
      [NetworkTableType.http]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          direction: Direction.desc,
        },
      },
      [NetworkTableType.tls]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTlsFields._id,
          direction: Direction.desc,
        },
      },
      [NetworkTableType.topCountriesSource]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_out,
          direction: Direction.desc,
        },
      },
      [NetworkTableType.topCountriesDestination]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_in,
          direction: Direction.desc,
        },
      },
      [NetworkTableType.alerts]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [NetworkTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
    },
  },
  details: {
    queries: {
      [NetworkDetailsTableType.http]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.topCountriesSource]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_out,
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.topCountriesDestination]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_in,
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.topNFlowSource]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_out,
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.topNFlowDestination]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTopTablesFields.bytes_in,
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.tls]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkTlsFields._id,
          direction: Direction.desc,
        },
      },
      [NetworkDetailsTableType.users]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: NetworkUsersFields.name,
          direction: Direction.asc,
        },
      },
      [NetworkDetailsTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
    },
    flowTarget: FlowTarget.source,
  },
};

export const networkReducer = createReducer(initialNetworkState, (builder) =>
  builder
    .addCase(updateNetworkTable, (state, { payload: { networkType, tableType, updates } }) => {
      state[networkType].queries[tableType] = {
        ...state[networkType].queries[tableType],
        ...updates,
      };
    })
    .addCase(setNetworkTablesActivePageToZero, (state) => {
      state.page.queries[NetworkTableType.topCountriesSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.topCountriesDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.topNFlowSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.topNFlowDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.dns].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.tls].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[NetworkTableType.http].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topCountriesSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topCountriesDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topNFlowSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topNFlowDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.tls].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.http].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(setNetworkDetailsTablesActivePageToZero, (state) => {
      state.details.queries[NetworkTableType.topCountriesSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topCountriesDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topNFlowSource].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.topNFlowDestination].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.tls].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[NetworkTableType.http].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(updateNetworkAnomaliesJobIdFilter, (state, { payload: { jobIds, networkType } }) => {
      if (networkType === NetworkType.page) {
        state.page.queries[NetworkTableType.anomalies].jobIdSelection = jobIds;
      } else {
        state.details.queries[NetworkTableType.anomalies].jobIdSelection = jobIds;
      }
    })
    .addCase(updateNetworkAnomaliesInterval, (state, { payload: { interval, networkType } }) => {
      if (networkType === NetworkType.page) {
        state.page.queries[NetworkTableType.anomalies].intervalSelection = interval;
      } else {
        state.details.queries[NetworkTableType.anomalies].intervalSelection = interval;
      }
    })
);
