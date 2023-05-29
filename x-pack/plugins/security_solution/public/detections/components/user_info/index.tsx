/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { noop } from 'lodash/fp';
import type { Dispatch } from 'react';
import React, { useEffect, useReducer, createContext, useContext, useCallback } from 'react';

import { useAlertsPrivileges } from '../../containers/detection_engine/alerts/use_alerts_privileges';
import { useSignalIndex } from '../../containers/detection_engine/alerts/use_signal_index';

export interface State {
  canUserCRUD: boolean | null;
  canUserREAD: boolean | null;
  hasIndexManage: boolean | null;
  hasIndexMaintenance: boolean | null;
  hasIndexWrite: boolean | null;
  hasIndexRead: boolean | null;
  hasIndexUpdateDelete: boolean | null;
  isSignalIndexExists: boolean | null;
  isAuthenticated: boolean | null;
  hasEncryptionKey: boolean | null;
  loading: boolean;
  signalIndexName: string | null;
  signalIndexMappingOutdated: boolean | null;
}

export const initialState: State = {
  canUserCRUD: null,
  canUserREAD: null,
  hasIndexManage: null,
  hasIndexMaintenance: null,
  hasIndexWrite: null,
  hasIndexRead: null,
  hasIndexUpdateDelete: null,
  isSignalIndexExists: null,
  isAuthenticated: null,
  hasEncryptionKey: null,
  loading: true,
  signalIndexName: null,
  signalIndexMappingOutdated: null,
};

export type Action =
  | { type: 'updateLoading'; loading: boolean }
  | {
      type: 'updateHasIndexManage';
      hasIndexManage: boolean | null;
    }
  | {
      type: 'updateHasIndexMaintenance';
      hasIndexMaintenance: boolean | null;
    }
  | {
      type: 'updateHasIndexWrite';
      hasIndexWrite: boolean | null;
    }
  | {
      type: 'updateHasIndexRead';
      hasIndexRead: boolean | null;
    }
  | {
      type: 'updateHasIndexUpdateDelete';
      hasIndexUpdateDelete: boolean | null;
    }
  | {
      type: 'updateIsSignalIndexExists';
      isSignalIndexExists: boolean | null;
    }
  | {
      type: 'updateIsAuthenticated';
      isAuthenticated: boolean | null;
    }
  | {
      type: 'updateHasEncryptionKey';
      hasEncryptionKey: boolean | null;
    }
  | {
      type: 'updateSignalIndexName';
      signalIndexName: string | null;
    }
  | {
      type: 'updateSignalIndexMappingOutdated';
      signalIndexMappingOutdated: boolean | null;
    }
  | {
      type: 'updateCanUserCRUD';
      canUserCRUD: boolean | null;
    }
  | {
      type: 'updateCanUserREAD';
      canUserREAD: boolean | null;
    };

export const userInfoReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'updateLoading': {
      return {
        ...state,
        loading: action.loading,
      };
    }
    case 'updateHasIndexManage': {
      return {
        ...state,
        hasIndexManage: action.hasIndexManage,
      };
    }
    case 'updateHasIndexMaintenance': {
      return {
        ...state,
        hasIndexMaintenance: action.hasIndexMaintenance,
      };
    }
    case 'updateHasIndexWrite': {
      return {
        ...state,
        hasIndexWrite: action.hasIndexWrite,
      };
    }
    case 'updateHasIndexRead': {
      return {
        ...state,
        hasIndexRead: action.hasIndexRead,
      };
    }
    case 'updateHasIndexUpdateDelete': {
      return {
        ...state,
        hasIndexUpdateDelete: action.hasIndexUpdateDelete,
      };
    }
    case 'updateIsSignalIndexExists': {
      return {
        ...state,
        isSignalIndexExists: action.isSignalIndexExists,
      };
    }
    case 'updateIsAuthenticated': {
      return {
        ...state,
        isAuthenticated: action.isAuthenticated,
      };
    }
    case 'updateHasEncryptionKey': {
      return {
        ...state,
        hasEncryptionKey: action.hasEncryptionKey,
      };
    }
    case 'updateSignalIndexName': {
      return {
        ...state,
        signalIndexName: action.signalIndexName,
      };
    }
    case 'updateSignalIndexMappingOutdated': {
      return {
        ...state,
        signalIndexMappingOutdated: action.signalIndexMappingOutdated,
      };
    }
    case 'updateCanUserCRUD': {
      return {
        ...state,
        canUserCRUD: action.canUserCRUD,
      };
    }
    case 'updateCanUserREAD': {
      return {
        ...state,
        canUserREAD: action.canUserREAD,
      };
    }
    default:
      return state;
  }
};

const StateUserInfoContext = createContext<[State, Dispatch<Action>]>([initialState, () => noop]);

export const useUserData = () => useContext(StateUserInfoContext);

interface ManageUserInfoProps {
  children: React.ReactNode;
}

export const ManageUserInfo = ({ children }: ManageUserInfoProps) => (
  <StateUserInfoContext.Provider value={useReducer(userInfoReducer, initialState)}>
    {children}
  </StateUserInfoContext.Provider>
);

export const useUserInfo = (): State => {
  const [
    {
      canUserCRUD,
      canUserREAD,
      hasIndexManage,
      hasIndexMaintenance,
      hasIndexWrite,
      hasIndexRead,
      hasIndexUpdateDelete,
      isSignalIndexExists,
      isAuthenticated,
      hasEncryptionKey,
      loading,
      signalIndexName,
      signalIndexMappingOutdated,
    },
    dispatch,
  ] = useUserData();
  const {
    loading: privilegeLoading,
    isAuthenticated: isApiAuthenticated,
    hasEncryptionKey: isApiEncryptionKey,
    hasIndexManage: hasApiIndexManage,
    hasIndexMaintenance: hasApiIndexMaintenance,
    hasIndexUpdateDelete: hasApiIndexUpdateDelete,
    hasIndexWrite: hasApiIndexWrite,
    hasIndexRead: hasApiIndexRead,
    hasKibanaCRUD,
    hasKibanaREAD,
  } = useAlertsPrivileges();
  const {
    loading: indexNameLoading,
    signalIndexExists: isApiSignalIndexExists,
    signalIndexName: apiSignalIndexName,
    signalIndexMappingOutdated: apiSignalIndexMappingOutdated,
    createDeSignalIndex: createSignalIndex,
  } = useSignalIndex();
  debugger;
  const patchDispatch = useCallback(
    (action: Action) => {
      console.log(action);
      dispatch(action);
    },
    [dispatch]
  );

  useEffect(() => {
    if (!loading && canUserCRUD !== hasKibanaCRUD) {
      patchDispatch({ type: 'updateCanUserCRUD', canUserCRUD: hasKibanaCRUD });
    }
  }, [patchDispatch, loading, canUserCRUD, hasKibanaCRUD]);

  useEffect(() => {
    if (!loading && canUserREAD !== hasKibanaREAD) {
      patchDispatch({ type: 'updateCanUserREAD', canUserREAD: hasKibanaREAD });
    }
  }, [patchDispatch, loading, canUserREAD, hasKibanaREAD]);

  useEffect(() => {
    if (loading !== (privilegeLoading || indexNameLoading)) {
      patchDispatch({ type: 'updateLoading', loading: privilegeLoading || indexNameLoading });
    }
  }, [patchDispatch, loading, privilegeLoading, indexNameLoading]);

  useEffect(() => {
    if (!loading && hasIndexManage !== hasApiIndexManage && hasApiIndexManage != null) {
      patchDispatch({ type: 'updateHasIndexManage', hasIndexManage: hasApiIndexManage });
    }
  }, [patchDispatch, loading, hasIndexManage, hasApiIndexManage]);

  useEffect(() => {
    if (!loading && hasIndexWrite !== hasApiIndexWrite && hasApiIndexWrite != null) {
      patchDispatch({ type: 'updateHasIndexWrite', hasIndexWrite: hasApiIndexWrite });
    }
  }, [patchDispatch, loading, hasIndexWrite, hasApiIndexWrite]);

  useEffect(() => {
    if (!loading && hasIndexRead !== hasApiIndexRead && hasApiIndexRead != null) {
      patchDispatch({ type: 'updateHasIndexRead', hasIndexRead: hasApiIndexRead });
    }
  }, [patchDispatch, loading, hasIndexRead, hasApiIndexRead]);

  useEffect(() => {
    if (
      !loading &&
      hasIndexUpdateDelete !== hasApiIndexUpdateDelete &&
      hasApiIndexUpdateDelete != null
    ) {
      patchDispatch({
        type: 'updateHasIndexUpdateDelete',
        hasIndexUpdateDelete: hasApiIndexUpdateDelete,
      });
    }
  }, [patchDispatch, loading, hasIndexUpdateDelete, hasApiIndexUpdateDelete]);

  useEffect(() => {
    if (
      !loading &&
      hasIndexMaintenance !== hasApiIndexMaintenance &&
      hasApiIndexMaintenance != null
    ) {
      patchDispatch({
        type: 'updateHasIndexMaintenance',
        hasIndexMaintenance: hasApiIndexMaintenance,
      });
    }
  }, [patchDispatch, loading, hasIndexMaintenance, hasApiIndexMaintenance]);

  useEffect(() => {
    if (
      !loading &&
      isSignalIndexExists !== isApiSignalIndexExists &&
      isApiSignalIndexExists != null
    ) {
      patchDispatch({
        type: 'updateIsSignalIndexExists',
        isSignalIndexExists: isApiSignalIndexExists,
      });
    }
  }, [patchDispatch, loading, isSignalIndexExists, isApiSignalIndexExists]);

  useEffect(() => {
    if (!loading && isAuthenticated !== isApiAuthenticated && isApiAuthenticated != null) {
      patchDispatch({ type: 'updateIsAuthenticated', isAuthenticated: isApiAuthenticated });
    }
  }, [patchDispatch, loading, isAuthenticated, isApiAuthenticated]);

  useEffect(() => {
    if (!loading && hasEncryptionKey !== isApiEncryptionKey && isApiEncryptionKey != null) {
      patchDispatch({ type: 'updateHasEncryptionKey', hasEncryptionKey: isApiEncryptionKey });
    }
  }, [patchDispatch, loading, hasEncryptionKey, isApiEncryptionKey]);

  useEffect(() => {
    if (!loading && signalIndexName !== apiSignalIndexName && apiSignalIndexName != null) {
      patchDispatch({ type: 'updateSignalIndexName', signalIndexName: apiSignalIndexName });
    }
  }, [patchDispatch, loading, signalIndexName, apiSignalIndexName]);

  useEffect(() => {
    if (
      !loading &&
      signalIndexMappingOutdated !== apiSignalIndexMappingOutdated &&
      apiSignalIndexMappingOutdated != null
    ) {
      patchDispatch({
        type: 'updateSignalIndexMappingOutdated',
        signalIndexMappingOutdated: apiSignalIndexMappingOutdated,
      });
    }
  }, [patchDispatch, loading, signalIndexMappingOutdated, apiSignalIndexMappingOutdated]);

  useEffect(() => {
    if (
      isAuthenticated &&
      hasEncryptionKey &&
      hasIndexManage &&
      ((isSignalIndexExists != null && !isSignalIndexExists) ||
        (signalIndexMappingOutdated != null && signalIndexMappingOutdated)) &&
      createSignalIndex != null
    ) {
      createSignalIndex();
    }
  }, [
    createSignalIndex,
    isAuthenticated,
    hasEncryptionKey,
    isSignalIndexExists,
    hasIndexManage,
    signalIndexMappingOutdated,
  ]);

  return {
    loading,
    isSignalIndexExists,
    isAuthenticated,
    hasEncryptionKey,
    canUserCRUD,
    canUserREAD,
    hasIndexManage,
    hasIndexMaintenance,
    hasIndexWrite,
    hasIndexRead,
    hasIndexUpdateDelete,
    signalIndexName,
    signalIndexMappingOutdated,
  };
};
