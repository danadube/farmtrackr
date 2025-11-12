# FarmTrackr Testing Documentation

## Overview

This document outlines the testing strategy and implementation for the FarmTrackr app. The testing approach follows the testing pyramid model with a focus on unit tests, integration tests, and UI tests.

## Testing Strategy

### Test Pyramid
- **Unit Tests (70%)**: Fast, isolated tests for individual components and functions
- **Integration Tests (20%)**: Tests for component interactions and Core Data operations
- **UI Tests (10%)**: End-to-end user workflow tests

### Test Categories

#### 1. Unit Tests (`FarmTrackrTests.swift`)

**FarmContact Model Tests**
- `testFullNameComputation()`: Tests name formatting and edge cases
- `testZipCodeFormatting()`: Tests zip code formatting for 5 and 9-digit codes
- `testDisplayAddressFormatting()`: Tests address formatting with various field combinations
- `testPrimaryContactMethods()`: Tests email and phone number selection logic

**Core Data Operations Tests**
- `testContactCreationAndSaving()`: Tests contact creation and persistence
- `testContactDeletion()`: Tests contact deletion and verification
- `testContactUpdate()`: Tests contact modification and timestamp updates

**Theme System Tests**
- `testThemeViewModelInitialization()`: Tests theme initialization and defaults
- `testThemeManager()`: Tests theme retrieval and fallback behavior

**Accessibility Manager Tests**
- `testAccessibilityManagerInitialization()`: Tests accessibility state initialization

**Performance Tests**
- `testContactListPerformance()`: Tests Core Data fetch performance with large datasets

#### 2. UI Tests (`FarmTrackrUITests.swift`)

**Navigation Tests**
- `testNavigationBetweenTabs()`: Tests tab navigation and screen verification

**Contact Management Tests**
- `testAddNewContact()`: Tests complete contact creation workflow
- `testEditExistingContact()`: Tests contact editing and modification
- `testDeleteContact()`: Tests contact deletion with confirmation

**Search and Filter Tests**
- `testSearchContacts()`: Tests search functionality and results
- `testFilterContacts()`: Tests farm-based filtering

**Settings Tests**
- `testThemeSelection()`: Tests theme switching functionality
- `testDarkModeToggle()`: Tests dark mode toggle behavior

**Import/Export Tests**
- `testImportExportNavigation()`: Tests import/export sheet presentation

**Accessibility Tests**
- `testAccessibilityFeatures()`: Tests accessibility toggle functionality

**Performance Tests**
- `testLaunchPerformance()`: Tests app launch time
- `testContactListScrollingPerformance()`: Tests scrolling performance metrics

## Running Tests

### In Xcode
1. Open the FarmTrackr project in Xcode
2. Select the test target from the scheme dropdown
3. Press `Cmd+U` to run all tests
4. Or use `Cmd+Shift+U` to run tests with coverage

### Test Plan
Use the `FarmTrackrTestPlan.xctestplan` to organize and run tests:
1. Go to Product → Test Plan → FarmTrackrTestPlan
2. This will run both unit and UI tests in the correct order

### Individual Test Execution
- Right-click on any test method and select "Run Test"
- Use the test navigator to run specific test classes or methods

## Test Data Management

### In-Memory Core Data
All tests use in-memory Core Data stores to ensure:
- Tests don't affect production data
- Tests run in isolation
- Fast test execution
- No cleanup required

### Sample Data
- `FarmContact.preview()`: Creates sample contact for testing
- `PersistenceController.preview`: Sets up sample data for SwiftUI previews

## Test Coverage Goals

### Current Coverage Targets
- **Model Layer**: 95% coverage
- **Core Data Operations**: 90% coverage
- **Theme System**: 85% coverage
- **UI Components**: 80% coverage
- **User Workflows**: 75% coverage

### Coverage Measurement
Run tests with coverage enabled:
```bash
xcodebuild test -scheme FarmTrackr -destination 'platform=iOS Simulator,name=iPhone 15' -enableCodeCoverage YES
```

## Best Practices

### Unit Test Guidelines
1. **Arrange-Act-Assert**: Structure tests with clear sections
2. **Descriptive Names**: Use clear, descriptive test method names
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Isolation**: Tests should not depend on each other
5. **Fast Execution**: Unit tests should complete in milliseconds

### UI Test Guidelines
1. **User-Centric**: Focus on user workflows and interactions
2. **Robust Selectors**: Use accessibility identifiers when possible
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Monitor test execution time and resource usage

### Test Maintenance
1. **Regular Updates**: Update tests when features change
2. **Refactoring**: Keep tests clean and maintainable
3. **Documentation**: Document complex test scenarios
4. **Review**: Regularly review test coverage and effectiveness

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: |
          xcodebuild test -scheme FarmTrackr -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Xcode Cloud
1. Enable Xcode Cloud in project settings
2. Configure test plan for CI/CD
3. Set up automatic test execution on commits

## Troubleshooting

### Common Issues
1. **Test Failures**: Check Core Data model compatibility
2. **UI Test Timeouts**: Increase timeout values for slow operations
3. **Simulator Issues**: Reset simulator content and settings
4. **Build Errors**: Ensure all dependencies are properly linked

### Debugging Tests
1. Use breakpoints in test methods
2. Add logging with `print()` statements
3. Use Xcode's test navigator for detailed failure information
4. Check test reports for performance regressions

## Future Enhancements

### Planned Test Improvements
1. **Mock Services**: Add mock implementations for external dependencies
2. **Snapshot Testing**: Implement UI snapshot testing for visual regression
3. **Performance Baselines**: Establish performance benchmarks
4. **Accessibility Testing**: Add automated accessibility compliance tests
5. **Localization Testing**: Test app behavior in different locales

### Test Automation
1. **Nightly Builds**: Set up automated nightly test runs
2. **Test Reporting**: Implement comprehensive test reporting
3. **Coverage Tracking**: Track coverage trends over time
4. **Performance Monitoring**: Monitor test execution performance

## Resources

- [Apple Testing Documentation](https://developer.apple.com/documentation/xcode/testing)
- [Swift Testing Framework](https://developer.apple.com/documentation/swift/testing)
- [XCTest Framework](https://developer.apple.com/documentation/xctest)
- [UI Testing Best Practices](https://developer.apple.com/documentation/xcode/ui-testing) 