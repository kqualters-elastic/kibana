/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { isSecurityAppError } from '@kbn/securitysolution-t-grid';

import { useAppToasts } from '../../../../common/hooks/use_app_toasts';
import { createSignalIndex, getSignalIndex } from './api';
import * as i18n from './translations';
import { useAlertsPrivileges } from './use_alerts_privileges';

type Func = () => Promise<void>;

export interface ReturnSignalIndex {
  loading: boolean;
  signalIndexExists: boolean | null;
  signalIndexName: string | null;
  signalIndexMappingOutdated: boolean | null;
  createDeSignalIndex: Func | null;
}

/**
 * Hook for managing signal index
 *
 *
 */
export const useSignalIndex = (): ReturnSignalIndex => {
  console.log('useSignalIndex');
  debugger;
  const [loading, setLoading] = useState(true);
  const isSubscribed = useRef(true);
  const abortCtrl = useRef(new AbortController());
  const [signalIndexState, setSignalIndex] = useState<
    Omit<ReturnSignalIndex, 'loading' | 'createDeSignalIndex'>
  >({
    signalIndexExists: null,
    signalIndexName: null,
    signalIndexMappingOutdated: null,
  });
  const { addError } = useAppToasts();
  const { hasIndexRead } = useAlertsPrivileges();
  // eslint-disable-next-line complexity
  const createIndex = useCallback(async () => {
    let isFetchingData = false;
    const abortCtrolRef = abortCtrl.current;

    try {
      setLoading(true);
      await createSignalIndex({ signal: abortCtrolRef.signal });

      if (isSubscribed.current) {
        isFetchingData = true;
        try {
          setLoading(true);
          const signal = await getSignalIndex({ signal: abortCtrolRef.signal });

          if (isSubscribed.current && signal != null) {
            setSignalIndex({
              signalIndexExists: true,
              signalIndexName: signal.name,
              signalIndexMappingOutdated: signal.index_mapping_outdated,
            });
          }
        } catch (error) {
          if (isSubscribed.current) {
            setSignalIndex({
              signalIndexExists: false,
              signalIndexName: null,
              signalIndexMappingOutdated: null,
            });
            if (isSecurityAppError(error) && error.body.status_code !== 404) {
              addError(error, { title: i18n.SIGNAL_GET_NAME_FAILURE });
            }
          }
        }
        if (isSubscribed.current) {
          setLoading(false);
        }
      }
    } catch (error) {
      if (isSubscribed.current) {
        if (isSecurityAppError(error) && error.body.status_code === 409) {
          try {
            setLoading(true);
            const signalIndex = await getSignalIndex({ signal: abortCtrolRef.signal });

            if (isSubscribed && signalIndex != null) {
              setSignalIndex({
                signalIndexExists: true,
                signalIndexName: signalIndex.name,
                signalIndexMappingOutdated: signalIndex.index_mapping_outdated,
              });
            }
          } catch (innerError) {
            if (isSubscribed) {
              setSignalIndex({
                signalIndexExists: false,
                signalIndexName: null,
                signalIndexMappingOutdated: null,
              });
              if (isSecurityAppError(innerError) && innerError.body.status_code !== 404) {
                addError(innerError, { title: i18n.SIGNAL_GET_NAME_FAILURE });
              }
            }
          }
          if (isSubscribed) {
            setLoading(false);
          }
        } else {
          setSignalIndex({
            signalIndexExists: false,
            signalIndexName: null,
            signalIndexMappingOutdated: null,
          });
          addError(error, { title: i18n.SIGNAL_POST_FAILURE });
        }
      }
    }
    if (isSubscribed.current && !isFetchingData) {
      setLoading(false);
    }
  }, [addError, isSubscribed]);

  const fetchSignalIndex = useCallback(
    async (signal) => {
      if (hasIndexRead) {
        try {
          setLoading(true);
          const signalIndex = await getSignalIndex({ signal });

          if (isSubscribed.current && signalIndex != null) {
            setSignalIndex({
              signalIndexExists: true,
              signalIndexName: signalIndex.name,
              signalIndexMappingOutdated: signalIndex.index_mapping_outdated,
            });
          }
        } catch (error) {
          if (isSubscribed.current) {
            setSignalIndex({
              signalIndexExists: false,
              signalIndexName: null,
              signalIndexMappingOutdated: null,
            });
            if (isSecurityAppError(error) && error.body.status_code !== 404) {
              addError(error, { title: i18n.SIGNAL_GET_NAME_FAILURE });
            }
          }
        }
      } else {
        // Skip data fetching as the current user doesn't have enough priviliges.
        // Attempt to get the signal index will result in 500 error.
        setLoading(false);
      }
    },
    [addError, hasIndexRead, isSubscribed]
  );

  useEffect(() => {
    console.log('useSignalIndex useEffect');

    const abortCtrolRef = abortCtrl.current;

    fetchSignalIndex(abortCtrolRef.signal);
    return () => {
      isSubscribed.current = false;
      abortCtrolRef.abort();
    };
  }, [addError, hasIndexRead, fetchSignalIndex]);

  // return { loading, ...signalIndex };
  return useMemo(() => {
    return { loading, createDeSignalIndex: createIndex, ...signalIndexState };
  }, [loading, signalIndexState, createIndex]);
};
