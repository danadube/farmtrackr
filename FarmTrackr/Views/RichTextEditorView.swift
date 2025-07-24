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
    
    var body: some View {
        PlatformTextViewRepresentable(attributedText: $attributedText)
            .background(Color.appBackground)
    }
}

// MARK: - Platform-Specific Text View Implementation

#if os(iOS)
struct PlatformTextViewRepresentable: UIViewRepresentable {
    @Binding var attributedText: NSAttributedString
    
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
            parent.attributedText = textView.attributedText
        }
    }
}

#elseif os(macOS)
struct PlatformTextViewRepresentable: NSViewRepresentable {
    @Binding var attributedText: NSAttributedString
    
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
        
        // Configure text container
        textView.textContainer?.containerSize = NSSize(width: 0, height: CGFloat.greatestFiniteMagnitude)
        textView.textContainer?.widthTracksTextView = true
        
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
            parent.attributedText = textView.attributedString()
        }
    }
}
#endif 