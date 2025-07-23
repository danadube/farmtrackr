//
//  RichTextEditorView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

struct RichTextEditorView: View {
    @Binding var text: String
    let onTextChange: (String) -> Void
    @EnvironmentObject var themeVM: ThemeViewModel
    
    @State private var textViewRef: PlatformTextView?
    @State private var selectedFontSize: CGFloat = 16
    @State private var selectedFontName: String = "System"
    @State private var selectedAlignment: NSTextAlignment = .left
    @State private var selectedColor: PlatformColor = .label
    @State private var showingColorPicker = false
    @State private var showingFontPicker = false
    @State private var showingLinkDialog = false
    @State private var linkURL = ""
    @State private var selectedTextRange: NSRange?
    
    // Page settings - exactly 8.5x11 inches at 72 DPI
    private let pageWidth: CGFloat = 850 // 8.5 inches * 100 DPI for better scaling
    private let pageHeight: CGFloat = 1100 // 11 inches * 100 DPI for better scaling
    private let pageMargin: CGFloat = 40 // Reduced margins for more text space
    private let rulerWidth: CGFloat = 40
    
    // Text margins - standard document margins
    private let textMarginTop: CGFloat = 40 // Reduced from 80 to 40 to fix 2-inch margin issue
    private let textMarginBottom: CGFloat = 80 // Reduced from 100 to 80 for better spacing
    private let textMarginLeft: CGFloat = 50 // 0.5 inch left margin
    private let textMarginRight: CGFloat = 50 // 0.5 inch right margin
    
    // Ruler scaling - make rulers match page dimensions
    private let rulerScale: CGFloat = 100 // DPI for ruler markings
    private let inchesPerUnit: CGFloat = 1.0 // 1 inch = 1 unit on ruler
    
    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Toolbar at top
                RichTextToolbar(
                    selectedFontSize: $selectedFontSize,
                    selectedFontName: $selectedFontName,
                    selectedAlignment: $selectedAlignment,
                    selectedColor: $selectedColor,
                    showingColorPicker: $showingColorPicker,
                    showingFontPicker: $showingFontPicker,
                    onBold: applyBold,
                    onItalic: applyItalic,
                    onUnderline: applyUnderline,
                    onLink: showLinkDialog,
                    onTable: insertTable,
                    onImage: insertImage
                )
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .toolbarStyle()
                
                // Main content area with proper centering
                ScrollView([.horizontal, .vertical]) {
                    VStack(spacing: 0) {
                        // Top horizontal ruler
                        HorizontalRuler(pageWidth: pageWidth)
                            .frame(height: rulerWidth)
                            .background(Color.cardBackgroundAdaptive)
                            .border(Color.borderColor, width: 1)
                            .zIndex(1)
                        
                        // Page and vertical ruler row
                        HStack(spacing: 0) {
                            // Left vertical ruler
                            VerticalRuler(pageHeight: pageHeight)
                                .frame(width: rulerWidth)
                                .background(Color.cardBackgroundAdaptive)
                                .border(Color.borderColor, width: 1)
                            
                            // Page content
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
                                
                                // Text editor
                                PlatformTextViewWrapper(
                                    text: $text,
                                    onTextChange: onTextChange,
                                    textViewRef: $textViewRef,
                                    fontSize: selectedFontSize,
                                    fontName: selectedFontName,
                                    alignment: selectedAlignment,
                                    textColor: selectedColor,
                                    pageWidth: pageWidth,
                                    pageHeight: pageHeight,
                                    pageMargin: pageMargin
                                )
                                .frame(width: pageWidth - textMarginLeft - textMarginRight, 
                                       height: pageHeight - textMarginTop - textMarginBottom)
                                .offset(x: textMarginLeft, y: textMarginTop)
                                .clipped()
                            }
                        }
                    }
                    .frame(minWidth: pageWidth + rulerWidth + 40, minHeight: pageHeight + rulerWidth + 40)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.appBackground)
                .padding(.horizontal, 20)
                .padding(.top, 5) // Reduced top padding to move page higher
                .padding(.bottom, 10)
            }
        }
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
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        let currentFont = attributedText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitBold) {
            // Remove bold
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitBold))
        } else {
            // Add bold
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitBold))
        }
        
        attributedText.addAttribute(.font, value: newFont, range: selectedRange)
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
    }
    
    private func applyItalic() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        let currentFont = attributedText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitItalic) {
            // Remove italic
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitItalic))
        } else {
            // Add italic
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitItalic))
        }
        
        attributedText.addAttribute(.font, value: newFont, range: selectedRange)
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
    }
    
    private func applyUnderline() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        let currentUnderline = attributedText.attribute(.underlineStyle, at: selectedRange.location, effectiveRange: nil) as? Int ?? 0
        
        let newUnderline: Int
        if currentUnderline == NSUnderlineStyle.single.rawValue {
            // Remove underline
            newUnderline = 0
        } else {
            // Add underline
            newUnderline = NSUnderlineStyle.single.rawValue
        }
        
        attributedText.addAttribute(.underlineStyle, value: newUnderline, range: selectedRange)
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
    }
    
    private func applyColor(_ color: PlatformColor) {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        attributedText.addAttribute(.foregroundColor, value: color, range: selectedRange)
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
    }
    
    private func applyFont(_ fontName: String) {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        let currentFont = attributedText.attribute(.font, at: selectedRange.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: selectedFontSize)
        
        let newFont: PlatformFont
        if fontName == "System" {
            newFont = PlatformFont.systemFont(ofSize: currentFont.pointSize)
        } else {
            newFont = PlatformFont(name: fontName, size: currentFont.pointSize) ?? PlatformFont.systemFont(ofSize: currentFont.pointSize)
        }
        
        attributedText.addAttribute(.font, value: newFont, range: selectedRange)
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
    }
    
    private func showLinkDialog() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        selectedTextRange = selectedRange
        showingLinkDialog = true
    }
    
    private func addLink() {
        guard let textView = textViewRef,
              let selectedRange = selectedTextRange,
              !linkURL.isEmpty else { return }
        
        let attributedText = NSMutableAttributedString(attributedString: textView.attributedText)
        let linkAttribute = NSAttributedString.Key.link
        attributedText.addAttribute(linkAttribute, value: URL(string: linkURL) ?? linkURL, range: selectedRange)
        
        textView.attributedText = attributedText
        textView.selectedRange = selectedRange
        onTextChange(textView.attributedText.string)
        
        linkURL = ""
        selectedTextRange = nil
    }
    
    private func insertTable() {
        // Placeholder for table insertion
        print("Insert table")
    }
    
    private func insertImage() {
        // Placeholder for image insertion
        print("Insert image")
    }
}

// MARK: - Platform Text View Wrapper

struct PlatformTextViewWrapper: UIViewRepresentable {
    @Binding var text: String
    let onTextChange: (String) -> Void
    @Binding var textViewRef: PlatformTextView?
    
    let fontSize: CGFloat
    let fontName: String
    let alignment: NSTextAlignment
    let textColor: PlatformColor
    let pageWidth: CGFloat
    let pageHeight: CGFloat
    let pageMargin: CGFloat
    
    // Text margins - standard document margins
    private let textMarginTop: CGFloat = 40 // Reduced from 80 to 40 to fix 2-inch margin issue
    private let textMarginBottom: CGFloat = 80 // Reduced from 100 to 80 for better spacing
    private let textMarginLeft: CGFloat = 50 // 0.5 inch left margin
    private let textMarginRight: CGFloat = 50 // 0.5 inch right margin
    
    func makeUIView(context: Context) -> PlatformTextView {
        let textView = PlatformTextView()
        textView.delegate = context.coordinator
        textView.font = PlatformFont.systemFont(ofSize: fontSize)
        textView.textColor = textColor
        textView.textAlignment = alignment
        textView.backgroundColor = PlatformColor.clear
        textView.isScrollEnabled = true
        textView.isEditable = true
        textView.isSelectable = true
        textView.textContainerInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        textView.textContainer.lineFragmentPadding = 0
        textView.textContainer.widthTracksTextView = false
        textView.textContainer.heightTracksTextView = false
        
        // Set proper text container size with margins - allow unlimited height
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32) // Ensure positive width
        textView.textContainer.size = CGSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Ensure text container allows unlimited height for scrolling
        textView.textContainer.maximumNumberOfLines = 0
        textView.textContainer.lineBreakMode = .byWordWrapping
        
        // Enable scrolling
        textView.isScrollEnabled = true
        textView.showsVerticalScrollIndicator = true
        textView.showsHorizontalScrollIndicator = false
        
        return textView
    }
    
    func updateUIView(_ uiView: PlatformTextView, context: Context) {
        // Only update text if it's different to avoid loops
        if uiView.text != text {
            uiView.text = text
        }
        
        // Update font
        let font = fontName == "System" ? PlatformFont.systemFont(ofSize: fontSize) : PlatformFont(name: fontName, size: fontSize) ?? PlatformFont.systemFont(ofSize: fontSize)
        uiView.font = font
        
        // Update text color
        uiView.textColor = textColor
        
        // Update alignment
        uiView.textAlignment = alignment
        
        // Update text container size for proper width constraint with text margins - allow unlimited height
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32) // Ensure positive width
        uiView.textContainer.size = CGSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Ensure text container allows unlimited height for scrolling
        uiView.textContainer.maximumNumberOfLines = 0
        uiView.textContainer.lineBreakMode = .byWordWrapping
        
        // Enable scrolling
        uiView.isScrollEnabled = true
        uiView.showsVerticalScrollIndicator = true
        uiView.showsHorizontalScrollIndicator = false
        
        // Set the reference
        DispatchQueue.main.async {
            textViewRef = uiView
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PlatformTextViewDelegate {
        var parent: PlatformTextViewWrapper
        
        init(_ parent: PlatformTextViewWrapper) {
            self.parent = parent
        }
        
        func textViewDidChange(_ textView: PlatformTextView) {
            // Update the binding on the main queue to avoid state modification during view update
            DispatchQueue.main.async {
                self.parent.text = textView.text
                self.parent.onTextChange(textView.text)
            }
        }
    }
}

// MARK: - Font Picker View

struct FontPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedFontName: String
    let onFontSelected: (String) -> Void
    
    private let fonts = [
        "System", "Helvetica", "Arial", "Times New Roman", "Georgia", "Verdana", "Courier New"
    ]
    
    var body: some View {
        NavigationView {
            List(fonts, id: \.self) { font in
                Button(action: {
                    selectedFontName = font
                    onFontSelected(font)
                    dismiss()
                }) {
                    HStack {
                        Text(font)
                            .font(.system(size: 16))
                            .foregroundColor(Color.textColor)
                        Spacer()
                        if selectedFontName == font {
                            Image(systemName: "checkmark")
                                .foregroundColor(Color.accentColor)
                        }
                    }
                }
                .listRowBackground(Color.cardBackgroundAdaptive)
            }
            .listStyle(PlainListStyle())
            .background(Color.appBackground)
            .navigationTitle("Select Font")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Color Picker View

struct ColorPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedColor: PlatformColor
    let onColorSelected: (PlatformColor) -> Void
    
    private let colors: [PlatformColor] = [
        .label, .systemRed, .systemOrange, .systemYellow, .systemGreen, 
        .systemBlue, .systemPurple, .systemPink, .systemBrown, .systemGray
    ]
    
    var body: some View {
        NavigationView {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 16) {
                ForEach(colors, id: \.self) { color in
                    Button(action: {
                        selectedColor = color
                        onColorSelected(color)
                        dismiss()
                    }) {
                        Circle()
                            .fill(Color(color))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Circle()
                                    .stroke(Color.borderColor, lineWidth: selectedColor == color ? 3 : 1)
                            )
                    }
                }
            }
            .padding()
            .background(Color.appBackground)
            .navigationTitle("Select Color")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Horizontal Ruler

struct HorizontalRuler: View {
    let pageWidth: CGFloat
    
    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                let rulerHeight = size.height
                let rulerWidth = size.width
                
                // Draw ruler background
                context.fill(
                    Path(CGRect(origin: .zero, size: size)),
                    with: .color(Color.cardBackgroundAdaptive)
                )
                
                // Draw inch markings
                let inchesPerUnit: CGFloat = 1.0
                let dpi: CGFloat = 100
                let pixelsPerInch = dpi
                
                for inch in 0...Int(pageWidth / pixelsPerInch) {
                    let x = CGFloat(inch) * pixelsPerInch
                    
                    // Draw inch line
                    context.stroke(
                        Path { path in
                            path.move(to: CGPoint(x: x, y: 0))
                            path.addLine(to: CGPoint(x: x, y: rulerHeight))
                        },
                        with: .color(Color.textColor.opacity(0.3)),
                        lineWidth: 1
                    )
                    
                    // Draw inch number
                    let text = Text("\(inch)")
                        .font(.system(size: 10))
                        .foregroundColor(Color.textColor.opacity(0.7))
                    context.draw(text, at: CGPoint(x: x + 2, y: 2))
                    
                    // Draw half-inch marks
                    if inch < Int(pageWidth / pixelsPerInch) {
                        let halfX = x + pixelsPerInch / 2
                        context.stroke(
                            Path { path in
                                path.move(to: CGPoint(x: halfX, y: 0))
                                path.addLine(to: CGPoint(x: halfX, y: rulerHeight * 0.6))
                            },
                            with: .color(Color.textColor.opacity(0.2)),
                            lineWidth: 1
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Vertical Ruler

struct VerticalRuler: View {
    let pageHeight: CGFloat
    
    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                let rulerHeight = size.height
                let rulerWidth = size.width
                
                // Draw ruler background
                context.fill(
                    Path(CGRect(origin: .zero, size: size)),
                    with: .color(Color.cardBackgroundAdaptive)
                )
                
                // Draw inch markings
                let inchesPerUnit: CGFloat = 1.0
                let dpi: CGFloat = 100
                let pixelsPerInch = dpi
                
                for inch in 0...Int(pageHeight / pixelsPerInch) {
                    let y = CGFloat(inch) * pixelsPerInch
                    
                    // Draw inch line
                    context.stroke(
                        Path { path in
                            path.move(to: CGPoint(x: 0, y: y))
                            path.addLine(to: CGPoint(x: rulerWidth, y: y))
                        },
                        with: .color(Color.textColor.opacity(0.3)),
                        lineWidth: 1
                    )
                    
                    // Draw inch number
                    let text = Text("\(inch)")
                        .font(.system(size: 10))
                        .foregroundColor(Color.textColor.opacity(0.7))
                    context.draw(text, at: CGPoint(x: 2, y: y + 2))
                    
                    // Draw half-inch marks
                    if inch < Int(pageHeight / pixelsPerInch) {
                        let halfY = y + pixelsPerInch / 2
                        context.stroke(
                            Path { path in
                                path.move(to: CGPoint(x: 0, y: halfY))
                                path.addLine(to: CGPoint(x: rulerWidth * 0.6, y: halfY))
                            },
                            with: .color(Color.textColor.opacity(0.2)),
                            lineWidth: 1
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Platform-Specific Type Aliases

#if os(iOS)
typealias PlatformTextView = UITextView
typealias PlatformFont = UIFont
protocol PlatformTextViewDelegate: UITextViewDelegate {}
#elseif os(macOS)
typealias PlatformTextView = NSTextView
typealias PlatformFont = NSFont
protocol PlatformTextViewDelegate: NSTextViewDelegate {}
#endif

// MARK: - Platform Font Extensions

#if os(iOS)
extension UIFont {
    func withTraits(_ traits: UIFontDescriptor.SymbolicTraits) -> UIFont {
        let descriptor = fontDescriptor.withSymbolicTraits(traits)
        return UIFont(descriptor: descriptor!, size: pointSize)
    }
}
#elseif os(macOS)
extension NSFont {
    func withTraits(_ traits: NSFontDescriptor.SymbolicTraits) -> NSFont {
        let descriptor = fontDescriptor.withSymbolicTraits(traits)
        return NSFont(descriptor: descriptor!, size: pointSize) ?? self
    }
}
#endif 