/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useContext, useCallback } from 'react';
import { UseActionsColumnRegistry, BulkActionsVerbs } from '../../../../types';
import { BulkActionsContext, useBulkActionContext } from '../bulk_actions/context';

const DEFAULT_ACTIONS_COLUMNS_WIDTH = 75;

interface UseActionsColumnProps {
  options?: UseActionsColumnRegistry;
}

const defaultUseUserActionsColum = {
  renderCustomActionsRow: undefined,
  width: undefined,
};

export const useActionsColumn = ({ options }: UseActionsColumnProps) => {
  const { updateBulkActionsState } = useBulkActionContext();
  const defaultUseUserActionCallback = useCallback(() => {
    return defaultUseUserActionsColum;
  }, []);
  const useUserActionsColumn = options ? options : defaultUseUserActionCallback;

  const { renderCustomActionsRow, width: actionsColumnWidth = DEFAULT_ACTIONS_COLUMNS_WIDTH } =
    useUserActionsColumn();

  const setIsLoading = useCallback(
    (rowIndex: number, rowisLoading: boolean = true) => {
      updateBulkActionsState({
        action: BulkActionsVerbs.updateRowLoadingState,
        rowIndex,
        isLoading: rowisLoading,
      });
    },
    [updateBulkActionsState]
  );

  // we save the rowIndex when creating the function to be used by the clients
  // so they don't have to manage it
  const getSetIsActionLoadingCallback = useCallback(
    (rowIndex: number) => {
      return (isLoading: boolean) => setIsLoading(rowIndex, isLoading);
    },
    [setIsLoading]
  );

  return {
    renderCustomActionsRow,
    actionsColumnWidth,
    getSetIsActionLoadingCallback,
  };
};
