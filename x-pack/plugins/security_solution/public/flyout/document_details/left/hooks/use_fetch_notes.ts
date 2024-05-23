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

export interface UseFetchNotesParams {
  /**
   *
   * */
  documentIds: string[];
}

export interface UseFetchNotesResult {
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
  data: Note[];
}

/**
 *
 */
export const useFetchNotes = ({ documentIds }: UseFetchNotesParams): UseFetchNotesResult => {
  const {
    services: {
      data: { search: searchService },
    },
  } = useKibana();

  const { selectedPatterns } = useTimelineDataFilters(isActiveTimeline(SourcererScopeName.default));

  const searchRequest = buildSearchRequest(documentIds, selectedPatterns);

  const { data, isLoading, isError } = useQuery([QUERY_KEY, documentIds], () =>
    createFetchData<Note[]>(searchService, searchRequest)
  );

  const mockedData: Note[] = [
    {
      noteId: 'b2980b84-92ef-48cd-96fe-1d0f01dfb6e7',
      version: 'WzUyOTIsMV0=',
      timelineId: 'aa253145-d542-4e4f-b060-4c30a2cc1700',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one',
      created: 1716443756581,
      createdBy: 'elastic',
      updated: 1716443756581,
      updatedBy: 'elastic',
    },
    {
      noteId: 'ff40c50a-d57a-47ed-bd1e-a94367bb04b6',
      version: 'WzUyOTAsMV0=',
      timelineId: 'aa253145-d542-4e4f-b060-4c30a2cc1700',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'tes',
      created: 1716442683535,
      createdBy: 'elastic',
      updated: 1716442683535,
      updatedBy: 'elastic',
    },
    {
      noteId: '3770e528-2ccc-4679-8248-4fe458afb159',
      version: 'WzUyOTMsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716443835780,
      createdBy: 'elastic',
      updated: 1716443835780,
      updatedBy: 'elastic',
    },
    {
      noteId: '7bef6a55-9f4b-4287-a712-00028a647822',
      version: 'WzUyOTQsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716443955818,
      createdBy: 'elastic',
      updated: 1716443955818,
      updatedBy: 'elastic',
    },
    {
      noteId: '4f94db23-ff71-4661-9748-e1cee9449077',
      version: 'WzUyOTUsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444139051,
      createdBy: 'elastic',
      updated: 1716444139051,
      updatedBy: 'elastic',
    },
    {
      noteId: '6926a786-55b4-457a-a9b7-7659ff758d17',
      version: 'WzUyOTYsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444140001,
      createdBy: 'elastic',
      updated: 1716444140001,
      updatedBy: 'elastic',
    },
    {
      noteId: '4031ac35-afd3-45a5-839f-8c6fdccd7bcb',
      version: 'WzUyOTcsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444286170,
      createdBy: 'elastic',
      updated: 1716444286170,
      updatedBy: 'elastic',
    },
    {
      noteId: '7cb92e7d-935c-41cc-8bef-6bd44e6d29a9',
      version: 'WzUyOTgsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444287808,
      createdBy: 'elastic',
      updated: 1716444287808,
      updatedBy: 'elastic',
    },
    {
      noteId: 'ed7a14e7-105d-4554-84eb-ab777fdc0825',
      version: 'WzUyOTksMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444289646,
      createdBy: 'elastic',
      updated: 1716444289646,
      updatedBy: 'elastic',
    },
    {
      noteId: 'd037fc60-f409-4d44-878d-5fe877809c22',
      version: 'WzUzMDAsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444290965,
      createdBy: 'elastic',
      updated: 1716444290965,
      updatedBy: 'elastic',
    },
    {
      noteId: '6ae2a55a-e126-4cd6-8641-9be3488045cd',
      version: 'WzUzMDEsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444410332,
      createdBy: 'elastic',
      updated: 1716444410332,
      updatedBy: 'elastic',
    },
    {
      noteId: '0b6211cb-01b7-4d26-b626-a0f32d6a7a7f',
      version: 'WzUzMDIsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444411096,
      createdBy: 'elastic',
      updated: 1716444411096,
      updatedBy: 'elastic',
    },
    {
      noteId: '0e1d1737-a683-4dcb-a018-8e712315e3e4',
      version: 'WzUzMDMsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444490351,
      createdBy: 'elastic',
      updated: 1716444490351,
      updatedBy: 'elastic',
    },
    {
      noteId: 'e7026c4c-6677-4be2-8213-f28764069f03',
      version: 'WzUzMDQsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 2',
      created: 1716444591648,
      createdBy: 'elastic',
      updated: 1716444591648,
      updatedBy: 'elastic',
    },
    {
      noteId: 'e65a00c7-6cfa-4035-b899-9de8be95c317',
      version: 'WzUzMDUsMV0=',
      timelineId: '',
      eventId: '93010813af38f70404671ee5ed7445b5b1235b03c2f0d4a8a50543d7be440a5d',
      note: 'new one 69',
      created: 1716444903043,
      createdBy: 'elastic',
      updated: 1716444903043,
      updatedBy: 'elastic',
    },
  ];

  return {
    loading: isLoading,
    error: isError,
    data: mockedData,
  };
};

/**
 *
 */
const buildSearchRequest = (
  documentIds: string[],
  selectedPatterns: string[]
): IEsSearchRequest => {
  const query = buildEsQuery(
    undefined,
    [],
    [
      {
        query: {
          terms: {
            _id: documentIds,
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
