import SwiftUI

struct MoreView: View {
    @Environment(DemoStore.self) private var store

    var current: Person { store.current! }

    private var items: [MoreItem] {
        var all: [MoreItem] = [
            MoreItem(tag: "reports", title: "My Report Card", subtitle: "Marks and term cards", systemImage: "doc.plaintext.fill", tint: Theme.olive, destination: AnyView(ReportCardsView())),
            MoreItem(tag: "progress", title: "Course Progress", subtitle: "Goals, percent and grades", systemImage: "chart.line.uptrend.xyaxis", tint: Theme.terracotta, destination: AnyView(CourseProgressView())),
            MoreItem(tag: "communications", title: "Communications", subtitle: "Notices, declarations, polls", systemImage: "megaphone.fill", tint: Theme.olive, destination: AnyView(CommunicationsView())),
            MoreItem(tag: "events", title: "Events & Calendar", subtitle: "School calendar", systemImage: "calendar", tint: Theme.terracotta, destination: AnyView(EventsView())),
            MoreItem(tag: "studyroom", title: "Study Room", subtitle: "Shared PDFs and notes", systemImage: "book.closed.fill", tint: Theme.olive, destination: AnyView(StudyRoomView())),
            MoreItem(tag: "library", title: "My Library", subtitle: "Books and issues", systemImage: "building.columns.fill", tint: Theme.terracotta, destination: AnyView(LibraryView())),
            MoreItem(tag: "attendance", title: "My Attendance", subtitle: "Day-by-day record", systemImage: "person.badge.clock", tint: Theme.olive, destination: AnyView(AttendanceView())),
            MoreItem(tag: "gallery", title: "Gallery", subtitle: "School albums", systemImage: "photo.stack", tint: Theme.terracotta, destination: AnyView(GalleryView()))
        ]
        if current.role != .teacher {
            all.insert(MoreItem(tag: "fees", title: "My Fee", subtitle: "Invoices and sibling discount", systemImage: "indianrupeesign.circle.fill", tint: Theme.terracotta, destination: AnyView(FeesView())), at: 6)
        }
        if current.role == .admin {
            all.insert(MoreItem(tag: "people", title: "People", subtitle: "Roster, add student, password preview", systemImage: "person.2.fill", tint: Theme.olive, destination: AnyView(PeopleView())), at: 0)
            all.insert(MoreItem(tag: "audit", title: "Audit Log", subtitle: "Read-only trail of actions", systemImage: "list.clipboard.fill", tint: Theme.muted, destination: AnyView(AuditView())), at: 1)
        }
        all.append(MoreItem(tag: "profile", title: "Profile", subtitle: "Account, sign out, deletion", systemImage: "person.crop.circle.fill", tint: Theme.muted, destination: AnyView(ProfileView())))
        return all
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ScreenHeader(title: "More", subtitle: "Everything else in the school")
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(items) { item in
                        NavigationLink(destination: item.destination) {
                            Card {
                                VStack(alignment: .leading, spacing: 10) {
                                    Image(systemName: item.systemImage)
                                        .font(.title2)
                                        .foregroundStyle(item.tint)
                                    Text(item.title)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(Theme.ink)
                                    Text(item.subtitle)
                                        .font(.caption2)
                                        .foregroundStyle(Theme.muted)
                                        .lineLimit(2)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("More")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct MoreItem: Identifiable {
    var id: String { tag }
    var tag: String
    var title: String
    var subtitle: String
    var systemImage: String
    var tint: Color
    var destination: AnyView
}
