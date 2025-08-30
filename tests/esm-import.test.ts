// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * ESM Import Smoke Test
 */
import { describe, it, expect } from 'vitest';
import { projectFusion } from '../src/index.js';

describe('ESM Import Smoke Test', () => {
    it('should successfully import projectFusion from package', () => {
        expect(projectFusion).toBeDefined();
        expect(typeof projectFusion).toBe('function');
    });

    it('should create a valid builder instance', () => {
        const builder = projectFusion();
        expect(builder).toBeDefined();
        expect(builder.root).toBeDefined();
        expect(builder.include).toBeDefined();
        expect(builder.exclude).toBeDefined();
        expect(builder.generate).toBeDefined();
    });

    it('should support method chaining after import', () => {
        const builder = projectFusion()
            .root('./src')
            .include(['web']);
        
        expect(builder).toBeDefined();
        expect(typeof builder.generate).toBe('function');
    });
});