/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";

// Persistent mock for store.bills()
const billsMock = {
  create: jest.fn(() =>
    Promise.resolve({ fileUrl: "https://localhost/fake.jpg", key: "1234" })
  ),
  update: jest.fn(() => Promise.resolve()),
};
const mockStore = { bills: jest.fn(() => billsMock) };

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "employee@test.tld" })
    );
    document.body.innerHTML = NewBillUI();
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("handleChangeFile", () => {
    test("should set fileName and fileUrl on valid file", async () => {
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy content"], "fake.jpg", {
        type: "image/jpeg",
      });

      Object.defineProperty(fileInput, "files", {
        value: [file],
      });

      fireEvent.change(fileInput);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(billsMock.create).toHaveBeenCalled();
      expect(newBill.fileUrl).toBe("https://localhost/fake.jpg");
    });

    test("should log error on create failure", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const failingStore = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("Erreur création"))),
        })),
      };
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: failingStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["dummy content"], "error.jpg", {
        type: "image/jpeg",
      });

      Object.defineProperty(fileInput, "files", { value: [file] });
      fireEvent.change(fileInput);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateBill", () => {
    test("should call store.bills().update and navigate", async () => {
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      newBill.billId = "1234";

      const billData = { foo: "bar" };
      await newBill.updateBill(billData);

      expect(billsMock.update).toHaveBeenCalledWith({
        data: JSON.stringify(billData),
        selector: "1234",
      });
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});
