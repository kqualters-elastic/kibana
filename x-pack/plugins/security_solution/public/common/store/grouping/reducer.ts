/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createReducer } from '@reduxjs/toolkit';
import { updateGroups } from './actions';
import type { Groups } from './types';

export const initialGroupingState: Groups = {};

export const groupsReducer = createReducer(initialGroupingState, (builder) =>
  builder.addCase(updateGroups, (state, { payload: { tableId, activeGroups, options } }) => {
    if (activeGroups != null) {
      state[tableId].activeGroups = activeGroups;
    }
    if (options != null) {
      state[tableId].options = options;
    }
  })
);
