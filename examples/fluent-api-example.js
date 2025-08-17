#!/usr/bin/env node

// Example demonstrating the Fluent API for Project Fusion
import { projectFusion } from 'project-fusion';

async function basicExample() {
    console.log('🚀 Basic Fluent API Example');
    
    try {
        const result = await projectFusion()
            .include(['web', 'backend'])
            .exclude(['*.test.ts', 'node_modules'])
            .maxSize('2MB')
            .output(['md', 'html'])
            .generate();

        if (result.success) {
            console.log('✅ Fusion completed successfully!');
            console.log(`📄 Generated files: ${result.message}`);
        } else {
            console.log('❌ Fusion failed:', result.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function advancedExample() {
    console.log('\n🔧 Advanced Fluent API Example');
    
    try {
        const result = await projectFusion()
            .root('./src')
            .include(['web', 'backend'])
            .exclude(['*.test.ts', '__tests__/', 'coverage/'])
            .maxSize('5MB')
            .output(['text', 'md', 'html'])
            .name('my-project-fusion')
            .subdirectories(true)
            .clipboard(false)
            .gitignore(true)
            .extensions('custom', ['.custom', '.special'])
            .configure((options) => {
                // Custom configuration function
                options.parseSubDirectories = true;
                options.useGitIgnoreForExcludes = true;
            })
            .generate();

        if (result.success) {
            console.log('✅ Advanced fusion completed!');
            console.log(`📄 Generated files: ${result.message}`);
        } else {
            console.log('❌ Advanced fusion failed:', result.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function configInspection() {
    console.log('\n🔍 Configuration Inspection Example');
    
    const builder = projectFusion()
        .root('./src')
        .include(['web'])
        .maxSize('1MB')
        .output(['md']);
    
    const config = builder.getConfig();
    console.log('Current configuration:', JSON.stringify(config, null, 2));
    
    // Reset and reconfigure
    builder.reset()
        .include(['backend'])
        .maxSize('500KB');
        
    const newConfig = builder.getConfig();
    console.log('After reset:', JSON.stringify(newConfig, null, 2));
}

// Run examples
async function runExamples() {
    await basicExample();
    await advancedExample();
    await configInspection();
}

runExamples().catch(console.error);