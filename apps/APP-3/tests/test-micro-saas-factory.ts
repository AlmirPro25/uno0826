/**
 * Testes para MICRO_SAAS_FACTORY_MANIFEST
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MICRO_SAAS_FACTORY_MANIFEST, {
  MicroSaaSFactory,
  MicroSaaSIdea,
  MicroSaaSProduct,
} from '../services/manifestos/MICRO_SAAS_FACTORY_MANIFEST';

describe('MICRO_SAAS_FACTORY_MANIFEST', () => {
  describe('Manifest Structure', () => {
    it('should have correct id', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.id).toBe('micro-saas-factory-omnipotent');
    });

    it('should have version 2.0.0', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.version).toBe('2.0.0');
    });

    it('should have mission statement', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.mission).toContain('Micro-SaaS');
    });

    it('should have 4 philosophy principles', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.philosophy).toHaveLength(4);
    });

    it('should have all super powers defined', () => {
      const { superPowers } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(superPowers.intelligence).toBeDefined();
      expect(superPowers.engineering).toBeDefined();
      expect(superPowers.business).toBeDefined();
      expect(superPowers.autonomy).toBeDefined();
    });

    it('should have architecture guidelines', () => {
      const { architectureGuidelines } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(architectureGuidelines.frontend).toBe('Next.js + React + Tailwind + shadcn/ui');
      expect(architectureGuidelines.backend).toContain('Node.js');
      expect(architectureGuidelines.db).toContain('PostgreSQL');
    });

    it('should have multi-tenancy rules', () => {
      const { multiTenancy } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(multiTenancy.style).toBe('Row-Level Security (RLS)');
      expect(multiTenancy.rules).toHaveLength(4);
    });

    it('should have all product deliverables', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.productDeliverables).toHaveLength(7);
    });

    it('should have growth engine configured', () => {
      const { growthEngine } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(growthEngine.loops).toHaveLength(4);
      expect(growthEngine.funnelStages).toBeDefined();
      expect(growthEngine.materials).toHaveLength(4);
    });

    it('should have validation protocol', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.validationProtocol).toHaveLength(6);
    });

    it('should have 6 inviolable rules', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.rules).toHaveLength(6);
    });

    it('should have operations defined', () => {
      const { operations } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(operations.ideaGeneration).toBeDefined();
      expect(operations.mvpConstruction).toBeDefined();
      expect(operations.launchStrategy).toBeDefined();
      expect(operations.scalingMetrics).toBeDefined();
    });

    it('should have integrations configured', () => {
      const { integrations } = MICRO_SAAS_FACTORY_MANIFEST;
      expect(integrations.withManifestOrchestrator).toBe(true);
      expect(integrations.withThreePhasePipeline).toBe(true);
      expect(integrations.withToolOrchestra).toBe(true);
      expect(integrations.withDAIA).toBe(true);
    });
  });

  describe('MicroSaaSFactory', () => {
    let factory: MicroSaaSFactory;

    beforeEach(() => {
      factory = new MicroSaaSFactory();
    });

    describe('Idea Generation', () => {
      it('should generate ideas', async () => {
        const ideas = await factory.generateIdeas(5);
        expect(ideas).toHaveLength(5);
      });

      it('should generate ideas with all required fields', async () => {
        const ideas = await factory.generateIdeas(1);
        const idea = ideas[0];

        expect(idea.name).toBeDefined();
        expect(idea.description).toBeDefined();
        expect(idea.targetMarket).toBeDefined();
        expect(idea.painPoint).toBeDefined();
        expect(idea.urgency).toBeGreaterThanOrEqual(1);
        expect(idea.urgency).toBeLessThanOrEqual(10);
        expect(idea.ticketSize).toBeGreaterThan(0);
        expect(idea.technicalDifficulty).toBeGreaterThanOrEqual(1);
        expect(idea.technicalDifficulty).toBeLessThanOrEqual(10);
      });

      it('should generate 10 ideas by default', async () => {
        const ideas = await factory.generateIdeas();
        expect(ideas).toHaveLength(10);
      });
    });

    describe('Idea Ranking', () => {
      it('should rank ideas by score', async () => {
        await factory.generateIdeas(5);
        const ranked = factory.rankIdeas();

        expect(ranked).toHaveLength(5);
        expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score!);
      });

      it('should calculate score correctly', async () => {
        await factory.generateIdeas(1);
        const ranked = factory.rankIdeas();
        const idea = ranked[0];

        // Score formula: (pain * 0.3) + (urgency * 0.2) + (ticketSize * 0.3) + ((10 - difficulty) * 0.2)
        const expectedScore =
          (idea.painPoint.length * 0.3) +
          (idea.urgency * 0.2) +
          (idea.ticketSize / 1000 * 0.3) +
          ((10 - idea.technicalDifficulty) * 0.2);

        expect(idea.score).toBeCloseTo(expectedScore, 1);
      });

      it('should sort by score descending', async () => {
        await factory.generateIdeas(10);
        const ranked = factory.rankIdeas();

        for (let i = 0; i < ranked.length - 1; i++) {
          expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score!);
        }
      });
    });

    describe('Product Creation', () => {
      let testIdea: MicroSaaSIdea;

      beforeEach(async () => {
        const ideas = await factory.generateIdeas(1);
        testIdea = ideas[0];
      });

      it('should create a product from idea', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.id).toBeDefined();
        expect(product.name).toBe(testIdea.name);
        expect(product.idea).toEqual(testIdea);
        expect(product.status).toBe('ideation');
      });

      it('should have correct frontend config', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.frontend.framework).toBe('Next.js');
        expect(product.frontend.ui).toContain('React');
        expect(product.frontend.deployed).toBe(false);
      });

      it('should have correct backend config', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.backend.framework).toContain('Node.js');
        expect(product.backend.api).toMatch(/REST|GraphQL/);
        expect(product.backend.deployed).toBe(false);
      });

      it('should have correct database config', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.database.type).toBe('PostgreSQL');
        expect(product.database.provider).toBe('Supabase');
        expect(product.database.multiTenancy).toBe('RLS');
      });

      it('should have payment plans configured', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.payments.provider).toBe('Stripe');
        expect(product.payments.plans).toHaveLength(2);
        expect(product.payments.plans[0].name).toBe('Starter');
        expect(product.payments.plans[1].name).toBe('Pro');
      });

      it('should have initial metrics', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.metrics.mrr).toBe(0);
        expect(product.metrics.arr).toBe(0);
        expect(product.metrics.customers).toBe(0);
      });

      it('should have empty roadmap', async () => {
        const product = await factory.createProduct(testIdea);

        expect(product.roadmap).toEqual([]);
      });
    });

    describe('Product Management', () => {
      let product: MicroSaaSProduct;

      beforeEach(async () => {
        const ideas = await factory.generateIdeas(1);
        product = await factory.createProduct(ideas[0]);
      });

      it('should get product by id', () => {
        const retrieved = factory.getProduct(product.id);
        expect(retrieved).toEqual(product);
      });

      it('should return undefined for non-existent product', () => {
        const retrieved = factory.getProduct('non-existent-id');
        expect(retrieved).toBeUndefined();
      });

      it('should list all products', async () => {
        const ideas = await factory.generateIdeas(2);
        await factory.createProduct(ideas[0]);
        await factory.createProduct(ideas[1]);

        const products = factory.listProducts();
        expect(products.length).toBeGreaterThanOrEqual(3);
      });

      it('should update product status', () => {
        const updated = factory.updateProductStatus(product.id, 'building');

        expect(updated?.status).toBe('building');
        expect(factory.getProduct(product.id)?.status).toBe('building');
      });

      it('should update metrics', () => {
        factory.updateMetrics(product.id, {
          mrr: 1000,
          customers: 50,
          churn: 0.05,
        });

        const updated = factory.getProduct(product.id);
        expect(updated?.metrics.mrr).toBe(1000);
        expect(updated?.metrics.customers).toBe(50);
        expect(updated?.metrics.churn).toBe(0.05);
      });

      it('should preserve other metrics when updating', () => {
        factory.updateMetrics(product.id, { mrr: 500 });

        const updated = factory.getProduct(product.id);
        expect(updated?.metrics.mrr).toBe(500);
        expect(updated?.metrics.arr).toBe(0); // unchanged
      });
    });

    describe('Pricing Plans', () => {
      let product: MicroSaaSProduct;

      beforeEach(async () => {
        const ideas = await factory.generateIdeas(1);
        product = await factory.createProduct(ideas[0]);
      });

      it('should have starter plan', () => {
        const starter = product.payments.plans[0];
        expect(starter.name).toBe('Starter');
        expect(starter.price).toBe(29);
        expect(starter.currency).toBe('USD');
      });

      it('should have pro plan', () => {
        const pro = product.payments.plans[1];
        expect(pro.name).toBe('Pro');
        expect(pro.price).toBe(99);
        expect(pro.currency).toBe('USD');
      });

      it('should have features in plans', () => {
        product.payments.plans.forEach(plan => {
          expect(plan.features).toBeDefined();
          expect(plan.features.length).toBeGreaterThan(0);
        });
      });

      it('should have limits in plans', () => {
        product.payments.plans.forEach(plan => {
          expect(plan.limits).toBeDefined();
          expect(plan.limits.users).toBeGreaterThan(0);
          expect(plan.limits.projects).toBeGreaterThan(0);
        });
      });

      it('pro plan should have higher limits than starter', () => {
        const starter = product.payments.plans[0];
        const pro = product.payments.plans[1];

        expect(pro.limits.users).toBeGreaterThan(starter.limits.users);
        expect(pro.limits.projects).toBeGreaterThan(starter.limits.projects);
      });
    });

    describe('Validation Protocol', () => {
      it('should follow 6-step validation protocol', () => {
        const protocol = MICRO_SAAS_FACTORY_MANIFEST.validationProtocol;

        expect(protocol[0]).toContain('10 ideias');
        expect(protocol[1]).toContain('Classificar');
        expect(protocol[2]).toContain('Escolher');
        expect(protocol[3]).toContain('Landing page');
        expect(protocol[4]).toContain('Anúncios');
        expect(protocol[5]).toContain('SaaS');
      });
    });

    describe('Rules Compliance', () => {
      it('should enforce 6 inviolable rules', () => {
        const rules = MICRO_SAAS_FACTORY_MANIFEST.rules;

        expect(rules).toContain(expect.stringContaining('modelo de negócios'));
        expect(rules).toContain(expect.stringContaining('Plano Pago'));
        expect(rules).toContain(expect.stringContaining('48 horas'));
        expect(rules).toContain(expect.stringContaining('simples'));
        expect(rules).toContain(expect.stringContaining('bonito'));
        expect(rules).toContain(expect.stringContaining('Automatize'));
      });
    });
  });

  describe('Operations', () => {
    it('should have idea generation sources', () => {
      const sources = MICRO_SAAS_FACTORY_MANIFEST.operations.ideaGeneration.sources;
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should have MVP construction timeframe', () => {
      expect(MICRO_SAAS_FACTORY_MANIFEST.operations.mvpConstruction.timeframe).toBe('48 hours');
    });

    it('should have MVP essentials', () => {
      const essentials = MICRO_SAAS_FACTORY_MANIFEST.operations.mvpConstruction.essentials;
      expect(essentials).toContain('Autenticação');
      expect(essentials).toContain('Core feature');
      expect(essentials).toContain('Pagamento');
    });

    it('should have launch channels', () => {
      const channels = MICRO_SAAS_FACTORY_MANIFEST.operations.launchStrategy.channels;
      expect(channels).toContain('Product Hunt');
      expect(channels).toContain('Hacker News');
    });

    it('should have scaling metrics', () => {
      const metrics = MICRO_SAAS_FACTORY_MANIFEST.operations.scalingMetrics.track;
      expect(metrics).toContain('MRR (Monthly Recurring Revenue)');
      expect(metrics).toContain('CAC (Customer Acquisition Cost)');
      expect(metrics).toContain('LTV (Lifetime Value)');
    });

    it('should have scaling targets', () => {
      const targets = MICRO_SAAS_FACTORY_MANIFEST.operations.scalingMetrics.targets;
      expect(targets.mrr).toBe(1000);
      expect(targets.customers).toBe(50);
      expect(targets.churn).toBe('< 5%');
    });
  });
});
