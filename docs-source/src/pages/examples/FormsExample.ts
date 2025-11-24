import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

let formData: FormData = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

let errors: Errors = {};
let isSubmitting = false;
let submitStatus: "idle" | "success" | "error" = "idle";

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const formFieldStyle = cn(
  marginBottom("20px")
);

const labelStyle = cn(
  display("block")
    .fontSize("14px")
    .fontWeight("500")
    .color(colors.text)
    .marginBottom("8px")
);

const inputStyle = cn(
  width("100%")
    .padding("12px 14px")
    .backgroundColor(colors.bgLight)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .outline("none")
    .transition("border-color 0.2s")
);

const inputErrorStyle = {
  borderColor: "#ef4444",
};

const errorTextStyle = cn(
  fontSize("12px")
    .color("#ef4444")
    .marginTop("6px")
);

const btnStyle = cn(
  width("100%")
    .padding("14px 20px")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .border("none")
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s")
    .marginTop("8px")
);

const btnDisabledStyle = {
  backgroundColor: colors.bgLight,
  color: colors.textDim,
  cursor: "not-allowed",
};

const successStyle = cn(
  padding("16px")
    .backgroundColor("rgba(132, 204, 22, 0.1)")
    .borderRadius("8px")
    .color(colors.primary)
    .marginBottom("20px")
    .textAlign("center")
);

function validateForm(): boolean {
  errors = {};

  if (formData.username.length < 3) {
    errors.username = "Username must be at least 3 characters";
  }

  if (!formData.email.includes("@")) {
    errors.email = "Please enter a valid email";
  }

  if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return Object.keys(errors).length === 0;
}

async function handleSubmit(e: Event) {
  e.preventDefault();

  if (!validateForm()) {
    update();
    return;
  }

  isSubmitting = true;
  submitStatus = "idle";
  update();

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    submitStatus = "success";
    formData = { username: "", email: "", password: "", confirmPassword: "" };
  } catch {
    submitStatus = "error";
  }

  isSubmitting = false;
  update();
}

function FormField(
  fieldName: keyof FormData,
  labelText: string,
  inputType: string,
  placeholder: string
) {
  return div(
    formFieldStyle,
    label(labelStyle, labelText),
    input(
      inputStyle,
      {
        type: inputType,
        placeholder,
        value: () => formData[fieldName],
        disabled: () => isSubmitting,
        style: () => errors[fieldName] ? inputErrorStyle : {},
      },
      on("input", (e) => {
        formData[fieldName] = (e.target as HTMLInputElement).value;
        delete errors[fieldName];
        update();
      }),
      on("focus", (e) => {
        if (!errors[fieldName]) {
          (e.target as HTMLElement).style.borderColor = colors.primary;
        }
      }),
      on("blur", (e) => {
        if (!errors[fieldName]) {
          (e.target as HTMLElement).style.borderColor = colors.border;
        }
      })
    ),
    when(
      () => !!errors[fieldName],
      span(errorTextStyle, () => errors[fieldName])
    )
  );
}

function LiveForms() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Sign Up"),
    when(
      () => submitStatus === "success",
      div(successStyle, "Account created successfully!")
    ),
    form(
      on("submit", handleSubmit),
      FormField("username", "Username", "text", "Enter username"),
      FormField("email", "Email", "email", "Enter email"),
      FormField("password", "Password", "password", "Enter password"),
      FormField("confirmPassword", "Confirm Password", "password", "Confirm password"),
      button(
        btnStyle,
        {
          type: "submit",
          disabled: () => isSubmitting,
          style: () => isSubmitting ? btnDisabledStyle : {},
        },
        () => isSubmitting ? "Creating account..." : "Sign Up",
        on("mouseenter", (e) => {
          if (!isSubmitting) {
            (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
          }
        }),
        on("mouseleave", (e) => {
          if (!isSubmitting) {
            (e.target as HTMLElement).style.backgroundColor = colors.primary;
          }
        })
      )
    )
  );
}

export function FormsExamplePage() {
  const example = examplesContent.find(e => e.id === "forms")!;

  return div(
    s.pageContent,
    a(
      cn(color(colors.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),
      "← Back to Examples",
      on("click", (e) => {
        e.preventDefault();
        setRoute("examples");
      })
    ),
    h1(s.pageTitle, example.title),
    p(s.pageSubtitle, example.description),
    LiveForms(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
