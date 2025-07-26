import SwiftUI
import CoreData

struct DataCleanupView: View {
    @StateObject private var cleanupManager = DataCleanupManager()
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        ScrollView {
                VStack(spacing: themeVM.theme.spacing.large) {
                    TabHeader(
                        icon: "wrench.and.screwdriver",
                        logoName: nil,
                        title: "Data Cleanup",
                        subtitle: "Fix formatting issues with phone numbers and zip codes"
                    )
                    
                    // What will be fixed
                    VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                        Text("This will fix:")
                            .font(themeVM.theme.fonts.titleFont)
                            .foregroundColor(.primary)
                        
                        VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                            FixItem(icon: "phone", title: "Phone Numbers", description: "Format as (XXX) XXX-XXXX")
                            FixItem(icon: "location", title: "Zip Codes", description: "Remove extra zeros, add leading zeros")
                            FixItem(icon: "clock", title: "Update Timestamps", description: "Mark modified contacts")
                        }
                    }
                    .padding(themeVM.theme.spacing.large)
                    .interactiveCardStyle()
                    
                    // Progress section
                    if cleanupManager.isCleaning {
                        VStack(spacing: themeVM.theme.spacing.small) {
                            ProgressView(value: cleanupManager.progress)
                                .progressViewStyle(LinearProgressViewStyle())
                            Text(cleanupManager.status)
                                .font(themeVM.theme.fonts.captionFont)
                                .foregroundColor(.secondary)
                        }
                        .padding(themeVM.theme.spacing.large)
                        .interactiveCardStyle()
                    }
                    
                    // Results section
                    if !cleanupManager.isCleaning && cleanupManager.cleanupResults.totalContacts > 0 {
                        VStack(alignment: .leading, spacing: themeVM.theme.spacing.medium) {
                            Text("Cleanup Results")
                                .font(themeVM.theme.fonts.titleFont)
                                .foregroundColor(.primary)
                            
                            VStack(alignment: .leading, spacing: themeVM.theme.spacing.small) {
                                ResultRow(title: "Total Contacts", value: "\(cleanupManager.cleanupResults.totalContacts)")
                                ResultRow(title: "Fixed Zip Codes", value: "\(cleanupManager.cleanupResults.fixedZipCodes)")
                                ResultRow(title: "Fixed Phone Numbers", value: "\(cleanupManager.cleanupResults.fixedPhoneNumbers)")
                                if cleanupManager.cleanupResults.errors > 0 {
                                    ResultRow(title: "Errors", value: "\(cleanupManager.cleanupResults.errors)")
                                        .foregroundColor(.red)
                                }
                            }
                        }
                        .padding(themeVM.theme.spacing.large)
                        .interactiveCardStyle()
                    }
                    
                    // Action buttons
                    VStack(spacing: themeVM.theme.spacing.medium) {
                        Button(action: {
                            Task {
                                await cleanupManager.cleanupData(context: PersistenceController.shared.container.viewContext)
                            }
                        }) {
                            HStack {
                                if cleanupManager.isCleaning {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "wrench.and.screwdriver")
                                }
                                Text(cleanupManager.isCleaning ? "Cleaning..." : "Start Cleanup")
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .primaryButtonStyle()
                        .disabled(cleanupManager.isCleaning)
                        
                        Button(action: {
                            dismiss()
                        }) {
                            HStack {
                                Text("Done")
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .secondaryButtonStyle()
                    }
                    .padding(.top, themeVM.theme.spacing.large)
                }
                .padding(themeVM.theme.spacing.large)
            }
            .background(themeVM.theme.colors.background)
    }
}

struct FixItem: View {
    let icon: String
    let title: String
    let description: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack(spacing: themeVM.theme.spacing.small) {
            Image(systemName: icon)
                .foregroundColor(themeVM.theme.colors.primary)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(themeVM.theme.fonts.bodyFont)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(themeVM.theme.fonts.captionFont)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

struct ResultRow: View {
    let title: String
    let value: String
    @EnvironmentObject var themeVM: ThemeViewModel
    
    var body: some View {
        HStack {
            Text(title)
                .font(themeVM.theme.fonts.bodyFont)
                .foregroundColor(.primary)
            
            Spacer()
            
            Text(value)
                .font(themeVM.theme.fonts.bodyFont)
                .fontWeight(.semibold)
                .foregroundColor(Constants.Colors.primary)
        }
    }
}

#Preview {
    DataCleanupView()
        .environmentObject(ThemeViewModel())
} 