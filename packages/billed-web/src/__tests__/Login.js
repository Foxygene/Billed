/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

const setupLoginInstance = ({
  isAdmin = false,
  withStore = true,
  loginFails = false,
} = {}) => {
  document.body.innerHTML = LoginUI();

  const emailInput = screen.getByTestId(
    isAdmin ? "admin-email-input" : "employee-email-input"
  );
  const passwordInput = screen.getByTestId(
    isAdmin ? "admin-password-input" : "employee-password-input"
  );
  fireEvent.change(emailInput, { target: { value: "test@email.com" } });
  fireEvent.change(passwordInput, { target: { value: "password" } });

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    },
    writable: true,
  });

  let usersCreateMock = jest.fn(() => Promise.resolve());
  let store;
  if (withStore) {
    store = {
      login: jest.fn(() =>
        loginFails
          ? Promise.reject("login failed")
          : Promise.resolve({ jwt: "token" })
      ),
      users: jest.fn(() => ({
        create: usersCreateMock,
      })),
    };
  }

  const loginInstance = new Login({
    document,
    localStorage: window.localStorage,
    onNavigate,
    PREVIOUS_LOCATION: "",
    store,
  });

  return { loginInstance, emailInput, passwordInput, store, usersCreateMock };
};

describe("Login.js - Unit Test Coverage Boost", () => {
  test("should successfully call login and set token", async () => {
    const { loginInstance, store } = setupLoginInstance();

    const form = screen.getByTestId("form-employee");
    fireEvent.submit(form);

    await new Promise(process.nextTick);

    expect(store.login).toHaveBeenCalledWith(
      JSON.stringify({ email: "test@email.com", password: "password" })
    );
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "user",
      expect.any(String)
    );
  });

  test("should try to create user on login failure (employee)", async () => {
    const { loginInstance } = setupLoginInstance({ loginFails: true });
    loginInstance.createUser = jest.fn(() => Promise.resolve());

    const form = screen.getByTestId("form-employee");
    fireEvent.submit(form);
    await new Promise(process.nextTick);

    expect(loginInstance.createUser).toHaveBeenCalled();
  });

  test("should try to create user on login failure (admin)", async () => {
    const { loginInstance } = setupLoginInstance({
      isAdmin: true,
      loginFails: true,
    });
    loginInstance.createUser = jest.fn(() => Promise.resolve());

    const form = screen.getByTestId("form-admin");
    fireEvent.submit(form);
    await new Promise(process.nextTick);

    expect(loginInstance.createUser).toHaveBeenCalled();
  });

  test("createUser should do nothing if store is missing", async () => {
    const { loginInstance } = setupLoginInstance({ withStore: false });
    loginInstance.store = null;
    const result = await loginInstance.createUser({});
    expect(result === undefined || result === null).toBe(true);
  });

  test("should initialize correctly for admin form", () => {
    document.body.innerHTML = LoginUI();
    const emailInput = screen.getByTestId("admin-email-input");
    const passwordInput = screen.getByTestId("admin-password-input");
    const form = screen.getByTestId("form-admin");

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(form).toBeTruthy();
  });

  test("should initialize correctly for employee form", () => {
    document.body.innerHTML = LoginUI();
    const emailInput = screen.getByTestId("employee-email-input");
    const passwordInput = screen.getByTestId("employee-password-input");
    const form = screen.getByTestId("form-employee");

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(form).toBeTruthy();
  });
});
