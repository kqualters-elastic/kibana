/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createAction, createReducer, AnyAction, PayloadAction } from '@reduxjs/toolkit';

import type { Note } from '../../lib/note';

import { addError, addErrorHash, addNotes, removeError, updateNote, deleteNote } from './actions';
import type { AppModel, NotesById } from './model';
import { allowedExperimentalValues } from '../../../../common/experimental_features';

export type AppState = AppModel;

export const initialAppState: AppState = {
  notesById: {},
  errors: [],
  enableExperimental: { ...allowedExperimentalValues },
};

interface UpdateNotesByIdParams {
  note: Note;
  notesById: NotesById;
}

export const updateNotesById = ({ note, notesById }: UpdateNotesByIdParams): NotesById => ({
  ...notesById,
  [note.id]: note,
});

export const appReducer = createReducer(initialAppState, (builder) =>
  builder
    .addCase(addNotes, (state, { payload: { notes } }) => {
      state.notesById = notes.reduce<NotesById>(
        (acc, note: Note) => ({ ...acc, [note.id]: note }),
        {}
      );
    })
    .addCase(deleteNote, (state, { payload: { id } }) => {
      state.notesById = Object.fromEntries(
        Object.entries(state.notesById).filter(([_, note]) => {
          return note.id !== id && note.saveObjectId !== id;
        })
      );
    })
    .addCase(updateNote, (state, { payload: { note } }) => {
      state.notesById[note.id] = note;
    })
    .addCase(addError, (state, { payload: { id, title, message } }) => {
      state.errors = state.errors.concat({ id, title, message });
    })
    .addCase(removeError, (state, { payload: { id } }) => {
      state.errors = state.errors.filter((error) => error.id !== id);
    })
    .addCase(addErrorHash, (state, { payload: { id, hash, title, message } }) => {
      const errorIdx = state.errors.findIndex((e) => e.id === id);
      const errorObj = state.errors.find((e) => e.id === id) || { id, title, message };
      if (errorIdx === -1) {
        state.errors = state.errors.concat({
          ...errorObj,
          hash,
          displayError: !state.errors.some((e) => e.hash === hash),
        });
      } else {
        state.errors = [
          ...state.errors.slice(0, errorIdx),
          { ...errorObj, hash, displayError: !state.errors.some((e) => e.hash === hash) },
          ...state.errors.slice(errorIdx + 1),
        ];
      }
    })
);
