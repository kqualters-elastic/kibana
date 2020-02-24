/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { EventsQuery } from './events';
import { EndpointAppConstants } from '../../../../common/types';

describe('related events query', () => {
  it('generates the correct legacy queries', () => {
    const timestamp = new Date();
    expect(
      new EventsQuery('awesome-id', { size: 1, timestamp, eventID: 'foo' }).build('5')
    ).toStrictEqual({
      body: {
        query: {
          bool: {
            filter: [
              {
                terms: { 'endgame.unique_pid': ['5'] },
              },
              {
                term: { 'agent.id': 'awesome-id' },
              },
              {
                term: { 'event.kind': 'event' },
              },
              {
                bool: {
                  must_not: {
                    term: { 'event.category': 'process' },
                  },
                },
              },
            ],
          },
        },
        aggs: {
          totals: {
            terms: {
              field: 'endgame.unique_pid',
              size: 1,
            },
          },
        },
        search_after: [timestamp.getTime(), 'foo'],
        size: 1,
        sort: [{ '@timestamp': 'asc' }, { 'endgame.serial_event_id': 'asc' }],
      },
      index: EndpointAppConstants.LEGACY_EVENT_INDEX_NAME,
    });
  });

  it('generates the correct non-legacy queries', () => {
    const timestamp = new Date();

    expect(
      new EventsQuery(undefined, { size: 1, timestamp, eventID: 'bar' }).build('baz')
    ).toStrictEqual({
      body: {
        query: {
          bool: {
            filter: [
              {
                terms: { 'process.entity_id': ['baz'] },
              },
              {
                term: { 'event.kind': 'event' },
              },
              {
                bool: {
                  must_not: {
                    term: { 'event.category': 'process' },
                  },
                },
              },
            ],
          },
        },
        aggs: {
          totals: {
            terms: {
              field: 'process.entity_id',
              size: 1,
            },
          },
        },
        search_after: [timestamp.getTime(), 'bar'],
        size: 1,
        sort: [{ '@timestamp': 'asc' }, { 'event.id': 'asc' }],
      },
      index: EndpointAppConstants.EVENT_INDEX_NAME,
    });
  });
});
