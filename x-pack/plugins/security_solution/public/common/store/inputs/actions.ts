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
import type { Filter } from '@kbn/es-query';
import type { SavedQuery } from '@kbn/data-plugin/public';
import type { InspectQuery, Refetch, RefetchKql } from './model';
import type { InputsModelId } from './constants';

export const setAbsoluteRangeDatePicker = createAction<{
  id: InputsModelId;
  from: string;
  to: string;
  fromStr?: string;
  toStr?: string;
}>('SET_ABSOLUTE_RANGE_DATE_PICKER');

export const setTimelineRangeDatePicker = createAction<{
  from: string;
  to: string;
}>('SET_TIMELINE_RANGE_DATE_PICKER');

export const setRelativeRangeDatePicker = createAction<{
  id: InputsModelId;
  fromStr: string;
  toStr: string;
  from: string;
  to: string;
}>('SET_RELATIVE_RANGE_DATE_PICKER');

export const setDuration = createAction<{
  id: InputsModelId;
  duration: number;
}>('SET_DURATION');

export const startAutoReload = createAction<{ id: InputsModelId }>('START_KQL_AUTO_RELOAD');

export const stopAutoReload = createAction<{ id: InputsModelId }>('STOP_KQL_AUTO_RELOAD');

export const setFullScreen = createAction<{
  id: InputsModelId;
  fullScreen: boolean;
}>('SET_FULL_SCREEN');

export const setQuery = createAction<{
  inputId: InputsModelId.global | InputsModelId.timeline;
  id: string;
  loading: boolean;
  refetch: Refetch | RefetchKql;
  inspect: InspectQuery | null;
  searchSessionId?: string;
}>('SET_QUERY');

export const deleteOneQuery = createAction<{
  inputId: InputsModelId.global | InputsModelId.timeline;
  id: string;
}>('DELETE_QUERY');

export const setInspectionParameter = createAction<{
  id: string;
  inputId: InputsModelId.global | InputsModelId.timeline;
  isInspected: boolean;
  selectedInspectIndex: number;
  searchSessionId?: string;
}>('SET_INSPECTION_PARAMETER');

export const deleteAllQuery = createAction<{ id: InputsModelId }>('DELETE_ALL_QUERY');

export const toggleTimelineLinkTo = createAction('TOGGLE_TIMELINE_LINK_TO');

export const toggleSocTrendsLinkTo = createAction('TOGGLE_SOC_TRENDS_LINK_TO');

export const removeLinkTo = createAction<InputsModelId[]>('REMOVE_LINK_TO');
export const addLinkTo = createAction<InputsModelId[]>('ADD_LINK_TO');

export const setFilterQuery = createAction<{
  id: InputsModelId;
  query: string | { [key: string]: unknown };
  language: string;
}>('SET_FILTER_QUERY');

export const setSavedQuery = createAction<{
  id: InputsModelId;
  savedQuery: SavedQuery | undefined;
}>('SET_SAVED_QUERY');

export const setSearchBarFilter = createAction<{
  id: InputsModelId;
  filters: Filter[];
}>('SET_SEARCH_BAR_FILTER');
