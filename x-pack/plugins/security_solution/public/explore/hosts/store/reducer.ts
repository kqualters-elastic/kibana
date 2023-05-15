/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createReducer } from '@reduxjs/toolkit';
import { Direction, HostsFields, RiskScoreFields } from '../../../../common/search_strategy';

import { DEFAULT_TABLE_ACTIVE_PAGE, DEFAULT_TABLE_LIMIT } from '../../../common/store/constants';

import {
  setHostDetailsTablesActivePageToZero,
  setHostTablesActivePageToZero,
  updateHostsSort,
  updateHostRiskScoreSeverityFilter,
  updateHostRiskScoreSort,
  updateTableActivePage,
  updateTableLimit,
  updateHostsAnomaliesJobIdFilter,
  updateHostsAnomaliesInterval,
} from './actions';
import type { HostsModel } from './model';
import { HostsTableType } from './model';

export type HostsState = HostsModel;

export const initialHostsState: HostsState = {
  page: {
    queries: {
      [HostsTableType.authentications]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.hosts]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        direction: Direction.desc,
        sortField: HostsFields.lastSeen,
      },
      [HostsTableType.events]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.uncommonProcesses]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
      [HostsTableType.risk]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: RiskScoreFields.hostRiskScore,
          direction: Direction.desc,
        },
        severitySelection: [],
      },
      [HostsTableType.sessions]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
    },
  },
  details: {
    queries: {
      [HostsTableType.authentications]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.hosts]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        direction: Direction.desc,
        limit: DEFAULT_TABLE_LIMIT,
        sortField: HostsFields.lastSeen,
      },
      [HostsTableType.events]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.uncommonProcesses]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [HostsTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
      [HostsTableType.risk]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: RiskScoreFields.hostRiskScore,
          direction: Direction.desc,
        },
        severitySelection: [],
      },
      [HostsTableType.sessions]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
    },
  },
};

export const hostsReducer = createReducer(initialHostsState, (builder) =>
  builder
    .addCase(setHostTablesActivePageToZero, (state) => {
      state.page.queries[HostsTableType.authentications].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[HostsTableType.hosts].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[HostsTableType.events].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.page.queries[HostsTableType.uncommonProcesses].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.authentications].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.hosts].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.events].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.uncommonProcesses].activePage =
        DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(setHostDetailsTablesActivePageToZero, (state) => {
      state.details.queries[HostsTableType.authentications].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.hosts].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.events].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      state.details.queries[HostsTableType.uncommonProcesses].activePage =
        DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(updateTableActivePage, (state, { payload: { activePage, hostsType, tableType } }) => {
      state[hostsType].queries[tableType].activePage = activePage;
    })
    .addCase(updateTableLimit, (state, { payload: { limit, hostsType, tableType } }) => {
      state[hostsType].queries[tableType].limit = limit;
    })
    .addCase(updateHostsSort, (state, { payload: { sort, hostsType } }) => {
      state[hostsType].queries[HostsTableType.hosts].direction = sort.direction;
      state[hostsType].queries[HostsTableType.hosts].sortField = sort.field;
      state[hostsType].queries[HostsTableType.hosts].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(updateHostRiskScoreSort, (state, { payload: { sort, hostsType } }) => {
      state[hostsType].queries[HostsTableType.risk].sort = sort;
    })
    .addCase(
      updateHostRiskScoreSeverityFilter,
      (state, { payload: { severitySelection, hostsType } }) => {
        state[hostsType].queries[HostsTableType.risk].severitySelection = severitySelection;
        state[hostsType].queries[HostsTableType.risk].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
      }
    )
    .addCase(updateHostsAnomaliesJobIdFilter, (state, { payload: { jobIds, hostsType } }) => {
      state[hostsType].queries[HostsTableType.anomalies].jobIdSelection = jobIds;
    })
    .addCase(updateHostsAnomaliesInterval, (state, { payload: { interval, hostsType } }) => {
      state[hostsType].queries[HostsTableType.anomalies].intervalSelection = interval;
    })
);
