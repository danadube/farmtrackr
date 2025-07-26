import SwiftUI

struct ActionCardView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let iconName: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: iconName)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(themeVM.theme.colors.primary)
                    .frame(width: 32, height: 32)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(themeVM.theme.colors.text)
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
            .background(themeVM.theme.colors.cardBackground)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.1), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(subtitle)")
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