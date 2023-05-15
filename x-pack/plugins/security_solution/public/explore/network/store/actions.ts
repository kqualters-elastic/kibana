/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import type { networkModel } from '.';
import type { NetworkType } from './model';

export const updateNetworkTable = createAction<{
  networkType: networkModel.NetworkType;
  tableType: networkModel.NetworkTableType | networkModel.NetworkDetailsTableType;
  updates: networkModel.TableUpdates;
}>('UPDATE_NETWORK_TABLE');

export const setNetworkDetailsTablesActivePageToZero = createAction(
  'SET_IP_DETAILS_TABLES_ACTIVE_PAGE_TO_ZERO'
);

export const setNetworkTablesActivePageToZero = createAction(
  'SET_NETWORK_TABLES_ACTIVE_PAGE_TO_ZERO'
);

export const updateNetworkAnomaliesJobIdFilter = createAction<{
  jobIds: string[];
  networkType: NetworkType;
}>('UPDATE_NETWORK_ANOMALIES_JOB_ID_FILTER');

export const updateNetworkAnomaliesInterval = createAction<{
  interval: string;
  networkType: NetworkType;
}>('UPDATE_NETWORK_ANOMALIES_INTERVAL');
