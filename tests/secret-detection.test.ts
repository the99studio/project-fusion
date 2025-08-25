// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for secret detection and redaction functionality
 */
import { describe, expect, it } from 'vitest';
import type { Config } from '../src/types.js';
import { redactSecrets, SECRET_PATTERNS, validateFileContent , defaultConfig } from '../src/utils.js';

describe('Secret Detection Tests', () => {
    describe('SECRET_PATTERNS', () => {
        it('should contain all expected secret patterns', () => {
            expect(SECRET_PATTERNS).toHaveLength(20);
            
            const expectedPatterns = [
                'AWS Access Key',
                'AWS Secret Key', 
                'RSA Private Key',
                'SSH Private Key',
                'PGP Private Key',
                'Slack Token',
                'Google API Key',
                'GitHub Token',
                'Stripe Key',
                'PayPal/Braintree Token',
                'Square Token',
                'Twilio Key',
                'MailChimp Key',
                'SendGrid Key',
                'Heroku API Key',
                'JWT Token',
                'npm Token',
                'Generic API Key',
                'Generic Secret',
                'Password Field'
            ];
            
            for (const patternName of expectedPatterns) {
                expect(SECRET_PATTERNS.some(p => p.name === patternName)).toBe(true);
            }
        });

        it('should have valid regex patterns', () => {
            for (const pattern of SECRET_PATTERNS) {
                expect(pattern.name).toBeTypeOf('string');
                expect(pattern.regex).toBeInstanceOf(RegExp);
                expect(pattern.name).toBeTruthy();
            }
        });
    });

    describe('redactSecrets', () => {
        it('should detect and redact AWS Access Keys', () => {
            const content = `
                const awsKey = "AKIA1234567890ABCDEF";
                const config = { accessKey: "AKIAQWERTYUIOPASDFGH" };
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('AWS Access Key');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('AKIA1234567890ABCDEF');
            expect(result.redactedContent).not.toContain('AKIAQWERTYUIOPASDFGH');
        });

        it('should detect and redact Stripe keys', () => {
            const content = `
                const stripeKey = "sk_live_1234567890abcdefghijklmnopqrst";
                const testKey = "sk_test_abcdefghijklmnopqrstuvwxyz123";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('Stripe Key');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('sk_live_');
            expect(result.redactedContent).not.toContain('sk_test_');
        });

        it('should detect and redact GitHub tokens', () => {
            const content = `
                const githubToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
                const githubSecret = "ghs_abcdefghijklmnopqrstuvwxyz1234567890";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('GitHub Token');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('ghp_');
            expect(result.redactedContent).not.toContain('ghs_');
        });

        it('should detect and redact SSH private keys', () => {
            const content = `
                const sshKey = \`-----BEGIN RSA PRIVATE KEY-----
                MIIEowIBAAKCAQEA1234567890...
                -----END RSA PRIVATE KEY-----\`;
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('RSA Private Key');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('-----BEGIN RSA PRIVATE KEY-----');
        });

        it('should detect and redact JWT tokens', () => {
            const content = `
                const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('JWT Token');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('eyJhbGciOiJIUzI1NiI');
        });

        it('should detect and redact Slack tokens', () => {
            const content = `
                const slackBot = "xoxb-123456789012-1234567890123-abcdefghijklmnopqrstuvwx";
                const slackApp = "xoxa-123456789012-1234567890123-abcdefghijklmnopqrstuvwx";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('Slack Token');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('xoxb-');
            expect(result.redactedContent).not.toContain('xoxa-');
        });

        it('should detect and redact Google API keys', () => {
            const content = `
                const googleKey = "AIzaSyB1234567890abcdefghijklmnopqrst";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('Google API Key');
            expect(result.redactedContent).toContain('[REDACTED]');
            expect(result.redactedContent).not.toContain('AIzaSyB');
        });

        it('should detect multiple secret types in one file', () => {
            const content = `
                const awsKey = "AKIA1234567890ABCDEF";
                const stripeKey = "sk_live_1234567890abcdefghijklmnopqrst";
                const githubToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
                const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toHaveLength(4);
            expect(result.detectedSecrets).toContain('AWS Access Key');
            expect(result.detectedSecrets).toContain('Stripe Key');
            expect(result.detectedSecrets).toContain('GitHub Token');
            expect(result.detectedSecrets).toContain('JWT Token');
            
            // All secrets should be redacted
            const redactedCount = (result.redactedContent.match(/\[REDACTED]/g) ?? []).length;
            expect(redactedCount).toBe(4);
        });

        it('should not detect secrets in normal code', () => {
            const content = `
                const normalVariable = "hello world";
                const config = { apiUrl: "https://api.example.com" };
                const token = "not-a-real-secret";
                function generateId() {
                    return Math.random().toString(36);
                }
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toHaveLength(0);
            expect(result.redactedContent).toBe(content);
        });

        it('should handle empty content', () => {
            const result = redactSecrets('');
            
            expect(result.detectedSecrets).toHaveLength(0);
            expect(result.redactedContent).toBe('');
        });

        it('should not duplicate secret types', () => {
            const content = `
                const key1 = "AKIA1234567890ABCDEF";
                const key2 = "AKIAQWERTYUIOPASDFGH";
                const key3 = "AKIAZYXWVUTSRQPONMLK";
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toHaveLength(1);
            expect(result.detectedSecrets).toContain('AWS Access Key');
            
            // All three keys should be redacted
            const redactedCount = (result.redactedContent.match(/\[REDACTED]/g) ?? []).length;
            expect(redactedCount).toBe(3);
        });
    });

    describe('validateFileContent with secret detection', () => {
        it('should detect secrets when excludeSecrets is enabled', () => {
            const content = `
                const awsKey = "AKIA1234567890ABCDEF";
                const stripeKey = "sk_live_1234567890abcdefghijklmnopqrst";
            `;
            
            const config: Config = {
                ...defaultConfig,
                excludeSecrets: true
            };
            
            const result = validateFileContent(content, 'test.js', config);
            
            expect(result.issues.hasSecrets).toBe(true);
            expect(result.issues.secretTypes).toContain('AWS Access Key');
            expect(result.issues.secretTypes).toContain('Stripe Key');
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('Secrets detected and redacted');
        });

        it('should not detect secrets when excludeSecrets is disabled', () => {
            const content = `
                const awsKey = "AKIA1234567890ABCDEF";
                const stripeKey = "sk_live_1234567890abcdefghijklmnopqrst";
            `;
            
            const config: Config = {
                ...defaultConfig,
                excludeSecrets: false
            };
            
            const result = validateFileContent(content, 'test.js', config);
            
            expect(result.issues.hasSecrets).toBeUndefined();
            expect(result.issues.secretTypes).toBeUndefined();
            expect(result.warnings.filter(w => w.includes('secret'))).toHaveLength(0);
        });

        it('should handle content with no secrets', () => {
            const content = `
                const normalVariable = "hello world";
                function test() { return true; }
            `;
            
            const config: Config = {
                ...defaultConfig,
                excludeSecrets: true
            };
            
            const result = validateFileContent(content, 'test.js', config);
            
            expect(result.issues.hasSecrets).toBeUndefined();
            expect(result.issues.secretTypes).toBeUndefined();
            expect(result.warnings.filter(w => w.includes('secret'))).toHaveLength(0);
        });
    });

    describe('Edge cases and security', () => {
        it('should handle malformed secrets gracefully', () => {
            const content = `
                const incomplete = "AKIA123"; // Too short
                const fake = "xoxb-invalid"; // Invalid format
                const partial = "-----BEGIN RSA"; // Incomplete key
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toHaveLength(0);
            expect(result.redactedContent).toBe(content);
        });

        it('should handle large content with many secrets', () => {
            let content = '';
            for (let i = 0; i < 100; i++) {
                content += `const key${i} = "AKIA${i.toString().padStart(16, '0')}";\n`;
            }
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('AWS Access Key');
            expect(result.redactedContent.split('[REDACTED]')).toHaveLength(101); // 100 keys + 1 for split
        });

        it('should not affect similar but non-secret patterns', () => {
            const content = `
                const notAwsKey = "BKIA1234567890ABCDEF"; // Wrong prefix
                const notStripe = "pk_live_1234567890abcdefghijklmnopqrst"; // Public key
                const notJwt = "eyNotAJwt.payload.signature"; // Invalid JWT
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toHaveLength(0);
            expect(result.redactedContent).toBe(content);
        });

        it('should handle secrets in different contexts', () => {
            const content = `
                // In comments: AKIA1234567890ABCDEF
                const config = {
                    "aws_key": "AKIAQWERTYUIOPASDFGH",
                    stripe: 'sk_live_1234567890abcdefghijklmnopqrst'
                };
                
                \`Template with \${AKIAZYXWVUTSRQPONMLK} interpolation\`
            `;
            
            const result = redactSecrets(content);
            
            expect(result.detectedSecrets).toContain('AWS Access Key');
            expect(result.detectedSecrets).toContain('Stripe Key');
            
            // All instances should be redacted regardless of context
            expect(result.redactedContent).not.toContain('AKIA1234567890ABCDEF');
            expect(result.redactedContent).not.toContain('AKIAQWERTYUIOPASDFGH');
            expect(result.redactedContent).not.toContain('AKIAZYXWVUTSRQPONMLK');
            expect(result.redactedContent).not.toContain('sk_live_');
        });
    });
});