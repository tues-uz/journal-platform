import { describe, expect, it } from "vitest";
import { deriveDashboardArticles } from "@/features/dashboard/hooks/useDashboardArticles";

describe("deriveDashboardArticles", () => {
  it("filters by status and sorts by title ascending", () => {
    const result = deriveDashboardArticles({
      userRole: "journal_maker",
      userName: "Tester",
      searchQuery: "",
      statusFilter: "accepted",
      sortColumn: "title",
      sortDirection: "asc",
    });

    expect(result.filteredArticles.length).toBe(1);
    expect(result.sortedArticles[0]?.status).toBe("accepted");
  });
});
