//
//  TextFormattingToolbar.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import Foundation

struct TextFormattingToolbar: View {
    @Binding var attributedText: NSAttributedString
    @Binding var selectedRange: NSRange
    @State private var showingColorPicker = false
    @State private var showingBackgroundColorPicker = false
    
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private let availableSizes: [CGFloat] = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72]
    private let availableFonts = ["System", "Times New Roman", "Arial", "Courier New", "Georgia", "Verdana", "Helvetica"]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                // Font controls
                fontControls
                
                Divider()
                    .frame(height: 24)
                    .background(themeVM.theme.colors.border)
                
                // Text formatting
                textFormatting
                
                Divider()
                    .frame(height: 24)
                    .background(themeVM.theme.colors.border)
                
                // Alignment
                alignmentControls
                
                Divider()
                    .frame(height: 24)
                    .background(themeVM.theme.colors.border)
                
                // Color controls
                colorControls
            }
            .padding(.horizontal, 16)
        }
        .sheet(isPresented: $showingColorPicker) {
            ColorPickerView(selectedColor: Binding(
                get: { currentTextColor },
                set: { applyTextColor($0) }
            ))
            .environmentObject(themeVM)
        }
        .sheet(isPresented: $showingBackgroundColorPicker) {
            ColorPickerView(selectedColor: Binding(
                get: { currentBackgroundColor },
                set: { applyBackgroundColor($0) }
            ))
            .environmentObject(themeVM)
        }
    }
    
    // MARK: - Font Controls
    
    private var fontControls: some View {
        HStack(spacing: 8) {
            // Font picker
            Menu {
                ForEach(availableFonts, id: \.self) { fontName in
                    Button(fontName) {
                        applyFont(fontName)
                    }
                }
            } label: {
                HStack {
                    Text(currentFontName)
                        .font(.system(size: 14))
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.cardBackgroundAdaptive)
                .cornerRadius(6)
            }
            
            // Font size picker
            Menu {
                ForEach(availableSizes, id: \.self) { size in
                    Button("\(Int(size))") {
                        applyFontSize(size)
                    }
                }
            } label: {
                HStack {
                    Text("\(Int(currentFontSize))")
                        .font(.system(size: 14))
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10))
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.cardBackgroundAdaptive)
                .cornerRadius(6)
            }
        }
    }
    
    // MARK: - Text Formatting
    
    private var textFormatting: some View {
        HStack(spacing: 8) {
            // Bold
            Button(action: toggleBold) {
                Image(systemName: "bold")
                    .font(.system(size: 16))
                    .foregroundColor(isBold ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: isBold))
            
            // Italic
            Button(action: toggleItalic) {
                Image(systemName: "italic")
                    .font(.system(size: 16))
                    .foregroundColor(isItalic ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: isItalic))
            
            // Underline
            Button(action: toggleUnderline) {
                Image(systemName: "underline")
                    .font(.system(size: 16))
                    .foregroundColor(isUnderlined ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: isUnderlined))
            
            // Strikethrough
            Button(action: toggleStrikethrough) {
                Image(systemName: "strikethrough")
                    .font(.system(size: 16))
                    .foregroundColor(isStrikethrough ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: isStrikethrough))
        }
    }
    
    // MARK: - Alignment Controls
    
    private var alignmentControls: some View {
        HStack(spacing: 8) {
            // Left align
            Button(action: { applyAlignment(.left) }) {
                Image(systemName: "text.alignleft")
                    .font(.system(size: 16))
                    .foregroundColor(currentAlignment == .left ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: currentAlignment == .left))
            
            // Center align
            Button(action: { applyAlignment(.center) }) {
                Image(systemName: "text.aligncenter")
                    .font(.system(size: 16))
                    .foregroundColor(currentAlignment == .center ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: currentAlignment == .center))
            
            // Right align
            Button(action: { applyAlignment(.right) }) {
                Image(systemName: "text.alignright")
                    .font(.system(size: 16))
                    .foregroundColor(currentAlignment == .right ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: currentAlignment == .right))
            
            // Justify
            Button(action: { applyAlignment(.justified) }) {
                                        Image(systemName: "text.justify")
                    .font(.system(size: 16))
                    .foregroundColor(currentAlignment == .justified ? themeVM.theme.colors.accent : themeVM.theme.colors.text)
            }
            .buttonStyle(ToolbarButtonStyle(isActive: currentAlignment == .justified))
        }
    }
    
    // MARK: - Color Controls
    
    private var colorControls: some View {
        HStack(spacing: 8) {
            // Text color
            Button(action: { showingColorPicker = true }) {
                Circle()
                    .fill(Color(currentTextColor))
                    .frame(width: 20, height: 20)
                    .overlay(
                        Circle()
                            .stroke(themeVM.theme.colors.border, lineWidth: 1)
                    )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Background color
            Button(action: { showingBackgroundColorPicker = true }) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(currentBackgroundColor))
                    .frame(width: 20, height: 20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(themeVM.theme.colors.border, lineWidth: 1)
                    )
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    // MARK: - Computed Properties
    
    private var currentFontName: String {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            if let font = attributes[.font] as? PlatformFont {
                return font.familyName
            }
        }
        return "System"
    }
    
    private var currentFontSize: CGFloat {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            if let font = attributes[.font] as? PlatformFont {
                return font.pointSize
            }
        }
        return 16
    }
    
    private var isBold: Bool {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            if let font = attributes[.font] as? PlatformFont {
                return font.fontDescriptor.symbolicTraits.contains(.traitBold)
            }
        }
        return false
    }
    
    private var isItalic: Bool {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            if let font = attributes[.font] as? PlatformFont {
                return font.fontDescriptor.symbolicTraits.contains(.traitItalic)
            }
        }
        return false
    }
    
    private var isUnderlined: Bool {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            return attributes[.underlineStyle] != nil
        }
        return false
    }
    
    private var isStrikethrough: Bool {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            return attributes[.strikethroughStyle] != nil
        }
        return false
    }
    
    private var currentAlignment: NSTextAlignment {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            if let paragraphStyle = attributes[.paragraphStyle] as? NSParagraphStyle {
                return paragraphStyle.alignment
            }
        }
        return .left
    }
    
    private var currentTextColor: PlatformColor {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            return attributes[.foregroundColor] as? PlatformColor ?? .label
        }
        return .label
    }
    
    private var currentBackgroundColor: PlatformColor {
        if selectedRange.length > 0 {
            let attributes = attributedText.attributes(at: selectedRange.location, effectiveRange: nil)
            return attributes[.backgroundColor] as? PlatformColor ?? .clear
        }
        return .clear
    }
    
    // MARK: - Formatting Actions
    
    private func applyFont(_ fontName: String) {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let font = PlatformFont(name: fontName, size: currentFontSize) ?? PlatformFont.systemFont(ofSize: currentFontSize)
        
        if selectedRange.length > 0 {
            mutableText.addAttribute(.font, value: font, range: selectedRange)
        } else {
            // Apply to entire text if nothing is selected
            mutableText.addAttribute(.font, value: font, range: NSRange(location: 0, length: mutableText.length))
        }
        
        attributedText = mutableText
    }
    
    private func applyFontSize(_ size: CGFloat) {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let font = PlatformFont(name: currentFontName, size: size) ?? PlatformFont.systemFont(ofSize: size)
        
        if selectedRange.length > 0 {
            mutableText.addAttribute(.font, value: font, range: selectedRange)
        } else {
            // Apply to entire text if nothing is selected
            mutableText.addAttribute(.font, value: font, range: NSRange(location: 0, length: mutableText.length))
        }
        
        attributedText = mutableText
    }
    
    private func toggleBold() {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            for i in 0..<selectedRange.length {
                let location = selectedRange.location + i
                let attributes = mutableText.attributes(at: location, effectiveRange: nil)
                let currentFont = attributes[.font] as? PlatformFont ?? PlatformFont.systemFont(ofSize: currentFontSize)
                
                #if os(iOS)
                let newTraits: UIFontDescriptor.SymbolicTraits = isBold ? [] : .traitBold
                #elseif os(macOS)
                let newTraits: NSFontDescriptor.SymbolicTraits = isBold ? [] : .bold
                #endif
                let newFont = currentFont.withTraits(newTraits)
                mutableText.addAttribute(.font, value: newFont, range: NSRange(location: location, length: 1))
            }
        }
        
        attributedText = mutableText
    }
    
    private func toggleItalic() {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            for i in 0..<selectedRange.length {
                let location = selectedRange.location + i
                let attributes = mutableText.attributes(at: location, effectiveRange: nil)
                let currentFont = attributes[.font] as? PlatformFont ?? PlatformFont.systemFont(ofSize: currentFontSize)
                
                #if os(iOS)
                let newTraits: UIFontDescriptor.SymbolicTraits = isItalic ? [] : .traitItalic
                #elseif os(macOS)
                let newTraits: NSFontDescriptor.SymbolicTraits = isItalic ? [] : .italic
                #endif
                let newFont = currentFont.withTraits(newTraits)
                mutableText.addAttribute(.font, value: newFont, range: NSRange(location: location, length: 1))
            }
        }
        
        attributedText = mutableText
    }
    
    private func toggleUnderline() {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            let underlineValue = isUnderlined ? 0 : NSUnderlineStyle.single.rawValue
            mutableText.addAttribute(.underlineStyle, value: underlineValue, range: selectedRange)
        }
        
        attributedText = mutableText
    }
    
    private func toggleStrikethrough() {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            let strikethroughValue = isStrikethrough ? 0 : NSUnderlineStyle.single.rawValue
            mutableText.addAttribute(.strikethroughStyle, value: strikethroughValue, range: selectedRange)
        }
        
        attributedText = mutableText
    }
    
    private func applyAlignment(_ alignment: NSTextAlignment) {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = alignment
        
        if selectedRange.length > 0 {
            mutableText.addAttribute(.paragraphStyle, value: paragraphStyle, range: selectedRange)
        } else {
            // Apply to entire text if nothing is selected
            mutableText.addAttribute(.paragraphStyle, value: paragraphStyle, range: NSRange(location: 0, length: mutableText.length))
        }
        
        attributedText = mutableText
    }
    
    private func applyTextColor(_ color: PlatformColor) {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            mutableText.addAttribute(.foregroundColor, value: color, range: selectedRange)
        } else {
            // Apply to entire text if nothing is selected
            mutableText.addAttribute(.foregroundColor, value: color, range: NSRange(location: 0, length: mutableText.length))
        }
        
        attributedText = mutableText
    }
    
    private func applyBackgroundColor(_ color: PlatformColor) {
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        
        if selectedRange.length > 0 {
            mutableText.addAttribute(.backgroundColor, value: color, range: selectedRange)
        } else {
            // Apply to entire text if nothing is selected
            mutableText.addAttribute(.backgroundColor, value: color, range: NSRange(location: 0, length: mutableText.length))
        }
        
        attributedText = mutableText
    }
}

// MARK: - Supporting Types

struct ToolbarButtonStyle: ButtonStyle {
    let isActive: Bool
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(8)
            .background(isActive ? Color.accentColor.opacity(0.2) : Color.clear)
            .cornerRadius(6)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Font Extensions

extension PlatformFont {
    #if os(iOS)
    func withTraits(_ traits: UIFontDescriptor.SymbolicTraits) -> PlatformFont {
        let descriptor = fontDescriptor.withSymbolicTraits(traits)
        return PlatformFont(descriptor: descriptor!, size: 0)
    }
    #elseif os(macOS)
    func withTraits(_ traits: NSFontDescriptor.SymbolicTraits) -> PlatformFont {
        let descriptor = fontDescriptor.withSymbolicTraits(traits)
        return PlatformFont(descriptor: descriptor!, size: 0)
    }
    #endif
} 