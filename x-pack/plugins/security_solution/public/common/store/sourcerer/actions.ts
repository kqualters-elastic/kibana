/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';


import type { SelectedDataView, SourcererDataView, SourcererScopeName } from './model';
import type { SecurityDataView } from '../../containers/sourcerer/create_sourcerer_data_view';

export const setDataView = createAction<Partial<SourcererDataView>>('SET_DATA_VIEW');

export const setDataViewLoading = createAction<{
  id: string;
  loading: boolean;
}>('SET_DATA_VIEW_LOADING');

export const setSignalIndexName = createAction<{ signalIndexName: string }>(
  'SET_SIGNAL_INDEX_NAME'
);

export const setSourcererDataViews = createAction<SecurityDataView>('SET_SOURCERER_DATA_VIEWS');

export const setSourcererScopeLoading = createAction<{
  id?: SourcererScopeName;
  loading: boolean;
}>('SET_SOURCERER_SCOPE_LOADING');

export interface SelectedDataViewPayload {
  id: SourcererScopeName;
  selectedDataViewId: SelectedDataView['dataViewId'];
  selectedPatterns: SelectedDataView['selectedPatterns'];
  shouldValidateSelectedPatterns?: boolean;
}
export const setSelectedDataView = createAction<SelectedDataViewPayload>('SET_SELECTED_DATA_VIEW');
