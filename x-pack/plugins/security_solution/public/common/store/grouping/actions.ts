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
import type React from 'react';

export const updateGroupSelector = createAction<{
  groupSelector: React.ReactElement | null;
}>('UPDATE_GROUP_SELECTOR');
