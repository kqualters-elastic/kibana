/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  ENHANCEMENT_TYPE_SELECT,
  ENHANCEMENT_FILE_PICKER,
  ADD_ENHANCEMENT_BUTTON,
  ENHANCEMENTS_STEP_NUMBER,
  ENHANCEMENTS_TITLE,
  UPLOAD_RULES_FLYOUT,
} from '../../../../screens/siem_migrations';
import { deleteConnectors } from '../../../../tasks/api_calls/common';
import { createBedrockConnector } from '../../../../tasks/api_calls/connectors';
import { cleanMigrationData } from '../../../../tasks/api_calls/siem_migrations';
import { visit } from '../../../../tasks/navigation';
import {
  openUploadRulesFlyout,
  selectMigrationConnector,
  saveDefaultMigrationName,
  selectQRadarMigrationSource,
  uploadQRadarRules,
  uploadMitreMappings,
  navigateToEnhancementsStep,
} from '../../../../tasks/siem_migrations';
import { GET_STARTED_URL } from '../../../../urls/navigation';
import { role } from '../common/role';

// TODO: https://github.com/elastic/kibana/issues/228940 remove @skipInServerlessMKI tag when privileges issue is fixed
describe(
  'QRadar Rule Migrations - MITRE Mappings Enhancement',
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

    context('Enhancement Upload', () => {
      beforeEach(() => {
        cleanMigrationData();
      });

      it('should be able to upload MITRE mappings enhancement', () => {
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

        navigateToEnhancementsStep();
        cy.get(ENHANCEMENTS_STEP_NUMBER).should('be.visible');
        cy.get(ENHANCEMENTS_TITLE).should('be.visible');

        cy.get(ENHANCEMENT_TYPE_SELECT).should('be.visible');
        cy.get(ENHANCEMENT_TYPE_SELECT).should('contain.text', 'MITRE');

        cy.fixture('qradar/mitre_mappings.json').then((mitreMappings) => {
          cy.intercept({
            url: '**/rules/enhance',
            method: 'POST',
          }).as('enhanceRules');

          uploadMitreMappings(mitreMappings);

          cy.wait('@enhanceRules').then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
            expect(interception.response?.body.updated).to.equal(true);
          });
        });

        cy.get(ENHANCEMENT_FILE_PICKER).should('be.visible');
      });

      it('should validate MITRE mappings JSON format', () => {
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
        cy.wait('@createQRadarRules');

        navigateToEnhancementsStep();

        const invalidJson = { invalid: 'data' };
        cy.get(ENHANCEMENT_FILE_PICKER).selectFile({
          contents: Cypress.Buffer.from(JSON.stringify(invalidJson)),
          fileName: 'invalid_mappings.json',
          mimeType: 'application/json',
        });

        cy.get(ADD_ENHANCEMENT_BUTTON).should('be.disabled');
      });

      it('should show error for invalid JSON file', () => {
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
        cy.wait('@createQRadarRules');

        navigateToEnhancementsStep();

        cy.get(ENHANCEMENT_FILE_PICKER).selectFile({
          contents: Cypress.Buffer.from('invalid json content'),
          fileName: 'invalid.json',
          mimeType: 'application/json',
        });

        cy.get(ADD_ENHANCEMENT_BUTTON).should('be.disabled');
      });
    });
  }
);

