/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  MIGRATION_PANEL_NAME,
  ONBOARDING_SIEM_MIGRATIONS_LIST,
  ONBOARDING_TRANSLATIONS_RESULT_TABLE,
  RULE_MIGRATIONS_GROUP_PANEL,
  RULE_MIGRATION_PROGRESS_BAR,
} from '../../../../screens/siem_migrations';
import { deleteConnectors } from '../../../../tasks/api_calls/common';
import { createBedrockConnector } from '../../../../tasks/api_calls/connectors';
import { cleanMigrationData } from '../../../../tasks/api_calls/siem_migrations';
import { visit } from '../../../../tasks/navigation';
import {
  openUploadRulesFlyout,
  selectMigrationConnector,
  startMigrationFromFlyout,
  toggleMigrateRulesCard,
  saveDefaultMigrationName,
  renameMigration,
  selectQRadarMigrationSource,
  uploadQRadarRules,
} from '../../../../tasks/siem_migrations';
import { GET_STARTED_URL } from '../../../../urls/navigation';
import { role } from '../common/role';

// TODO: https://github.com/elastic/kibana/issues/228940 remove @skipInServerlessMKI tag when privileges issue is fixed
describe(
  'QRadar Rule Migrations - Basic Workflow',
  { tags: ['@ess', '@serverless', '@skipInServerlessMKI'] },
  () => {
    before(() => {
      role.setup();
    });

    beforeEach(() => {
      deleteConnectors();
      cy.task('esArchiverLoad', {
        archiveName: 'siem_migrations/rules',
      });

      cy.task('esArchiverLoad', {
        archiveName: 'siem_migrations/rule_migrations',
      });

      role.login();
      createBedrockConnector();
      visit(GET_STARTED_URL);
    });

    after(() => {
      role.teardown();

      cy.task('esArchiverUnload', {
        archiveName: 'siem_migrations/rules',
      });

      cy.task('esArchiverUnload', {
        archiveName: 'siem_migrations/rule_migrations',
      });
    });

    context('First Migration', () => {
      beforeEach(() => {
        cleanMigrationData();
      });
      it('should be able to create QRadar migrations', () => {
        selectMigrationConnector();
        openUploadRulesFlyout();
        selectQRadarMigrationSource();
        saveDefaultMigrationName();
        cy.fixture('qradar/rules.xml').then((xmlContent) => {
          uploadQRadarRules(xmlContent);
        });
        cy.intercept({
          url: '**/rules/qradar',
        }).as('createQRadarRules');
        cy.wait('@createQRadarRules').then((interception) => {
          expect(interception.response?.statusCode).to.equal(200);
        });
        cy.intercept({
          url: '**/start',
        }).as('startMigration');
        startMigrationFromFlyout();
        cy.wait('@startMigration')
          .its('request.body.settings')
          .should('have.property', 'skip_prebuilt_rules_matching', false);
        cy.get(RULE_MIGRATIONS_GROUP_PANEL).within(() => {
          cy.get(ONBOARDING_SIEM_MIGRATIONS_LIST).should('have.length', 1);
          cy.get(RULE_MIGRATION_PROGRESS_BAR).should('have.length', 1);
        });
      });
    });

    context('On Successful Translation', () => {
      context('Migration Results', () => {
        beforeEach(() => {
          selectMigrationConnector();
          toggleMigrateRulesCard();
        });

        it('should be able to see the result of the completed QRadar migration', () => {
          cy.get(RULE_MIGRATIONS_GROUP_PANEL).within(() => {
            cy.get(ONBOARDING_SIEM_MIGRATIONS_LIST).should('have.length', 1);
            cy.get(ONBOARDING_TRANSLATIONS_RESULT_TABLE.TRANSLATION_STATUS_COUNT('Failed')).should(
              'exist'
            );
            cy.get(
              ONBOARDING_TRANSLATIONS_RESULT_TABLE.TRANSLATION_STATUS_COUNT('Partially translated')
            ).should('exist');
            cy.get(
              ONBOARDING_TRANSLATIONS_RESULT_TABLE.TRANSLATION_STATUS_COUNT('Translated')
            ).should('exist');
          });
        });

        it('should be able to rename the QRadar migration', () => {
          cy.get(ONBOARDING_SIEM_MIGRATIONS_LIST).should('have.length', 1);
          renameMigration('New QRadar Migration Name');
          cy.get(MIGRATION_PANEL_NAME).should('have.text', 'New QRadar Migration Name');
        });
      });
    });
  }
);

