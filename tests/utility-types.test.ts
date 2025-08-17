// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for utility types
 */
import { describe, it, expect } from 'vitest';
import {
    type NonEmptyArray,
    isNonEmptyArray,
    createNonEmptyArray,
    type ExtensionGroupName,
    EXTENSION_GROUPS,
    isValidExtensionGroup,
    getExtensionsForGroup,
    FusionError
} from '../src/types.js';

describe('Utility Types', () => {
    describe('NonEmptyArray', () => {
        it('should correctly identify non-empty arrays', () => {
            expect(isNonEmptyArray([1, 2, 3])).toBe(true);
            expect(isNonEmptyArray(['a'])).toBe(true);
            expect(isNonEmptyArray([])).toBe(false);
        });

        it('should create non-empty arrays from valid arrays', () => {
            const result = createNonEmptyArray([1, 2, 3]);
            expect(result).toEqual([1, 2, 3]);
            
            // TypeScript should infer this as NonEmptyArray<number>
            const first: number = result[0];
            expect(first).toBe(1);
        });

        it('should throw error for empty arrays', () => {
            expect(() => createNonEmptyArray([])).toThrow(FusionError);
            expect(() => createNonEmptyArray([])).toThrow('Array must contain at least one element');
        });

        it('should preserve readonly nature', () => {
            const readonlyArray = [1, 2, 3] as const;
            const result = createNonEmptyArray(readonlyArray);
            
            // Should be assignable to NonEmptyArray
            const typed: NonEmptyArray<number> = result;
            expect(typed[0]).toBe(1);
        });
    });

    describe('ExtensionGroup', () => {
        it('should have correct extension groups defined', () => {
            expect(EXTENSION_GROUPS.web).toContain('.js');
            expect(EXTENSION_GROUPS.web).toContain('.ts');
            expect(EXTENSION_GROUPS.backend).toContain('.py');
            expect(EXTENSION_GROUPS.config).toContain('.json');
            expect(EXTENSION_GROUPS.cpp).toContain('.cpp');
            expect(EXTENSION_GROUPS.scripts).toContain('.sh');
            expect(EXTENSION_GROUPS.godot).toContain('.gd');
            expect(EXTENSION_GROUPS.doc).toContain('.md');
        });

        it('should validate extension group names', () => {
            expect(isValidExtensionGroup('web')).toBe(true);
            expect(isValidExtensionGroup('backend')).toBe(true);
            expect(isValidExtensionGroup('config')).toBe(true);
            expect(isValidExtensionGroup('invalid')).toBe(false);
            expect(isValidExtensionGroup('')).toBe(false);
        });

        it('should get extensions for valid groups', () => {
            const webExtensions = getExtensionsForGroup('web');
            expect(webExtensions).toContain('.js');
            expect(webExtensions).toContain('.ts');
            
            const backendExtensions = getExtensionsForGroup('backend');
            expect(backendExtensions).toContain('.py');
            expect(backendExtensions).toContain('.java');
        });

        it('should have all extensions as non-empty arrays', () => {
            const groupNames: ExtensionGroupName[] = Object.keys(EXTENSION_GROUPS) as ExtensionGroupName[];
            
            for (const groupName of groupNames) {
                const extensions = getExtensionsForGroup(groupName);
                expect(isNonEmptyArray(extensions)).toBe(true);
                expect(extensions.length).toBeGreaterThan(0);
            }
        });

        it('should have extensions starting with dot', () => {
            const groupNames: ExtensionGroupName[] = Object.keys(EXTENSION_GROUPS) as ExtensionGroupName[];
            
            for (const groupName of groupNames) {
                const extensions = getExtensionsForGroup(groupName);
                for (const ext of extensions) {
                    expect(ext.startsWith('.')).toBe(true);
                    expect(ext.length).toBeGreaterThan(1);
                }
            }
        });

        it('should not have duplicate extensions within groups', () => {
            const groupNames: ExtensionGroupName[] = Object.keys(EXTENSION_GROUPS) as ExtensionGroupName[];
            
            for (const groupName of groupNames) {
                const extensions = getExtensionsForGroup(groupName);
                const uniqueExtensions = new Set(extensions);
                expect(uniqueExtensions.size).toBe(extensions.length);
            }
        });

        it('should have extensions in alphabetical order within groups', () => {
            const groupNames: ExtensionGroupName[] = Object.keys(EXTENSION_GROUPS) as ExtensionGroupName[];
            
            for (const groupName of groupNames) {
                const extensions = getExtensionsForGroup(groupName);
                const sortedExtensions = [...extensions].sort();
                expect(extensions).toEqual(sortedExtensions);
            }
        });
    });

    describe('Type Safety', () => {
        it('should prevent invalid extension group access at compile time', () => {
            // This should work fine
            const validGroup: ExtensionGroupName = 'web';
            const extensions = getExtensionsForGroup(validGroup);
            expect(extensions).toBeDefined();
            
            // This would cause a TypeScript error if uncommented:
            // const invalidGroup: ExtensionGroupName = 'invalid';
            // getExtensionsForGroup(invalidGroup);
        });

        it('should enforce non-empty array constraints', () => {
            // This should work
            const validArray: NonEmptyArray<string> = ['.js', '.ts'];
            expect(validArray[0]).toBe('.js');
            
            // This would cause a TypeScript error if uncommented:
            // const invalidArray: NonEmptyArray<string> = [];
        });
    });
});