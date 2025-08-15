/**
 * Type definitions for the apply diff functionality
 */

/**
 * Configuration for the apply diff process
 */
export interface ApplyDiffConfig {
  directory: string;
  diff_file: string;
  applydiff_log: string;
}

/**
 * Types of file changes that can be applied
 */
export enum FileChangeType {
  MODIFY = 'MODIFY',
  NEW = 'NEW',
  DELETE = 'DELETE',
  RENAME = 'RENAME'
}

/**
 * Representation of a file change to be applied
 */
export interface FileChange {
  filePath: string;
  type: FileChangeType;
  content?: string;
  newPath?: string; // For RENAME operations
  diff?: string; // For MODIFY operations
  hash?: string; // Optional hash for validation
}

/**
 * Result of parsing a diff section
 */
export interface ParsedDiffSection {
  filePath: string;
  type: FileChangeType;
  content?: string;
  newPath?: string;
  diff?: string;
  hash?: string; // Added hash property for validation
}

/**
 * Options for the apply diff process
 */
export interface ApplyDiffOptions {
  skipHashValidation?: boolean;
  fuzzyMatch?: boolean; // Optional parameter, but will be true by default in the implementation
}

/**
 * Result of the apply diff process
 */
export interface ApplyDiffResult {
  success: boolean;
  message: string;
  logFilePath?: string;
  changedFiles?: string[];
  error?: Error;
}