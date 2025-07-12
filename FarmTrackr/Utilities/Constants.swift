//
//  Constants.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

struct Constants {
    
    // MARK: - Colors
    struct Colors {
        static let primary = Color(red: 46/255, green: 125/255, blue: 50/255) // Farm Green #2E7D32
        static let secondary = Color(red: 255/255, green: 160/255, blue: 0/255) // Harvest Gold #FFA000
        static let background = Color(red: 245/255, green: 245/255, blue: 245/255) // Light Gray #F5F5F5
        static let text = Color(red: 51/255, green: 51/255, blue: 51/255) // Dark Gray #333333
        static let accent = Color(red: 25/255, green: 118/255, blue: 210/255) // Sky Blue #1976D2
        static let cardBackground = Color.white
        static let border = Color(red: 224/255, green: 224/255, blue: 224/255) // Light Gray #E0E0E0
        static let error = Color.red
        static let success = Color.green
        static let warning = Color.orange
    }
    
    // MARK: - Typography
    struct Typography {
        static let headerFont = Font.system(size: 24, weight: .bold, design: .default)
        static let titleFont = Font.system(size: 20, weight: .semibold, design: .default)
        static let bodyFont = Font.system(size: 16, weight: .regular, design: .default)
        static let captionFont = Font.system(size: 12, weight: .regular, design: .default)
        static let buttonFont = Font.system(size: 16, weight: .medium, design: .default)
    }
    
    // MARK: - Spacing
    struct Spacing {
        static let small: CGFloat = 8
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let extraLarge: CGFloat = 32
        static let cardSpacing: CGFloat = 8
        static let buttonHeight: CGFloat = 44
        static let listRowHeight: CGFloat = 60
    }
    
    // MARK: - Corner Radius
    struct CornerRadius {
        static let small: CGFloat = 4
        static let medium: CGFloat = 8
        static let large: CGFloat = 12
        static let extraLarge: CGFloat = 16
    }
    
    // MARK: - Animation
    struct Animation {
        static let standard = SwiftUI.Animation.easeInOut(duration: 0.3)
        static let fast = SwiftUI.Animation.easeInOut(duration: 0.2)
        static let slow = SwiftUI.Animation.easeInOut(duration: 0.5)
    }
    
    // MARK: - Validation
    struct Validation {
        static let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        static let phoneRegex = "^[+]?[0-9]{10,15}$"
        static let phoneRegexWithFormatting = "^[+]?[0-9\\s\\(\\)\\-]{10,20}$"
        static let zipCodeRegex = "^[0-9]{5}(-[0-9]{4})?$"
    }
    
    // MARK: - File Types
    struct FileTypes {
        static let csv = "csv"
        static let excel = ["xlsx", "xls"]
        static let pdf = "pdf"
    }
}

// MARK: - Sort Order
enum SortOrder: CaseIterable {
    case firstName, lastName, farm, dateCreated, dateModified
    
    var displayName: String {
        switch self {
        case .firstName: return "First Name"
        case .lastName: return "Last Name"
        case .farm: return "Farm"
        case .dateCreated: return "Date Created"
        case .dateModified: return "Date Modified"
        }
    }
}

// --- THEME SYSTEM EXPANSION ---
struct ThemeColors {
    let primary: Color
    let secondary: Color
    let accent: Color
    let background: Color
    let text: Color
    let cardBackground: Color
    let border: Color
    let error: Color
    let success: Color
    let warning: Color
    let secondaryLabel: Color
    let tertiary: Color
    let backgroundSecondary: Color
    let disabled: Color
    let separator: Color
    let red: Color
    let systemGray6: Color
}

struct ThemeSpacing {
    let small: CGFloat
    let medium: CGFloat
    let large: CGFloat
    let extraLarge: CGFloat
    let cardSpacing: CGFloat
    let buttonHeight: CGFloat
    let listRowHeight: CGFloat
}

struct ThemeCornerRadius {
    let small: CGFloat
    let medium: CGFloat
    let large: CGFloat
    let extraLarge: CGFloat
}

struct ThemeFonts {
    let headerFont: Font
    let titleFont: Font
    let bodyFont: Font
    let captionFont: Font
    let buttonFont: Font
    let headlineFont: Font
    let subheadlineFont: Font
    let title2: Font
    let title3: Font
    let semiboldFont: (CGFloat) -> Font
    let mediumFont: (CGFloat) -> Font
}

struct Theme {
    let name: String
    let colors: ThemeColors
    let font: String
    let spacing: ThemeSpacing
    let cornerRadius: ThemeCornerRadius
    let fonts: ThemeFonts
}

struct ThemeManager {
    static let themes: [String: Theme] = [
        "Modern Green": Theme(
            name: "Modern Green",
            colors: ThemeColors(
                primary: Color(red: 34/255, green: 139/255, blue: 34/255), // Forest Green
                secondary: Color(red: 245/255, green: 245/255, blue: 220/255),
                accent: Color(red: 144/255, green: 238/255, blue: 144/255), // Light Green
                background: Color(red: 248/255, green: 252/255, blue: 248/255), // Very light green tint
                text: Color(red: 27/255, green: 27/255, blue: 27/255),
                cardBackground: Color(red: 242/255, green: 250/255, blue: 242/255), // Very light green
                border: Color(red: 200/255, green: 220/255, blue: 200/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color.gray,
                tertiary: Color.gray.opacity(0.5),
                backgroundSecondary: Color(red: 245/255, green: 250/255, blue: 245/255),
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "SF Pro Display",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        ),
        "Classic Green": Theme(
            name: "Classic Green",
            colors: ThemeColors(
                primary: Color(red: 46/255, green: 125/255, blue: 50/255),
                secondary: Color(red: 245/255, green: 245/255, blue: 220/255),
                accent: Color(red: 165/255, green: 214/255, blue: 167/255),
                background: Color(red: 240/255, green: 248/255, blue: 240/255), // Light green tint
                text: Color(red: 27/255, green: 27/255, blue: 27/255),
                cardBackground: Color.white,
                border: Color(red: 200/255, green: 220/255, blue: 200/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color.gray,
                tertiary: Color.gray.opacity(0.5),
                backgroundSecondary: Color(red: 240/255, green: 245/255, blue: 240/255),
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "Poppins",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        ),
        // --- Repeat for other themes, using same structure and sensible color/font defaults ---
        "Sunset Soil": Theme(
            name: "Sunset Soil",
            colors: ThemeColors(
                primary: Color(red: 230/255, green: 81/255, blue: 0/255),
                secondary: Color(red: 78/255, green: 52/255, blue: 46/255),
                accent: Color(red: 1.0, green: 235/255, blue: 59/255),
                background: Color(red: 255/255, green: 248/255, blue: 235/255), // Warm cream
                text: Color(red: 33/255, green: 33/255, blue: 33/255),
                cardBackground: Color.white,
                border: Color(red: 224/255, green: 224/255, blue: 224/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color.gray,
                tertiary: Color.gray.opacity(0.5),
                backgroundSecondary: Color(red: 255/255, green: 248/255, blue: 225/255),
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "Montserrat",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        ),
        "Blueprint Pro": Theme(
            name: "Blueprint Pro",
            colors: ThemeColors(
                primary: Color(red: 13/255, green: 71/255, blue: 161/255),
                secondary: Color(red: 129/255, green: 212/255, blue: 250/255),
                accent: .white,
                background: Color(red: 240/255, green: 245/255, blue: 250/255), // Cool blue-gray
                text: Color(red: 13/255, green: 27/255, blue: 42/255),
                cardBackground: Color.white,
                border: Color(red: 224/255, green: 224/255, blue: 224/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color.gray,
                tertiary: Color.gray.opacity(0.5),
                backgroundSecondary: Color(red: 243/255, green: 247/255, blue: 251/255),
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "Roboto",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        ),
        "Harvest Luxe": Theme(
            name: "Harvest Luxe",
            colors: ThemeColors(
                primary: Color(red: 181/255, green: 137/255, blue: 0/255),
                secondary: Color(red: 46/255, green: 46/255, blue: 46/255),
                accent: Color(red: 143/255, green: 151/255, blue: 121/255),
                background: Color(red: 252/255, green: 250/255, blue: 245/255), // Warm ivory
                text: Color(red: 26/255, green: 26/255, blue: 26/255),
                cardBackground: Color.white,
                border: Color(red: 224/255, green: 224/255, blue: 224/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color.gray,
                tertiary: Color.gray.opacity(0.5),
                backgroundSecondary: Color(red: 250/255, green: 248/255, blue: 240/255),
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "Cormorant Garamond",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        ),
        "Fieldlight": Theme(
            name: "Fieldlight",
            colors: ThemeColors(
                primary: Color(red: 0/255, green: 105/255, blue: 120/255),
                secondary: Color(red: 224/255, green: 224/255, blue: 224/255),
                accent: Color(red: 1.0, green: 112/255, blue: 67/255),
                background: Color(red: 240/255, green: 248/255, blue: 250/255), // Light teal tint
                text: Color.black,
                cardBackground: Color.white,
                border: Color(red: 224/255, green: 224/255, blue: 224/255),
                error: .red,
                success: .green,
                warning: .orange,
                secondaryLabel: Color(red: 30/255, green: 41/255, blue: 59/255),
                tertiary: Color(red: 156/255, green: 163/255, blue: 175/255),
                backgroundSecondary: Color.white,
                disabled: Color.gray.opacity(0.3),
                separator: Color.gray.opacity(0.3),
                red: .red,
                systemGray6: Color(.systemGray6)
            ),
            font: "Open Sans",
            spacing: ThemeSpacing(
                small: 8, medium: 16, large: 24, extraLarge: 32, cardSpacing: 8, buttonHeight: 44, listRowHeight: 60
            ),
            cornerRadius: ThemeCornerRadius(
                small: 4, medium: 8, large: 12, extraLarge: 16
            ),
            fonts: ThemeFonts(
                headerFont: .system(size: 24, weight: .bold),
                titleFont: .system(size: 20, weight: .semibold),
                bodyFont: .system(size: 16, weight: .regular),
                captionFont: .system(size: 12, weight: .regular),
                buttonFont: .system(size: 16, weight: .medium),
                headlineFont: .system(size: 17, weight: .semibold),
                subheadlineFont: .system(size: 15, weight: .regular),
                title2: .system(size: 22, weight: .semibold),
                title3: .system(size: 20, weight: .medium),
                semiboldFont: { .system(size: $0, weight: .semibold) },
                mediumFont: { .system(size: $0, weight: .medium) }
            )
        )
    ]

    static func theme(named name: String) -> Theme {
        themes[name] ?? themes["Classic Green"]!
    }
} 

// MARK: - Accessibility
struct Accessibility {
    struct Labels {
        static let addContact = "Add new contact"
        static let editContact = "Edit contact"
        static let deleteContact = "Delete contact"
        static let searchContacts = "Search contacts"
        static let filterContacts = "Filter contacts"
        static let importData = "Import data from file"
        static let exportData = "Export data to file"
        static let printLabels = "Print mailing labels"
        static let dataQuality = "Data quality dashboard"
        static let batchActions = "Batch actions"
        static let settings = "Settings"
        static let themeSelector = "Theme selector"
        static let darkModeToggle = "Dark mode toggle"
        static let backupData = "Backup data"
        static let restoreData = "Restore data"
        static let clearData = "Clear all data"
    }
    
    struct Hints {
        static let addContact = "Double tap to create a new contact"
        static let editContact = "Double tap to edit this contact"
        static let deleteContact = "Double tap to delete this contact"
        static let searchContacts = "Type to search for contacts"
        static let filterContacts = "Double tap to open filter options"
        static let importData = "Double tap to select a file to import"
        static let exportData = "Double tap to export your data"
        static let printLabels = "Double tap to print mailing labels"
        static let dataQuality = "Double tap to view data quality issues"
        static let batchActions = "Double tap to perform batch operations"
        static let settings = "Double tap to open settings"
        static let themeSelector = "Double tap to change the app theme"
        static let darkModeToggle = "Double tap to toggle dark mode"
        static let backupData = "Double tap to create a backup"
        static let restoreData = "Double tap to restore from backup"
        static let clearData = "Double tap to clear all data (this action cannot be undone)"
    }
}



// MARK: - Dynamic Type Support
extension Font {
    static func dynamicTitle() -> Font {
        .largeTitle
    }
    
    static func dynamicTitle2() -> Font {
        .title2
    }
    
    static func dynamicTitle3() -> Font {
        .title3
    }
    
    static func dynamicHeadline() -> Font {
        .headline
    }
    
    static func dynamicBody() -> Font {
        .body
    }
    
    static func dynamicCallout() -> Font {
        .callout
    }
    
    static func dynamicSubheadline() -> Font {
        .subheadline
    }
    
    static func dynamicFootnote() -> Font {
        .footnote
    }
    
    static func dynamicCaption() -> Font {
        .caption
    }
    
    static func dynamicCaption2() -> Font {
        .caption2
    }
}

// MARK: - Accessibility Manager
class AccessibilityManager: ObservableObject {
    @Published var isVoiceOverRunning = UIAccessibility.isVoiceOverRunning
    @Published var isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
    @Published var isReduceTransparencyEnabled = UIAccessibility.isReduceTransparencyEnabled
    @Published var isBoldTextEnabled = UIAccessibility.isBoldTextEnabled
    @Published var isGrayscaleEnabled = UIAccessibility.isGrayscaleEnabled
    @Published var isHighContrastEnabled = false // UIAccessibility.isHighContrastEnabled not available in iOS 18.5
    @Published var isInvertColorsEnabled = UIAccessibility.isInvertColorsEnabled
    @Published var isShakeToUndoEnabled = UIAccessibility.isShakeToUndoEnabled
    @Published var isSpeakScreenEnabled = UIAccessibility.isSpeakScreenEnabled
    @Published var isSpeakSelectionEnabled = UIAccessibility.isSpeakSelectionEnabled
    @Published var isSwitchControlRunning = UIAccessibility.isSwitchControlRunning
    @Published var isAssistiveTouchRunning = UIAccessibility.isAssistiveTouchRunning
    
    init() {
        setupNotifications()
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(voiceOverStatusChanged),
            name: UIAccessibility.voiceOverStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(reduceMotionStatusChanged),
            name: UIAccessibility.reduceMotionStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(reduceTransparencyStatusChanged),
            name: UIAccessibility.reduceTransparencyStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(boldTextStatusChanged),
            name: UIAccessibility.boldTextStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(grayscaleStatusChanged),
            name: UIAccessibility.grayscaleStatusDidChangeNotification,
            object: nil
        )
        
        // UIAccessibility.highContrastStatusDidChangeNotification not available in iOS 18.5
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(invertColorsStatusChanged),
            name: UIAccessibility.invertColorsStatusDidChangeNotification,
            object: nil
        )
        
        // UIAccessibility.shakeToUndoStatusDidChangeNotification not available in iOS 18.5
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(speakScreenStatusChanged),
            name: UIAccessibility.speakScreenStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(speakSelectionStatusChanged),
            name: UIAccessibility.speakSelectionStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(switchControlStatusChanged),
            name: UIAccessibility.switchControlStatusDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(assistiveTouchStatusChanged),
            name: UIAccessibility.assistiveTouchStatusDidChangeNotification,
            object: nil
        )
    }
    
    @objc private func voiceOverStatusChanged() {
        DispatchQueue.main.async {
            self.isVoiceOverRunning = UIAccessibility.isVoiceOverRunning
        }
    }
    
    @objc private func reduceMotionStatusChanged() {
        DispatchQueue.main.async {
            self.isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
        }
    }
    
    @objc private func reduceTransparencyStatusChanged() {
        DispatchQueue.main.async {
            self.isReduceTransparencyEnabled = UIAccessibility.isReduceTransparencyEnabled
        }
    }
    
    @objc private func boldTextStatusChanged() {
        DispatchQueue.main.async {
            self.isBoldTextEnabled = UIAccessibility.isBoldTextEnabled
        }
    }
    
    @objc private func grayscaleStatusChanged() {
        DispatchQueue.main.async {
            self.isGrayscaleEnabled = UIAccessibility.isGrayscaleEnabled
        }
    }
    
    // UIAccessibility.isHighContrastEnabled not available in iOS 18.5
    
    @objc private func invertColorsStatusChanged() {
        DispatchQueue.main.async {
            self.isInvertColorsEnabled = UIAccessibility.isInvertColorsEnabled
        }
    }
    
    // UIAccessibility.isShakeToUndoEnabled not available in iOS 18.5
    
    @objc private func speakScreenStatusChanged() {
        DispatchQueue.main.async {
            self.isSpeakScreenEnabled = UIAccessibility.isSpeakScreenEnabled
        }
    }
    
    @objc private func speakSelectionStatusChanged() {
        DispatchQueue.main.async {
            self.isSpeakSelectionEnabled = UIAccessibility.isSpeakSelectionEnabled
        }
    }
    
    @objc private func switchControlStatusChanged() {
        DispatchQueue.main.async {
            self.isSwitchControlRunning = UIAccessibility.isSwitchControlRunning
        }
    }
    
    @objc private func assistiveTouchStatusChanged() {
        DispatchQueue.main.async {
            self.isAssistiveTouchRunning = UIAccessibility.isAssistiveTouchRunning
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
} 