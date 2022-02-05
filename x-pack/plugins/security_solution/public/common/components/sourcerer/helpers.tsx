/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiSuperSelectOption,
  EuiIcon,
  EuiBadge,
  EuiButtonEmpty,
  EuiFormRow,
  EuiFormRowProps,
} from '@elastic/eui';
import styled, { css } from 'styled-components';

import { sourcererModel } from '../../store/sourcerer';

export const FormRow = styled(EuiFormRow)<EuiFormRowProps & { $expandAdvancedOptions: boolean }>`
  display: ${({ $expandAdvancedOptions }) => ($expandAdvancedOptions ? 'flex' : 'none')};
  max-width: none;
`;

export const StyledFormRow = styled(EuiFormRow)`
  max-width: none;
`;

export const StyledButton = styled(EuiButtonEmpty)`
  &:enabled:focus,
  &:focus {
    background-color: transparent;
  }
`;

export const ResetButton = styled(EuiButtonEmpty)`
  width: fit-content;
  &:enabled:focus,
  &:focus {
    background-color: transparent;
  }
`;

export const PopoverContent = styled.div`
  width: 600px;
`;

export const StyledBadge = styled(EuiBadge)`
  margin-left: 8px;
  &,
  .euiBadge__text {
    cursor: pointer;
  }
`;

export const Blockquote = styled.span`
  ${({ theme }) => css`
    display: block;
    border-color: ${theme.eui.euiColorDarkShade};
    border-left: ${theme.eui.euiBorderThick};
    margin: ${theme.eui.euiSizeS} 0 ${theme.eui.euiSizeS} ${theme.eui.euiSizeS};
    padding: ${theme.eui.euiSizeS};
  `}
`;

interface GetTooltipContent {
  isOnlyDetectionAlerts: boolean;
  isPopoverOpen: boolean;
  selectedPatterns: string[];
  signalIndexName: string | null;
}

export const getTooltipContent = ({
  isOnlyDetectionAlerts,
  isPopoverOpen,
  selectedPatterns,
  signalIndexName,
}: GetTooltipContent): string | null => {
  if (isPopoverOpen || (isOnlyDetectionAlerts && !signalIndexName)) {
    return null;
  }
  return (isOnlyDetectionAlerts ? [signalIndexName] : selectedPatterns).join(', ');
};
