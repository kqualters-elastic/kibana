/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';
import {
  applyDeltaToColumnWidth,
  clearEventsDeleted,
  clearEventsLoading,
  clearSelected,
  createDataTable,
  initializeDataTableSettings,
  removeColumn,
  setEventsDeleted,
  setEventsLoading,
  setDataTableSelectAll,
  setSelected,
  toggleDetailPanel,
  updateColumnOrder,
  updateColumns,
  updateColumnWidth,
  updateIsLoading,
  updateItemsPerPage,
  updateItemsPerPageOptions,
  updateSort,
  upsertColumn,
  updateGraphEventId,
  updateSessionViewConfig,
  setTableUpdatedAt,
  updateTotalCount,
  changeViewMode,
  updateShowBuildingBlockAlertsFilter,
  updateShowThreatIndicatorAlertsFilter,
} from './actions';

import {
  applyDeltaToTableColumnWidth,
  createInitDataTable,
  setInitializeDataTableSettings,
  removeTableColumn,
  setDeletedTableEvents,
  setLoadingTableEvents,
  setSelectedTableEvents,
  updateDataTableColumnOrder,
  updateDataTableColumnWidth,
  updateTableColumns,
  updateTableItemsPerPage,
  updateTablePerPageOptions,
  updateTableSort,
  upsertTableColumn,
  updateTableDetailsPanel,
  updateTableGraphEventId,
  updateTableSessionViewConfig,
} from './helpers';

import type { TableState } from './types';
import { EMPTY_TABLE_BY_ID } from './types';

const initialDataTableState: TableState = {
  tableById: EMPTY_TABLE_BY_ID,
};

/** The reducer for all data table actions  */
export const dataTableReducer = createReducer(initialDataTableState, (builder) =>
  builder
    .addCase(upsertColumn, (state, { payload: { column, id, index } }) => ({
      ...state,
      tableById: upsertTableColumn({ column, id, index, tableById: state.tableById }),
    }))
    .addCase(createDataTable, (state, { payload: tableProps }) => {
      return {
        ...state,
        tableById: createInitDataTable({
          ...tableProps,
          tableById: state.tableById,
        }),
      };
    })
    .addCase(
      initializeDataTableSettings,
      (state, { payload: { id, ...dataTableSettingsProps } }) => ({
        ...state,
        tableById: setInitializeDataTableSettings({
          id,
          tableById: state.tableById,
          dataTableSettingsProps,
        }),
      })
    )
    .addCase(toggleDetailPanel, (state, { payload }) => {
      return {
        ...state,
        tableById: {
          ...state.tableById,
          [payload.id]: {
            ...state.tableById[payload.id],
            expandedDetail: {
              ...state.tableById[payload.id].expandedDetail,
              ...updateTableDetailsPanel(payload),
            },
          },
        },
      };
    })
    .addCase(applyDeltaToColumnWidth, (state, { payload: { id, columnId, delta } }) => ({
      ...state,
      tableById: applyDeltaToTableColumnWidth({
        id,
        columnId,
        delta,
        tableById: state.tableById,
      }),
    }))
    .addCase(updateColumnOrder, (state, { payload: { id, columnIds } }) => ({
      ...state,
      tableById: updateDataTableColumnOrder({
        columnIds,
        id,
        tableById: state.tableById,
      }),
    }))
    .addCase(updateColumnWidth, (state, { payload: { id, columnId, width } }) => ({
      ...state,
      tableById: updateDataTableColumnWidth({
        columnId,
        id,
        tableById: state.tableById,
        width,
      }),
    }))
    .addCase(removeColumn, (state, { payload: { id, columnId } }) => ({
      ...state,
      tableById: removeTableColumn({
        id,
        columnId,
        tableById: state.tableById,
      }),
    }))
    .addCase(setEventsDeleted, (state, { payload: { id, eventIds, isDeleted } }) => ({
      ...state,
      tableById: setDeletedTableEvents({
        id,
        eventIds,
        tableById: state.tableById,
        isDeleted,
      }),
    }))
    .addCase(clearEventsDeleted, (state, { payload: { id } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          deletedEventIds: [],
        },
      },
    }))
    .addCase(setEventsLoading, (state, { payload: { id, eventIds, isLoading } }) => ({
      ...state,
      tableById: setLoadingTableEvents({
        id,
        eventIds,
        tableById: state.tableById,
        isLoading,
      }),
    }))
    .addCase(clearEventsLoading, (state, { payload: { id } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          loadingEventIds: [],
        },
      },
    }))
    .addCase(
      setSelected,
      (state, { payload: { id, eventIds, isSelected, isSelectAllChecked } }) => ({
        ...state,
        tableById: setSelectedTableEvents({
          id,
          eventIds,
          tableById: state.tableById,
          isSelected,
          isSelectAllChecked,
        }),
      })
    )
    .addCase(clearSelected, (state, { payload: { id } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          selectedEventIds: {},
          isSelectAllChecked: false,
        },
      },
    }))
    .addCase(updateIsLoading, (state, { payload: { id, isLoading } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          isLoading,
        },
      },
    }))
    .addCase(updateColumns, (state, { payload: { id, columns } }) => ({
      ...state,
      tableById: updateTableColumns({
        id,
        columns,
        tableById: state.tableById,
      }),
    }))
    .addCase(updateSort, (state, { payload: { id, sort } }) => ({
      ...state,
      tableById: updateTableSort({ id, sort, tableById: state.tableById }),
    }))
    .addCase(updateItemsPerPage, (state, { payload: { id, itemsPerPage } }) => ({
      ...state,
      tableById: updateTableItemsPerPage({
        id,
        itemsPerPage,
        tableById: state.tableById,
      }),
    }))
    .addCase(updateItemsPerPageOptions, (state, { payload: { id, itemsPerPageOptions } }) => ({
      ...state,
      tableById: updateTablePerPageOptions({
        id,
        itemsPerPageOptions,
        tableById: state.tableById,
      }),
    }))
    .addCase(setDataTableSelectAll, (state, { payload: { id, selectAll } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          selectAll,
        },
      },
    }))
    .addCase(updateGraphEventId, (state, { payload: { id, graphEventId } }) => ({
      ...state,
      tableById: updateTableGraphEventId({ id, graphEventId, tableById: state.tableById }),
    }))
    .addCase(updateSessionViewConfig, (state, { payload: { id, sessionViewConfig } }) => ({
      ...state,
      tableById: updateTableSessionViewConfig({
        id,
        sessionViewConfig,
        tableById: state.tableById,
      }),
    }))
    .addCase(setTableUpdatedAt, (state, { payload: { id, updated } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          updated,
        },
      },
    }))
    .addCase(updateTotalCount, (state, { payload: { id, totalCount } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          totalCount,
        },
      },
    }))
    .addCase(changeViewMode, (state, { payload: { id, viewMode } }) => ({
      ...state,
      tableById: {
        ...state.tableById,
        [id]: {
          ...state.tableById[id],
          viewMode,
        },
      },
    }))
    .addCase(
      updateShowBuildingBlockAlertsFilter,
      (state, { payload: { id, showBuildingBlockAlerts } }) => ({
        ...state,
        tableById: {
          ...state.tableById,
          [id]: {
            ...state.tableById[id],
            additionalFilters: {
              ...state.tableById[id].additionalFilters,
              showBuildingBlockAlerts,
            },
          },
        },
      })
    )
    .addCase(
      updateShowThreatIndicatorAlertsFilter,
      (
        state,
        {
          payload: {
            payload: { id, showOnlyThreatIndicatorAlerts },
          },
        }
      ) => ({
        ...state,
        tableById: {
          ...state.tableById,
          [id]: {
            ...state.tableById[id],
            additionalFilters: {
              ...state.tableById[id].additionalFilters,
              showOnlyThreatIndicatorAlerts,
            },
          },
        },
      })
    )
);
