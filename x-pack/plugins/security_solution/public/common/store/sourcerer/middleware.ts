/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { Action, Dispatch, MiddlewareAPI, applyMiddleware } from 'redux';
import { CoreStart } from '../../../../../../../src/core/public';
import * as sourcererActions from './actions';

const sourcererMiddleware = (deps: CoreStart) => (api: MiddlewareAPI) => (next: Dispatch) => {
  return async (action: Action) => {
    next(action);
    console.log('hi from sourcerer', action);
  };
};

export const sourcererMiddlewareFactory = (deps: CoreStart) => {
  return sourcererMiddleware(deps);
};
