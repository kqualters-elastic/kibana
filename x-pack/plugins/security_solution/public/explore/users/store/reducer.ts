/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { set } from '@kbn/safer-lodash-set/fp';
import { DEFAULT_TABLE_ACTIVE_PAGE, DEFAULT_TABLE_LIMIT } from '../../../common/store/constants';

import {
  setUsersTablesActivePageToZero,
  updateTableActivePage,
  updateTableLimit,
  updateTableSorting,
  updateUserRiskScoreSeverityFilter,
  updateUsersAnomaliesInterval,
  updateUsersAnomaliesJobIdFilter,
} from './actions';
import { setUsersPageQueriesActivePageToZero } from './helpers';
import type { UsersModel } from './model';
import { UsersTableType, UsersType } from './model';
import { Direction } from '../../../../common/search_strategy/common';
import { RiskScoreFields } from '../../../../common/search_strategy';
import { UsersFields } from '../../../../common/search_strategy/security_solution/users/common';

export type UsersState = UsersModel;

export const initialUsersState: UsersState = {
  page: {
    queries: {
      [UsersTableType.allUsers]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: UsersFields.lastSeen,
          direction: Direction.desc,
        },
      },
      [UsersTableType.authentications]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
      [UsersTableType.risk]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
        sort: {
          field: RiskScoreFields.userRiskScore,
          direction: Direction.desc,
        },
        severitySelection: [],
      },
      [UsersTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
      [UsersTableType.events]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
    },
  },
  details: {
    queries: {
      [UsersTableType.anomalies]: {
        jobIdSelection: [],
        intervalSelection: 'auto',
      },
      [UsersTableType.events]: {
        activePage: DEFAULT_TABLE_ACTIVE_PAGE,
        limit: DEFAULT_TABLE_LIMIT,
      },
    },
  },
};

export const usersReducer = createReducer(initialUsersState, (builder) =>
  builder
    .addCase(setUsersTablesActivePageToZero, (state) => {
      state.page.queries[UsersTableType.allUsers].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(updateTableActivePage, (state, { payload: { activePage, tableType } }) => {
      state.page.queries[tableType].activePage = activePage;
    })
    .addCase(updateTableLimit, (state, { payload: { limit, tableType } }) => {
      state.page.queries[tableType].limit = limit;
    })
    .addCase(updateTableSorting, (state, { payload: { sort, tableType } }) => {
      state.page.queries[tableType].sort = sort;
      state.page.queries[tableType].activePage = DEFAULT_TABLE_ACTIVE_PAGE;
    })
    .addCase(updateUserRiskScoreSeverityFilter, (state, { payload: { severitySelection } }) => ({
      ...state,
      page: {
        ...state.page,
        queries: {
          ...state.page.queries,
          [UsersTableType.risk]: {
            ...state.page.queries[UsersTableType.risk],
            severitySelection,
            activePage: DEFAULT_TABLE_ACTIVE_PAGE,
          },
        },
      },
    }))
    .addCase(updateUsersAnomaliesJobIdFilter, (state, { payload: { jobIds, usersType } }) => {
      if (usersType === UsersType.page) {
        state.page.queries[UsersTableType.anomalies].jobIdSelection = jobIds;
      } else {
        state.details.queries[UsersTableType.anomalies].jobIdSelection = jobIds;
      }
    })
    .addCase(updateUsersAnomaliesInterval, (state, { payload: { interval, usersType } }) => {
      if (usersType === UsersType.page) {
        state.page.queries[UsersTableType.anomalies].intervalSelection = interval;
      } else {
        state.details.queries[UsersTableType.anomalies].intervalSelection = interval;
      }
    })
);
