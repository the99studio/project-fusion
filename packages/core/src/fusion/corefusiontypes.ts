/**
 * Type definitions for the fusion functionality
 */

/**
 * Configuration for the fusion process
 */
export interface FusionConfig {
    directory: string;
    fusion_file: string;
    fusion_log: string;
  }
  
  /**
   * Configuration for parsed file extensions
   */
  export interface ParsedFileExtensionsConfig {
    backend: string[];
    config: string[];
    cpp: string[];
    scripts: string[];
    web: string[];
    [key: string]: string[];
  }
  
  /**
   * Configuration for parsing
   */
  export interface ParsingConfig {
    parseSubDirectories: boolean;
    rootDirectory: string;
  }
  
  /**
   * Information about a file for fusion
   */
  export interface FileInfo {
    path: string;
    content: string;
    hash: string;
  }
  
  /**
   * Options for the fusion process
   */
  export interface FusionOptions {
    extensionGroups?: string[];
  }
  
  /**
   * Result of the fusion process
   */
  export interface FusionResult {
    success: boolean;
    message: string;
    fusionFilePath?: string;
    logFilePath?: string;
    error?: Error;
  }