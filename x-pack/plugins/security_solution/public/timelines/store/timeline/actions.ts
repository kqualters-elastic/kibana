/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import type { Filter } from '@kbn/es-query';

import type { SessionViewConfig } from '../../../../common/types';
import type {
  DataProvider,
  DataProviderType,
  QueryOperator,
} from '../../components/timeline/data_providers/data_provider';

import type { KqlMode, TimelineModel } from './model';
import type { InitialyzeTimelineSettings, InsertTimeline } from './types';
import type {
  FieldsEqlOptions,
  TimelineNonEcsData,
} from '../../../../common/search_strategy/timeline';
import type {
  RowRendererId,
  TimelineTabs,
  TimelinePersistInput,
  SerializedFilterQuery,
  ToggleDetailPanel,
  ColumnHeaderOptions,
  SortColumnTimeline,
} from '../../../../common/types/timeline';
import type { ResolveTimelineConfig } from '../../components/open_timeline/types';

export const addNote = createAction<{ id: string; noteId: string }>('ADD_NOTE');

export const addNoteToEvent = createAction<{ id: string; noteId: string; eventId: string }>(
  'ADD_NOTE_TO_EVENT'
);

export const showTimeline = createAction<{ id: string; show: boolean }>('SHOW_TIMELINE');

export const setInsertTimeline = createAction<InsertTimeline | null>('SET_INSERT_TIMELINE');

export const addProvider = createAction<{ id: string; providers: DataProvider[] }>('ADD_PROVIDER');

export const saveTimeline = createAction<TimelinePersistInput>('SAVE_TIMELINE');

export const createTimeline = createAction<TimelinePersistInput>('CREATE_TIMELINE');

export const pinEvent = createAction<{ id: string; eventId: string }>('PIN_EVENT');

export const setTimelineUpdatedAt = createAction<{ id: string; updated: number | undefined }>(
  'SET_TIMELINE_UPDATED_AT'
);

export const removeProvider = createAction<{
  id: string;
  providerId: string;
  andProviderId?: string;
}>('REMOVE_PROVIDER');

export const updateGraphEventId = createAction<{ id: string; graphEventId: string }>(
  'UPDATE_TIMELINE_GRAPH_EVENT_ID'
);

export const updateSessionViewConfig = createAction<{
  id: string;
  sessionViewConfig: SessionViewConfig | null;
}>('UPDATE_TIMELINE_SESSION_VIEW_CONFIG');

export const unPinEvent = createAction<{ id: string; eventId: string }>('UN_PIN_EVENT');

export const updateTimeline = createAction<{
  id: string;
  timeline: TimelineModel;
}>('UPDATE_TIMELINE');

export const addTimeline = createAction<{
  id: string;
  timeline: TimelineModel;
  resolveTimelineConfig?: ResolveTimelineConfig;
  savedTimeline?: boolean;
}>('ADD_TIMELINE');

export const startTimelineSaving = createAction<{
  id: string;
}>('START_TIMELINE_SAVING');

export const endTimelineSaving = createAction<{
  id: string;
}>('END_TIMELINE_SAVING');

export const updateDataProviderEnabled = createAction<{
  id: string;
  enabled: boolean;
  providerId: string;
  andProviderId?: string;
}>('TOGGLE_PROVIDER_ENABLED');

export const updateDataProviderExcluded = createAction<{
  id: string;
  excluded: boolean;
  providerId: string;
  andProviderId?: string;
}>('TOGGLE_PROVIDER_EXCLUDED');

export const dataProviderEdited = createAction<{
  andProviderId?: string;
  excluded: boolean;
  field: string;
  id: string;
  operator: QueryOperator;
  providerId: string;
  value: string | number | Array<string | number>;
}>('DATA_PROVIDER_EDITED');

export const updateDataProviderType = createAction<{
  andProviderId?: string;
  id: string;
  type: DataProviderType;
  providerId: string;
}>('UPDATE_PROVIDER_TYPE');

export const updateKqlMode = createAction<{ id: string; kqlMode: KqlMode }>('UPDATE_KQL_MODE');

export const applyKqlFilterQuery = createAction<{
  id: string;
  filterQuery: SerializedFilterQuery;
}>('APPLY_KQL_FILTER_QUERY');

export const updateIsFavorite = createAction<{ id: string; isFavorite: boolean }>(
  'UPDATE_IS_FAVORITE'
);

export const updateTitleAndDescription = createAction<{
  description: string;
  id: string;
  title: string;
}>('UPDATE_TITLE_AND_DESCRIPTION');

export const updateProviders = createAction<{ id: string; providers: DataProvider[] }>(
  'UPDATE_PROVIDERS'
);

export const updateRange = createAction<{ id: string; start: string; end: string }>('UPDATE_RANGE');

export const updateAutoSaveMsg = createAction<{
  timelineId: string | null;
  newTimelineModel: TimelineModel | null;
}>('UPDATE_AUTO_SAVE');

export const showCallOutUnauthorizedMsg = createAction('SHOW_CALL_OUT_UNAUTHORIZED_MSG');

export const setSavedQueryId = createAction<{
  id: string;
  savedQueryId: string | null;
}>('SET_TIMELINE_SAVED_QUERY');

export const setFilters = createAction<{
  id: string;
  filters: Filter[];
}>('SET_TIMELINE_FILTERS');

export const setExcludedRowRendererIds = createAction<{
  id: string;
  excludedRowRendererIds: RowRendererId[];
}>('SET_TIMELINE_EXCLUDED_ROW_RENDERER_IDS');

export const updateDataView = createAction<{
  id: string;
  dataViewId: string;
  indexNames: string[];
}>('UPDATE_DATA_VIEW');

export const setActiveTabTimeline = createAction<{
  id: string;
  activeTab: TimelineTabs;
  scrollToTop?: boolean;
}>('SET_ACTIVE_TAB_TIMELINE');

export const toggleModalSaveTimeline = createAction<{
  id: string;
  showModalSaveTimeline: boolean;
}>('TOGGLE_MODAL_SAVE_TIMELINE');

export const updateEqlOptions = createAction<{
  id: string;
  field: FieldsEqlOptions;
  value: string | undefined;
}>('UPDATE_EQL_OPTIONS_TIMELINE');

export const updateIsLoading = createAction<{
  id: string;
  isLoading: boolean;
}>('UPDATE_LOADING');

export const toggleDetailPanel = createAction<ToggleDetailPanel>('TOGGLE_DETAIL_PANEL');

export const setEventsLoading = createAction<{
  id: string;
  eventIds: string[];
  isLoading: boolean;
}>('SET_TIMELINE_EVENTS_LOADING');

export const setEventsDeleted = createAction<{
  id: string;
  eventIds: string[];
  isDeleted: boolean;
}>('SET_TIMELINE_EVENTS_DELETED');

export const removeColumn = createAction<{
  id: string;
  columnId: string;
}>('REMOVE_COLUMN');

export const updateColumns = createAction<{
  id: string;
  columns: ColumnHeaderOptions[];
}>('UPDATE_COLUMNS');

export const updateSort = createAction<{ id: string; sort: SortColumnTimeline[] }>('UPDATE_SORT');

export const upsertColumn = createAction<{
  column: ColumnHeaderOptions;
  id: string;
  index: number;
}>('UPSERT_COLUMN');

export const setSelected = createAction<{
  id: string;
  eventIds: Record<string, TimelineNonEcsData[]>;
  isSelected: boolean;
  isSelectAllChecked: boolean;
}>('SET_TIMELINE_SELECTED');

export const clearSelected = createAction<{
  id: string;
}>('CLEAR_TIMELINE_SELECTED');

export const initializeTimelineSettings =
  createAction<InitialyzeTimelineSettings>('INITIALIZE_TIMELINE');

export const updateItemsPerPage = createAction<{ id: string; itemsPerPage: number }>(
  'UPDATE_ITEMS_PER_PAGE'
);

export const updateItemsPerPageOptions = createAction<{
  id: string;
  itemsPerPageOptions: number[];
}>('UPDATE_ITEMS_PER_PAGE_OPTIONS');

export const applyDeltaToColumnWidth = createAction<{
  id: string;
  columnId: string;
  delta: number;
}>('APPLY_DELTA_TO_COLUMN_WIDTH');

export const clearEventsLoading = createAction<{
  id: string;
}>('CLEAR_TGRID_EVENTS_LOADING');

export const clearEventsDeleted = createAction<{
  id: string;
}>('CLEAR_TGRID_EVENTS_DELETED');

export const updateTotalCount = createAction<{ id: string; totalCount: number }>(
  'UPDATE_TOTAL_COUNT'
);
