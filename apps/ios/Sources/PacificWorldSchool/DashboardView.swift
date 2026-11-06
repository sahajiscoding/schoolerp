import SwiftUI

struct DashboardView: View {
    @Environment(DemoStore.self) private var store
    private let now = Date()

    var current: Person { store.current! }

    var greeting: String {
        let hour = Calendar.current.component(.hour, from: now)
        switch hour {
        case ..<12: return "Good morning"
        case ..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header

                switch current.role {
                case .admin: adminDashboard
                case .teacher: teacherDashboard
                case .student: studentDashboard
                }
            }
            .padding(18)
        }
        .background(Theme.sand)
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                AvatarView(name: current.fullName, size: 32)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(greeting), \(current.fullName.components(separatedBy: " ").first ?? current.fullName)")
                .font(.title.weight(.bold))
                .foregroundStyle(Theme.ink)
            HStack(spacing: 8) {
                Text(current.role.title)
                Text("·")
                Text(current.sectionKey.isEmpty ? "Pacific World School" : current.sectionKey)
                Text("·")
                Text("AY \(Seed.academicYear)")
            }
            .font(.subheadline)
            .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Admin

    private var adminDashboard: some View {
        VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(title: "Enrolled students", value: "\(store.people.filter { $0.role == .student }.count)", icon: "graduationcap.fill")
                StatCard(title: "Pending approvals", value: "\(store.pendingApprovals().count)", icon: "doc.badge.checkmark", tint: Theme.terracotta)
                StatCard(title: "Fees collected", value: inr(store.feesCollected), icon: "indianrupeesign.circle.fill", tint: Theme.olive)
                StatCard(title: "Fees pending", value: inr(store.feesPending), icon: "clock.badge.exclamationmark", tint: Theme.terracotta)
            }

            feeCollection
            quickLinks
        }
    }

    private var feeCollection: some View {
        let total = store.feesCollected + store.feesPending
        let progress = total > 0 ? store.feesCollected / total : 0
        return Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("Fee collection", systemImage: "chart.bar.fill")
                        .font(.headline)
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    Text("\(Int(progress * 100))%")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(Theme.olive)
                }
                ProgressView(value: progress)
                    .tint(Theme.olive)
                HStack {
                    Text("Collected \(inr(store.feesCollected))")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                    Spacer()
                    Text("Pending \(inr(store.feesPending))")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
            }
        }
    }

    // MARK: - Teacher

    private var teacherDashboard: some View {
        let section = current.classTeacherOf ?? current.sectionKey
        let roster = store.students(in: section)
        let due = store.assignmentsForCurrent().filter { $0.teacherID == current.id }
        let toReview = store.submissions.filter { submission in
            due.contains { $0.id == submission.assignmentID } && submission.status == "submitted"
        }.count
        return VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(title: "Students in \(section)", value: "\(roster.count)", icon: "person.3.fill")
                StatCard(title: "Pending approvals", value: "\(store.pendingApprovals().count)", icon: "doc.badge.checkmark", tint: Theme.terracotta)
                StatCard(title: "Submissions to review", value: "\(toReview)", icon: "tray.full.fill", tint: Theme.terracotta)
                StatCard(title: "Active work", value: "\(due.count)", icon: "book.fill")
            }

            VStack(alignment: .leading, spacing: 10) {
                ScreenHeader(title: "My work", subtitle: "What you've published")
                ForEach(due.prefix(3)) { assignment in
                    NavigationLink(destination: AssignmentDetailView(assignment: assignment)) {
                        Card {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: assignment.kind == "ASSIGNMENT" ? "doc.text.fill" : "pencil.and.list.clipboard")
                                    .foregroundStyle(Theme.terracotta)
                                    .padding(.top, 2)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(assignment.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink).multilineTextAlignment(.leading)
                                    Text("\(assignment.subject) · due \(relativeDay(assignment.dueDate ?? ""))")
                                        .font(.caption)
                                        .foregroundStyle(Theme.muted)
                                }
                                Spacer()
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                if due.isEmpty {
                    EmptyState(icon: "tray", title: "No work yet", subtitle: "Publish your first assignment with the Assignments tab.")
                }
            }

            quickLinks
        }
    }

    // MARK: - Student

    private var studentDashboard: some View {
        let section = current.sectionKey
        let mine = store.assignmentsForCurrent()
        let pending = mine.filter { store.submissionFor($0, student: current) == nil }.count
        let composed = store.notices.filter { !$0.readBy.contains(current.id) }.count
        let goals = store.goals.filter { $0.studentID == current.id }
        let avg = goals.isEmpty ? 0 : goals.reduce(0) { $0 + $1.percent } / goals.count

        return VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(title: "Pending work", value: "\(pending)", icon: "tray.full.fill", tint: Theme.terracotta)
                StatCard(title: "My average progress", value: "\(avg)%", icon: "chart.line.uptrend.xyaxis")
                StatCard(title: "Unread notices", value: "\(composed)", icon: "megaphone.fill", tint: Theme.terracotta)
                StatCard(title: "Study materials", value: "\(store.materials.filter { $0.sectionLabel == section }.count)", icon: "books.vertical.fill")
            }

            VStack(alignment: .leading, spacing: 10) {
                ScreenHeader(title: "Due soon", subtitle: "What the school sent you")
                ForEach(mine.prefix(3)) { assignment in
                    NavigationLink(destination: AssignmentDetailView(assignment: assignment)) {
                        Card {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: "doc.text")
                                    .foregroundStyle(Theme.olive)
                                    .padding(.top, 2)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(assignment.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink).multilineTextAlignment(.leading)
                                    Text("\(assignment.subject) · due \(relativeDay(assignment.dueDate ?? ""))")
                                        .font(.caption)
                                        .foregroundStyle(Theme.muted)
                                }
                                Spacer()
                                if store.submissionFor(assignment, student: current) != nil {
                                    Badge(text: "Submitted", tint: Theme.olive)
                                }
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            quickLinks
        }
    }

    // MARK: - Quick links

    private var quickLinks: some View {
        let links: [(String, String, AnyView)] = [
            ("Assignments", "book.fill", AnyView(AssignmentsView())),
            ("Course Progress", "chart.line.uptrend.xyaxis", AnyView(CourseProgressView())),
            ("Communications", "megaphone.fill", AnyView(CommunicationsView())),
            ("Events", "calendar", AnyView(EventsView()))
        ]
        return VStack(alignment: .leading, spacing: 10) {
            ScreenHeader(title: "Quick links")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(links, id: \.0) { link in
                    NavigationLink(destination: link.2) {
                        Card {
                            HStack {
                                Image(systemName: link.1).foregroundStyle(Theme.terracotta)
                                Text(link.0).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                                Spacer()
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private extension Role {
    var title: String {
        switch self {
        case .admin: return "Admin"
        case .teacher: return "Teacher"
        case .student: return "Student"
        }
    }
}
