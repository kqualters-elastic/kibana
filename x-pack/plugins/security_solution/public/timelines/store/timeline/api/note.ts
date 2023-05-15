/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { NoteSavedObject, SavedNote } from '../../../../../common/types/timeline/note';
import { NOTE_URL } from '../../../../../common/constants';
import { kibanaBaseQuery } from '.';

export const noteApi = createApi({
  baseQuery: kibanaBaseQuery({
    baseUrl: NOTE_URL,
  }),
  tagTypes: ['Post'],
  endpoints: (build) => ({
    updatePost: build.mutation({
      // note: an optional `queryFn` may be used in place of `query`
      query: ({ noteId, version, note, overrideOwner }) => ({
        url: `/`,
        method: 'PATCH',
        body: { noteId, version, note, overrideOwner },
      }),
    }),
  }),
});
