/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createSelector } from 'reselect';
import type { State } from '../types';
/* eslint-disable @typescript-eslint/no-shadow */

export const baseSelector = (state: State) => state.sourcerer;

export const sourcererSelector = createSelector(baseSelector, (sourcerer) => sourcerer);

export const scopes = createSelector(sourcererSelector, (sourcerer) => sourcerer.sourcererScopes);

export const defaultDataView = createSelector(
  sourcererSelector,
  (sourcerer) => sourcerer.defaultDataView,
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);

export const kibanaDataView = createSelector(
  sourcererSelector,
  (sourcerer) => sourcerer.kibanaDataViews,
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);

export const signalIndexName = createSelector(
  sourcererSelector,
  (sourcerer) => sourcerer.signalIndexName,
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);

export const timelineScope = createSelector(scopes, (scopes) => scopes.timeline, {
  memoizeOptions: {
    maxSize: 3,
  },
});

export const defaultScope = createSelector(scopes, (scopes) => scopes.default, {
  memoizeOptions: {
    maxSize: 3,
  },
});

export const detectionsScope = createSelector(scopes, (scopes) => scopes.detections, {
  memoizeOptions: {
    maxSize: 3,
  },
});

export const timelineDataView = createSelector(
  kibanaDataView,
  timelineScope,
  (kibanaDataView, timelineScope) => {
    return kibanaDataView.find((dataView) => dataView.id === timelineScope.selectedDataViewId);
  },
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);

export const sdefaultDataView = createSelector(
  kibanaDataView,
  defaultScope,
  (kibanaDataView, defaultScope) => {
    return kibanaDataView.find((dataView) => dataView.id === defaultScope.selectedDataViewId);
  },
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);

export const sdetectionsDataView = createSelector(
  kibanaDataView,
  detectionsScope,
  (kibanaDataView, detectionsScope) => {
    return kibanaDataView.find((dataView) => dataView.id === detectionsScope.selectedDataViewId);
  },
  {
    memoizeOptions: {
      maxSize: 3,
    },
  }
);
