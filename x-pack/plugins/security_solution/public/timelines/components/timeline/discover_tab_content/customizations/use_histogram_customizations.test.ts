/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TestProviders } from '../../../../../common/mock';
import { renderHook } from '@testing-library/react-hooks';
import { useHistogramCustomization } from './use_histogram_customizations';

const applyFilterMock = {
  exec: jest.fn(),
};

const renderHookWithContext = () => {
  renderHook(() => useHistogramCustomization(), {
    wrapper: TestProviders,
  });
};

describe('useHistogramCustomization', () => {
  describe('onFilterCallback', () => {
    it('should apply filter correctly, in case of single value click Trigger', () => {});
    it('should apply filter correctly, in case of multi value click Trigger', () => {});
  });

  describe('onBrushEndCallback', () => {
    it('should apply timerange in correctly in case of brush end event', () => {});
  });
});
