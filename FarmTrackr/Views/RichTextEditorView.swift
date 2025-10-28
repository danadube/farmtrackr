//
//  RichTextEditorView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI
import Foundation

struct RichTextEditorView: View {
    @Binding var attributedText: NSAttributedString
    @Binding var selectedRange: NSRange
    var onTextChange: ((String) -> Void)? = nil
    
    var body: some View {
        PlatformTextViewRepresentable(
            attributedText: $attributedText, 
            selectedRange: $selectedRange,
            onTextChange: onTextChange
        )
        .background(Color.appBackground)
    }
}

// MARK: - Platform-Specific Text View Implementation

#if os(iOS)
struct PlatformTextViewRepresentable: UIViewRepresentable {
    @Binding var attributedText: NSAttributedString
    @Binding var selectedRange: NSRange
    var onTextChange: ((String) -> Void)?
    
    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.delegate = context.coordinator
        textView.backgroundColor = UIColor.clear
        textView.font = UIFont.systemFont(ofSize: 16)
        textView.isEditable = true
        textView.isScrollEnabled = true
        textView.autocapitalizationType = .sentences
        textView.autocorrectionType = .default
        textView.spellCheckingType = .default
        textView.dataDetectorTypes = [.link, .phoneNumber, .address]
        
        // Add padding to prevent text from starting at the edge
        textView.textContainerInset = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        
        return textView
    }
    
    func updateUIView(_ uiView: UITextView, context: Context) {
        if uiView.attributedText != attributedText {
            uiView.attributedText = attributedText
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UITextViewDelegate {
        var parent: PlatformTextViewRepresentable
        
        init(_ parent: PlatformTextViewRepresentable) {
            self.parent = parent
        }
        
        func textViewDidChange(_ textView: UITextView) {
            // Use a more robust approach to avoid state modification during view update
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.parent.attributedText = textView.attributedText
                self.parent.onTextChange?(textView.text)
            }
        }
        
        func textViewDidChangeSelection(_ textView: UITextView) {
            parent.selectedRange = textView.selectedRange
        }
    }
}

#elseif os(macOS)
struct PlatformTextViewRepresentable: NSViewRepresentable {
    @Binding var attributedText: NSAttributedString
    @Binding var selectedRange: NSRange
    var onTextChange: ((String) -> Void)?
    
    func makeNSView(context: Context) -> NSTextView {
        let textView = NSTextView()
        textView.delegate = context.coordinator
        textView.backgroundColor = NSColor.clear
        textView.font = NSFont.systemFont(ofSize: 16)
        textView.isEditable = true
        textView.isSelectable = true
        textView.isRichText = true
        textView.allowsUndo = true
        textView.isAutomaticQuoteSubstitutionEnabled = true
        textView.isAutomaticDashSubstitutionEnabled = true
        textView.isAutomaticTextReplacementEnabled = true
        textView.isAutomaticSpellingCorrectionEnabled = true
        
        // Configure text container with padding
        textView.textContainer?.containerSize = NSSize(width: 0, height: CGFloat.greatestFiniteMagnitude)
        textView.textContainer?.widthTracksTextView = true
        
        // Add padding to prevent text from starting at the edge
        textView.textContainerInset = NSSize(width: 20, height: 20)
        
        return textView
    }
    
    func updateNSView(_ nsView: NSTextView, context: Context) {
        if nsView.attributedString() != attributedText {
            nsView.textStorage?.setAttributedString(attributedText)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: PlatformTextViewRepresentable
        
        init(_ parent: PlatformTextViewRepresentable) {
            self.parent = parent
        }
        
        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            // Use a more robust approach to avoid state modification during view update
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.parent.attributedText = textView.attributedString()
                self.parent.onTextChange?(textView.string)
            }
        }
        
        func textViewDidChangeSelection(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.selectedRange = textView.selectedRange()
        }
    }
}
#endif 