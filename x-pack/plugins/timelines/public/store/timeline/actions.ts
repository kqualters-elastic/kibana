/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { createAction } from '@reduxjs/toolkit';
import { DataProvider } from '../../../common';

export const addProviderToTimeline = createAction<{ id: string; dataProvider: DataProvider }>(
  'ADD_PROVIDER_TO_TIMELINE'
);
