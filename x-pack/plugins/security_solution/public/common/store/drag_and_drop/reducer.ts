/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { omit } from 'lodash/fp';
import { createReducer } from '@reduxjs/toolkit';

import type { DataProvider } from '../../../timelines/components/timeline/data_providers/data_provider';

import { registerProvider, unRegisterProvider } from './actions';
import type { DragAndDropModel, IdToDataProvider } from './model';

export type DragAndDropState = DragAndDropModel;

export const initialDragAndDropState: DragAndDropState = { dataProviders: {} };

interface RegisterProviderHandlerParams {
  provider: DataProvider;
  dataProviders: IdToDataProvider;
}

export const registerProviderHandler = ({
  provider,
  dataProviders,
}: RegisterProviderHandlerParams): IdToDataProvider => ({
  ...dataProviders,
  [provider.id]: provider,
});

interface UnRegisterProviderHandlerParams {
  id: string;
  dataProviders: IdToDataProvider;
}

export const unRegisterProviderHandler = ({
  id,
  dataProviders,
}: UnRegisterProviderHandlerParams): IdToDataProvider => omit(id, dataProviders);

export const dragAndDropReducer = createReducer(initialDragAndDropState, (builder) => {
  builder
    .addCase(registerProvider, (state, { payload: { provider } }) => {
      state.dataProviders[provider.id] = provider;
    })
    .addCase(unRegisterProvider, (state, { payload: { id } }) => {
      state.dataProviders = unRegisterProviderHandler({ id, dataProviders: state.dataProviders });
    });
});
