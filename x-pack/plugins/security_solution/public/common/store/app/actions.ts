/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import actionCreatorFactory from 'typescript-fsa';

import type { BareNote } from '../../../../common/api/timeline';
import type { NormalizedEntities, NormalizedEntity } from '../../../timelines/store/normalize';
import type { Note } from '../../lib/note';

const actionCreator = actionCreatorFactory('x-pack/security_solution/local/app');

export const updateNote = actionCreator<{ note: Note }>('UPDATE_NOTE');

export const addNotes = actionCreator<{ notes: Note[] }>('ADD_NOTE');

export const deleteNote = actionCreator<{ id: string }>('DELETE_NOTE');

export const addError = actionCreator<{ id: string; title: string; message: string[] }>(
  'ADD_ERRORS'
);

export const removeError = actionCreator<{ id: string }>('REMOVE_ERRORS');

export const setEventIdsToFetchNotesFor = actionCreator<{ eventIds: string[] }>(
  'SET_EVENT_IDS_TO_FETCH_NOTES_FOR'
);

export const setNonTimelineEventNotesLoading = actionCreator<{ isLoading: boolean }>(
  'SET_NON_TIMELINE_EVENT_NOTES_LOADING'
);

export const serverReturnedNonAssociatedNotes = actionCreator<{ notes: Note[] }>(
  'SERVER_RETURNED_NON_ASSOCIATED_NOTES'
);

export const fetchNotesByDocumentRequest = actionCreator<{ documentId: string }>(
  'FETCH_NOTES_BY_DOCUMENT_ID_REQUEST'
);

export const fetchNotesByDocumentSuccess = actionCreator<{
  documentId: string;
  data: NormalizedEntities<Note>;
}>('FETCH_NOTES_BY_DOCUMENT_ID_SUCCESS');

export const fetchNotesByDocumentFailure = actionCreator('FETCH_NOTES_BY_DOCUMENT_ID_FAILURE');

export const fetchNotesByDocumentsRequest = actionCreator<{ documentIds: string[] }>(
  'FETCH_NOTES_BY_DOCUMENT_IDS_REQUEST'
);

export const fetchNotesByDocumentsSuccess = actionCreator<{
  documentIds: string[];
  data: NormalizedEntities<Note>;
}>('FETCH_NOTES_BY_DOCUMENT_IDS_SUCCESS');

export const fetchNotesByDocumentsFailure = actionCreator('FETCH_NOTES_BY_DOCUMENT_IDS_FAILURE');

export const fetchNotesBySavedObjectRequest = actionCreator<{ savedObjectId: string }>(
  'FETCH_NOTES_BY_SAVED_OBJECT_ID_REQUEST'
);

export const fetchNotesBySavedObjectSuccess = actionCreator<{
  savedObjectId: string;
  data: NormalizedEntities<Note>;
}>('FETCH_NOTES_BY_SAVED_OBJECT_ID_SUCCESS');

export const fetchNotesBySavedObjectFailure = actionCreator(
  'FETCH_NOTES_BY_SAVED_OBJECT_ID_FAILURE'
);

export const createNoteForDocumentRequest = actionCreator<{ documentId: string; note: BareNote }>(
  'CREATE_NOTE_FOR_DOCUMENT_REQUEST'
);

export const createNoteForDocumentSuccess = actionCreator<{
  documentId: string;
  data: NormalizedEntity<Note>;
}>('CREATE_NOTE_FOR_DOCUMENT_SUCCESS');

export const createNoteForDocumentFailure = actionCreator('CREATE_NOTE_FOR_DOCUMENT_FAILURE');

export const createNoteForTimelineRequest = actionCreator<{
  savedObjectId: string;
  note: BareNote;
}>('CREATE_NOTE_FOR_TIMELINE_REQUEST');

export const createNoteForTimelineSuccess = actionCreator<{
  savedObjectId: string;
  data: NormalizedEntity<Note>;
}>('CREATE_NOTE_FOR_TIMELINE_SUCCESS');

export const createNoteForTimelineFailure = actionCreator('CREATE_NOTE_FOR_TIMELINE_FAILURE');

export const createNoteForDocumentAndTimelineRequest = actionCreator<{
  documentId: string;
  savedObjectId: string;
  note: BareNote;
}>('CREATE_NOTE_FOR_DOCUMENT_AND_TIMELINE_REQUEST');

export const createNoteForDocumentAndTimelineSuccess = actionCreator<{
  documentId: string;
  savedObjectId: string;
  data: NormalizedEntity<Note>;
}>('CREATE_NOTE_FOR_DOCUMENT_AND_TIMELINE_SUCCESS');

export const createNoteForDocumentAndTimelineFailure = actionCreator(
  'CREATE_NOTE_FOR_DOCUMENT_AND_TIMELINE_FAILURE'
);

export const deleteNoteRequest = actionCreator<{
  note: Note;
}>('DELETE_NOTE_REQUEST');

export const deleteNoteSuccess = actionCreator<{
  noteId: string;
  documentId: string;
  savedObjectId: string;
}>('DELETE_NOTE_SUCCESS');

export const deleteNoteFailure = actionCreator<{ noteId: string }>('DELETE_NOTE_FAILURE');

export const addErrorHash = actionCreator<{
  id: string;
  hash: string;
  title: string;
  message: string[];
}>('ADD_ERROR_HASH');

export const notesTableChange = actionCreator<{
  page: { index: number; size: number };
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}>('NOTES_TABLE_CHANGE');

export const setNotesTableSelectedItems = actionCreator<{ selectedItems: string[] }>(
  'SET_NOTES_TABLE_SELECTED_ITEMS'
);

export const setNotesTableSelectAll = actionCreator<{ isSelected: boolean }>(
  'SET_NOTES_TABLE_SELECT_ALL'
);

export const notesTableInitialize = actionCreator('NOTES_TABLE_INITIALIZE');

export const fetchNotesPaginatedSuccess = actionCreator<{ totalCount: number; notes: Note[] }>(
  'FETCH_NOTES_PAGINATED_SUCCESS'
);

export const fetchNotesPaginatedFailure = actionCreator('FETCH_NOTES_PAGINATED_FAILURE');

export const bulkDeleteNotes = actionCreator<{ noteIds: string[] }>('BULK_DELETE_NOTES');
