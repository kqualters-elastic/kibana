/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import type { usersModel } from '.';
import type { RiskScoreSortField, RiskSeverity } from '../../../../common/search_strategy';
import type { SortUsersField } from '../../../../common/search_strategy/security_solution/users/common';

export const setUsersTablesActivePageToZero = createAction('SET_USERS_TABLES_ACTIVE_PAGE_TO_ZERO');

export const setUsersDetailsTablesActivePageToZero = createAction(
  'SET_USERS_DETAILS_TABLES_ACTIVE_PAGE_TO_ZERO'
);

export const updateTableLimit = createAction<{
  usersType: usersModel.UsersType;
  limit: number;
  tableType: Exclude<usersModel.UsersTableType, usersModel.UsersTableType.anomalies>;
}>('UPDATE_USERS_TABLE_LIMIT');

export const updateTableActivePage = createAction<{
  usersType: usersModel.UsersType;
  activePage: number;
  tableType: Exclude<usersModel.UsersTableType, usersModel.UsersTableType.anomalies>;
}>('UPDATE_USERS_ACTIVE_PAGE');

export const updateTableSorting = createAction<{
  tableType: usersModel.UsersTableType.allUsers | usersModel.UsersTableType.risk;
  sort: RiskScoreSortField | SortUsersField;
}>('UPDATE_USERS_SORTING');

export const updateUserRiskScoreSeverityFilter = createAction<{
  severitySelection: RiskSeverity[];
}>('UPDATE_USERS_RISK_SEVERITY_FILTER');

export const updateUsersAnomaliesJobIdFilter = createAction<{
  jobIds: string[];
  usersType: usersModel.UsersType;
}>('UPDATE_USERS_ANOMALIES_JOB_ID_FILTER');

export const updateUsersAnomaliesInterval = createAction<{
  interval: string;
  usersType: usersModel.UsersType;
}>('UPDATE_USERS_ANOMALIES_INTERVAL');
