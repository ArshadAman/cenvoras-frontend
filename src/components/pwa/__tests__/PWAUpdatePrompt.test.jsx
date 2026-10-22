import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const state = { needRefresh: false, setNeedRefresh: vi.fn(), updateServiceWorker: vi.fn(), reg: null };
vi.mock("virtual:pwa-register/react", async () => {
  const React = await import("react");
  return {
    useRegisterSW: (opts) => {
      const [nr, setNr] = React.useState(state.needRefresh);
      React.useEffect(() => { if (state.reg) opts?.onRegisteredSW?.("/sw.js", state.reg); }, []);
      return {
        needRefresh: [nr, (v) => { state.setNeedRefresh(v); setNr(v); }],
        offlineReady: [false, () => {}],
        updateServiceWorker: state.updateServiceWorker,
      };
    },
  };
});

import PWAUpdatePrompt from "../PWAUpdatePrompt";

beforeEach(() => {
  state.needRefresh = false;
  state.reg = null;
  state.setNeedRefresh.mockClear();
  state.updateServiceWorker.mockClear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("PWAUpdatePrompt", () => {
  it("renders nothing when no update is waiting", () => {
    render(<PWAUpdatePrompt />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows an accessible banner when needRefresh is true", () => {
    state.needRefresh = true;
    render(<PWAUpdatePrompt />);
    const banner = screen.getByRole("status");
    expect(banner.textContent).toContain("New version available");
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  });

  it("Refresh calls updateSW(true)", () => {
    state.needRefresh = true;
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(state.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("Later / dismiss hides the banner", () => {
    state.needRefresh = true;
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(state.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("polls registration.update() hourly and on visibilitychange", () => {
    vi.useFakeTimers();
    state.reg = { update: vi.fn(() => Promise.resolve()) };
    render(<PWAUpdatePrompt />);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(state.reg.update).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(state.reg.update).toHaveBeenCalledTimes(2);
  });
});
