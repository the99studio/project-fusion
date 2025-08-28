// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
import { describe, expect, it } from 'vitest';
import { HtmlOutputStrategy, type OutputContext } from '../src/strategies/output-strategy.js';
import { defaultConfig } from '../src/utils.js';

describe('Security Headers', () => {
    const strategy = new HtmlOutputStrategy();
    const mockContext: OutputContext = {
        projectTitle: 'Test Project',
        versionInfo: '',
        filesToProcess: [],
        config: defaultConfig,
        toolVersion: '1.0.0'
    };

    it('should include X-Content-Type-Options header', () => {
        const header = strategy.generateHeader(mockContext);
        expect(header).toContain('<meta http-equiv="X-Content-Type-Options" content="nosniff">');
    });

    it('should include X-Frame-Options header', () => {
        const header = strategy.generateHeader(mockContext);
        expect(header).toContain('<meta http-equiv="X-Frame-Options" content="DENY">');
    });

    it('should include Referrer-Policy header', () => {
        const header = strategy.generateHeader(mockContext);
        expect(header).toContain('<meta http-equiv="Referrer-Policy" content="no-referrer">');
    });

    it('should include CSP with base-uri none', () => {
        const header = strategy.generateHeader(mockContext);
        expect(header).toContain('content="default-src \'none\'; style-src \'unsafe-inline\'; font-src \'self\'; base-uri \'none\'"');
    });

    it('should include all security headers in correct order', () => {
        const header = strategy.generateHeader(mockContext);
        const cspIndex = header.indexOf('Content-Security-Policy');
        const contentTypeIndex = header.indexOf('X-Content-Type-Options');
        const frameOptionsIndex = header.indexOf('X-Frame-Options');
        const referrerPolicyIndex = header.indexOf('Referrer-Policy');

        expect(cspIndex).toBeGreaterThan(-1);
        expect(contentTypeIndex).toBeGreaterThan(cspIndex);
        expect(frameOptionsIndex).toBeGreaterThan(contentTypeIndex);
        expect(referrerPolicyIndex).toBeGreaterThan(frameOptionsIndex);
    });

    it('should have secure GitHub link with proper attributes', () => {
        const header = strategy.generateHeader(mockContext);
        expect(header).toContain('<a href="https://github.com/the99studio/project-fusion" target="_blank" rel="noopener noreferrer">');
    });

    it('should escape project title in security headers', () => {
        const maliciousContext: OutputContext = {
            ...mockContext,
            projectTitle: '<script>alert("xss")</script>Test',
            versionInfo: ' v1.0<script>alert("xss")</script>'
        };

        const header = strategy.generateHeader(maliciousContext);
        expect(header).not.toContain('<script>');
        expect(header).toContain('&lt;script&gt;');
        expect(header).toContain('&quot;xss&quot;');
    });
});