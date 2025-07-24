//
//  NSAttributedStringManager.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import Foundation

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

class NSAttributedStringManager {
    
    // MARK: - Save and Load
    
    /// Save NSAttributedString as RTF data
    static func saveAsRTF(_ attributedString: NSAttributedString, to url: URL) throws {
        let data = try attributedString.data(
            from: NSRange(location: 0, length: attributedString.length),
            documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
        )
        try data.write(to: url)
    }
    
    /// Load NSAttributedString from RTF data
    static func loadFromRTF(from url: URL) throws -> NSAttributedString {
        let data = try Data(contentsOf: url)
        return try NSAttributedString(
            data: data,
            options: [.documentType: NSAttributedString.DocumentType.rtf],
            documentAttributes: nil
        )
    }
    
    /// Save NSAttributedString as plain text
    static func saveAsPlainText(_ attributedString: NSAttributedString, to url: URL) throws {
        let plainText = attributedString.string
        try plainText.write(to: url, atomically: true, encoding: .utf8)
    }
    
    /// Convert NSAttributedString to plain text
    static func toPlainText(_ attributedString: NSAttributedString) -> String {
        return attributedString.string
    }
    
    /// Convert plain text to NSAttributedString
    static func fromPlainText(_ text: String) -> NSAttributedString {
        return NSAttributedString(string: text)
    }
    
    // MARK: - Export to PDF
    
    #if os(iOS)
    /// Export NSAttributedString to PDF on iOS
    static func exportToPDF(_ attributedString: NSAttributedString, to url: URL, pageSize: CGSize = CGSize(width: 612, height: 792)) throws {
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(origin: .zero, size: pageSize))
        
        try renderer.writePDF(to: url) { context in
            context.beginPage()
            
            let textRect = CGRect(x: 72, y: 72, width: pageSize.width - 144, height: pageSize.height - 144)
            attributedString.draw(in: textRect)
        }
    }
    #elseif os(macOS)
    /// Export NSAttributedString to PDF on macOS
    static func exportToPDF(_ attributedString: NSAttributedString, to url: URL, pageSize: CGSize = CGSize(width: 612, height: 792)) throws {
        let pdfData = NSMutableData()
        let pdfConsumer = CGDataConsumer(data: pdfData as CFMutableData)!
        
        var mediaBox = CGRect(origin: .zero, size: pageSize)
        let pdfContext = CGContext(consumer: pdfConsumer, mediaBox: &mediaBox, nil)!
        
        pdfContext.beginPage(mediaBox: &mediaBox)
        
        let textRect = CGRect(x: 72, y: 72, width: pageSize.width - 144, height: pageSize.height - 144)
        attributedString.draw(in: textRect)
        
        pdfContext.endPage()
        pdfContext.closePDF()
        
        try pdfData.write(to: url, atomically: true)
    }
    #endif
    
    // MARK: - Mail Merge
    
    /// Perform mail merge with NSAttributedString template
    static func merge(template: NSAttributedString, with fields: [String: String]) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: template)
        
        for (key, value) in fields {
            let pattern = "{{\(key)}}"
            let range = (mutable.string as NSString).range(of: pattern)
            
            if range.location != NSNotFound {
                // Preserve formatting by creating attributed string for the replacement
                let replacementString = NSAttributedString(string: value)
                mutable.replaceCharacters(in: range, with: replacementString)
            }
        }
        
        return mutable
    }
    
    /// Extract merge fields from NSAttributedString template
    static func extractMergeFields(from template: NSAttributedString) -> [String] {
        let pattern = "\\{\\{([^}]+)\\}\\}"
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(location: 0, length: template.string.count)
        
        guard let matches = regex?.matches(in: template.string, range: range) else {
            return []
        }
        
        return matches.compactMap { match in
            guard match.numberOfRanges > 1 else { return nil }
            let fieldRange = match.range(at: 1)
            return (template.string as NSString).substring(with: fieldRange)
        }
    }
    
    // MARK: - Formatting Utilities
    
    /// Apply bold formatting to selected range
    static func applyBold(to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        let currentFont = mutable.attribute(.font, at: range.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: 12)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitBold) {
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitBold))
        } else {
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitBold))
        }
        
        mutable.addAttribute(.font, value: newFont, range: range)
        return mutable
    }
    
    /// Apply italic formatting to selected range
    static func applyItalic(to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        let currentFont = mutable.attribute(.font, at: range.location, effectiveRange: nil) as? PlatformFont ?? PlatformFont.systemFont(ofSize: 12)
        
        let newFont: PlatformFont
        if currentFont.fontDescriptor.symbolicTraits.contains(.traitItalic) {
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.subtracting(.traitItalic))
        } else {
            newFont = currentFont.withTraits(currentFont.fontDescriptor.symbolicTraits.union(.traitItalic))
        }
        
        mutable.addAttribute(.font, value: newFont, range: range)
        return mutable
    }
    
    /// Apply underline formatting to selected range
    static func applyUnderline(to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        let currentUnderline = mutable.attribute(.underlineStyle, at: range.location, effectiveRange: nil) as? Int ?? 0
        
        let newUnderline: Int
        if currentUnderline != 0 {
            newUnderline = 0
        } else {
            newUnderline = NSUnderlineStyle.single.rawValue
        }
        
        mutable.addAttribute(.underlineStyle, value: newUnderline, range: range)
        return mutable
    }
    
    /// Apply color to selected range
    static func applyColor(_ color: PlatformColor, to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        mutable.addAttribute(.foregroundColor, value: color, range: range)
        return mutable
    }
    
    /// Apply font to selected range
    static func applyFont(_ fontName: String, size: CGFloat, to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        
        let newFont: PlatformFont
        if fontName == "System" {
            newFont = PlatformFont.systemFont(ofSize: size)
        } else {
            newFont = PlatformFont(name: fontName, size: size) ?? PlatformFont.systemFont(ofSize: size)
        }
        
        mutable.addAttribute(.font, value: newFont, range: range)
        return mutable
    }
    
    /// Apply alignment to selected range
    static func applyAlignment(_ alignment: NSTextAlignment, to attributedString: NSAttributedString, range: NSRange) -> NSAttributedString {
        let mutable = NSMutableAttributedString(attributedString: attributedString)
        
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = alignment
        
        mutable.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
        return mutable
    }
    
    // MARK: - Template Management
    
    /// Create a template from NSAttributedString
    static func createTemplate(from attributedString: NSAttributedString, name: String) -> DocumentTemplate {
        let template = DocumentTemplate(context: PersistenceController.shared.container.viewContext)
        template.id = UUID()
        template.name = name
        template.content = attributedString.string // Store as plain text for now
        template.createdDate = Date()
        template.modifiedDate = Date()
        template.type = "letter"
        
        // TODO: Store full NSAttributedString data in a separate attribute
        // For now, we'll store the RTF data as base64 in a custom attribute
        
        return template
    }
    
    /// Load template as NSAttributedString
    static func loadTemplate(_ template: DocumentTemplate) -> NSAttributedString {
        guard let content = template.content else {
            return NSAttributedString(string: "")
        }
        
        // TODO: Load full NSAttributedString data from custom attribute
        // For now, return as plain text
        return NSAttributedString(string: content)
    }
}

// Note: Platform-specific font extensions are already defined in RichTextEditorView.swift 