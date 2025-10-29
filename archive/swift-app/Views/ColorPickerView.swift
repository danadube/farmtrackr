//
//  ColorPickerView.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/23/25.
//

import SwiftUI

struct ColorPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    @Binding var selectedColor: PlatformColor
    
    private let colors: [PlatformColor] = [
        .label, .systemBlue, .systemGreen, .systemRed, .systemOrange,
        .systemPurple, .systemPink, .systemYellow, .systemGray,
        .systemTeal, .systemIndigo, .systemBrown, .systemMint
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(themeVM.theme.colors.accent)
                    
                    Spacer()
                    
                    Text("Choose Color")
                        .font(.headline)
                        .foregroundColor(themeVM.theme.colors.text)
                    
                    Spacer()
                    
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(themeVM.theme.colors.accent)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(Color.cardBackgroundAdaptive)
                
                Divider()
                    .background(Color.borderColor)
                
                // Color grid
                ScrollView {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                        ForEach(colors, id: \.self) { color in
                            Button(action: {
                                selectedColor = color
                                dismiss()
                            }) {
                                Circle()
                                    .fill(Color(color))
                                    .frame(width: 60, height: 60)
                                    .overlay(
                                        Circle()
                                            .stroke(selectedColor == color ? themeVM.theme.colors.accent : Color.borderColor, lineWidth: selectedColor == color ? 3 : 1)
                                    )
                                    .scaleEffect(selectedColor == color ? 1.1 : 1.0)
                                    .animation(.easeInOut(duration: 0.2), value: selectedColor == color)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(24)
                }
            }
        }
        .navigationBarHidden(true)
    }
}

#Preview {
    ColorPickerView(selectedColor: .constant(.label))
        .environmentObject(ThemeViewModel())
} 