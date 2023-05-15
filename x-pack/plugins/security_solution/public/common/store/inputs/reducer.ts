/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get } from 'lodash/fp';
import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { InputsModelId } from './constants';
import { getIntervalSettings, getTimeRangeSettings } from '../../utils/default_date_settings';
import {
  deleteAllQuery,
  setAbsoluteRangeDatePicker,
  setDuration,
  setFullScreen,
  setInspectionParameter,
  setQuery,
  setRelativeRangeDatePicker,
  setTimelineRangeDatePicker,
  startAutoReload,
  stopAutoReload,
  toggleTimelineLinkTo,
  deleteOneQuery,
  setFilterQuery,
  setSavedQuery,
  setSearchBarFilter,
  removeLinkTo,
  addLinkTo,
  toggleSocTrendsLinkTo,
} from './actions';
// import {
//   setIsInspected,
//   toggleLockTimeline,
//   updateInputTimerange,
//   upsertQuery,
//   addInputLink,
//   removeInputLink,
//   deleteOneQuery as helperDeleteOneQuery,
//   updateInputFullScreen,
//   toggleLockSocTrends,
// } from './helpers';
import { getFutureTimeRange, getPreviousTimeRange } from '../../utils/get_time_range';
import type { InputsModel, TimeRange } from './model';

export type InputsState = InputsModel;

const { socTrends: socTrendsUnused, ...timeRangeSettings } = getTimeRangeSettings(false);

export const initialInputsState: InputsState = {
  global: {
    timerange: {
      kind: 'relative',
      ...timeRangeSettings,
    },
    queries: [],
    policy: getIntervalSettings(false),
    linkTo: [InputsModelId.timeline],
    query: {
      query: '',
      language: 'kuery',
    },
    filters: [],
    fullScreen: false,
  },
  timeline: {
    timerange: {
      kind: 'relative',
      ...timeRangeSettings,
    },
    queries: [],
    policy: getIntervalSettings(false),
    linkTo: [InputsModelId.global],
    query: {
      query: '',
      language: 'kuery',
    },
    filters: [],
    fullScreen: false,
  },
};

export const createInitialInputsState = (socTrendsEnabled: boolean): InputsState => {
  const { from, fromStr, to, toStr, socTrends } = getTimeRangeSettings();
  const { kind, duration } = getIntervalSettings();
  return {
    global: {
      timerange: {
        kind: 'relative',
        fromStr,
        toStr,
        from,
        to,
      },
      queries: [],
      policy: {
        kind,
        duration,
      },
      linkTo: [InputsModelId.timeline, ...(socTrendsEnabled ? [InputsModelId.socTrends] : [])],
      query: {
        query: '',
        language: 'kuery',
      },
      filters: [],
      fullScreen: false,
    },
    timeline: {
      timerange: {
        kind: 'relative',
        fromStr,
        toStr,
        from,
        to,
      },
      queries: [],
      policy: {
        kind,
        duration,
      },
      linkTo: [InputsModelId.global],
      query: {
        query: '',
        language: 'kuery',
      },
      filters: [],
      fullScreen: false,
    },
    ...(socTrendsEnabled
      ? {
          socTrends: {
            timerange: socTrends,
            linkTo: [InputsModelId.global],
            policy: {
              kind,
              duration,
            },
          },
        }
      : {}),
  };
};

const getTimeRange = (timerange: TimeRange, inputId: InputsModelId, linkToId: InputsModelId) => {
  if (
    (inputId === InputsModelId.global || inputId === InputsModelId.timeline) &&
    linkToId === InputsModelId.socTrends
  ) {
    return getPreviousTimeRange(timerange);
  }
  if (
    inputId === InputsModelId.socTrends &&
    (linkToId === InputsModelId.global || linkToId === InputsModelId.timeline)
  ) {
    return getFutureTimeRange(timerange);
  }
  return timerange;
};

export const inputsReducer = createReducer(initialInputsState, (builder) =>
  builder
    .addCase(setTimelineRangeDatePicker, (state, { payload: { from, to } }) => {
      state.global.linkTo = state.global.linkTo.filter((i) => i !== InputsModelId.timeline);
      state.timeline.timerange = {
        kind: 'absolute',
        fromStr: undefined,
        toStr: undefined,
        from,
        to,
      };
      state.timeline.linkTo = [];
    })
    .addCase(
      setAbsoluteRangeDatePicker,
      (state, { payload: { id, from, to, fromStr = undefined, toStr = undefined } }) => {
        const timerange: TimeRange = {
          kind: 'absolute',
          fromStr,
          toStr,
          from,
          to,
        };
        const input = state[id];
        if (input) {
          input.timerange = getTimeRange(timerange, id, id);
          input.linkTo.map((link) => {
            const linked = state[link];
            if (linked) {
              linked.timerange = getTimeRange(timerange, id, link);
            }
            return link;
          });
        }
      }
    )
    .addCase(setRelativeRangeDatePicker, (state, { payload: { id, fromStr, from, to, toStr } }) => {
      const timerange: TimeRange = {
        kind: 'relative',
        fromStr,
        toStr,
        from,
        to,
      };
      // obviously not needed separate actions
      const input = state[id];
      if (input) {
        input.timerange = getTimeRange(timerange, id, id);
        input.linkTo.map((link) => {
          const linked = state[link];
          if (linked) {
            linked.timerange = getTimeRange(timerange, id, link);
          }
          return link;
        });
      }
    })
    .addCase(setFullScreen, (state, { payload: { id, fullScreen } }) => {
      if (id === InputsModelId.global) {
        state.global.fullScreen = fullScreen;
      } else if (id === InputsModelId.timeline) {
        state.timeline.fullScreen = fullScreen;
      }
    })
    .addCase(deleteAllQuery, (state, { payload: { id } }) => {
      const inputToClear = state[id];
      if (inputToClear) {
        inputToClear.queries = [];
      }
    })
    // .addCase(
    //   setQuery,
    //   (state, { payload: { inputId, id, inspect, loading, refetch, searchSessionId } }) =>
    //     upsertQuery({ inputId, id, inspect, loading, refetch, state, searchSessionId })
    // )
    .addCase(deleteOneQuery, (state, { payload: { inputId, id } }) => {
      const queryIndex = state[inputId].queries.findIndex((q) => q.id === id);
      const input = state[inputId];
      if (queryIndex > -1) {
        input.queries = [
          ...input.queries.slice(0, queryIndex),
          ...input.queries.slice(queryIndex + 1),
        ];
      }
    })
    .addCase(setDuration, (state, { payload: { id, duration } }) => {
      const input = state[id];
      if (input) {
        input.policy.duration = duration;
      }
    })
    .addCase(startAutoReload, (state, { payload: { id } }) => {
      const input = state[id];
      if (input) {
        input.policy.kind = 'interval';
      }
    })
    .addCase(stopAutoReload, (state, { payload: { id } }) => {
      const input = state[id];
      if (input) {
        input.policy.kind = 'manual';
      }
    })
    // .addCase(toggleTimelineLinkTo, (state) => toggleLockTimeline(state))
    // .addCase(toggleSocTrendsLinkTo, (state) => toggleLockSocTrends(state))
    // .addCase(
    //   setInspectionParameter,
    //   (state, { payload: { id, inputId, isInspected, selectedInspectIndex, searchSessionId } }) =>
    //     setIsInspected({ id, inputId, isInspected, selectedInspectIndex, state, searchSessionId })
    // )
    // .addCase(removeLinkTo, (state, { payload: linkToIds }) => removeInputLink(linkToIds, state))
    // .addCase(addLinkTo, (state, { payload: linkToIds }) => addInputLink(linkToIds, state))
    .addCase(setFilterQuery, (state, { payload: { id, query, language } }) => {
      const input = state[id];
      if (input) {
        input.query.query = query;
        input.query.language = language;
      }
    })
    .addCase(setSavedQuery, (state, { payload: { id, savedQuery } }) => {
      const input = state[id];
      if (input) {
        input.savedQuery = savedQuery;
      }
    })
    .addCase(setSearchBarFilter, (state, { payload: { id, filters } }) => {
      const input = state[id];
      if (input) {
        input.filters = filters;
      }
    })
);
