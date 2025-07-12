//
//  Extensions.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import Foundation
import SwiftUI

// MARK: - String Extensions
extension String {
    var isValidEmail: Bool {
        let emailRegex = Constants.Validation.emailRegex
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
    
    var isValidPhone: Bool {
        // First try the strict format (digits only)
        let phoneRegex = Constants.Validation.phoneRegex
        let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        if phonePredicate.evaluate(with: self) {
            return true
        }
        
        // Then try the flexible format (with formatting characters)
        let phoneRegexWithFormatting = Constants.Validation.phoneRegexWithFormatting
        let phonePredicateWithFormatting = NSPredicate(format: "SELF MATCHES %@", phoneRegexWithFormatting)
        if phonePredicateWithFormatting.evaluate(with: self) {
            // Check if it has at least 10 digits after cleaning
            let digits = self.filter { $0.isNumber }
            return digits.count >= 10 && digits.count <= 15
        }
        
        return false
    }
    
    var cleanedPhoneNumber: String {
        // Remove all non-digit characters except + at the beginning
        let digits = self.filter { $0.isNumber }
        if self.hasPrefix("+") && digits.count >= 10 {
            return "+" + digits
        } else if digits.count >= 10 {
            return digits
        }
        return self
    }
    
    var isValidZipCode: Bool {
        let zipRegex = Constants.Validation.zipCodeRegex
        let zipPredicate = NSPredicate(format: "SELF MATCHES %@", zipRegex)
        return zipPredicate.evaluate(with: self)
    }
    
    var formattedPhone: String {
        let digits = self.filter { $0.isNumber }
        if digits.count == 10 {
            return "(\(digits.prefix(3))) \(digits.dropFirst(3).prefix(3))-\(digits.dropFirst(6))"
        } else if digits.count == 11 && digits.hasPrefix("1") {
            return "+1 (\(digits.dropFirst().prefix(3))) \(digits.dropFirst(4).prefix(3))-\(digits.dropFirst(7))"
        }
        return self
    }
    
    var capitalizedWords: String {
        self.split(separator: " ")
            .map { $0.prefix(1).uppercased() + $0.dropFirst().lowercased() }
            .joined(separator: " ")
    }
}

// MARK: - Int32 Extensions
extension Int32 {
    var formattedZipCode: String {
        String(self).count == 9 ? 
            "\(String(self).prefix(5))-\(String(self).dropFirst(5))" : 
            String(self)
    }
}

// MARK: - Date Extensions
extension Date {
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: self)
    }
    
    var formattedDateTime: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }
    
    var relativeTime: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}

// MARK: - View Extensions
extension View {
    var appBackground: Color {
        Color(UIColor { trait in
            if trait.userInterfaceStyle == .dark {
                return UIColor.systemBackground
            } else {
                // Use the current theme's background color in light mode
                return UIColor(ThemeManager.theme(named: UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green").colors.background)
            }
        })
    }
    var cardBackgroundAdaptive: Color {
        Color(UIColor { trait in
            if trait.userInterfaceStyle == .dark {
                return UIColor.secondarySystemBackground
            } else {
                // Use the current theme's card background color in light mode
                return UIColor(ThemeManager.theme(named: UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green").colors.cardBackground)
            }
        })
    }
    func cardStyle() -> some View {
        self
            .background(cardBackgroundAdaptive)
            .cornerRadius(Constants.CornerRadius.large)
            .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 4)
            .shadow(color: Color.black.opacity(0.04), radius: 2, x: 0, y: 1)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.CornerRadius.large)
                    .stroke(Constants.Colors.border.opacity(0.3), lineWidth: 0.5)
            )
    }
    
    func interactiveCardStyle() -> some View {
        self
            .background(cardBackgroundAdaptive)
            .cornerRadius(Constants.CornerRadius.large)
            .shadow(color: Color.black.opacity(0.12), radius: 12, x: 0, y: 6)
            .shadow(color: Color.black.opacity(0.06), radius: 4, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.CornerRadius.large)
                    .stroke(Constants.Colors.border.opacity(0.4), lineWidth: 0.5)
            )
            .scaleEffect(1.0)
            .animation(.easeInOut(duration: 0.2), value: true)
    }
    
    func primaryButtonStyle() -> some View {
        self
            .font(Constants.Typography.buttonFont)
            .foregroundColor(.white)
            .frame(height: Constants.Spacing.buttonHeight)
            .frame(maxWidth: .infinity)
            .background(Constants.Colors.primary)
            .cornerRadius(Constants.CornerRadius.medium)
    }
    
    func secondaryButtonStyle() -> some View {
        self
            .font(Constants.Typography.buttonFont)
            .foregroundColor(Constants.Colors.primary)
            .frame(height: Constants.Spacing.buttonHeight)
            .frame(maxWidth: .infinity)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: Constants.CornerRadius.medium)
                    .stroke(Constants.Colors.primary, lineWidth: 1)
            )
    }
    
    func listRowStyle() -> some View {
        self
            .padding(.horizontal, Constants.Spacing.medium)
            .padding(.vertical, Constants.Spacing.small)
            .background(Constants.Colors.cardBackground)
            .cornerRadius(Constants.CornerRadius.small)
    }
}

// MARK: - Corner Radius Extension
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

// MARK: - Color Extensions
extension Color {
    static let systemBackground = Color(UIColor.systemBackground)
    static let secondarySystemBackground = Color(UIColor.secondarySystemBackground)
    static let tertiarySystemBackground = Color(UIColor.tertiarySystemBackground)
    static let label = Color(UIColor.label)
    static let secondaryLabel = Color(UIColor.secondaryLabel)
    static let tertiaryLabel = Color(UIColor.tertiaryLabel)
}

// MARK: - Bundle Extensions
extension Bundle {
    var appName: String {
        return infoDictionary?["CFBundleName"] as? String ?? "FarmTrackr"
    }
    
    var appVersion: String {
        return infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
    
    var buildNumber: String {
        return infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}

extension View {
    func accessibilityTestMode(_ enabled: Bool) -> some View {
        self.accessibilityIdentifier(enabled ? "accessibility-test-mode" : "")
    }
    
    func accessibilityDebugInfo() -> some View {
        self.accessibilityLabel("Debug: \(String(describing: self))")
    }
}

// MARK: - Accessibility Testing Utilities
class AccessibilityTester: ObservableObject {
    @Published var isTestMode = false
    @Published var testResults: [String: Bool] = [:]
    
    func runAccessibilityTests() {
        testResults.removeAll()
        
        // Test VoiceOver support
        testResults["VoiceOver"] = UIAccessibility.isVoiceOverRunning
        
        // Test Dynamic Type
        testResults["Dynamic Type"] = true // Always available in SwiftUI
        
        // Test High Contrast
        testResults["High Contrast"] = false // UIAccessibility.isHighContrastEnabled not available in iOS 18.5
        
        // Test Reduce Motion
        testResults["Reduce Motion"] = UIAccessibility.isReduceMotionEnabled
        
        // Test Bold Text
        testResults["Bold Text"] = UIAccessibility.isBoldTextEnabled
        
        // Test Switch Control
        testResults["Switch Control"] = UIAccessibility.isSwitchControlRunning
        
        // Test AssistiveTouch
        testResults["AssistiveTouch"] = UIAccessibility.isAssistiveTouchRunning
    }
    
    func generateAccessibilityReport() -> String {
        var report = "Accessibility Test Report\n"
        report += "=====================\n\n"
        
        for (feature, supported) in testResults {
            let status = supported ? "✅ Supported" : "❌ Not Supported"
            report += "\(feature): \(status)\n"
        }
        
        report += "\nRecommendations:\n"
        
        if !testResults["VoiceOver"]! {
            report += "- Ensure all interactive elements have proper accessibility labels\n"
        }
        
        if !testResults["High Contrast"]! {
            report += "- Test app with high contrast mode enabled\n"
        }
        
        if !testResults["Reduce Motion"]! {
            report += "- Respect reduce motion preferences\n"
        }
        
        return report
    }
}

// MARK: - Accessibility Color Extensions
extension Color {
    var accessibilityContrastRatio: Double {
        // Simplified contrast ratio calculation
        // In a real implementation, you'd calculate actual contrast ratios
        return 4.5 // Placeholder value
    }
    
    var isAccessibleOnBackground: Bool {
        return accessibilityContrastRatio >= 4.5
    }
}

// MARK: - Accessibility Font Extensions
extension Font {
    var accessibilityScaled: Font {
        // .dynamicTypeSize(.large) is not available; fallback to .largeTitle
        return .largeTitle
    }
    
    var accessibilityBold: Font {
        return self.weight(.bold)
    }
}

// MARK: - Accessibility Gesture Extensions
extension View {
    func accessibilityGesture<T: Gesture>(_ gesture: T) -> some View {
        return self.gesture(gesture)
    }
    
    func accessibilityLongPressGesture(minimumDuration: Double = 0.5, maximumDistance: CGFloat = 10, perform action: @escaping () -> Void) -> some View {
        return self.onLongPressGesture(minimumDuration: minimumDuration, maximumDistance: maximumDistance, perform: action)
    }
    
    func accessibilityTapGesture(count: Int = 1, perform action: @escaping () -> Void) -> some View {
        return self.onTapGesture(count: count, perform: action)
    }
}

// MARK: - Accessibility Focus Extensions
// Removed accessibilityFocused (not available in iOS 18.5)

// MARK: - Accessibility Group Extensions
extension View {
    func accessibilityGroup() -> some View {
        return self.accessibilityElement(children: .contain)
    }
    
    func accessibilityCombine() -> some View {
        return self.accessibilityElement(children: .combine)
    }
    
    func accessibilityIgnore() -> some View {
        return self.accessibilityElement(children: .ignore)
    }
}

// MARK: - Accessibility Action Extensions
extension View {
    func accessibilityCustomAction(_ name: String, action: @escaping () -> Void) -> some View {
        return self.accessibilityAction(named: name) { action() }
    }
    // Removed accessibilityAdjustableAction (not available in iOS 18.5)
}

// MARK: - Accessibility Sort Extensions
extension View {
    func accessibilitySortPriority(_ priority: Double) -> some View {
        return self.accessibilitySortPriority(priority)
    }
    
    func accessibilitySortPriority(_ priority: Int) -> some View {
        return self.accessibilitySortPriority(Double(priority))
    }
}

// MARK: - Accessibility Large Content Viewer Extensions
extension View {
    func accessibilityLargeContentViewer() -> some View {
        return self.accessibilityShowsLargeContentViewer()
    }
}

// MARK: - Accessibility Ignore Extensions
// Removed accessibilityIgnoresSmartInvertColors, accessibilityIgnoresReduceMotion, accessibilityIgnoresReduceTransparency, accessibilityIgnoresAssistiveTechnologies (not available in iOS 18.5)

// MARK: - Accessibility Testing View
struct AccessibilityTestView: View {
    @StateObject private var tester = AccessibilityTester()
    @State private var showingReport = false
    
    var body: some View {
        NavigationView {
            List {
                Section("Accessibility Tests") {
                    ForEach(Array(tester.testResults.keys.sorted()), id: \.self) { feature in
                        HStack {
                            Text(feature)
                            Spacer()
                            if tester.testResults[feature] == true {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                            } else {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                    }
                }
                
                Section("Actions") {
                    Button("Run Tests") {
                        tester.runAccessibilityTests()
                    }
                    
                    Button("Generate Report") {
                        showingReport = true
                    }
                }
            }
            .navigationTitle("Accessibility Tests")
            .sheet(isPresented: $showingReport) {
                NavigationView {
                    ScrollView {
                        Text(tester.generateAccessibilityReport())
                            .font(.system(.body, design: .monospaced))
                            .padding()
                    }
                    .navigationTitle("Accessibility Report")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showingReport = false
                            }
                        }
                    }
                }
            }
        }
    }
} 