/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createReducer } from '@reduxjs/toolkit';
import { isEmpty } from 'lodash';
import {
  setSourcererDataViews,
  setSourcererScopeLoading,
  setSelectedDataView,
  setSignalIndexName,
  setDataView,
  setDataViewLoading,
} from './actions';
import type { SourcererModel } from './model';
import { initDataView, initialSourcererState, SourcererScopeName } from './model';
import { getScopePatternListSelection } from './helpers';
import { ensurePatternFormat, sortWithExcludesAtEnd } from '../../../../common/utils/sourcerer';

export type SourcererState = SourcererModel;

export const sourcererReducer = createReducer(initialSourcererState, (builder) =>
  builder
    .addCase(setSignalIndexName, (state, { payload: { signalIndexName } }) => {
      state.signalIndexName = signalIndexName;
    })
    .addCase(setDataViewLoading, (state, { payload: { id, loading } }) => {
      debugger;
      if (id === state.defaultDataView.id) {
        state.defaultDataView.loading = loading;
      }
      const dataView = state.kibanaDataViews.find((dataViewToUpdate) => dataViewToUpdate.id === id);
      if (dataView) {
        dataView.loading = loading;
      }
    })
    .addCase(setSourcererDataViews, (state, { payload: { defaultDataView, kibanaDataViews } }) => {
      state.defaultDataView = defaultDataView;
      // lol
      state.kibanaDataViews = kibanaDataViews;
    })
    .addCase(setSourcererScopeLoading, (state, { payload: { id, loading } }) => {
      debugger;
      if (id != null) {
        state.sourcererScopes[id].loading = loading;
      } else {
        state.sourcererScopes[SourcererScopeName.default].loading = loading;
        state.sourcererScopes[SourcererScopeName.detections].loading = loading;
        state.sourcererScopes[SourcererScopeName.timeline].loading = loading;
      }
    })
    .addCase(
      setSelectedDataView,
      (state, { payload: { shouldValidateSelectedPatterns = true, ...patternsInfo } }) => {
        console.log(state);
        debugger;
        const { id, ...rest } = patternsInfo;
        const dataView = state.kibanaDataViews.find((p) => p.id === rest.selectedDataViewId);
        // dedupe because these could come from a silly url or pre 8.0 timeline
        const dedupePatterns = ensurePatternFormat(rest.selectedPatterns);
        let missingPatterns: string[] = [];
        // check for missing patterns against default data view only
        if (dataView == null || dataView.id === state.defaultDataView.id) {
          const dedupeAllDefaultPatterns = ensurePatternFormat(
            (dataView ?? state.defaultDataView).title.split(',')
          );
          missingPatterns = dedupePatterns.filter(
            (pattern) => !dedupeAllDefaultPatterns.includes(pattern)
          );
        }
        const selectedPatterns =
          // shouldValidateSelectedPatterns is false when upgrading from
          // legacy pre-8.0 timeline index patterns to data view.
          shouldValidateSelectedPatterns &&
          dataView != null &&
          missingPatterns.length === 0 &&
          // don't validate when the data view has not been initialized (default is initialized already always)
          dataView.id !== state.defaultDataView.id &&
          dataView.patternList.length > 0
            ? dedupePatterns.filter(
                (pattern) =>
                  (dataView != null && dataView.patternList.includes(pattern)) ||
                  // this is a hack, but sometimes signal index is deleted and is getting regenerated. it gets set before it is put in the dataView
                  state.signalIndexName == null ||
                  state.signalIndexName === pattern
              )
            : // don't remove non-existing patterns, they were saved in the first place in timeline
              // but removed from the security data view
              // or its a legacy pre-8.0 timeline
              dedupePatterns;
        debugger;
        state.sourcererScopes[id] = {
          ...state.sourcererScopes[id],
          ...rest,
          selectedDataViewId: dataView?.id ?? null,
          selectedPatterns,
          missingPatterns,
          // if in timeline, allow for empty in case pattern was deleted
          // need flow for this
          ...(isEmpty(selectedPatterns) && id !== SourcererScopeName.timeline
            ? {
                selectedPatterns: getScopePatternListSelection(
                  dataView ?? state.defaultDataView,
                  id,
                  state.signalIndexName,
                  (dataView ?? state.defaultDataView).id === state.defaultDataView.id
                ),
              }
            : {}),
          loading: false,
        };
      }
    )
    .addCase(setDataView, (state, { payload: dataView }) => {
      if (dataView.id === state.defaultDataView.id) {
        state.defaultDataView = dataView;
      }
      let updateDataView = state.kibanaDataViews.find(
        (dataViewToUpdate) => dataViewToUpdate.id === dataView.id
      );
      if (updateDataView) {
        updateDataView = dataView;
      }
    })
);
