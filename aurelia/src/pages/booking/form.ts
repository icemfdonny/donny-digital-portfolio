export type DetailsForm = {
  name: string;
  phone: string;
  email: string;
  note: string;
  firstVisit: boolean;
  patchTest: "" | "done" | "needed";
  code: string;
  createAccount: boolean;
  password: string;
  terms: boolean;
  marketing: boolean;
};

export const emptyForm: DetailsForm = {
  name: "",
  phone: "",
  email: "",
  note: "",
  firstVisit: false,
  patchTest: "",
  code: "",
  createAccount: true,
  password: "",
  terms: false,
  marketing: false,
};

export type FormErrors = Partial<Record<keyof DetailsForm, string>>;
