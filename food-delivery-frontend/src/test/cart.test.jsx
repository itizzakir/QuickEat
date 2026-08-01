import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { api } from "../services/api";
import { writeSession } from "../services/session";
import { formatCurrency } from "../utils/currency";
import { makeToken, serverUser } from "./testUtils";

function CartProbe() {
  const { items, totalItems, totalPrice } = useCart();
  return (
    <div>
      <p data-testid="lines">{items.length}</p>
      <p data-testid="count">{totalItems}</p>
      <p data-testid="total">{totalPrice}</p>
      <p data-testid="formatted">{formatCurrency(totalPrice)}</p>
    </div>
  );
}

const cartFixture = {
  id: 7,
  userId: 1,
  totalPrice: 0,
  items: [
    { id: 1, quantity: 2, menuItem: { id: 10, name: "Burger", price: 250 } },
    { id: 2, quantity: 3, menuItem: { id: 11, name: "Fries", price: 100 } },
    { id: 3, quantity: 1, menuItem: { id: 12, name: "Cola", price: 49.5 } },
  ],
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <CartProbe />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("cart totals", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    writeSession({ ...serverUser({ role: "ROLE_CUSTOMER" }), token: makeToken() });
    vi.spyOn(api, "getMe").mockResolvedValue(serverUser({ role: "ROLE_CUSTOMER" }));
  });

  it("sums quantity x price across lines", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue(cartFixture);
    renderCart();

    // 2*250 + 3*100 + 1*49.5 = 849.5
    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("849.5"));
    expect(screen.getByTestId("count")).toHaveTextContent("6");
    expect(screen.getByTestId("lines")).toHaveTextContent("3");
  });

  it("renders the total as rupees, never dollars", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue(cartFixture);
    renderCart();

    await waitFor(() => expect(screen.getByTestId("formatted")).toHaveTextContent("849.50"));
    const text = screen.getByTestId("formatted").textContent;
    expect(text).toContain("₹");
    expect(text).not.toContain("$");
  });

  it("is zero for an empty cart", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue({ id: null, userId: 1, items: [], totalPrice: 0 });
    renderCart();

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("0"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("formatted")).toHaveTextContent("₹0.00");
  });

  it("recomputes after an item is added", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue({ id: 7, userId: 1, items: [], totalPrice: 0 });
    vi.spyOn(api, "addToCart").mockResolvedValue(cartFixture);

    let cartApi;
    function Harness() {
      cartApi = useCart();
      return <CartProbe />;
    }
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <Harness />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("0"));

    await act(async () => {
      await cartApi.addToCart({ id: 10, name: "Burger", price: 250 }, 2);
    });

    expect(screen.getByTestId("total")).toHaveTextContent("849.5");
  });

  it("tolerates a malformed line rather than rendering NaN", async () => {
    vi.spyOn(api, "getCart").mockResolvedValue({
      id: 7,
      userId: 1,
      totalPrice: 0,
      items: [
        { id: 1, quantity: 2, menuItem: { id: 10, name: "Burger", price: 250 } },
        // A line whose menu item failed to serialise.
        { id: 2, quantity: 4, menuItem: null },
      ],
    });
    renderCart();

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("500"));
    expect(screen.getByTestId("formatted")).not.toHaveTextContent("NaN");
  });
});
