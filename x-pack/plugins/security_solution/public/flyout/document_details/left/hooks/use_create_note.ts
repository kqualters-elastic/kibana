/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { buildEsQuery } from '@kbn/es-query';
import type { IEsSearchRequest } from '@kbn/search-types';
import { useQuery } from '@tanstack/react-query';
import type { Note } from '../../../../../common/api/timeline';
import { createFetchData } from '../../shared/utils/fetch_data';
import { useTimelineDataFilters } from '../../../../timelines/containers/use_timeline_data_filters';
import { isActiveTimeline } from '../../../../helpers';
import { useKibana } from '../../../../common/lib/kibana';
import { SourcererScopeName } from '../../../../common/store/sourcerer/model';

const QUERY_KEY = 'useFetchNotes';

export interface UseCreateNoteParams {
  /**
   *
   * */
  eventId: string;
}

export interface UseCreateNoteResult {
  /**
   * Returns true if data is being loaded
   */
  loading: boolean;
  /**
   * Returns true if fetching data has errored out
   */
  error: boolean;
  /**
   *
   */
  data: Note;
}

/**
 *
 */
export const useCreateNote = ({ eventId }: UseCreateNoteParams): UseCreateNoteResult => {
  const {
    services: {
      data: { search: searchService },
    },
  } = useKibana();

  const { selectedPatterns } = useTimelineDataFilters(isActiveTimeline(SourcererScopeName.default));

  const searchRequest = buildSearchRequest(eventId, selectedPatterns);

  const { data, isLoading, isError } = useQuery([QUERY_KEY, eventId], () =>
    createFetchData<Note>(searchService, searchRequest)
  );

  const mockedData: Note = {
    noteId: '1ff3f0c8-8b08-4522-aeac-715d758f7640',
    version: 'WzUyOTQsMV0=',
    timelineId: 'f8cdd558-c5d9-4e4a-aa58-a341bc616f9a',
    note: 'aqdd new notes',
    created: 1716493065230,
    createdBy: 'elastic',
    updated: 1716493065230,
    updatedBy: 'elastic',
  };

  return {
    loading: isLoading,
    error: isError,
    data: mockedData,
  };
};

/**
 *
 */
const buildSearchRequest = (eventId: string, selectedPatterns: string[]): IEsSearchRequest => {
  const query = buildEsQuery(
    undefined,
    [],
    [
      {
        query: {
          terms: {
            _id: [eventId],
          },
        },
        meta: {},
      },
    ]
  );

  return {
    params: {
      index: selectedPatterns,
      body: {
        query,
      },
    },
  };
};
