/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import { TimelineNonEcsData } from '@kbn/timelines-plugin/common';
import type { ExpandedDetailType } from '../../common/types/detail_panel';
import type {
  ColumnHeaderOptions,
  SessionViewConfig,
  SortColumnTable,
  ViewSelection,
} from '../../common/types';
import type { InitialyzeDataTableSettings, DataTablePersistInput } from './types';

export const createDataTable = createAction<DataTablePersistInput>('TABLE_CREATE_DATA_TABLE');

export const upsertColumn = createAction<{
  column: ColumnHeaderOptions;
  id: string;
  index: number;
}>('TABLE_UPSERT_COLUMN');

export const applyDeltaToColumnWidth = createAction<{
  id: string;
  columnId: string;
  delta: number;
}>('TABLE_APPLY_DELTA_TO_COLUMN_WIDTH');

export const updateColumnOrder = createAction<{
  columnIds: string[];
  id: string;
}>('TABLE_UPDATE_COLUMN_ORDER');

export const updateColumnWidth = createAction<{
  columnId: string;
  id: string;
  width: number;
}>('TABLE_UPDATE_COLUMN_WIDTH');

export type TableToggleDetailPanel = ExpandedDetailType & {
  tabType?: string;
  id: string;
};

export const toggleDetailPanel = createAction<TableToggleDetailPanel>('TABLE_TOGGLE_DETAIL_PANEL');

export const removeColumn = createAction<{
  id: string;
  columnId: string;
}>('TABLE_REMOVE_COLUMN');

export const updateIsLoading = createAction<{
  id: string;
  isLoading: boolean;
}>('TABLE_UPDATE_LOADING');

export const updateColumns = createAction<{
  id: string;
  columns: ColumnHeaderOptions[];
}>('TABLE_UPDATE_COLUMNS');

export const updateItemsPerPage = createAction<{ id: string; itemsPerPage: number }>(
  'TABLE_UPDATE_ITEMS_PER_PAGE'
);

export const updateItemsPerPageOptions = createAction<{
  id: string;
  itemsPerPageOptions: number[];
}>('TABLE_UPDATE_ITEMS_PER_PAGE_OPTIONS');

export const updateSort = createAction<{ id: string; sort: SortColumnTable[] }>('TABLE_UPDATE_SORT');

export const setSelected = createAction<{
  id: string;
  eventIds: Readonly<Record<string, TimelineNonEcsData[]>>;
  isSelected: boolean;
  isSelectAllChecked: boolean;
}>('TABLE_SET_DATA_TABLE_SELECTED');

export const clearSelected = createAction<{
  id: string;
}>('TABLE_CLEAR_DATA_TABLE_SELECTED');

export const setEventsLoading = createAction<{
  id: string;
  eventIds: string[];
  isLoading: boolean;
}>('TABLE_SET_DATA_TABLE_EVENTS_LOADING');

export const clearEventsLoading = createAction<{
  id: string;
}>('TABLE_CLEAR_DATA_TABLE_EVENTS_LOADING');

export const setEventsDeleted = createAction<{
  id: string;
  eventIds: string[];
  isDeleted: boolean;
}>('TABLE_SET_DATA_TABLE_EVENTS_DELETED');

export const clearEventsDeleted = createAction<{
  id: string;
}>('TABLE_CLEAR_DATA_TABLE_EVENTS_DELETED');

export const initializeDataTableSettings =
  createAction<InitialyzeDataTableSettings>('TABLE_INITIALIZE_DATA_TABLE');

export const setDataTableSelectAll = createAction<{ id: string; selectAll: boolean }>(
  'TABLE_SET_DATA_TABLE_SELECT_ALL'
);

export const updateGraphEventId = createAction<{ id: string; graphEventId: string }>(
  'TABLE_UPDATE_DATA_TABLE_GRAPH_EVENT_ID'
);

export const updateSessionViewConfig = createAction<{
  id: string;
  sessionViewConfig: SessionViewConfig | null;
}>('TABLE_UPDATE_DATA_TABLE_SESSION_VIEW_CONFIG');

export const setTableUpdatedAt = createAction<{ id: string; updated: number }>(
  'TABLE_SET_TABLE_UPDATED_AT'
);

export const updateTotalCount = createAction<{ id: string; totalCount: number }>(
  'TABLE_UPDATE_TOTAL_COUNT'
);

export const changeViewMode = createAction<{
  id: string;
  viewMode: ViewSelection;
}>('TABLE_CHANGE_ALERT_TABLE_VIEW_MODE');

export const updateShowBuildingBlockAlertsFilter = createAction<{
  id: string;
  showBuildingBlockAlerts: boolean;
}>('TABLE_UPDATE_BUILDING_BLOCK_ALERTS_FILTER');

export const updateShowThreatIndicatorAlertsFilter = createAction<{
  id: string;
  showOnlyThreatIndicatorAlerts: boolean;
}>('TABLE_UPDATE_SHOW_THREAT_INDICATOR_ALERTS_FILTER');
