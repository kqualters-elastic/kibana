/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../common/ftr_provider_context';
import { NavLinksBuilder } from '../../common/nav_links_builder';
import { FeaturesService } from '../../common/services';
import { UICapabilitiesService } from '../../common/services/ui_capabilities';
import { UnreachableError } from '../../common/lib';
import { SpaceScenarios } from '../scenarios';

export default function navLinksTests({ getService }: FtrProviderContext) {
  const uiCapabilitiesService: UICapabilitiesService = getService('uiCapabilities');
  const featuresService: FeaturesService = getService('features');

  const uiCapabilitiesExceptions = {
    // appSearch and workplace Search are loaded but disabled because the ent-search application isn't running.
    // That means the following capabilities are disabled:
    feature: 'enterpriseSearch',
    apps: ['appSearch', 'workplaceSearch'],
  };

  describe('navLinks', () => {
    let navLinksBuilder: NavLinksBuilder;
    before(async () => {
      const features = await featuresService.get();
      navLinksBuilder = new NavLinksBuilder(features);
    });

    SpaceScenarios.forEach((scenario) => {
      it(`${scenario.name}`, async () => {
        const uiCapabilities = await uiCapabilitiesService.get({ spaceId: scenario.id });
        switch (scenario.id) {
          case 'everything_space':
            expect(uiCapabilities.success).to.be(true);
            expect(uiCapabilities.value).to.have.property('navLinks');
            expect(uiCapabilities.value!.navLinks).to.eql(
              navLinksBuilder.except(uiCapabilitiesExceptions)
            );
            break;
          case 'nothing_space':
            expect(uiCapabilities.success).to.be(true);
            expect(uiCapabilities.value).to.have.property('navLinks');
            const { kibana, securitySolutionCases, ...navLinksWithoutDeprecated } =
              uiCapabilities.value!.navLinks;
            const {
              kibana: _,
              securitySolutionCases: __,
              ...navLinksWithoutDeprecatedExpected
            } = navLinksBuilder.only('management');
            expect(navLinksWithoutDeprecated).to.eql(navLinksWithoutDeprecatedExpected);
            break;
          case 'foo_disabled_space':
            expect(uiCapabilities.success).to.be(true);
            expect(uiCapabilities.value).to.have.property('navLinks');
            expect(uiCapabilities.value!.navLinks).to.eql(
              navLinksBuilder.except('foo', uiCapabilitiesExceptions)
            );
            break;
          default:
            throw new UnreachableError(scenario);
        }
      });
    });
  });
}
