/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiContextMenuItem } from '@elastic/eui';
import {
  UtilityBarGroup,
  UtilityBarText,
  UtilityBar,
  UtilityBarSection,
  UtilityBarAction,
} from '../../common/components/utility_bar';
import {
  selectNotesPagination,
  selectNotesTableSort,
  selectNotesTableTotalItems,
  fetchNotes,
  selectNotesTableSelectedIds,
  selectNotesTableSearch,
  userSelectedBulkDelete,
} from '..';
import * as i18n from './translations';

export const NotesUtilityBar = React.memo(() => {
  const dispatch = useDispatch();
  const pagination = useSelector(selectNotesPagination);
  const sort = useSelector(selectNotesTableSort);
  const totalItems = useSelector(selectNotesTableTotalItems);
  const selectedItems = useSelector(selectNotesTableSelectedIds);
  const resultsCount = useMemo(() => {
    const { perPage, page } = pagination;
    const startOfCurrentPage = perPage * (page - 1) + 1;
    const endOfCurrentPage = Math.min(perPage * page, totalItems);
    return perPage === 0 ? 'All' : `${startOfCurrentPage}-${endOfCurrentPage} of ${totalItems}`;
  }, [pagination, totalItems]);
  const deleteSelectedNotes = useCallback(() => {
    dispatch(userSelectedBulkDelete());
  }, [dispatch]);
  const notesSearch = useSelector(selectNotesTableSearch);

  const BulkActionPopoverContent = useCallback(
    (closePopover) => {
      return (
        <div>
          <EuiContextMenuItem
            data-test-subj="delete-notes"
            onClick={deleteSelectedNotes}
            disabled={selectedItems.length === 0}
            icon="trash"
            key="DeleteItemKey"
          >
            {i18n.DELETE_SELECTED}
          </EuiContextMenuItem>
        </div>
      );
    },
    [deleteSelectedNotes, selectedItems.length]
  );
  const refresh = useCallback(() => {
    dispatch(
      fetchNotes({
        page: pagination.page,
        perPage: pagination.perPage,
        sortField: sort.field,
        sortOrder: sort.direction,
        filter: '',
        search: notesSearch,
      })
    );
  }, [dispatch, pagination.page, pagination.perPage, sort.field, sort.direction, notesSearch]);
  return (
    <UtilityBar border>
      <UtilityBarSection>
        <UtilityBarGroup>
          <UtilityBarText data-test-subj="query-message">
            {`Showing: ${resultsCount}`}
          </UtilityBarText>
        </UtilityBarGroup>
        <UtilityBarGroup>
          <UtilityBarText data-test-subj="selected-count">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : ''}
          </UtilityBarText>
          <UtilityBarAction
            dataTestSubj="batchActions"
            iconSide="right"
            iconType="arrowDown"
            popoverContent={BulkActionPopoverContent}
            data-test-subj="utility-bar-action"
          >
            <span data-test-subj="utility-bar-action-button">{i18n.BATCH_ACTIONS}</span>
          </UtilityBarAction>
          <UtilityBarAction
            dataTestSubj="refreshButton"
            iconSide="right"
            iconType="refresh"
            onClick={refresh}
          >
            {i18n.REFRESH}
          </UtilityBarAction>
        </UtilityBarGroup>
      </UtilityBarSection>
    </UtilityBar>
  );
});

NotesUtilityBar.displayName = 'NotesUtilityBar';
