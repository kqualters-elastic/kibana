/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  createAction,
  createReducer,
  AnyAction,
  PayloadAction,
} from '@reduxjs/toolkit';

import type { DataProvider } from '../../../timelines/components/timeline/data_providers/data_provider';

export const registerProvider = createAction<{ provider: DataProvider }>('REGISTER_PROVIDER');

export const unRegisterProvider = createAction<{ id: string }>('UNREGISTER_PROVIDER');

export const noProviderFound = createAction<{ id: string }>('NO_PROVIDER_FOUND');
