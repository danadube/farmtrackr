//
//  FarmTrackrApp.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

@main
struct FarmTrackrApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject private var themeVM = ThemeViewModel()
    
    init() {
        print("[DEBUG] App launched")
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(themeVM)
                .preferredColorScheme(themeVM.darkModeEnabled ? .dark : .light)
        }
        .defaultSize(width: 1100, height: 800)
        .windowResizability(.contentSize)
#if targetEnvironment(macCatalyst)
        .windowStyle(HiddenTitleBarWindowStyle())
#endif
        .commands {
            CommandMenu("TestMenu") {
                Button("Test Action") {
                    print("Test Action triggered")
                }
            }
        }
    }
} 