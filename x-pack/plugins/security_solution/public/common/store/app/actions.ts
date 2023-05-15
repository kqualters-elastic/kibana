/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction } from '@reduxjs/toolkit';

import type { Note } from '../../lib/note';

export const updateNote = createAction<{ note: Note }>('UPDATE_NOTE');

export const addNotes = createAction<{ notes: Note[] }>('APP_ADD_NOTE');

export const deleteNote = createAction<{ id: string }>('DELETE_NOTE');

export const addError = createAction<{ id: string; title: string; message: string[] }>(
  'ADD_ERRORS'
);

export const removeError = createAction<{ id: string }>('REMOVE_ERRORS');

export const addErrorHash = createAction<{
  id: string;
  hash: string;
  title: string;
  message: string[];
}>('ADD_ERROR_HASH');
