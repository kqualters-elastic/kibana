/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createContext, useContext, useMemo, useCallback } from 'react';
import { BulkActionsReducerAction, BulkActionsState, RowSelectionState } from '../../../../types';

export const initialState = {
  rowSelection: new Map<number, RowSelectionState>(),
  isAllSelected: false,
  areAllVisibleRowsSelected: false,
  rowCount: 0,
};

export const BulkActionsContext = createContext<
  [BulkActionsState, React.Dispatch<BulkActionsReducerAction>]
>([initialState, () => {}]);

export const useBulkActionContext = () => {
  const [
    { isAllSelected, rowSelection, areAllVisibleRowsSelected, rowCount },
    updateBulkActionsState,
  ] = useContext(BulkActionsContext);
  const updateStateCallback = useCallback(
    (action: BulkActionsReducerAction) => updateBulkActionsState(action),
    [updateBulkActionsState]
  );
  return useMemo(() => {
    return {
      isAllSelected,
      rowSelection,
      areAllVisibleRowsSelected,
      rowCount,
      updateBulkActionsState: updateStateCallback,
    };
  }, [isAllSelected, rowSelection, areAllVisibleRowsSelected, rowCount, updateStateCallback]);
};
