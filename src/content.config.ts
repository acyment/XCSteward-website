import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Fit level a given failure mode has with XCSteward's scope.
 * Deliberately cautious wording — we never promise a fix.
 */
const fitLevel = z.enum(['strong', 'partial', 'out-of-scope']);
export type FitLevel = z.infer<typeof fitLevel>;

const failures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/failures' }),
  schema: z.object({
    /** Page <title> and H1. */
    title: z.string().min(10).max(70),
    /** Meta description / OG description. ~150–160 chars reads best. */
    description: z.string().min(50).max(200),
    /** One-line symptom, shown on cards and as the page lede. */
    symptom: z.string().min(20).max(200),
    /** Short label for the likely failure class (shown on cards). */
    failureClass: z.string().min(3).max(80),
    /** How well this class of failure fits XCSteward's scope. */
    fit: fitLevel,
    /** Human-readable fit note shown on the card. */
    fitNote: z.string().min(5).max(120),
    /** Real, symptom-based search phrases this page targets. */
    queries: z.array(z.string()).min(1).max(8),
    /** Slugs of related failure modes for internal linking. */
    related: z.array(z.string()).default([]),
    /** Sort order in the library index (lower = earlier). */
    order: z.number().int().default(100),
    /** Last meaningful content update. */
    updated: z.coerce.date(),
    /** Set true to hide from the index without deleting the file. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { failures };
