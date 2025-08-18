# Performance Testing Guide

This guide covers Project Fusion's comprehensive performance testing suite, designed to validate scalability, detect memory leaks, and track performance regressions.

## Overview

The performance testing suite consists of three main components:

1. **Automated Performance Tests** (`tests/performance.test.ts`)
2. **Standalone Benchmark Runner** (`scripts/benchmark-runner.js`)
3. **Performance Scripts** (npm commands)

## Running Performance Tests

### Quick Test Run

```bash
# Run all performance tests
npm run test:perf

# Run standalone benchmark suite
npm run benchmark
```

### Individual Test Categories

The performance test suite is organized into several categories:

#### Stress Tests
Tests Project Fusion's ability to handle large numbers of files and validate resource limits.

- **1000 small files**: Validates processing efficiency with many small files
- **5000 files with caps**: Tests enforcement of file count limits
- **Large files**: Tests handling of files with significant content

#### Memory Leak Tests
Ensures proper memory cleanup and prevents memory accumulation over time.

- **Repeated processing**: Validates memory doesn't accumulate across multiple runs
- **Resource cleanup**: Tests proper cleanup of temporary resources
- **Memory pressure**: Tests behavior under high memory usage scenarios
- **Recovery testing**: Validates graceful recovery from memory pressure

#### Benchmark Suite
Provides consistent performance measurements and regression detection.

- **Performance metrics**: Tracks processing time, memory usage, throughput
- **Regression detection**: Establishes performance baselines and detects changes
- **Throughput analysis**: Measures performance across different workload patterns
- **Standardized testing**: Consistent test datasets for reliable comparisons

#### Scalability Tests
Validates performance across different architectural scenarios.

- **Deep directories**: Tests performance with nested directory structures
- **Mixed file sizes**: Validates efficiency across varied file size distributions

## Benchmark Runner

The standalone benchmark runner (`npm run benchmark`) provides comprehensive performance analysis:

### Features

- **Scalability Benchmark**: Tests with different file counts and sizes
- **Throughput Benchmark**: Measures processing speed across workload patterns
- **Memory Stress Testing**: Validates memory usage under intensive scenarios
- **Automated Reporting**: Generates JSON reports with performance metrics
- **Performance Grading**: Provides letter grades for different performance aspects

### Sample Output

```
🏁 Starting Project Fusion Performance Benchmark
Node.js v18.x on darwin arm64

🚀 Running scalability benchmark...
  📊 Testing small: 50 files × 1KB
    ✅ 35ms, 1.3MB, 1.4 MB/s
  
⚡ Running throughput benchmark...
  ⚡ many-tiny: 1000 × 50 bytes
    ⚡ 0.33 MB/s (145ms avg)

📊 Performance Benchmark Summary
══════════════════════════════════════════════════
Average Throughput: 16.69 MB/s
Max Processing Time: 160ms  
Max Memory Usage: 17.0MB
All Tests Passed: ✅
══════════════════════════════════════════════════
Performance Grades:
  Throughput: 🚀 16.69 MB/s
  Memory Usage: 🚀 17.0 MB  
  Processing Time: 🚀 160 ms
```

## Performance Baselines

### Expected Performance Characteristics

| Metric | Target | Good | Acceptable |
|--------|--------|------|------------|
| Throughput | >10 MB/s | >5 MB/s | >1 MB/s |
| Memory Growth | <50MB | <100MB | <200MB |
| Processing Time (1000 files) | <5s | <10s | <30s |
| File Count Limit | 10000 | 5000 | 1000 |

### Performance Grades

The benchmark runner provides performance grades:

- 🚀 **Excellent**: Exceeds performance targets
- ✅ **Good**: Meets performance expectations  
- ⚠️ **Acceptable**: Within acceptable limits but could be improved

## Regression Detection

### Automated Regression Testing

Performance tests include regression detection mechanisms:

1. **Baseline Establishment**: Multiple runs establish performance baselines
2. **Variance Analysis**: Detects unusual performance variations  
3. **Threshold Monitoring**: Alerts when performance degrades beyond thresholds
4. **Historical Tracking**: JSON reports enable performance tracking over time

### Using Performance Reports

The benchmark runner generates `performance-report.json` with detailed metrics:

```json
{
  "metadata": {
    "timestamp": "2025-01-01T00:00:00.000Z",
    "nodeVersion": "v18.x.x", 
    "platform": "darwin arm64"
  },
  "scalability": [...],
  "throughput": [...],
  "memory": {...},
  "summary": {
    "overallThroughputMBPerSec": 16.69,
    "maxProcessingTimeMs": 160,
    "maxMemoryUsageMB": 17.0,
    "allTestsPassed": true
  }
}
```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
- name: Run Performance Tests
  run: |
    npm run test:perf
    npm run benchmark
    
- name: Upload Performance Report  
  uses: actions/upload-artifact@v3
  with:
    name: performance-report
    path: performance-report.json
```

### Performance Monitoring

1. **Automated Testing**: Include `npm run test:perf` in CI pipeline
2. **Benchmark Reports**: Archive benchmark results for trend analysis
3. **Threshold Alerts**: Set up alerts for performance degradation
4. **Release Validation**: Run benchmarks before releases

## Troubleshooting

### Common Issues

**Test Timeouts**
- Increase timeout values in test configuration
- Check system resources during test runs
- Consider reducing test data sizes for slower systems

**Memory Test Failures**  
- Tests may be sensitive to Node.js garbage collection timing
- Consider running with `--expose-gc` for more predictable GC behavior
- Adjust memory thresholds based on system characteristics

**Inconsistent Results**
- Ensure system is not under heavy load during testing
- Run multiple times to establish consistent baselines
- Consider system-specific performance characteristics

### Custom Configuration

Performance tests can be customized by modifying:

- File count limits in test configurations
- Memory threshold expectations  
- Processing time expectations
- Throughput benchmarks

## Best Practices

1. **Regular Testing**: Run performance tests regularly, not just before releases
2. **Baseline Updates**: Update performance baselines when making intentional optimizations
3. **Environment Consistency**: Run benchmarks in consistent environments
4. **Trend Analysis**: Track performance trends over time using generated reports
5. **Resource Monitoring**: Monitor system resources during performance testing

## Contributing

When adding new performance tests:

1. Follow existing test structure and naming conventions
2. Include appropriate timeouts for longer-running tests  
3. Clean up test artifacts in afterEach hooks
4. Document expected performance characteristics
5. Update baselines if tests introduce new performance expectations

For questions about performance testing, refer to the main project documentation or open an issue on GitHub.