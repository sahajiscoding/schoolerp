import SwiftUI

struct FeesView: View {
    @Environment(DemoStore.self) private var store

    var invoices: [Invoice] { store.invoicesForCurrent() }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScreenHeader(title: "Fees", subtitle: "Invoices and payments for 2026-27")

                summary
                Text(store.siblingDiscountDescription)
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                    .padding(10)
                    .background(Theme.olive.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))

                if invoices.isEmpty {
                    EmptyState(icon: "indianrupeesign.circle", title: "Nothing outstanding", subtitle: "Your invoices will appear here.")
                } else {
                    ForEach(invoices) { invoice in
                        InvoiceRow(invoice: invoice)
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.sand)
        .navigationTitle("My Fee")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var summary: some View {
        Card {
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(inr(store.feesCollected))
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Theme.olive)
                    Text("Collected").font(.caption).foregroundStyle(Theme.muted)
                }
                Divider().frame(height: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(inr(store.feesPending))
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Theme.terracotta)
                    Text("Pending").font(.caption).foregroundStyle(Theme.muted)
                }
            }
        }
    }
}

private struct InvoiceRow: View {
    @Environment(DemoStore.self) private var store
    let invoice: Invoice

    var payer: Person? { store.person(invoice.studentID) }
    var sibling: Person? {
        guard let siblingID = payer?.siblingID else { return nil }
        return store.person(siblingID)
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(invoice.label).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                    Spacer()
                    Badge(text: invoice.status.uppercased(), tint: invoice.status == "paid" ? Theme.olive : Theme.terracotta)
                }
                HStack {
                    Text(inr(invoice.amount))
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Theme.ink)
                    if invoice.siblingDiscountApplied {
                        Badge(text: "50% sibling discount", tint: Theme.olive)
                    }
                    Spacer()
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Due \(relativeDay(invoice.dueDate))")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                    if let payer {
                        Text("\(payer.fullName) · \(payer.classLabel ?? "—")-\(payer.sectionLabel ?? "—")")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    }
                    if let sibling {
                        Text("Sibling: \(sibling.fullName) · \(sibling.classLabel ?? "—")-\(sibling.sectionLabel ?? "—")")
                            .font(.caption2)
                            .foregroundStyle(Theme.muted)
                    }
                }
            }
        }
    }
}
