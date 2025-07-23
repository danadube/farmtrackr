//
//  RichTextToolbar.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI

struct RichTextToolbar: View {
    @Binding var selectedFontSize: CGFloat
    @Binding var selectedFontName: String
    @Binding var selectedAlignment: NSTextAlignment
    @Binding var selectedColor: PlatformColor
    @Binding var showingColorPicker: Bool
    @Binding var showingFontPicker: Bool
    
    let onBold: () -> Void
    let onItalic: () -> Void
    let onUnderline: () -> Void
    let onLink: () -> Void
    let onTable: () -> Void
    let onImage: () -> Void
    
    @EnvironmentObject var themeVM: ThemeViewModel
    
    private let availableSizes: [CGFloat] = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72]
    
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
                
                // Insert controls
                insertControls
            }
            .padding(.horizontal, 16)
        }
    }
    
    private var fontControls: some View {
        HStack(spacing: 12) {
            // Font picker
            Button(action: {
                showingFontPicker = true
            }) {
                HStack(spacing: 4) {
                    Text(selectedFontName)
                        .font(.caption)
                        .foregroundColor(themeVM.theme.colors.text)
                        .lineLimit(1)
                        .frame(maxWidth: 80)
                    Image(systemName: "chevron.down")
                        .font(.caption2)
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(themeVM.theme.colors.background)
                .cornerRadius(4)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(themeVM.theme.colors.border, lineWidth: 1)
                )
            }
            .help("Select font")
            
            // Font size
            fontSizeMenu
        }
    }
    
    private var fontSizeMenu: some View {
        Menu {
            ForEach(availableSizes, id: \.self) { size in
                Button("\(Int(size))") { selectedFontSize = size }
            }
        } label: {
            HStack(spacing: 4) {
                Text("\(Int(selectedFontSize))")
                    .font(.caption)
                    .foregroundColor(themeVM.theme.colors.text)
                Image(systemName: "chevron.down")
                    .font(.caption2)
                    .foregroundColor(themeVM.theme.colors.secondaryLabel)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(themeVM.theme.colors.background)
            .cornerRadius(4)
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(themeVM.theme.colors.border, lineWidth: 1)
            )
        }
        .help("Select font size")
    }
    
    private var textFormatting: some View {
        HStack(spacing: 8) {
            // Bold
            ToolbarButton(
                icon: "bold",
                action: onBold,
                help: "Bold"
            )
            
            // Italic
            ToolbarButton(
                icon: "italic",
                action: onItalic,
                help: "Italic"
            )
            
            // Underline
            ToolbarButton(
                icon: "underline",
                action: onUnderline,
                help: "Underline"
            )
            
            // Color picker
            Button(action: {
                showingColorPicker = true
            }) {
                Image(systemName: "paintbrush.fill")
                    .font(.system(size: 16))
                    .foregroundColor(themeVM.theme.colors.text)
                    .frame(width: 32, height: 32)
                    .background(themeVM.theme.colors.background)
                    .cornerRadius(4)
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(themeVM.theme.colors.border, lineWidth: 1)
                    )
            }
            .help("Text color")
        }
    }
    
    private var alignmentControls: some View {
        HStack(spacing: 8) {
            // Left align
            ToolbarButton(
                icon: "text.alignleft",
                action: { selectedAlignment = .left },
                help: "Align left"
            )
            
            // Center align
            ToolbarButton(
                icon: "text.aligncenter",
                action: { selectedAlignment = .center },
                help: "Align center"
            )
            
            // Right align
            ToolbarButton(
                icon: "text.alignright",
                action: { selectedAlignment = .right },
                help: "Align right"
            )
        }
    }
    
    private var insertControls: some View {
        HStack(spacing: 8) {
            // Link
            ToolbarButton(
                icon: "link",
                action: onLink,
                help: "Insert link"
            )
            
            // Table
            ToolbarButton(
                icon: "tablecells",
                action: onTable,
                help: "Insert table"
            )
            
            // Image
            ToolbarButton(
                icon: "photo",
                action: onImage,
                help: "Insert image"
            )
        }
    }
}

struct ToolbarButton: View {
    let icon: String
    let action: () -> Void
    let help: String
    
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(themeVM.theme.colors.text)
                .frame(width: 32, height: 32)
                .background(themeVM.theme.colors.background)
                .cornerRadius(6)
                .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(themeVM.theme.colors.border, lineWidth: 1)
                )
        }
        .help(help)
    }
} 