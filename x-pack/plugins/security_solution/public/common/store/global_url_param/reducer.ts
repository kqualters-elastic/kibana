/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RisonValue } from '@kbn/rison';
import deepEqual from 'fast-deep-equal';
import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { registerUrlParam, updateUrlParam, deregisterUrlParam } from './actions';

export type GlobalUrlParam = Record<string, RisonValue | null>;

export const initialGlobalUrlParam: GlobalUrlParam = {};

export const globalUrlParamReducer = createReducer(initialGlobalUrlParam, (builder) =>
  builder
    .addCase(registerUrlParam, (state, { payload: { key, initialValue } }) => {
      // It doesn't allow the query param to be used twice
      let currentKey = state[key];
      if (currentKey !== undefined) {
        // eslint-disable-next-line no-console
        console.error(`Url param key '${key}' is already being used.`);
      } else {
        currentKey = initialValue;
      }
    })
    .addCase(deregisterUrlParam, (state, { payload: { key } }) => {
      delete state[key];
    })
    .addCase(updateUrlParam, (state, { payload: { key, value } }) => {
      if (state[key] === undefined || deepEqual(state[key], value)) {
        // return state;
      } else {
        state[key] = value;
      }
    })
);
