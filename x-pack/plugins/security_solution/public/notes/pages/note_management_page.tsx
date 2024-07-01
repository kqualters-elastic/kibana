/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import type { DefaultItemAction, EuiBasicTableColumn } from '@elastic/eui';
import { EuiBasicTable, EuiEmptyPrompt, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
// TODO unify this type from the api with the one in public/common/lib/note
import type { Note } from '../../../common/api/timeline';
import { FormattedRelativePreferenceDate } from '../../common/components/formatted_date';
import {
  userSelectedPage,
  userSelectedPerPage,
  userSelectedRow,
  userSortedNotes,
  selectAllNotes,
  selectNotesPagination,
  selectNotesTableSort,
  selectNotesTableTotalItems,
  fetchNotes,
  selectNotesTableSearch,
  selectFetchNotesStatus,
  selectNotesTablePendingDeleteIds,
  userSelectedRowForDeletion,
  selectFetchNotesError,
  ReqStatus,
} from '..';
import type { NotesState } from '..';
import { SearchRow } from '../components/search_row';
import { NotesUtilityBar } from '../components/utility_bar';
import { DeleteConfirmModal } from '../components/delete_confirm_modal';
import * as i18n from '../components/translations';
import { NOTES_MANAGEMENT_TITLE } from '../components/translations';

const columns: Array<EuiBasicTableColumn<Note>> = [
  {
    field: 'created',
    name: i18n.CREATED_COLUMN,
    sortable: true,
    render: (created: Note['created']) => <FormattedRelativePreferenceDate value={created} />,
  },
  {
    field: 'createdBy',
    name: i18n.CREATED_BY_COLUMN,
  },
  {
    field: 'eventId',
    name: i18n.EVENT_ID_COLUMN,
    sortable: true,
  },
  {
    field: 'timelineId',
    name: i18n.TIMELINE_ID_COLUMN,
  },
  {
    field: 'note',
    name: i18n.NOTE_CONTENT_COLUMN,
  },
];

const pageSizeOptions = [50, 25, 10, 0];

/**
 * Allows user to search and delete notes.
 * This component uses the same slices of state as the notes functionality of the rest of the Security Solution applicaiton.
 * Therefore, changes made in this page (like fetching or deleting notes) will have an impact everywhere.
 */
export const NoteManagementPage = () => {
  const dispatch = useDispatch();
  const notes = useSelector(selectAllNotes);
  const pagination = useSelector(selectNotesPagination);
  const sort = useSelector(selectNotesTableSort);
  const totalItems = useSelector(selectNotesTableTotalItems);
  const notesSearch = useSelector(selectNotesTableSearch);
  const pendingDeleteIds = useSelector(selectNotesTablePendingDeleteIds);
  const isDeleteModalVisible = pendingDeleteIds.length > 0;
  const fetchNotesStatus = useSelector(selectFetchNotesStatus);
  const fetchLoading = fetchNotesStatus === ReqStatus.Loading;
  const fetchError = fetchNotesStatus === ReqStatus.Failed;
  const fetchErrorData = useSelector(selectFetchNotesError);

  const fetchData = useCallback(() => {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onTableChange = useCallback(
    ({
      page,
      sort: newSort,
    }: {
      page?: { index: number; size: number };
      sort?: NotesState['sort'];
    }) => {
      if (page) {
        dispatch(userSelectedPage(page.index + 1));
        dispatch(userSelectedPerPage(page.size));
      }
      if (newSort) {
        dispatch(userSortedNotes({ field: newSort.field, direction: newSort.direction }));
      }
    },
    [dispatch]
  );

  const selectRowForDeletion = useCallback(
    (id: string) => {
      dispatch(userSelectedRowForDeletion(id));
    },
    [dispatch]
  );

  const onSelectionChange = useCallback(
    (selection: Note[]) => {
      const rowIds = selection.map((item) => item.noteId);
      dispatch(userSelectedRow(rowIds));
    },
    [dispatch]
  );

  const itemIdSelector = useCallback((item: Note) => {
    return item.noteId;
  }, []);

  const columnWithActions = useMemo(() => {
    const actions: Array<DefaultItemAction<Note>> = [
      {
        name: i18n.DELETE,
        description: i18n.DELETE_SINGLE_NOTE_DESCRIPTION,
        color: 'primary',
        icon: 'trash',
        type: 'icon',
        onClick: (note: Note) => selectRowForDeletion(note.noteId),
      },
    ];
    return [
      ...columns,
      {
        name: 'actions',
        actions,
      },
    ];
  }, [selectRowForDeletion]);

  const currentPagination = useMemo(() => {
    return {
      pageIndex: pagination.page - 1,
      pageSize: pagination.perPage,
      totalItemCount: totalItems,
      pageSizeOptions,
    };
  }, [pagination, totalItems]);

  const selection = useMemo(() => {
    return {
      onSelectionChange,
      selectable: () => true,
    };
  }, [onSelectionChange]);

  const sorting: { sort: { field: keyof Note; direction: 'asc' | 'desc' } } = useMemo(() => {
    return {
      sort,
    };
  }, [sort]);

  if (fetchError) {
    return (
      <EuiEmptyPrompt
        iconType="error"
        color="danger"
        title={<h2>{i18n.TABLE_ERROR}</h2>}
        body={<p>{fetchErrorData}</p>}
      />
    );
  }

  return (
    <>
      <EuiTitle size={'l'}>
        <h1>{NOTES_MANAGEMENT_TITLE}</h1>
      </EuiTitle>
      <EuiSpacer />
      <SearchRow />
      <NotesUtilityBar />
      <EuiBasicTable
        items={notes}
        pagination={currentPagination}
        columns={columnWithActions}
        onChange={onTableChange}
        selection={selection}
        sorting={sorting}
        itemId={itemIdSelector}
        loading={fetchLoading}
      />
      {isDeleteModalVisible && <DeleteConfirmModal />}
    </>
  );
};

NoteManagementPage.displayName = 'NoteManagementPage';
