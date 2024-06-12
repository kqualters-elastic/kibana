/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { NOTE_URL } from '../../../../common/constants';
import type { BareNote, Note } from '../../../../common/api/timeline';
import { KibanaServices } from '../../../common/lib/kibana';

export const persistNote = async ({
  note,
  noteId,
  version,
  overrideOwner,
}: {
  note: BareNote;
  noteId?: string | null;
  version?: string | null;
  overrideOwner?: boolean;
}) => {
  let requestBody;

  try {
    requestBody = JSON.stringify({ noteId, version, note, overrideOwner });
  } catch (err) {
    return Promise.reject(new Error(`Failed to stringify query: ${JSON.stringify(err)}`));
  }
  const response = await KibanaServices.get().http.patch<Note[]>(NOTE_URL, {
    method: 'PATCH',
    body: requestBody,
    version: '2023-10-31',
  });
  return response;
};

export const deleteNote = async (noteId: string) => {
  const response = await KibanaServices.get().http.delete<Note[]>(NOTE_URL, {
    body: JSON.stringify({ noteId }),
    version: '2023-10-31',
  });
  return response;
};

export const bulkDeleteNotes = async (noteIds: string[]) => {
  const response = await KibanaServices.get().http.delete<Note[]>(NOTE_URL, {
    body: JSON.stringify({ noteIds }),
    version: '2023-10-31',
  });
  return response;
};

export const getNotesByIds = async (documentIds: string[]) => {
  const response = await KibanaServices.get().http.get<Note[]>(NOTE_URL, {
    query: { alertIds: documentIds },
    version: '2023-10-31',
  });
  return response;
};

export const fetchNotesPaginatedAndSorted = async ({
  page,
  perPage,
  sortField,
  sortOrder,
  filter,
  search,
}: {
  page: number;
  perPage: number;
  sortField: string;
  sortOrder: string;
  filter: string;
  search: string;
}) => {
  const response = await KibanaServices.get().http.get<{ totalCount: number; notes: Note[] }>(
    NOTE_URL,
    {
      query: {
        page,
        perPage,
        sortField,
        sortOrder,
        filter,
        search,
      },
      version: '2023-10-31',
    }
  );
  return response;
};

export const fetchNotesByDocumentId = async (documentId: string) => {
  const response = await KibanaServices.get().http.get<Note[]>(NOTE_URL, {
    query: {
      alertIds: [documentId],
      page: '1',
      perPage: '10',
      search: '',
      sortField: '',
      sortOrder: 'asc',
      filter: '',
    },
    version: '2023-10-31',
  });
  return response;
};

export const fetchNotesByDocumentIds = async (documentIds: string[]) => {
  const response = await KibanaServices.get().http.get<Note[]>(NOTE_URL, {
    query: {
      alertIds: documentIds,
      page: '1',
      perPage: '10',
      search: '',
      sortField: '',
      sortOrder: 'asc',
      filter: '',
    },
    version: '2023-10-31',
  });
  return response;
};

// TODO implement that
export const fetchNotesBySavedObjectIdId = async (savedObjectId: string) => {
  const response = await KibanaServices.get().http.get<Note[]>(NOTE_URL, {
    query: { savedObjectId },
    version: '2023-10-31',
  });
  return response;
};
