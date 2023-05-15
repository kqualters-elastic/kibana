/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RisonValue } from '@kbn/rison';
import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';

export const registerUrlParam = createAction<{ key: string; initialValue: string }>(
  'REGISTER_URL_PARAM'
);

export const deregisterUrlParam = createAction<{ key: string }>('DEREGISTER_URL_PARAM');

export const updateUrlParam = createAction<{ key: string; value: string }>('UPDATE_URL_PARAM');
