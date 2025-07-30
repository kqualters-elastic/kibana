/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiButton, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import * as i18n from './translations';
import { ReprocessFailedRulesButton } from './reprocess_failed_rules';
import {
  UtilityBar,
  UtilityBarAction,
  UtilityBarGroup,
  UtilityBarSection,
  UtilityBarText,
} from '../../../../../common/components/utility_bar';

export interface BulkActionsProps {
  isTableLoading: boolean;
  numberOfFailedRules: number;
  numberOfTranslatedRules: number;
  numberOfSelectedRules: number;
  numberOfTotalRules: number;
  numberOfRulesWithMissingIndex: number;
  setMissingIndexPatternFlyoutOpen?: () => void;
  installTranslatedRule?: () => void;
  installSelectedRule?: () => void;
  reprocessFailedRules?: () => void;
  isSelectAllSelected: boolean;
  userSelectedAll: (userSelected: boolean) => void;
}

/**
 * Collection of buttons to perform bulk actions on migration rules within the SIEM Rules Migrations table.
 */
export const BulkActions: React.FC<BulkActionsProps> = React.memo(
  ({
    isTableLoading,
    numberOfFailedRules,
    numberOfTranslatedRules,
    numberOfSelectedRules,
    numberOfTotalRules,
    numberOfRulesWithMissingIndex,
    installTranslatedRule,
    setMissingIndexPatternFlyoutOpen,
    installSelectedRule,
    reprocessFailedRules,
    isSelectAllSelected,
    userSelectedAll,
  }) => {
    const disableInstallTranslatedRulesButton = isTableLoading || !numberOfTranslatedRules;
    const showInstallSelectedRulesButton = numberOfSelectedRules > 0;
    const showRetryFailedRulesButton = numberOfFailedRules > 0;
    const showSelectAllButton =
      numberOfTotalRules > 0 && !isSelectAllSelected && numberOfSelectedRules > 0;
    const totalSelected = isSelectAllSelected ? numberOfTotalRules : numberOfSelectedRules;
    return (
      <>
        <UtilityBar>
          <UtilityBarSection>
            <UtilityBarGroup>
              <UtilityBarText>{'Bulk actions'}</UtilityBarText>
              {numberOfRulesWithMissingIndex > 0 && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => setMissingIndexPatternFlyoutOpen?.()}
                  disabled={disableInstallTranslatedRulesButton}
                  dataTestSubj="updateIndexPatternOfSelectedRulesButton"
                >
                  {i18n.UPDATE_INDEX_PATTERN_OF_SELECTED_RULES(numberOfSelectedRules)}
                </UtilityBarAction>
              )}
              {numberOfTranslatedRules > 0 && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => installTranslatedRule?.()}
                  disabled={disableInstallTranslatedRulesButton}
                  dataTestSubj="installTranslatedRulesButton"
                >
                  {i18n.INSTALL_TRANSLATED_RULES(numberOfTranslatedRules)}
                </UtilityBarAction>
              )}
              {isSelectAllSelected && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => userSelectedAll(false)}
                  disabled={isTableLoading}
                  dataTestSubj="clearSelectAllButton"
                >
                  {i18n.CLEAR_SELECT_ALL}
                </UtilityBarAction>
              )}
              {showSelectAllButton && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => userSelectedAll(true)}
                  disabled={isTableLoading}
                  dataTestSubj="selectAllButton"
                >
                  {`Select all ${numberOfTotalRules} rules`}
                </UtilityBarAction>
              )}
              {showInstallSelectedRulesButton && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => installSelectedRule?.()}
                  disabled={isTableLoading}
                  dataTestSubj="installSelectedRulesButton"
                >
                  {i18n.INSTALL_SELECTED_RULES(totalSelected)}
                </UtilityBarAction>
              )}
              {showRetryFailedRulesButton && (
                <UtilityBarAction
                  iconType="plusInCircle"
                  color={'primary'}
                  onClick={() => reprocessFailedRules?.()}
                  disabled={isTableLoading}
                  dataTestSubj="reprocessFailedRulesButton"
                >
                  {i18n.REPROCESS_FAILED_RULES(numberOfFailedRules)}
                </UtilityBarAction>
              )}
            </UtilityBarGroup>
          </UtilityBarSection>
        </UtilityBar>
        {/* <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={true}>
          {isSelectAllSelected && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="plusInCircle"
                color={'primary'}
                onClick={() => userSelectedAll(false)}
                disabled={isTableLoading}
                isLoading={isTableLoading}
                data-test-subj="clearSelectAllButton"
                aria-label={i18n.CLEAR_SELECT_ALL_ARIA_LABEL}
              >
                {i18n.CLEAR_SELECT_ALL}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
          {showSelectAllButton && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="plusInCircle"
                color={'primary'}
                onClick={() => userSelectedAll(true)}
                disabled={isTableLoading}
                isLoading={isTableLoading}
                data-test-subj="selectAllButton"
                aria-label={'todo'}
              >
                {`Select all ${numberOfTotalRules} rules`}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
          {showInstallSelectedRulesButton && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="plusInCircle"
                color={'primary'}
                onClick={() => installSelectedRule?.()}
                disabled={isTableLoading}
                isLoading={isTableLoading}
                data-test-subj="installSelectedRulesButton"
                aria-label={i18n.INSTALL_SELECTED_ARIA_LABEL}
              >
                {i18n.INSTALL_SELECTED_RULES(totalSelected)}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
          {showRetryFailedRulesButton && (
            <EuiFlexItem grow={false}>
              <ReprocessFailedRulesButton
                onClick={() => reprocessFailedRules?.()}
                isDisabled={isTableLoading}
                isLoading={isTableLoading}
                numberOfFailedRules={numberOfFailedRules}
              />
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="plusInCircle"
              onClick={() => installTranslatedRule?.()}
              disabled={disableInstallTranslatedRulesButton}
              isLoading={isTableLoading}
              data-test-subj="installTranslatedRulesButton"
              aria-label={i18n.INSTALL_TRANSLATED_ARIA_LABEL}
            >
              {numberOfTranslatedRules > 0
                ? i18n.INSTALL_TRANSLATED_RULES(numberOfTranslatedRules)
                : i18n.INSTALL_TRANSLATED_RULES_EMPTY_STATE}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup> */}
      </>
    );
  }
);
BulkActions.displayName = 'BulkActions';
