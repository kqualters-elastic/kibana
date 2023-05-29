/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createSelector } from 'reselect';
import type { State } from '../types';
import type {
  SourcererDataView,
  SourcererModel,
  SourcererScope,
  SourcererScopeName,
} from './model';

export const sourcererKibanaDataViewsSelector = ({
  sourcerer,
}: State): SourcererModel['kibanaDataViews'] => sourcerer.kibanaDataViews;

export const sourcererSignalIndexNameSelector = ({ sourcerer }: State): string | null =>
  sourcerer.signalIndexName;

export const sourcererDefaultDataViewSelector = ({
  sourcerer,
}: State): SourcererModel['defaultDataView'] => sourcerer.defaultDataView;

export const dataViewSelector = (
  { sourcerer }: State,
  id: string | null
): SourcererDataView | undefined => {
  return sourcerer.kibanaDataViews.find((dataView) => dataView.id === id);
};

export const sourcererScopeIdSelector = (
  { sourcerer }: State,
  scopeId: SourcererScopeName
): SourcererScope => sourcerer.sourcererScopes[scopeId];

export const scopeIdSelector = () => createSelector(sourcererScopeIdSelector, (scope) => scope);

export const kibanaDataViewsSelector = () =>
  createSelector(sourcererKibanaDataViewsSelector, (dataViews) => dataViews);

export const signalIndexNameSelector = () =>
  createSelector(sourcererSignalIndexNameSelector, (signalIndexName) => signalIndexName);

export const defaultDataViewSelector = () =>
  createSelector(sourcererDefaultDataViewSelector, (dataViews) => dataViews);

export const sourcererDataViewSelector = () =>
  createSelector(dataViewSelector, (dataView) => dataView);

export interface SourcererScopeSelector extends Omit<SourcererModel, 'sourcererScopes'> {
  selectedDataView: SourcererDataView | undefined;
  sourcererScope: SourcererScope;
}

export const getSourcererDataViewsSelector = () => {
  const getKibanaDataViewsSelector = kibanaDataViewsSelector();
  const getDefaultDataViewSelector = defaultDataViewSelector();
  const getSignalIndexNameSelector = signalIndexNameSelector();
  return (state: State): Omit<SourcererModel, 'sourcererScopes'> => {
    const kibanaDataViews = getKibanaDataViewsSelector(state);
    const defaultDataView = getDefaultDataViewSelector(state);
    const signalIndexName = getSignalIndexNameSelector(state);

    return {
      defaultDataView,
      kibanaDataViews,
      signalIndexName,
    };
  };
};

/**
 * Attn Future Developer
 * Access sourcererScope.selectedPatterns from
 * hook useSourcererDataView in `common/containers/sourcerer/index`
 * in order to get exclude patterns for searches
 * Access sourcererScope.selectedPatterns
 * from this function for display purposes only
 * */
export const getSourcererScopeSelector = () => {
  const getDataViewsSelector = getSourcererDataViewsSelector();
  const getSourcererDataViewSelector = sourcererDataViewSelector();
  const getScopeSelector = scopeIdSelector();

  return (state: State, scopeId: SourcererScopeName): SourcererScopeSelector => {
    const dataViews = getDataViewsSelector(state);
    const scope = getScopeSelector(state, scopeId);
    const selectedDataView = getSourcererDataViewSelector(state, scope.selectedDataViewId);

    return {
      ...dataViews,
      selectedDataView,
      sourcererScope: scope,
    };
  };
};

export const betterSelector = (state: State) => state.sourcerer;

export const sourcererSelector = createSelector(betterSelector, (sourcerer) => sourcerer);

export const scopes = createSelector(sourcererSelector, (sourcerer) => sourcerer.sourcererScopes);

export const dv = createSelector(sourcererSelector, (sourcerer) => sourcerer.defaultDataView);

export const kv = createSelector(sourcererSelector, (sourcerer) => sourcerer.kibanaDataViews);

export const sin = createSelector(sourcererSelector, (sourcerer) => sourcerer.signalIndexName);

export const stimelineScope = createSelector(scopes, (scopes) => scopes.timeline);

export const sdefaultScope = createSelector(scopes, (scopes) => scopes.default);

export const sdetectionsScope = createSelector(scopes, (scopes) => scopes.detections);

export const stimelineDataView = createSelector(kv, stimelineScope, (kv, timelineScope) => {
  return kv.find((dv) => dv.id === timelineScope.selectedDataViewId);
});

export const sdefaultDataView = createSelector(kv, sdefaultScope, (kv, defaultScope) => {
  return kv.find((dv) => dv.id === defaultScope.selectedDataViewId);
});

export const sdetectionsDataView = createSelector(kv, sdetectionsScope, (kv, detectionsScope) => {
  return kv.find((dv) => dv.id === detectionsScope.selectedDataViewId);
});
