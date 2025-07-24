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
    @State private var currentPage: Int = 0
    @State private var pages: [String] = []
    
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
                        
                        // Paginated document view
                        PaginatedDocumentView(
                            text: $text,
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
                            textMarginRight: textMarginRight,
                            currentPage: $currentPage,
                            pages: $pages
                        )
                    }
                }
                .frame(minWidth: pageWidth + rulerWidth + 40, minHeight: pageHeight + rulerWidth + 40)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.appBackground)
                .padding(.horizontal, 10) // Reduced horizontal padding
                .padding(.top, 2) // Minimal top padding
                .padding(.bottom, 5) // Minimal bottom padding
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
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
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
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
        onTextChange(textView.attributedText.string)
    }
    
    private func applyItalic() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
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
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
        onTextChange(textView.attributedText.string)
    }
    
    private func applyUnderline() {
        guard let textView = textViewRef else { return }
        let selectedRange = textView.selectedRange
        guard selectedRange.length > 0 else { return }
        
        // Store current scroll position
        let currentOffset = textView.contentOffset
        
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
        
        // Restore scroll position
        DispatchQueue.main.async {
            textView.setContentOffset(currentOffset, animated: false)
        }
        
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
                    
                    // Draw inch number (only if it fits in the ruler width)
                    if x + 20 < rulerWidth {
                        let text = Text("\(inch)")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(Color.textColor.opacity(0.8))
                        context.draw(text, at: CGPoint(x: x + 4, y: 4))
                    }
                    
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
                    
                    // Draw inch number (only if it fits in the ruler height)
                    if y + 20 < rulerHeight {
                        let text = Text("\(inch)")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(Color.textColor.opacity(0.8))
                        context.draw(text, at: CGPoint(x: 4, y: y + 4))
                    }
                    
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

// MARK: - Paginated Document View

struct PaginatedDocumentView: View {
    @Binding var text: String
    let onTextChange: (String) -> Void
    @Binding var textViewRef: PlatformTextView?
    let fontSize: CGFloat
    let fontName: String
    let alignment: NSTextAlignment
    let textColor: PlatformColor
    let pageWidth: CGFloat
    let pageHeight: CGFloat
    let textMarginTop: CGFloat
    let textMarginBottom: CGFloat
    let textMarginLeft: CGFloat
    let textMarginRight: CGFloat
    @Binding var currentPage: Int
    @Binding var pages: [String]
    
    @State private var allPages: [String] = []
    
    var body: some View {
        VStack(spacing: 20) {
            // Page navigation
            HStack {
                Button("Previous") {
                    if currentPage > 0 {
                        currentPage -= 1
                    }
                }
                .disabled(currentPage == 0)
                
                Spacer()
                
                Text("Page \(currentPage + 1) of \(max(1, allPages.count))")
                    .font(.headline)
                
                Spacer()
                
                Button("Next") {
                    if currentPage < allPages.count - 1 {
                        currentPage += 1
                    }
                }
                .disabled(currentPage >= allPages.count - 1)
            }
            .padding(.horizontal, 20)
            
            // Current page content
            if !allPages.isEmpty && currentPage < allPages.count {
                SinglePageView(
                    pageText: allPages[currentPage],
                    onTextChange: { newText in
                        updatePageText(newText)
                    },
                    textViewRef: $textViewRef,
                    fontSize: fontSize,
                    fontName: fontName,
                    alignment: alignment,
                    textColor: textColor,
                    pageWidth: pageWidth,
                    pageHeight: pageHeight,
                    textMarginTop: textMarginTop,
                    textMarginBottom: textMarginBottom,
                    textMarginLeft: textMarginLeft,
                    textMarginRight: textMarginRight
                )
            } else {
                // Fallback to single page view
                SinglePageView(
                    pageText: text,
                    onTextChange: onTextChange,
                    textViewRef: $textViewRef,
                    fontSize: fontSize,
                    fontName: fontName,
                    alignment: alignment,
                    textColor: textColor,
                    pageWidth: pageWidth,
                    pageHeight: pageHeight,
                    textMarginTop: textMarginTop,
                    textMarginBottom: textMarginBottom,
                    textMarginLeft: textMarginLeft,
                    textMarginRight: textMarginRight
                )
            }
        }
        .onAppear {
            paginateText()
        }
        .onChange(of: text) {
            paginateText()
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
            // Repaginate when app becomes active (after restart)
            paginateText()
        }
    }
    
    private func paginateText() {
        // Simple character-based pagination
        let charactersPerPage = estimateCharactersPerPage()
        allPages = splitTextIntoPages(text, charactersPerPage: charactersPerPage)
        
        // Ensure current page is valid
        if currentPage >= allPages.count {
            currentPage = max(0, allPages.count - 1)
        }
        
        // If we have text but no pages, create at least one page
        if !text.isEmpty && allPages.isEmpty {
            allPages = [text]
            currentPage = 0
        }
    }
    
    private func estimateCharactersPerPage() -> Int {
        // Rough estimate based on page dimensions and font size
        let textAreaWidth = pageWidth - textMarginLeft - textMarginRight
        let textAreaHeight = pageHeight - textMarginTop - textMarginBottom
        
        // Estimate characters per line (assuming average character width)
        let avgCharWidth = fontSize * 0.6 // Rough estimate
        let charsPerLine = Int(textAreaWidth / avgCharWidth)
        
        // Estimate lines per page
        let lineHeight = fontSize * 1.2 // Rough estimate
        let linesPerPage = Int(textAreaHeight / lineHeight)
        
        return charsPerLine * linesPerPage
    }
    
    private func splitTextIntoPages(_ text: String, charactersPerPage: Int) -> [String] {
        guard !text.isEmpty else { return [""] }
        
        var pages: [String] = []
        var remainingText = text
        
        while !remainingText.isEmpty {
            let pageEndIndex = min(charactersPerPage, remainingText.count)
            let pageText = String(remainingText.prefix(pageEndIndex))
            
            // Try to break at sentence or word boundary
            let finalPageText = findGoodBreakPoint(pageText, remainingText: remainingText)
            
            pages.append(finalPageText)
            
            let consumedLength = finalPageText.count
            if consumedLength >= remainingText.count {
                break
            }
            
            remainingText = String(remainingText.dropFirst(consumedLength))
        }
        
        return pages.isEmpty ? [""] : pages
    }
    
    private func findGoodBreakPoint(_ pageText: String, remainingText: String) -> String {
        // Try to break at sentence end
        if let sentenceEnd = pageText.lastIndex(of: ".") {
            return String(pageText[...sentenceEnd])
        }
        
        // Try to break at word boundary
        if let wordEnd = pageText.lastIndex(of: " ") {
            return String(pageText[...wordEnd])
        }
        
        // If no good break point, use the full page text
        return pageText
    }
    
    private func updatePageText(_ newText: String) {
        if currentPage < allPages.count {
            allPages[currentPage] = newText
            // Reconstruct full text
            text = allPages.joined(separator: "")
            onTextChange(text)
        }
    }
}

// MARK: - Single Page View

struct SinglePageView: View {
    let pageText: String
    let onTextChange: (String) -> Void
    @Binding var textViewRef: PlatformTextView?
    let fontSize: CGFloat
    let fontName: String
    let alignment: NSTextAlignment
    let textColor: PlatformColor
    let pageWidth: CGFloat
    let pageHeight: CGFloat
    let textMarginTop: CGFloat
    let textMarginBottom: CGFloat
    let textMarginLeft: CGFloat
    let textMarginRight: CGFloat
    
    var body: some View {
        ZStack {
            // Page background
            Rectangle()
                .fill(Color.adaptivePageBackground)
                .frame(width: pageWidth, height: pageHeight)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.25), radius: 16, x: 0, y: 8)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.borderColor.opacity(0.2), lineWidth: 1)
                )
            
            // Text area background (shows margins)
            Rectangle()
                .fill(Color.adaptivePageBackground)
                .frame(width: pageWidth - textMarginLeft - textMarginRight, 
                       height: pageHeight - textMarginTop - textMarginBottom)
                .offset(x: textMarginLeft, y: textMarginTop)
            
            // Text editor
            PlatformTextViewWrapper(
                text: .constant(pageText),
                onTextChange: onTextChange,
                textViewRef: $textViewRef,
                fontSize: fontSize,
                fontName: fontName,
                alignment: alignment,
                textColor: textColor,
                pageWidth: pageWidth,
                pageHeight: pageHeight,
                pageMargin: 0
            )
            .frame(width: pageWidth - textMarginLeft - textMarginRight, 
                   height: pageHeight - textMarginTop - textMarginBottom)
            .offset(x: textMarginLeft, y: textMarginTop)
            .clipped()
        }
    }
} 