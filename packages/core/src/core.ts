/**
 * Entry point for the Project Fusion core module
 */

// Export types
export * from './applydiff/coreapplydifftypes.js';
export * from './fusion/corefusiontypes.js';

// Export schemas
export * from './schema.js';

// Export utilities
export * from './coreutils.js';

// Export fusion functionality
export { processFusion } from './fusion/corefusion.js';

// Export apply diff functionality
export { processApplyDiff } from './applydiff/coreapplydiff.js';
