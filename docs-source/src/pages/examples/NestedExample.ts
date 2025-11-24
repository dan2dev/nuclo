import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type User = {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
};

let users: User[] = [
  { id: 1, name: "Alice", avatar: "A", bio: "Software developer", followers: 142 },
  { id: 2, name: "Bob", avatar: "B", bio: "Designer", followers: 89 },
  { id: 3, name: "Charlie", avatar: "C", bio: "Product manager", followers: 234 },
];

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const gridStyle = cn(
  display("grid")
    .gap("16px")
);

const userCardStyle = cn(
  padding("20px")
    .backgroundColor(colors.bgLight)
    .borderRadius("12px")
    .transition("all 0.2s")
);

const avatarStyle = cn(
  width("48px")
    .height("48px")
    .borderRadius("50%")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .fontSize("20px")
    .fontWeight("600")
    .marginBottom("12px")
);

const nameStyle = cn(
  fontSize("16px")
    .fontWeight("600")
    .color(colors.text)
    .marginBottom("4px")
);

const bioStyle = cn(
  fontSize("14px")
    .color(colors.textMuted)
    .marginBottom("12px")
);

const followersStyle = cn(
  fontSize("13px")
    .color(colors.textDim)
    .marginBottom("12px")
);

const btnStyle = cn(
  padding("8px 16px")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .border("none")
    .borderRadius("6px")
    .fontSize("13px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s")
);

function handleFollow(id: number) {
  const user = users.find(u => u.id === id);
  if (user) {
    user.followers++;
    update();
  }
}

function UserCard(user: User) {
  return div(
    userCardStyle,
    on("mouseenter", (e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgCard;
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    }),
    on("mouseleave", (e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgLight;
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    }),
    div(avatarStyle, user.avatar),
    h4(nameStyle, user.name),
    p(bioStyle, user.bio),
    p(followersStyle, () => `${user.followers} followers`),
    button(
      btnStyle,
      "Follow",
      on("click", () => handleFollow(user.id)),
      on("mouseenter", (e) => {
        (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
      }),
      on("mouseleave", (e) => {
        (e.target as HTMLElement).style.backgroundColor = colors.primary;
      })
    )
  );
}

function UserGrid(userList: User[]) {
  return div(
    gridStyle,
    { style: { gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" } },
    list(() => userList, user => UserCard(user))
  );
}

function LiveNested() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "User Directory"),
    p(cn(fontSize("14px").color(colors.textMuted).marginBottom("20px")), "This example shows reusable component functions."),
    UserGrid(users)
  );
}

export function NestedExamplePage() {
  const example = examplesContent.find(e => e.id === "nested")!;

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
    LiveNested(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
