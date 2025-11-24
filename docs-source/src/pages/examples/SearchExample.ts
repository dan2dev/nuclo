import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "User" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", role: "Admin" },
  { id: 5, name: "Eve Anderson", email: "eve@example.com", role: "User" },
];

let searchQuery = "";
let selectedRole = "all";

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const inputStyle = cn(
  padding("10px 14px")
    .backgroundColor(colors.bgLight)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .outline("none")
    .flex("1")
    .minWidth("200px")
    .transition("border-color 0.2s")
);

const selectStyle = cn(
  padding("10px 14px")
    .backgroundColor(colors.bgLight)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .outline("none")
    .cursor("pointer")
    .transition("border-color 0.2s")
);

const userCardStyle = cn(
  padding("16px")
    .backgroundColor(colors.bgLight)
    .borderRadius("10px")
    .marginBottom("12px")
    .transition("all 0.2s")
);

const roleBadgeStyle = cn(
  display("inline-block")
    .padding("4px 10px")
    .borderRadius("20px")
    .fontSize("12px")
    .fontWeight("600")
);

function filteredUsers() {
  const query = searchQuery.toLowerCase();
  return users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesRole =
      selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
}

function LiveSearch() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "User Directory"),
    div(
      s.flex,
      s.gap16,
      s.mb24,
      cn(flexWrap("wrap")),
      input(
        inputStyle,
        {
          type: "search",
          placeholder: "Search by name or email...",
          value: () => searchQuery,
        },
        on("input", (e) => {
          searchQuery = (e.target as HTMLInputElement).value;
          update();
        }),
        on("focus", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.primary;
        }),
        on("blur", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.border;
        })
      ),
      select(
        selectStyle,
        { value: () => selectedRole },
        on("change", (e) => {
          selectedRole = (e.target as HTMLSelectElement).value;
          update();
        }),
        on("focus", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.primary;
        }),
        on("blur", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.border;
        }),
        option({ value: "all" }, "All Roles"),
        option({ value: "Admin" }, "Admins"),
        option({ value: "User" }, "Users")
      )
    ),
    p(
      cn(fontSize("13px").color(colors.textDim).marginBottom("16px")),
      () => {
        const count = filteredUsers().length;
        return `Showing ${count} user${count !== 1 ? "s" : ""}`;
      }
    ),
    when(
      () => filteredUsers().length > 0,
      div(
        list(() => filteredUsers(), user =>
          div(
            userCardStyle,
            on("mouseenter", (e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgCard;
            }),
            on("mouseleave", (e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgLight;
            }),
            div(
              s.flexBetween,
              div(
                h4(cn(fontSize("15px").fontWeight("600").color(colors.text).marginBottom("4px")), user.name),
                p(cn(fontSize("13px").color(colors.textMuted).margin("0")), user.email)
              ),
              span(
                roleBadgeStyle,
                {
                  style: {
                    backgroundColor: user.role === "Admin" ? "rgba(132, 204, 22, 0.15)" : "rgba(100, 116, 139, 0.15)",
                    color: user.role === "Admin" ? colors.primary : colors.textMuted,
                  }
                },
                user.role
              )
            )
          )
        )
      )
    ).else(
      div(
        cn(textAlign("center").padding("32px").color(colors.textDim)),
        () => searchQuery
          ? `No users found matching "${searchQuery}"`
          : "No users found"
      )
    )
  );
}

export function SearchExamplePage() {
  const example = examplesContent.find(e => e.id === "search")!;

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
    LiveSearch(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
