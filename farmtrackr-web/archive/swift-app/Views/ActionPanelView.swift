import SwiftUI

struct ActionPanelView: View {
    @EnvironmentObject var themeVM: ThemeViewModel
    let title: String
    let actions: [ActionCardData]
    let columns: [GridItem]
    
    init(title: String, actions: [ActionCardData], columns: [GridItem]? = nil) {
        self.title = title
        self.actions = actions
        self.columns = columns ?? [
            GridItem(.adaptive(minimum: 160), spacing: 16),
            GridItem(.adaptive(minimum: 160), spacing: 16)
        ]
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: themeVM.theme.spacing.large) {
            // Panel Title
            Text(title)
                .font(themeVM.theme.fonts.titleFont)
                .fontWeight(.bold)
                .foregroundColor(themeVM.theme.colors.text)
                .padding(.horizontal, themeVM.theme.spacing.large)
            
            // Action Cards Grid
            LazyVGrid(columns: columns, spacing: themeVM.theme.spacing.medium) {
                ForEach(actions) { action in
                    ActionCardView(
                        iconName: action.icon,
                        title: action.title,
                        subtitle: action.subtitle,
                        action: action.action
                    )
                }
            }
            .padding(.horizontal, themeVM.theme.spacing.large)
            .padding(.vertical, themeVM.theme.spacing.medium)
        }
        .padding(.vertical, themeVM.theme.spacing.large)
        .background(themeVM.theme.colors.panelBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.25), radius: 12, x: 0, y: 6)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.black.opacity(0.1), lineWidth: 1)
        )
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(title) panel with \(actions.count) actions")
    }
}

#Preview {
    ActionPanelView(
        title: "Quick Actions",
        actions: [
            .init(icon: "list.bullet", title: "View Details", subtitle: "See validation issues", action: {}),
            .init(icon: "person.2", title: "Fix Duplicates", subtitle: "Resolve duplicate contacts", action: {}),
            .init(icon: "plus.circle", title: "Add Test Data", subtitle: "Add sample duplicates", action: {}),
            .init(icon: "doc.on.doc", title: "Export Report", subtitle: "Download quality report", action: {})
        ]
    )
    .environmentObject(ThemeViewModel())
    .padding()
} 