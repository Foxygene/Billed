/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /(([1-3]{1})?([0-9]{1})(\ )(Jan|Fév|Mar|Avr|Mai|Jui|Jui|Aoû|Sep|Oct|Nov|Déc).(\ )([0-9]{2}))/g
        )
        .map((a) => a.innerHTML);
      const chrono = (a, b) => (a > b ? -1 : 1);
      const datesSorted = [...dates].sort(chrono);
      expect(dates).toEqual(datesSorted);
    });

    test('Then clicking on "New Bill" should navigate to NewBill page', () => {
      document.body.innerHTML = `<button data-testid="btn-new-bill">New Bill</button>`;
      const onNavigate = jest.fn();
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      newBillBtn.click();

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then clicking on eye icon should open modal with correct image", () => {
      document.body.innerHTML = `
        <div data-testid="icon-eye" data-bill-url="https://url-to-proof.com/image.jpg"></div>
        <div id="modaleFile" style="width: 600px">
          <div class="modal-body"></div>
        </div>`;
      const modalMock = jest.fn();
      $.fn.modal = modalMock;

      const billsInstance = new Bills({
        document,
        onNavigate: () => {},
        store: null,
        localStorage: window.localStorage,
      });
      const eyeIcon = screen.getByTestId("icon-eye");

      billsInstance.handleClickIconEye(eyeIcon);

      const modalBody = document.querySelector(".modal-body").innerHTML;
      expect(modalBody).toContain("img");
      expect(modalBody).toContain("https://url-to-proof.com/image.jpg");
      expect(modalMock).toHaveBeenCalledWith("show");
    });

    test("Then getBills should return formatted bills if store exists", async () => {
      const mockBills = [
        { id: "1", date: "2023-04-12", status: "pending" },
        { id: "2", date: "2023-03-05", status: "accepted" },
      ];

      const storeMock = {
        bills: () => ({
          list: () => Promise.resolve(mockBills),
        }),
      };

      const billsInstance = new Bills({
        document,
        onNavigate: () => {},
        store: storeMock,
        localStorage: window.localStorage,
      });
      const billsList = await billsInstance.getBills();

      expect(billsList).toHaveLength(2);
      expect(billsList[0].status).toBe("En attente");
      expect(billsList[1].status).toBe("Accepté");
    });

    test("Then getBills should handle corrupted data and log error", async () => {
      const corruptedBills = [
        { id: "1", date: "invalid-date", status: "pending" },
      ];
      const storeMock = {
        bills: () => ({
          list: () => Promise.resolve(corruptedBills),
        }),
      };

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const billsInstance = new Bills({
        document,
        onNavigate: () => {},
        store: storeMock,
        localStorage: window.localStorage,
      });
      const billsList = await billsInstance.getBills();

      expect(consoleSpy).toHaveBeenCalled();
      expect(billsList[0].date).toBe("invalid-date");

      consoleSpy.mockRestore();
    });
  });
});
