import SwiftUI

enum Theme {
    static let olive = Color(red: 0x4B / 255, green: 0x5D / 255, blue: 0x2A / 255)
    static let terracotta = Color(red: 0xD2 / 255, green: 0x69 / 255, blue: 0x1E / 255)
    static let sand = Color(red: 0xF5 / 255, green: 0xF1 / 255, blue: 0xEC / 255)
    static let cream = Color(red: 0xFA / 255, green: 0xF7 / 255, blue: 0xF2 / 255)
    static let ink = Color(red: 0x1A / 255, green: 0x1A / 255, blue: 0x1A / 255)
    static let muted = Color(red: 0x6B / 255, green: 0x6B / 255, blue: 0x6B / 255)
    static let line = Color.black.opacity(0.08)

    static let subjectColors: [String: Color] = [
        "Artificial Intelligence": olive,
        "Mathematics": terracotta,
        "English": Color(red: 0x7C / 255, green: 0x3A / 255, blue: 0xED / 255),
        "Science": Color(red: 0x0F / 255, green: 0x76 / 255, blue: 0x6E / 255),
        "Social Science": Color(red: 0xB4 / 255, green: 0x53 / 255, blue: 0x09 / 255),
        "Hindi": Color(red: 0xBE / 255, green: 0x12 / 255, blue: 0x3C / 255)
    ]

    static func subjectColor(_ name: String) -> Color {
        subjectColors[name] ?? muted
    }
}

struct Card<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(14)
            .background(Theme.cream)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Theme.line, lineWidth: 1)
            )
    }
}

struct StatCard: View {
    var title: String
    var value: String
    var icon: String
    var tint: Color = Theme.olive

    var body: some View {
        Card {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(Theme.cream)
                    .frame(width: 44, height: 44)
                    .background(tint, in: RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 2) {
                    Text(value).font(.title3.weight(.semibold)).foregroundStyle(Theme.ink)
                    Text(title).font(.caption).foregroundStyle(Theme.muted).lineLimit(2)
                }
                Spacer()
            }
        }
    }
}

struct ScreenHeader: View {
    var title: String
    var subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.title2.weight(.bold)).foregroundStyle(Theme.ink)
            if let subtitle {
                Text(subtitle).font(.subheadline).foregroundStyle(Theme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 4)
    }
}

struct Badge: View {
    var text: String
    var tint: Color = Theme.olive

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(tint)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(tint.opacity(0.12), in: Capsule())
    }
}

struct EmptyState: View {
    var icon: String
    var title: String
    var subtitle: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 42))
                .foregroundStyle(Theme.muted.opacity(0.7))
            Text(title).font(.headline).foregroundStyle(Theme.ink)
            Text(subtitle).font(.subheadline).foregroundStyle(Theme.muted).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 48)
    }
}

struct AvatarView: View {
    var name: String
    var size: CGFloat = 36

    var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.compactMap { $0.first.map(String.init) }.joined().uppercased()
    }

    var body: some View {
        Text(initials)
            .font(.system(size: size * 0.36, weight: .semibold))
            .foregroundStyle(Theme.cream)
            .frame(width: size, height: size)
            .background(Theme.olive, in: Circle())
    }
}

func inr(_ amount: Double) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "INR"
    formatter.maximumFractionDigits = 0
    return formatter.string(from: NSNumber(value: amount)) ?? "₹\(Int(amount))"
}

func relativeDay(_ iso: String) -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    guard let date = f.date(from: iso) else { return iso }
    let display = DateFormatter()
    display.dateStyle = .medium
    return display.string(from: date)
}
