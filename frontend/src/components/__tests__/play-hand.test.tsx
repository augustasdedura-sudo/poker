import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PokerApp } from "@/components/PokerApp";
import type { StoredHand } from "@/lib/poker/types";

function jsonResponse(data: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => data } as Response;
}

let stored: StoredHand[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  stored = [];
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init || !init.method || init.method === "GET") {
      return jsonResponse(stored);
    }
    if (init.method === "POST") {
      const record = JSON.parse(init.body as string);
      const hand: StoredHand = {
        ...record,
        winnings: [0, 0, 0, -20, 20, 0],
        pot: 40,
        createdAt: new Date().toISOString(),
      };
      stored = [hand, ...stored];
      return jsonResponse(hand, 201);
    }
    return jsonResponse({}, 400);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PokerApp integration", () => {
  it("plays a hand to completion, saves it, and shows it in history", async () => {
    const user = userEvent.setup();
    render(<PokerApp />);

    // History is fetched on mount.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText("No hands played yet.")).toBeInTheDocument();

    // Deal a hand, then fold around to the big blind (5 folds end the hand).
    await user.click(screen.getByRole("button", { name: "Start" }));
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole("button", { name: "Fold" }));
    }

    // The log reports completion with the final pot.
    await waitFor(() =>
      expect(screen.getByTestId("play-log").textContent).toContain("Final pot was 40"),
    );

    // Exactly one hand was POSTed to the backend.
    const postCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === "POST");
    expect(postCalls).toHaveLength(1);

    // The saved hand shows up as a history card. ("Winnings:" only appears in
    // the history card, whereas "Hand #" also appears in the play log.)
    await waitFor(() => expect(screen.getByText(/Winnings:/)).toBeInTheDocument());
    expect(screen.getAllByText(/^Hand #/).length).toBeGreaterThanOrEqual(1);
  });
});
