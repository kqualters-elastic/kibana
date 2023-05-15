/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { updateGroupSelector } from './actions';
import type { GroupModel } from './types';

export const initialGroupingState: GroupModel = {
  groupSelector: null,
};

export const groupsReducer = createReducer(initialGroupingState, (builder) =>
  builder.addCase(updateGroupSelector, (state, { payload: { groupSelector } }) => ({
    ...state,
    groupSelector,
  }))
);
