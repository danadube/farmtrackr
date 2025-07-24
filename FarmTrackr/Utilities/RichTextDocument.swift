//
//  RichTextDocument.swift
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

class RichTextDocument {
    
    // MARK: - Save Functionality
    
    static func save(_ text: NSAttributedString, to url: URL) throws {
        let data = try text.data(
            from: NSRange(location: 0, length: text.length),
            documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
        )
        try data.write(to: url)
    }
    
    static func saveAsRTF(_ text: NSAttributedString, to url: URL) throws {
        let data = try text.data(
            from: NSRange(location: 0, length: text.length),
            documentAttributes: [.documentType: NSAttributedString.DocumentType.rtf]
        )
        try data.write(to: url)
    }
    
    static func saveAsPlainText(_ text: NSAttributedString, to url: URL) throws {
        let plainText = text.string
        try plainText.write(to: url, atomically: true, encoding: .utf8)
    }
    
    static func saveAsHTML(_ text: NSAttributedString, to url: URL) throws {
        let data = try text.data(
            from: NSRange(location: 0, length: text.length),
            documentAttributes: [.documentType: NSAttributedString.DocumentType.html]
        )
        try data.write(to: url)
    }
    
    // MARK: - Load Functionality
    
    static func load(from url: URL) throws -> NSAttributedString {
        let data = try Data(contentsOf: url)
        
        // Try to detect the document type
        let fileExtension = url.pathExtension.lowercased()
        
        switch fileExtension {
        case "rtf":
            return try NSAttributedString(
                data: data,
                options: [.documentType: NSAttributedString.DocumentType.rtf],
                documentAttributes: nil
            )
        case "html", "htm":
            return try NSAttributedString(
                data: data,
                options: [.documentType: NSAttributedString.DocumentType.html],
                documentAttributes: nil
            )
        case "txt":
            let plainText = String(data: data, encoding: .utf8) ?? ""
            return NSAttributedString(string: plainText)
        default:
            // Try RTF first, then fall back to plain text
            do {
                return try NSAttributedString(
                    data: data,
                    options: [.documentType: NSAttributedString.DocumentType.rtf],
                    documentAttributes: nil
                )
            } catch {
                let plainText = String(data: data, encoding: .utf8) ?? ""
                return NSAttributedString(string: plainText)
            }
        }
    }
    
    // MARK: - Export Functionality
    
    static func exportAsPDF(_ text: NSAttributedString, to url: URL) throws {
        #if os(iOS)
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792))
        try renderer.writePDF(to: url) { context in
            context.beginPage()
            
            let textRect = CGRect(x: 50, y: 50, width: 512, height: 692)
            text.draw(in: textRect)
        }
        #elseif os(macOS)
        // macOS PDF generation
        let pdfData = NSMutableData()
        let pdfConsumer = CGDataConsumer(data: pdfData as CFMutableData)!
        
        var mediaBox = CGRect(x: 0, y: 0, width: 612, height: 792)
        let pdfContext = CGContext(consumer: pdfConsumer, mediaBox: &mediaBox, nil)!
        
        let pdfInfo = [kCGPDFContextCreator as String: "FarmTrackr"]
        let pdfDocument = CGPDFContextCreate(pdfConsumer, &mediaBox, pdfInfo as CFDictionary)
        
        CGPDFContextBeginPage(pdfDocument, nil)
        
        let textRect = CGRect(x: 50, y: 50, width: 512, height: 692)
        let attributedString = text as CFAttributedString
        let line = CTLineCreateWithAttributedString(attributedString)
        CGContextSetTextPosition(pdfContext, textRect.origin.x, textRect.origin.y)
        CTLineDraw(line, pdfContext)
        
        CGPDFContextEndPage(pdfDocument)
        CGPDFContextClose(pdfDocument)
        
        try pdfData.write(to: url, atomically: true)
        #endif
    }
    
    static func exportAsWord(_ text: NSAttributedString, to url: URL) throws {
        // For Word export, we'll create a simple HTML file that Word can open
        // This is a basic implementation - in a production app, you'd use a proper Word library
        let htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Document</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                p { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            \(text.string.replacingOccurrences(of: "\n", with: "<br>"))
        </body>
        </html>
        """
        
        try htmlContent.write(to: url, atomically: true, encoding: .utf8)
    }
    
    static func exportAsExcel(_ content: String, to url: URL) throws {
        // For Excel export, we'll create a CSV file that Excel can open
        // This is a basic implementation - in a production app, you'd use a proper Excel library
        let csvContent = """
        Content
        "\(content.replacingOccurrences(of: "\"", with: "\"\""))"
        """
        
        try csvContent.write(to: url, atomically: true, encoding: .utf8)
    }
    
    // MARK: - Utility Functions
    
    static func createEmptyDocument() -> NSAttributedString {
        return NSAttributedString(string: "")
    }
    
    static func createDocumentWithText(_ text: String) -> NSAttributedString {
        return NSAttributedString(string: text)
    }
    
    static func getDocumentInfo(from url: URL) -> DocumentInfo? {
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            let creationDate = attributes[.creationDate] as? Date
            let modificationDate = attributes[.modificationDate] as? Date
            
            return DocumentInfo(
                url: url,
                fileSize: fileSize,
                creationDate: creationDate,
                modificationDate: modificationDate
            )
        } catch {
            return nil
        }
    }
}

// MARK: - Supporting Types

struct DocumentInfo {
    let url: URL
    let fileSize: Int64
    let creationDate: Date?
    let modificationDate: Date?
    
    var fileSizeString: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: fileSize)
    }
    
    var fileName: String {
        return url.lastPathComponent
    }
    
    var fileExtension: String {
        return url.pathExtension
    }
} 