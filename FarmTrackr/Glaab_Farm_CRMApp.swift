//
//  Glaab_Farm_CRMApp.swift
//  FarmTrackr
//
//  Created by Dana Dube on 7/9/25.
//

import SwiftUI

@main
struct Glaab_Farm_CRMApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject private var themeVM = ThemeViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(themeVM)
                .preferredColorScheme(themeVM.darkModeEnabled ? .dark : .light)
        }
    }
}
