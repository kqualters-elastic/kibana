/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createContext } from 'react';
import { BulkActionsReducerAction, BulkActionsState, RowSelectionState } from '../../../../types';

export const emptyBulkActionsState: BulkActionsState = {
  rowSelection: new Map<number, RowSelectionState>(),
  isAllSelected: false,
  areAllVisibleRowsSelected: false,
  rowCount: 0,
};

export const BulkActionsContext = createContext<
  [BulkActionsState, React.Dispatch<BulkActionsReducerAction>]
>([emptyBulkActionsState, () => {}]);
