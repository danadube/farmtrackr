import SwiftUI

struct ActionCardView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let iconName: String
    let title: String
    let subtitle: String
    let action: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                // Icon with enhanced hover effects
                Image(systemName: iconName)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(isHovered ? themeVM.theme.colors.accent : themeVM.theme.colors.primary)
                    .frame(width: 32, height: 32)
                    .scaleEffect(isHovered ? 1.15 : 1.0)
                    .shadow(color: isHovered ? themeVM.theme.colors.primary.opacity(0.4) : Color.clear, radius: 4, x: 0, y: 2)
                    .animation(.easeInOut(duration: 0.2), value: isHovered)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(isHovered ? themeVM.theme.colors.primary : themeVM.theme.colors.text)
                        .lineLimit(2)
                    
                    Text(subtitle)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(themeVM.theme.colors.secondaryLabel)
                        .lineLimit(2)
                }
                
                Spacer()
            }
            .padding(themeVM.theme.spacing.medium)
            .frame(maxWidth: .infinity, minHeight: 100)
            .background(backgroundGradient)
            .cornerRadius(12)
            .shadow(color: shadowColor, radius: shadowRadius, x: 0, y: shadowY)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(strokeColor, lineWidth: strokeWidth)
            )
            .scaleEffect(isHovered ? 1.02 : 1.0)
            .offset(y: isHovered ? -4 : 0)
            .animation(.easeInOut(duration: 0.2), value: isHovered)
        }
        .buttonStyle(PlainButtonStyle())
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = true
            }
            // Reset hover state after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHovered = false
                }
            }
            action()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(subtitle)")
    }
    
    // MARK: - Computed Properties for Hover Effects
    
    private var backgroundGradient: some ShapeStyle {
        if isHovered {
            return AnyShapeStyle(
                LinearGradient(
                    colors: [
                        themeVM.theme.colors.cardBackground,
                        themeVM.theme.colors.primary.opacity(0.05),
                        themeVM.theme.colors.secondary.opacity(0.03)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        } else {
            return AnyShapeStyle(themeVM.theme.colors.cardBackground)
        }
    }
    
    private var shadowColor: Color {
        isHovered ? Color.black.opacity(0.35) : Color.black.opacity(0.25)
    }
    
    private var shadowRadius: CGFloat {
        isHovered ? 16 : 12
    }
    
    private var shadowY: CGFloat {
        isHovered ? 8 : 6
    }
    
    private var strokeColor: Color {
        isHovered ? themeVM.theme.colors.primary.opacity(0.3) : Color.black.opacity(0.1)
    }
    
    private var strokeWidth: CGFloat {
        isHovered ? 1.5 : 1
    }
}

struct ActionCardData: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
}

#Preview {
    ActionCardView(
        iconName: "list.bullet",
        title: "View Details",
        subtitle: "See validation issues",
        action: {}
    )
    .environmentObject(ThemeViewModel())
    .padding()
} 