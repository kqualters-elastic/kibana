/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CellActionExecutionContext } from '@kbn/cell-actions';
import { KibanaServices } from '../../../common/lib/kibana';
import { createFilterInAction } from './filter_in';
import { createFilter } from '../helpers';

jest.mock('../../../common/lib/kibana');
jest.mock('../helpers');

const mockFilterManager = KibanaServices.get().data.query.filterManager;
const mockCreateFilter = createFilter as jest.Mock;

describe('Default createFilterInAction', () => {
  const filterInAction = createFilterInAction({ order: 1 });
  const context = {
    field: { name: 'user.name', value: 'the value', type: 'text' },
  } as CellActionExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return display name', () => {
    expect(filterInAction.getDisplayName(context)).toEqual('Filter In');
  });

  it('should return icon type', () => {
    expect(filterInAction.getIconType(context)).toEqual('plusInCircle');
  });

  describe('isCompatible', () => {
    it('should return true if everything is okay', async () => {
      expect(await filterInAction.isCompatible(context)).toEqual(true);
    });
  });

  describe('execute', () => {
    it('should execute normally', async () => {
      await filterInAction.execute(context);
      expect(mockFilterManager.addFilters).toHaveBeenCalled();
      expect(mockCreateFilter).toBeCalledWith(context.field.name, context.field.value, false);
    });

    describe('should execute correctly when negateFilters is provided', () => {
      it('if negateFilters is false, negate should be false (do not exclude)', async () => {
        await filterInAction.execute({
          ...context,
          metadata: {
            negateFilters: false,
          },
        });
        expect(mockFilterManager.addFilters).toHaveBeenCalled();
        expect(mockCreateFilter).toBeCalledWith(context.field.name, context.field.value, false);
      });

      it('if negateFilters is true, negate should be true (exclude)', async () => {
        await filterInAction.execute({
          ...context,
          metadata: {
            negateFilters: true,
          },
        });
        expect(mockFilterManager.addFilters).toHaveBeenCalled();
        expect(mockCreateFilter).toBeCalledWith(context.field.name, context.field.value, true);
      });
    });
  });
});
