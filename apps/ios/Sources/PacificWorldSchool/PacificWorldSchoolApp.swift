import SwiftUI

@main
struct PacificWorldSchoolApp: App {
    @State private var store = DemoStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
        }
    }
}
