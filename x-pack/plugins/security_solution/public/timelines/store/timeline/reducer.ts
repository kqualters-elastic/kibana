/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createReducer } from '@reduxjs/toolkit';

import {
  addNote,
  addNoteToEvent,
  addProvider,
  addTimeline,
  applyKqlFilterQuery,
  createTimeline,
  dataProviderEdited,
  endTimelineSaving,
  pinEvent,
  removeProvider,
  setActiveTabTimeline,
  setExcludedRowRendererIds,
  setFilters,
  setInsertTimeline,
  setSavedQueryId,
  showCallOutUnauthorizedMsg,
  showTimeline,
  startTimelineSaving,
  unPinEvent,
  updateAutoSaveMsg,
  updateDataProviderEnabled,
  updateDataProviderExcluded,
  updateDataProviderType,
  updateDataView,
  updateIsFavorite,
  updateKqlMode,
  updateProviders,
  updateRange,
  updateTimeline,
  updateGraphEventId,
  updateTitleAndDescription,
  updateSessionViewConfig,
  toggleModalSaveTimeline,
  updateEqlOptions,
  setTimelineUpdatedAt,
  toggleDetailPanel,
  setEventsLoading,
  removeColumn,
  upsertColumn,
  updateColumns,
  updateIsLoading,
  updateSort,
  clearSelected,
  setSelected,
  setEventsDeleted,
  initializeTimelineSettings,
  updateItemsPerPage,
  updateItemsPerPageOptions,
  applyDeltaToColumnWidth,
  clearEventsDeleted,
  clearEventsLoading,
} from './actions';

import {
  addNewTimeline,
  addTimelineNote,
  addTimelineNoteToEvent,
  addTimelineProviders,
  addTimelineToStore,
  applyKqlFilterQueryDraft,
  pinTimelineEvent,
  removeTimelineProvider,
  unPinTimelineEvent,
  updateExcludedRowRenderersIds,
  updateTimelineIsFavorite,
  updateTimelineKqlMode,
  updateTimelineProviderEnabled,
  updateTimelineProviderExcluded,
  updateTimelineProviderProperties,
  updateTimelineProviderType,
  updateTimelineProviders,
  updateTimelineRange,
  updateTimelineShowTimeline,
  updateTimelineTitleAndDescription,
  updateSavedQuery,
  updateTimelineGraphEventId,
  updateFilters,
  updateTimelineSessionViewConfig,
  updateTimelineDetailsPanel,
  setLoadingTableEvents,
  removeTableColumn,
  upsertTableColumn,
  updateTableColumns,
  updateTableSort,
  setSelectedTableEvents,
  setDeletedTableEvents,
  setInitializeTimelineSettings,
  applyDeltaToTableColumnWidth,
  updateTimelinePerPageOptions,
  updateTimelineItemsPerPage,
} from './helpers';

import type { TimelineState } from './types';
import { EMPTY_TIMELINE_BY_ID } from './types';
import { TimelineType } from '../../../../common/types/timeline';

export const initialTimelineState: TimelineState = {
  timelineById: EMPTY_TIMELINE_BY_ID,
  autoSavedWarningMsg: {
    timelineId: null,
    newTimelineModel: null,
  },
  showCallOutUnauthorizedMsg: false,
  insertTimeline: null,
};

/** The reducer for all timeline actions  */
export const timelineReducer = createReducer(initialTimelineState, (builder) =>
  builder
    .addCase(addTimeline, (state, { payload: { id, timeline, resolveTimelineConfig } }) => {
      const newTimeline = addTimelineToStore({
        id,
        timeline,
        resolveTimelineConfig,
        timelineById: draft.timelineById,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(
      createTimeline,
      (state, { payload: { id, timelineType = TimelineType.default, ...timelineProps } }) => {
        const newTimeline = addNewTimeline({
          id,
          timelineType,
          timelineById: state.timelineById,
          ...timelineProps,
        });
        state.timelineById[id] = newTimeline;
      }
    )
    .addCase(addNote, (state, { payload: { id, noteId } }) => {
      state.timelineById[id].noteIds.push(noteId);
    })
    .addCase(addNoteToEvent, (state, { payload: { id, noteId, eventId } }) => {
      state.timelineById[id].existingNoteIds = addTimelineNoteToEvent({
        id,
        noteId,
        eventId,
        timelineById: state.timelineById,
      });
    })
    .addCase(addProvider, (state, { payload: { id, providers } }) => {
      state.timelineById[id] = addTimelineProviders({
        id,
        providers,
        timelineById: state.timelineById,
      });
    })
    .addCase(applyKqlFilterQuery, (state, { payload: { id, filterQuery } }) => {
      const newTimelines = applyKqlFilterQueryDraft({
        id,
        filterQuery,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimelines;
    })
    .addCase(showTimeline, (state, { payload: { id, show } }) => {
      const currentTimeline = state.timelineById[id];
      if (currentTimeline) {
        currentTimeline.show = show;
      }
    })
    .addCase(updateGraphEventId, (state, { payload: { id, graphEventId } }) => {
      const newTimeline = updateTimelineGraphEventId({
        id,
        graphEventId,
        timelineById: state.timelineById,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(updateSessionViewConfig, (state, { payload: { id, sessionViewConfig } }) => {
      const newTimelines = updateTimelineSessionViewConfig({
        id,
        sessionViewConfig,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimelines;
    })
    .addCase(pinEvent, (state, { payload: { id, eventId } }) => {
      // here
      state.timelineById = pinTimelineEvent({ id, eventId, timelineById: state.timelineById });
    })
    .addCase(removeProvider, (state, { payload: { id, providerId, andProviderId } }) => {
      const newTimelines = removeTimelineProvider({
        id,
        providerId,
        timelineById: state.timelineById,
        andProviderId,
      });
      state.timelineById = newTimelines;
    })
    .addCase(startTimelineSaving, (state, { payload: { id } }) => {
      const currentTimeline = state.timelineById[id];
      if (currentTimeline) {
        currentTimeline.isSaving = true;
      }
    })
    .addCase(endTimelineSaving, (state, { payload: { id } }) => {
      const currentTimeline = state.timelineById[id];
      if (currentTimeline) {
        currentTimeline.isSaving = false;
      }
    })
    .addCase(setExcludedRowRendererIds, (state, { payload: { id, excludedRowRendererIds } }) => {
      const newTimelines = updateExcludedRowRenderersIds({
        id,
        excludedRowRendererIds,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimelines;
    })
    .addCase(updateTimeline, (state, { payload: { id, timeline } }) => {
      state.timelineById[id] = timeline;
    })
    .addCase(unPinEvent, (state, { payload: { id, eventId } }) => {
      state.timelineById = unPinTimelineEvent({ id, eventId, timelineById: state.timelineById });
    })
    .addCase(updateIsFavorite, (state, { payload: { id, isFavorite } }) => {
      state.timelineById = updateTimelineIsFavorite({
        id,
        isFavorite,
        timelineById: state.timelineById,
      });
    })
    .addCase(updateKqlMode, (state, { payload: { id, kqlMode } }) => {
      state.timelineById = updateTimelineKqlMode({ id, kqlMode, timelineById: state.timelineById });
    })
    .addCase(updateTitleAndDescription, (state, { payload: { id, title, description } }) => {
      const newTimelines = updateTimelineTitleAndDescription({
        id,
        title,
        description,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimelines;
    })
    .addCase(updateProviders, (state, { payload: { id, providers } }) => {
      state.timelineById = updateTimelineProviders({
        id,
        providers,
        timelineById: state.timelineById,
      });
    })
    .addCase(updateRange, (state, { payload: { id, start, end } }) => {
      state.timelineById = updateTimelineRange({
        id,
        start,
        end,
        timelineById: state.timelineById,
      });
    })
    .addCase(
      updateDataProviderEnabled,
      (state, { payload: { id, enabled, providerId, andProviderId } }) => {
        const newTimelines = updateTimelineProviderEnabled({
          id,
          enabled,
          providerId,
          timelineById: state.timelineById,
          andProviderId,
        });
        state.timelineById = newTimelines;
      }
    )
    .addCase(
      updateDataProviderExcluded,
      (state, { payload: { id, excluded, providerId, andProviderId } }) => {
        const newTimelines = updateTimelineProviderExcluded({
          id,
          excluded,
          providerId,
          timelineById: state.timelineById,
          andProviderId,
        });
        state.timelineById = newTimelines;
      }
    )
    .addCase(
      dataProviderEdited,
      (state, { payload: { andProviderId, excluded, field, id, operator, providerId, value } }) => {
        const newTimelines = updateTimelineProviderProperties({
          andProviderId,
          excluded,
          field,
          id,
          operator,
          providerId,
          timelineById: state.timelineById,
          value,
        });
        state.timelineById = newTimelines;
      }
    )
    .addCase(
      updateDataProviderType,
      (state, { payload: { id, type, providerId, andProviderId } }) => {
        const newTimelines = updateTimelineProviderType({
          id,
          type,
          providerId,
          timelineById: state.timelineById,
          andProviderId,
        });
        state.timelineById = newTimelines;
      }
    )
    .addCase(updateAutoSaveMsg, (state, { payload: { timelineId, newTimelineModel } }) => {
      state.autoSavedWarningMsg = {
        timelineId,
        newTimelineModel,
      };
    })
    .addCase(showCallOutUnauthorizedMsg, (state) => {
      state.showCallOutUnauthorizedMsg = true;
    })
    .addCase(setSavedQueryId, (state, { payload: { id, savedQueryId } }) => {
      const newTimelines = updateSavedQuery({
        id,
        savedQueryId,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimelines;
    })
    .addCase(setFilters, (state, { payload: { id, filters } }) => {
      const newTimeline = updateFilters({
        id,
        filters,
        timelineById: state.timelineById,
      });
      state.timelineById = newTimeline;
    })
    .addCase(
      setInsertTimeline,
      (state, { payload: { graphEventId, timelineId, timelineSavedObjectId, timelineTitle } }) => {
        const timeline = state.timelineById[timelineId];
        if (timeline) {
          timeline.savedObjectId = timelineSavedObjectId;
          timeline.title = timelineTitle;
        }
      }
    )
    .addCase(updateDataView, (state, { payload: { id, dataViewId, indexNames } }) => {
      state.timelineById[id].dataViewId = dataViewId;
      state.timelineById[id].indexNames = indexNames;
    })
    .addCase(setActiveTabTimeline, (state, { payload: { id, activeTab, scrollToTop } }) => {
      const currentTimeline = state.timelineById[id];
      currentTimeline.prevActiveTab = currentTimeline.activeTab;
      currentTimeline.activeTab = activeTab;
      if (scrollToTop) {
        currentTimeline.scrollToTop.timestamp = Math.floor(Date.now() / 1000);
      }
    })
    .addCase(toggleModalSaveTimeline, (state, { payload: { id, showModalSaveTimeline } }) => {
      state.timelineById[id].showSaveModal = showModalSaveTimeline;
    })
    .addCase(updateEqlOptions, (state, { payload: { id, field, value } }) => {
      let currentEqlOptions = state.timelineById[id].eqlOptions;
      currentEqlOptions = {
        ...currentEqlOptions,
        [field]: value,
      };
    })
    .addCase(setTimelineUpdatedAt, (state, { payload: { id, updated } }) => {
      state.timelineById[id].updated = updated;
    })
    .addCase(toggleDetailPanel, (state, { payload: { tabType, id, ...expandedDetails } }) => {
      state.timelineById[id].expandedDetail = updateTimelineDetailsPanel({
        tabType,
        id,
        expandedDetails,
      });
    })
    .addCase(setEventsLoading, (state, { payload: { id, eventIds, isLoading } }) => {
      state.timelineById = setLoadingTableEvents({
        id,
        eventIds,
        timelineById: state.timelineById,
        isLoading,
      });
    })
    .addCase(removeColumn, (state, { payload: { id, columnId } }) => {
      state.timelineById = removeTableColumn({
        id,
        columnId,
        timelineById: state.timelineById,
      });
    })
    .addCase(upsertColumn, (state, { payload: { column, id, index } }) => {
      state.timelineById = upsertTableColumn({
        column,
        id,
        index,
        timelineById: state.timelineById,
      });
    })
    .addCase(updateColumns, (state, { payload: { id, columns } }) => {
      state.timelineById = updateTableColumns({
        id,
        columns,
        timelineById: state.timelineById,
      });
    })
    .addCase(updateIsLoading, (state, { payload: { id, isLoading } }) => {
      const currentTimeline = state.timelineById[id];
      if (currentTimeline) {
        currentTimeline.isLoading = isLoading;
      }
    })
    .addCase(updateSort, (state, { payload: { id, sort } }) => {
      state.timelineById = updateTableSort({ id, sort, timelineById: state.timelineById });
    })
    .addCase(
      setSelected,
      (state, { payload: { id, eventIds, isSelected, isSelectAllChecked } }) => {
        const newTimeline = setSelectedTableEvents({
          id,
          eventIds,
          timelineById: state.timelineById,
          isSelected,
          isSelectAllChecked,
        });
        state.timelineById[id] = newTimeline;
      }
    )
    .addCase(clearSelected, (state, { payload: { id } }) => {
      state.timelineById[id].selectedEventIds = {};
      state.timelineById[id].isSelectAllChecked = false;
    })
    .addCase(setEventsDeleted, (state, { payload: { id, eventIds, isDeleted } }) => {
      const newTimeline = setDeletedTableEvents({
        id,
        eventIds,
        timelineById: state.timelineById,
        isDeleted,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(initializeTimelineSettings, (state, { payload: { id, ...timelineSettingsProps } }) => {
      if (state.timelineById[id].initialized === false) {
        const newTimeline = setInitializeTimelineSettings({
          id,
          timelineById: state.timelineById,
          timelineSettingsProps,
        });
        state.timelineById[id] = newTimeline;
      }
    })
    .addCase(updateItemsPerPage, (state, { payload: { id, itemsPerPage } }) => {
      const newTimeline = updateTimelineItemsPerPage({
        id,
        itemsPerPage,
        timelineById: state.timelineById,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(updateItemsPerPageOptions, (state, { payload: { id, itemsPerPageOptions } }) => {
      const newTimeline = updateTimelinePerPageOptions({
        id,
        itemsPerPageOptions,
        timelineById: state.timelineById,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(applyDeltaToColumnWidth, (state, { payload: { id, columnId, delta } }) => {
      const newTimeline = applyDeltaToTableColumnWidth({
        id,
        columnId,
        delta,
        timelineById: state.timelineById,
      });
      state.timelineById[id] = newTimeline;
    })
    .addCase(clearEventsDeleted, (state, { payload: { id } }) => {
      const currentTimeline = state.timelineById[id];
      currentTimeline.deletedEventIds = [];
    })
    .addCase(clearEventsLoading, (state, { payload: { id } }) => {
      const currentTimeline = state.timelineById[id];
      currentTimeline.loadingEventIds = [];
    })
);
