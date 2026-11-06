import SwiftUI

struct RootView: View {
    @Environment(DemoStore.self) private var store

    var body: some View {
        if store.current != nil {
            MainTabView()
        } else {
            NavigationStack {
                LoginView()
            }
        }
    }
}

struct MainTabView: View {
    @Environment(DemoStore.self) private var store

    var approvalsTitle: String {
        store.current?.role == .student ? "Apply" : "Approvals"
    }

    var body: some View {
        TabView {
            NavigationStack {
                DashboardView()
            }
            .tabItem { Label("Home", systemImage: "house.fill") }

            NavigationStack {
                ApprovalsView()
            }
            .tabItem { Label(approvalsTitle, systemImage: "doc.badge.checkmark") }

            NavigationStack {
                AssignmentsView()
            }
            .tabItem { Label("Assignments", systemImage: "book.fill") }

            NavigationStack {
                MessagesView()
            }
            .tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right.fill") }

            NavigationStack {
                MoreView()
            }
            .tabItem { Label("More", systemImage: "ellipsis.circle.fill") }
        }
        .tint(Theme.olive)
    }
}
