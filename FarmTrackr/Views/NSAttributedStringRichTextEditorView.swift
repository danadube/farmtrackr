//
//  NSAttributedStringRichTextEditorView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import Foundation

struct NSAttributedStringRichTextEditorView: View {
    @Binding var attributedText: NSAttributedString
    let onTextChange: (NSAttributedString) -> Void
    
    @EnvironmentObject var themeVM: ThemeViewModel
    @State private var textViewRef: PlatformTextView?
    
    // Font and formatting state
    @State private var selectedFontSize: CGFloat = 12
    @State private var selectedFontName: String = "System"
    @State private var selectedAlignment: NSTextAlignment = .left
    @State private var selectedColor: PlatformColor = .label
    
    // UI state
    @State private var showingFontPicker = false
    @State private var showingColorPicker = false
    @State private var showingLinkDialog = false
    @State private var linkURL = ""
    
    // Page settings - exactly 8.5x11 inches at 100 DPI for better scaling
    private let pageWidth: CGFloat = 850 // 8.5 inches * 100 DPI
    private let pageHeight: CGFloat = 1100 // 11 inches * 100 DPI
    private let pageMargin: CGFloat = 40
    private let rulerWidth: CGFloat = 50 // Increased for better number visibility
    
    // Text margins - standard document margins (1 inch top/bottom, 0.5 inch left/right)
    private let textMarginTop: CGFloat = 80 // Reduced from 100 to 80 for better spacing
    private let textMarginBottom: CGFloat = 100 // 1 inch bottom margin
    private let textMarginLeft: CGFloat = 40 // Reduced from 50 to 40 for better spacing
    private let textMarginRight: CGFloat = 50 // 0.5 inch right margin
    
    // Ruler scaling - make rulers match page dimensions
    private let rulerScale: CGFloat = 100 // DPI for ruler markings
    private let inchesPerUnit: CGFloat = 1.0 // 1 inch = 1 unit on ruler
    
    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack(spacing: 16) {
                // Font controls
                HStack(spacing: 8) {
                    Button(action: { showingFontPicker = true }) {
                        HStack(spacing: 4) {
                            Text(selectedFontName)
                                .font(.system(size: 12))
                            Image(systemName: "chevron.down")
                                .font(.system(size: 8))
                        }
                        .foregroundColor(Color.textColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.cardBackgroundAdaptive)
                        .cornerRadius(4)
                    }
                    
                    Stepper(value: $selectedFontSize, in: 8...72, step: 1) {
                        Text("\(Int(selectedFontSize))")
                            .font(.system(size: 12))
                            .foregroundColor(Color.textColor)
                            .frame(width: 30)
                    }
                    .scaleEffect(0.8)
                }
                
                Divider()
                    .frame(height: 20)
                
                // Formatting controls
                HStack(spacing: 4) {
                    Button(action: applyBold) {
                        Image(systemName: "bold")
                            .font(.system(size: 14))
                            .foregroundColor(isBold() ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: applyItalic) {
                        Image(systemName: "italic")
                            .font(.system(size: 14))
                            .foregroundColor(isItalic() ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: applyUnderline) {
                        Image(systemName: "underline")
                            .font(.system(size: 14))
                            .foregroundColor(isUnderlined() ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Divider()
                    .frame(height: 20)
                
                // Alignment controls
                HStack(spacing: 4) {
                    Button(action: { selectedAlignment = .left }) {
                        Image(systemName: "text.alignleft")
                            .font(.system(size: 14))
                            .foregroundColor(selectedAlignment == .left ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: { selectedAlignment = .center }) {
                        Image(systemName: "text.aligncenter")
                            .font(.system(size: 14))
                            .foregroundColor(selectedAlignment == .center ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: { selectedAlignment = .right }) {
                        Image(systemName: "text.alignright")
                            .font(.system(size: 14))
                            .foregroundColor(selectedAlignment == .right ? Color.accentColor : Color.textColor)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Divider()
                    .frame(height: 20)
                
                // Color control
                Button(action: { showingColorPicker = true }) {
                    Circle()
                        .fill(Color(selectedColor))
                        .frame(width: 20, height: 20)
                        .overlay(Circle().stroke(Color.borderColor, lineWidth: 1))
                }
                .buttonStyle(PlainButtonStyle())
                
                Divider()
                    .frame(height: 20)
                
                // Link control
                Button(action: { showingLinkDialog = true }) {
                    Image(systemName: "link")
                        .font(.system(size: 14))
                        .foregroundColor(Color.textColor)
                }
                .buttonStyle(PlainButtonStyle())
                
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.cardBackgroundAdaptive)
            .border(Color.borderColor, width: 1)
            .toolbarStyle()
            
            // Main content area with pagination
            HStack(spacing: 0) {
                // Left vertical ruler
                VerticalRuler(pageHeight: pageHeight)
                    .frame(width: rulerWidth)
                    .background(Color.cardBackgroundAdaptive)
                    .border(Color.borderColor, width: 1)
                
                VStack(spacing: 0) {
                    // Top horizontal ruler - aligned with page
                    HorizontalRuler(pageWidth: pageWidth)
                        .frame(height: rulerWidth)
                        .background(Color.cardBackgroundAdaptive)
                        .border(Color.borderColor, width: 1)
                        .zIndex(1)
                    
                    // Document content
                    ZStack {
                        // Page background - white in light mode, dark in dark mode
                        Rectangle()
                            .fill(Color.adaptivePageBackground)
                            .frame(width: pageWidth, height: pageHeight)
                            .cornerRadius(12)
                            .shadow(color: Color.black.opacity(0.25), radius: 16, x: 0, y: 8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(themeVM.theme.colors.border.opacity(0.2), lineWidth: 1)
                            )
                        
                        // Text area background (shows margins) - same as page background
                        Rectangle()
                            .fill(Color.adaptivePageBackground)
                            .frame(width: pageWidth - textMarginLeft - textMarginRight, 
                                   height: pageHeight - textMarginTop - textMarginBottom)
                            .offset(x: textMarginLeft, y: textMarginTop)
                        
                        // Rich text editor
                        CrossPlatformTextView(
                            attributedText: $attributedText,
                            onTextChange: onTextChange,
                            textViewRef: $textViewRef,
                            fontSize: selectedFontSize,
                            fontName: selectedFontName,
                            alignment: selectedAlignment,
                            textColor: selectedColor,
                            pageWidth: pageWidth,
                            pageHeight: pageHeight,
                            textMarginTop: textMarginTop,
                            textMarginBottom: textMarginBottom,
                            textMarginLeft: textMarginLeft,
                            textMarginRight: textMarginRight
                        )
                        .frame(width: pageWidth - textMarginLeft - textMarginRight, 
                               height: pageHeight - textMarginTop - textMarginBottom)
                        .offset(x: textMarginLeft, y: textMarginTop)
                        .clipped()
                    }
                }
            }
        }
        .frame(minWidth: pageWidth + rulerWidth + 40, minHeight: pageHeight + rulerWidth + 40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
        .padding(.horizontal, 10) // Reduced horizontal padding
        .padding(.top, 2) // Minimal top padding
        .padding(.bottom, 5) // Minimal bottom padding
        .sheet(isPresented: $showingColorPicker) {
            ColorPickerView(selectedColor: $selectedColor) { color in
                applyColor(color)
            }
        }
        .sheet(isPresented: $showingFontPicker) {
            FontPickerView(selectedFontName: $selectedFontName) { fontName in
                applyFont(fontName)
            }
        }
        .alert("Add Link", isPresented: $showingLinkDialog) {
            TextField("URL", text: $linkURL)
            Button("Cancel", role: .cancel) { }
            Button("Add") {
                addLink()
            }
        } message: {
            Text("Enter the URL for the selected text")
        }
    }
    
    // MARK: - Formatting Functions
    
    private func applyBold() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let currentFont = mutableText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitBold) {
            // Remove bold
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitBold))
        } else {
            // Add bold
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitBold))
        }
        
        mutableText.addAttribute(.font, value: newFont, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
        onTextChange(attributedText)
    }
    
    private func applyItalic() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let currentFont = mutableText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitItalic) {
            // Remove italic
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitItalic))
        } else {
            // Add italic
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitItalic))
        }
        
        mutableText.addAttribute(.font, value: newFont, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
        onTextChange(attributedText)
    }
    
    private func applyUnderline() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let currentUnderline = mutableText.attribute(.underlineStyle, at: selectedRange.location, effectiveRange: nil) as? Int ?? 0
        
        let newUnderline: Int
        if currentUnderline != 0 {
            // Remove underline
            newUnderline = 0
        } else {
            // Add underline
            newUnderline = NSUnderlineStyle.single.rawValue
        }
        
        mutableText.addAttribute(.underlineStyle, value: newUnderline, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
        onTextChange(attributedText)
    }
    
    private func applyColor(_ color: PlatformColor) {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        mutableText.addAttribute(.foregroundColor, value: color, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        onTextChange(attributedText)
    }
    
    private func applyFont(_ fontName: String) {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        let currentFont = mutableText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if fontName == "System" {
            newFont = PlatformFont.systemFont(ofSize: currentFont.pointSize)
        } else {
            newFont = PlatformFont(name: fontName, size: currentFont.pointSize) ?? PlatformFont.systemFont(ofSize: currentFont.pointSize)
        }
        
        mutableText.addAttribute(.font, value: newFont, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        onTextChange(attributedText)
    }
    
    private func addLink() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 && !linkURL.isEmpty else { return }
        
        let mutableText = NSMutableAttributedString(attributedString: attributedText)
        mutableText.addAttribute(.link, value: URL(string: linkURL) ?? linkURL, range: selectedRange)
        attributedText = mutableText
        textView.selectedRange = selectedRange
        
        linkURL = ""
        onTextChange(attributedText)
    }
    
    // MARK: - State Check Functions
    
    private func isBold() -> Bool {
        guard let textView = textViewRef else { return false }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return false }
        
        let font = attributedText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont
        return font?.fontDescriptor.symbolicTraits.contains(.traitBold) ?? false
    }
    
    private func isItalic() -> Bool {
        guard let textView = textViewRef else { return false }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return false }
        
        let font = attributedText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont
        return font?.fontDescriptor.symbolicTraits.contains(.traitItalic) ?? false
    }
    
    private func isUnderlined() -> Bool {
        guard let textView = textViewRef else { return false }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return false }
        
        let underline = attributedText.attribute(.underlineStyle, at: selectedRange.location, effectiveRange: nil) as? Int
        return underline != 0
    }
}

// Note: Font extension is already defined in RichTextEditorView.swift

// Note: ColorPickerView, FontPickerView, HorizontalRuler, and VerticalRuler are already defined in RichTextEditorView.swift 