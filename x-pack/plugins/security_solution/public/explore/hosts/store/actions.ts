/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction } from '@reduxjs/toolkit';
import type { RiskScoreSortField, RiskSeverity } from '../../../../common/search_strategy';
import type { HostsSortField } from '../../../../common/search_strategy/security_solution/hosts';

import type { HostsTableType, HostsType } from './model';

export const updateTableActivePage = createAction<{
  activePage: number;
  hostsType: HostsType;
  tableType: Exclude<HostsTableType, 'anomalies'>;
}>('UPDATE_HOST_TABLE_ACTIVE_PAGE');

export const setHostTablesActivePageToZero = createAction('SET_HOST_TABLES_ACTIVE_PAGE_TO_ZERO');

export const setHostDetailsTablesActivePageToZero = createAction(
  'SET_HOST_DETAILS_TABLES_ACTIVE_PAGE_TO_ZERO'
);

export const updateTableLimit = createAction<{
  hostsType: HostsType;
  limit: number;
  tableType: Exclude<HostsTableType, 'anomalies'>;
}>('UPDATE_HOST_TABLE_LIMIT');

export const updateHostsSort = createAction<{
  sort: HostsSortField;
  hostsType: HostsType;
}>('UPDATE_HOSTS_SORT');

export const updateHostRiskScoreSort = createAction<{
  sort: RiskScoreSortField;
  hostsType: HostsType;
}>('UPDATE_HOST_RISK_SCORE_SORT');

export const updateHostRiskScoreSeverityFilter = createAction<{
  severitySelection: RiskSeverity[];
  hostsType: HostsType;
}>('UPDATE_HOST_RISK_SCORE_SEVERITY');

export const updateHostsAnomaliesJobIdFilter = createAction<{
  jobIds: string[];
  hostsType: HostsType;
}>('UPDATE_HOSTS_ANOMALIES_JOB_ID_FILTER');

export const updateHostsAnomaliesInterval = createAction<{
  interval: string;
  hostsType: HostsType;
}>('UPDATE_HOSTS_ANOMALIES_INTERVAL');
