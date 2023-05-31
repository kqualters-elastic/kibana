/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction } from '@reduxjs/toolkit';
import type { TableId } from '@kbn/securitysolution-data-table';

export const updateGroups = createAction<{
  activeGroups?: string[];
  tableId: TableId;
  options?: Array<{ key: string; label: string }>;
}>('UPDATE_GROUPS');
