//
//  Extensions.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import Foundation

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

// MARK: - Platform-Specific Type Aliases

#if os(iOS)
typealias PlatformTextView = UITextView
typealias PlatformFont = UIFont
typealias PlatformColor = UIColor
typealias PlatformTextViewDelegate = UITextViewDelegate
#elseif os(macOS)
typealias PlatformTextView = NSTextView
typealias PlatformFont = NSFont
typealias PlatformColor = NSColor
typealias PlatformTextViewDelegate = NSTextViewDelegate
#endif

// MARK: - Color Extensions

extension Color {
    #if os(iOS)
    static let systemBackground = Color(UIColor.systemBackground)
    static let secondarySystemBackground = Color(UIColor.secondarySystemBackground)
    static let tertiarySystemBackground = Color(UIColor.tertiarySystemBackground)
    static let label = Color(UIColor.label)
    static let secondaryLabel = Color(UIColor.secondaryLabel)
    static let tertiaryLabel = Color(UIColor.tertiaryLabel)
    #elseif os(macOS)
    static let systemBackground = Color(NSColor.controlBackgroundColor)
    static let secondarySystemBackground = Color(NSColor.controlAlternatingRowBackgroundColors[0])
    static let tertiarySystemBackground = Color(NSColor.controlAlternatingRowBackgroundColors[1])
    static let label = Color(NSColor.labelColor)
    static let secondaryLabel = Color(NSColor.secondaryLabelColor)
    static let tertiaryLabel = Color(NSColor.tertiaryLabelColor)
    #endif
    
    static var cardBackgroundColor: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.secondarySystemBackground
            default:
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return UIColor(theme.colors.cardBackground)
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.controlBackgroundColor
            } else {
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return NSColor(theme.colors.cardBackground)
            }
        })
        #endif
    }
    
    static var appBackground: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.systemBackground
            default:
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return UIColor(theme.colors.background)
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.controlBackgroundColor
            } else {
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return NSColor(theme.colors.background)
            }
        })
        #endif
    }
    
    static var cardBackgroundAdaptive: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.secondarySystemBackground
            default:
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return UIColor(theme.colors.cardBackground)
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.controlBackgroundColor
            } else {
                let themeName = UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green"
                let theme = ThemeManager.theme(named: themeName)
                return NSColor(theme.colors.cardBackground)
            }
        })
        #endif
    }
    
    static var adaptivePageBackground: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.systemGray5
            default:
                return UIColor.white
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.controlBackgroundColor
            } else {
                return NSColor.white
            }
        })
        #endif
    }
    
    static var adaptiveShadowColor: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.black
            default:
                return UIColor.black
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.black
            } else {
                return NSColor.black
            }
        })
        #endif
    }
    
    // Cross-platform color creation
    static func dynamicColor(light: Color, dark: Color) -> Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor(dark)
            default:
                return UIColor(light)
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor(dark)
            } else {
                return NSColor(light)
            }
        })
        #endif
    }
    
    // Cross-platform system colors
    static var systemBackgroundColor: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.systemBackground
            default:
                return UIColor(ThemeManager.theme(named: UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green").colors.background)
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.controlBackgroundColor
            } else {
                return NSColor(ThemeManager.theme(named: UserDefaults.standard.string(forKey: "selectedTheme") ?? "Modern Green").colors.background)
            }
        })
        #endif
    }
    
    static var textColor: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.white
            default:
                return UIColor.black
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.white
            } else {
                return NSColor.black
            }
        })
        #endif
    }
    
    static var borderColor: Color {
        #if os(iOS)
        return Color(UIColor { trait in
            switch trait.userInterfaceStyle {
            case .dark:
                return UIColor.systemGray4
            default:
                return UIColor.systemGray5
            }
        })
        #elseif os(macOS)
        return Color(NSColor { appearance in
            if appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua {
                return NSColor.separatorColor
            } else {
                return NSColor.separatorColor
            }
        })
        #endif
    }
}



// MARK: - Color Utilities

extension Color {
    func luminance(_ color: PlatformColor) -> Double {
        let components = color.cgColor.components ?? [0, 0, 0]
        let r = components[0]
        let g = components[1]
        let b = components[2]
        
        return 0.299 * r + 0.587 * g + 0.114 * b
    }
    
    var isLight: Bool {
        #if os(iOS)
        let color = UIColor(self)
        let bg = UIColor.white // Assume white background for contrast
        #elseif os(macOS)
        let color = NSColor(self)
        let bg = NSColor.white // Assume white background for contrast
        #endif
        
        let luminance1 = luminance(color)
        let luminance2 = luminance(bg)
        
        return abs(luminance1 - luminance2) > 0.5
    }
}

// MARK: - View Extensions

extension View {
    func placeholder<Content: View>(
        when shouldShow: Bool,
        alignment: Alignment = .leading,
        @ViewBuilder placeholder: () -> Content) -> some View {
        
        ZStack(alignment: alignment) {
            placeholder().opacity(shouldShow ? 1 : 0)
            self
        }
    }
    
    func cardStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
    }
    
    func elevatedCardStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.3), radius: 16, x: 0, y: 8)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.black.opacity(0.12), lineWidth: 1)
            )
    }
    
    func buttonStyle() -> some View {
        self
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.accentColor)
            .foregroundColor(.white)
            .cornerRadius(10)
            .shadow(color: Color.black.opacity(0.3), radius: 6, x: 0, y: 3)
    }
    
    func primaryButtonStyle() -> some View {
        self
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(.white)
            .frame(height: 44)
            .frame(maxWidth: .infinity)
            .background(Color.accentColor)
            .cornerRadius(10)
            .shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
    }
    
    func secondaryButtonStyle() -> some View {
        self
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(Color.accentColor)
            .frame(height: 44)
            .frame(maxWidth: .infinity)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.accentColor, lineWidth: 1.5)
            )
            .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
    }
    
    func settingsButtonStyle() -> some View {
        self
            .font(.system(size: 16))
            .foregroundColor(.primary)
            .frame(minHeight: 44)
            .frame(maxWidth: .infinity)
            .background(Color.cardBackgroundColor)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
    }
    
    func listRowStyle() -> some View {
        self
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.cardBackgroundColor)
            .cornerRadius(10)
            .shadow(color: Color.black.opacity(0.15), radius: 6, x: 0, y: 3)
    }
    
    func interactiveCardStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
    }
    
    func floatingCardStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.35), radius: 20, x: 0, y: 10)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.black.opacity(0.15), lineWidth: 1)
            )
    }
    
    func toolbarStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(8)
            .shadow(color: Color.black.opacity(0.2), radius: 6, x: 0, y: 3)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.black.opacity(0.08), lineWidth: 1)
            )
    }
    
    func inputFieldStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(8)
            .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.black.opacity(0.12), lineWidth: 1)
            )
    }
    
    func menuCardStyle() -> some View {
        self
            .background(Color.cardBackgroundColor)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
    }
    
    // MARK: - Enhanced Hover Effects
    
    func enhancedHoverEffect(
        primaryColor: Color,
        secondaryColor: Color,
        isHovered: Bool,
        scale: CGFloat = 1.02,
        lift: CGFloat = -4
    ) -> some View {
        self
            .scaleEffect(isHovered ? scale : 1.0)
            .offset(y: isHovered ? lift : 0)
            .shadow(
                color: isHovered ? Color.black.opacity(0.35) : Color.black.opacity(0.25),
                radius: isHovered ? 16 : 12,
                x: 0,
                y: isHovered ? 8 : 6
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isHovered ? primaryColor.opacity(0.3) : Color.black.opacity(0.1),
                        lineWidth: isHovered ? 1.5 : 1
                    )
            )
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        isHovered ? 
                        AnyShapeStyle(
                            LinearGradient(
                                colors: [
                                    Color.cardBackgroundColor,
                                    primaryColor.opacity(0.05),
                                    secondaryColor.opacity(0.03)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        ) : AnyShapeStyle(Color.cardBackgroundColor)
                    )
            )
            .animation(.easeInOut(duration: 0.2), value: isHovered)
    }
    
    func iconHoverEffect(
        primaryColor: Color,
        isHovered: Bool,
        scale: CGFloat = 1.1
    ) -> some View {
        self
            .scaleEffect(isHovered ? scale : 1.0)
            .shadow(
                color: isHovered ? primaryColor.opacity(0.4) : Color.clear,
                radius: 4,
                x: 0,
                y: 2
            )
            .animation(.easeInOut(duration: 0.2), value: isHovered)
    }
    
    func buttonHoverEffect(
        primaryColor: Color,
        isHovered: Bool,
        scale: CGFloat = 1.05
    ) -> some View {
        self
            .scaleEffect(isHovered ? scale : 1.0)
            .shadow(
                color: isHovered ? primaryColor.opacity(0.3) : Color.black.opacity(0.2),
                radius: isHovered ? 8 : 4,
                x: 0,
                y: isHovered ? 4 : 2
            )
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        isHovered ? 
                        AnyShapeStyle(
                            LinearGradient(
                                colors: [
                                    primaryColor.opacity(0.1),
                                    primaryColor.opacity(0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        ) : AnyShapeStyle(Color.clear)
                    )
            )
            .animation(.easeInOut(duration: 0.2), value: isHovered)
    }
    
    func cardLiftEffect(
        isHovered: Bool,
        lift: CGFloat = -8,
        shadowRadius: CGFloat = 20
    ) -> some View {
        self
            .offset(y: isHovered ? lift : 0)
            .shadow(
                color: isHovered ? Color.black.opacity(0.4) : Color.black.opacity(0.25),
                radius: isHovered ? shadowRadius : 12,
                x: 0,
                y: isHovered ? 12 : 6
            )
            .animation(.easeInOut(duration: 0.3), value: isHovered)
    }
    
    func slideEffect(
        isHovered: Bool,
        offset: CGFloat = 4
    ) -> some View {
        self
            .offset(x: isHovered ? offset : 0)
            .animation(.easeInOut(duration: 0.2), value: isHovered)
    }
    
    func glowEffect(
        color: Color,
        isHovered: Bool,
        radius: CGFloat = 8
    ) -> some View {
        self
            .shadow(
                color: isHovered ? color.opacity(0.6) : color.opacity(0.3),
                radius: isHovered ? radius : radius * 0.5,
                x: 0,
                y: isHovered ? radius * 0.5 : radius * 0.25
            )
            .animation(.easeInOut(duration: 0.3), value: isHovered)
    }
    
    #if os(macOS)
    func macWindowStyle() -> some View {
        self
            .frame(minWidth: 800, minHeight: 600)
            .background(Color.systemBackgroundColor)
    }
    #endif
}

// MARK: - String Extensions

extension String {
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
    
    var isValidPhone: Bool {
        let phoneRegex = "^[+]?[0-9]{10,15}$"
        let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        return phonePredicate.evaluate(with: self)
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
    
    var cleanedZipCode: String {
        // Remove all non-digit characters
        let digits = self.filter { $0.isNumber }
        
        // Handle scientific notation (e.g., 1.23456e+05)
        if self.contains("e") || self.contains("E") {
            if let doubleValue = Double(self) {
                let result = String(format: "%.0f", doubleValue)
                // Ensure we don't exceed 9 digits for ZIP+4
                return result.count > 9 ? String(result.prefix(9)) : result
            }
        }
        
        // If it's already 5 digits, return as is
        if digits.count == 5 {
            return digits
        }
        
        // If it's 9 digits, return as is (ZIP+4 format)
        if digits.count == 9 {
            return digits
        }
        
        // If it's 6 digits, truncate to 5 (common issue with Excel imports)
        if digits.count == 6 {
            return String(digits.prefix(5))
        }
        
        // If it's more than 9 digits, truncate to first 9
        if digits.count > 9 {
            return String(digits.prefix(9))
        }
        
        // If it's less than 5 digits and not empty, pad with zeros
        if digits.count < 5 && digits.count > 0 {
            let padded = String(format: "%05d", Int(digits) ?? 0)
            // Ensure we don't create a 6-digit number by padding
            return padded.count == 5 ? padded : digits
        }
        
        // For any other case, return the digits as they are
        return digits
    }
    
    var isValidZipCode: Bool {
        let zipRegex = "^[0-9]{5}(-[0-9]{4})?$"
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
    
    func capitalizingFirstLetter() -> String {
        return prefix(1).capitalized + dropFirst()
    }
    
    var trimmed: String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Date Extensions

extension Date {
    var relativeTime: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }
    
    var formattedDateTime: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }
}

// MARK: - Array Extensions

extension Array where Element: Hashable {
    func removingDuplicates() -> [Element] {
        return Array(Set(self))
    }
}

// MARK: - Int32 Extensions

extension Int32 {
    var formattedZipCode: String {
        let zipString = String(self)
        
        // Handle 6-digit zip codes by truncating to 5 digits
        if zipString.count == 6 {
            let fiveDigitZip = String(zipString.prefix(5))
            return fiveDigitZip
        }
        
        // Handle 9-digit ZIP+4 format
        if zipString.count == 9 {
            return "\(zipString.prefix(5))-\(zipString.dropFirst(5))"
        }
        
        // Return as is for 5-digit zip codes
        return zipString
    }
}

// MARK: - Optional Extensions

extension Optional where Wrapped == String {
    var isEmptyOrNil: Bool {
        return self?.isEmpty ?? true
    }
}

// MARK: - Bundle Extensions

extension Bundle {
    var appName: String {
        return object(forInfoDictionaryKey: "CFBundleName") as? String ?? "FarmTrackr"
    }
    
    var appVersion: String {
        return object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    }
    
    var buildNumber: String {
        return object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
    }
}

// MARK: - FileManager Extensions

extension FileManager {
    var documentsDirectory: URL {
        return urls(for: .documentDirectory, in: .userDomainMask).first!
    }
    
    var applicationSupportDirectory: URL {
        return urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
    }
    
    func createDirectoryIfNeeded(at url: URL) throws {
        if !fileExists(atPath: url.path) {
            try createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
        }
    }
}

// MARK: - Platform-Specific Extensions

// Note: Font extensions are defined in RichTextEditorView.swift to avoid conflicts 