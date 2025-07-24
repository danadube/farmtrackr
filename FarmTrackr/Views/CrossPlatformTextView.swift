//
//  CrossPlatformTextView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import Foundation

#if os(iOS)
import UIKit

struct CrossPlatformTextView: UIViewRepresentable {
    @Binding var attributedText: NSAttributedString
    let onTextChange: (NSAttributedString) -> Void
    @Binding var textViewRef: UITextView?
    
    let fontSize: CGFloat
    let fontName: String
    let alignment: NSTextAlignment
    let textColor: UIColor
    let pageWidth: CGFloat
    let pageHeight: CGFloat
    let textMarginTop: CGFloat
    let textMarginBottom: CGFloat
    let textMarginLeft: CGFloat
    let textMarginRight: CGFloat
    
    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.delegate = context.coordinator
        textView.font = UIFont.systemFont(ofSize: fontSize)
        textView.textColor = textColor
        textView.textAlignment = alignment
        textView.backgroundColor = UIColor.clear
        textView.isScrollEnabled = true
        textView.isEditable = true
        textView.isSelectable = true
        textView.textContainerInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        textView.textContainer.lineFragmentPadding = 0
        textView.textContainer.widthTracksTextView = false
        textView.textContainer.heightTracksTextView = false
        
        // Set proper text container size with margins
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32)
        textView.textContainer.size = CGSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Enable scrolling
        textView.textContainer.maximumNumberOfLines = 0
        textView.textContainer.lineBreakMode = .byWordWrapping
        textView.showsVerticalScrollIndicator = true
        textView.showsHorizontalScrollIndicator = false
        
        return textView
    }
    
    func updateUIView(_ uiView: UITextView, context: Context) {
        // Only update attributed text if it's different to avoid loops
        if uiView.attributedText != attributedText {
            uiView.attributedText = attributedText
        }
        
        // Update font
        let font = fontName == "System" ? UIFont.systemFont(ofSize: fontSize) : UIFont(name: fontName, size: fontSize) ?? UIFont.systemFont(ofSize: fontSize)
        uiView.font = font
        
        // Update text color
        uiView.textColor = textColor
        
        // Update alignment
        uiView.textAlignment = alignment
        
        // Update text container size
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32)
        uiView.textContainer.size = CGSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Set the reference
        DispatchQueue.main.async {
            textViewRef = uiView
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UITextViewDelegate {
        var parent: CrossPlatformTextView
        
        init(_ parent: CrossPlatformTextView) {
            self.parent = parent
        }
        
        func textViewDidChange(_ textView: UITextView) {
            // Update the binding on the main queue to avoid state modification during view update
            DispatchQueue.main.async {
                self.parent.attributedText = textView.attributedText
                self.parent.onTextChange(textView.attributedText)
            }
        }
    }
}

#elseif os(macOS)
import AppKit

struct CrossPlatformTextView: NSViewRepresentable {
    @Binding var attributedText: NSAttributedString
    let onTextChange: (NSAttributedString) -> Void
    @Binding var textViewRef: NSTextView?
    
    let fontSize: CGFloat
    let fontName: String
    let alignment: NSTextAlignment
    let textColor: NSColor
    let pageWidth: CGFloat
    let pageHeight: CGFloat
    let textMarginTop: CGFloat
    let textMarginBottom: CGFloat
    let textMarginLeft: CGFloat
    let textMarginRight: CGFloat
    
    func makeNSView(context: Context) -> NSTextView {
        let textView = NSTextView()
        textView.delegate = context.coordinator
        textView.font = NSFont.systemFont(ofSize: fontSize)
        textView.textColor = textColor
        textView.alignment = alignment
        textView.backgroundColor = NSColor.clear
        textView.isEditable = true
        textView.isSelectable = true
        textView.isRichText = true
        
        // Set proper text container size with margins
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32)
        textView.textContainer?.containerSize = NSSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Enable scrolling
        textView.textContainer?.widthTracksTextView = false
        textView.textContainer?.heightTracksTextView = false
        
        return textView
    }
    
    func updateNSView(_ nsView: NSTextView, context: Context) {
        // Only update attributed text if it's different to avoid loops
        if nsView.attributedString() != attributedText {
            nsView.textStorage?.setAttributedString(attributedText)
        }
        
        // Update font
        let font = fontName == "System" ? NSFont.systemFont(ofSize: fontSize) : NSFont(name: fontName, size: fontSize) ?? NSFont.systemFont(ofSize: fontSize)
        nsView.font = font
        
        // Update text color
        nsView.textColor = textColor
        
        // Update alignment
        nsView.alignment = alignment
        
        // Update text container size
        let contentWidth = max(1, pageWidth - textMarginLeft - textMarginRight - 32)
        nsView.textContainer?.containerSize = NSSize(width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        
        // Set the reference
        DispatchQueue.main.async {
            textViewRef = nsView
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CrossPlatformTextView
        
        init(_ parent: CrossPlatformTextView) {
            self.parent = parent
        }
        
        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            
            // Update the binding on the main queue to avoid state modification during view update
            DispatchQueue.main.async {
                self.parent.attributedText = textView.attributedString()
                self.parent.onTextChange(textView.attributedString())
            }
        }
    }
}
#endif

// Note: Platform-specific type aliases are already defined in Extensions.swift and RichTextEditorView.swift 