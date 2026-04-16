/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect } from "vitest";
import {
  renderToString,
  renderManyToString,
  renderToStringWithContainer,
} from "../../src/ssr/renderToString";
import "../../src/index";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Blog post page
// ─────────────────────────────────────────────────────────────────────────────
describe("Blog post page", () => {
  const navLinks = ["Home", "Blog", "About", "Contact"];
  const relatedPosts = [
    {
      title: "Getting Started with TypeScript",
      slug: "getting-started-typescript",
    },
    {
      title: "Advanced Patterns in JavaScript",
      slug: "advanced-patterns-javascript",
    },
    {
      title: "Building Scalable APIs with Node.js",
      slug: "scalable-apis-nodejs",
    },
    { title: "CSS Grid Layout Mastery", slug: "css-grid-layout-mastery" },
    { title: "Testing Modern Web Apps", slug: "testing-modern-web-apps" },
  ];

  const html = renderToString(
    div(
      { className: "blog-page" },
      header(
        { className: "site-header" },
        div({ className: "logo" }, a({ href: "/" }, "Nuclo Blog")),
        nav(
          { className: "main-nav" },
          ul(
            ...navLinks.map((link) =>
              li(a({ href: `/${link.toLowerCase()}` }, link)),
            ),
          ),
        ),
      ),
      main(
        { className: "main-content" },
        article(
          { className: "blog-article" },
          h1(
            { className: "article-title" },
            "Understanding Reactive UI Frameworks in 2024",
          ),
          div(
            { className: "article-meta" },
            span({ className: "article-date" }, "March 15, 2024"),
            span({ className: "article-author" }, "By Jane Doe"),
            span({ className: "article-category" }, "Web Development"),
          ),
          p(
            "Modern web development has evolved dramatically over the past decade. Developers now have access to a rich ecosystem of tools and frameworks that simplify building complex user interfaces.",
          ),
          p(
            "In this article, we explore the core principles behind reactive UI frameworks and how they manage state, rendering, and user interactions.",
          ),
          p(
            "Understanding the virtual DOM, fine-grained reactivity, and compile-time optimizations are key to choosing the right tool for your project.",
          ),
          blockquote(
            { className: "article-quote" },
            p(
              "The best framework is the one that gets out of your way and lets you build great software.",
            ),
            cite("— Rich Harris, Creator of Svelte"),
          ),
          p(
            "Each framework has trade-offs. React favors flexibility, Vue balances convention and flexibility, and Svelte compiles away the framework overhead.",
          ),
          pre(
            code(
              { className: "language-javascript" },
              `function reactiveCounter() {
  let count = 0;
  const button = document.createElement('button');
  button.textContent = count;
  button.addEventListener('click', () => {
    count++;
    button.textContent = count;
  });
  return button;
}`,
            ),
          ),
          figure(
            { className: "article-figure" },
            div({
              className: "figure-placeholder",
              style: { background: "#eee", height: "300px" },
            }),
            figcaption(
              "Figure 1: Comparison of rendering strategies across popular frameworks.",
            ),
          ),
        ),
        aside(
          { className: "sidebar" },
          h2("Related Posts"),
          ul(
            { className: "related-posts-list" },
            list(
              () => relatedPosts,
              (post) => li(a({ href: `/blog/${post.slug}` }, post.title)),
            ),
          ),
        ),
      ),
      footer(
        { className: "site-footer" },
        p("© 2024 Nuclo Blog. All rights reserved."),
      ),
    ),
  );

  it("renders the site header with logo", () => {
    expect(html).toContain("<header");
    expect(html).toContain("Nuclo Blog");
    expect(html).toContain('href="/"');
  });

  it("renders all navigation links", () => {
    expect(html).toContain(">Home<");
    expect(html).toContain(">Blog<");
    expect(html).toContain(">About<");
    expect(html).toContain(">Contact<");
    expect(html).toContain('href="/home"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/contact"');
  });

  it("renders the article title and meta information", () => {
    expect(html).toContain("Understanding Reactive UI Frameworks in 2024");
    expect(html).toContain("March 15, 2024");
    expect(html).toContain("By Jane Doe");
    expect(html).toContain("Web Development");
  });

  it("renders article body paragraphs", () => {
    expect(html).toContain("Modern web development has evolved dramatically");
    expect(html).toContain("core principles behind reactive UI frameworks");
    expect(html).toContain("virtual DOM, fine-grained reactivity");
  });

  it("renders the blockquote with cite", () => {
    expect(html).toContain("<blockquote");
    expect(html).toContain(
      "gets out of your way and lets you build great software",
    );
    expect(html).toContain("<cite>");
    expect(html).toContain("Rich Harris, Creator of Svelte");
  });

  it("renders the code block", () => {
    expect(html).toContain("<pre>");
    expect(html).toContain("<code");
    expect(html).toContain("reactiveCounter");
    expect(html).toContain('class="language-javascript"');
  });

  it("renders the figure with figcaption", () => {
    expect(html).toContain("<figure");
    expect(html).toContain("<figcaption>");
    expect(html).toContain("Figure 1: Comparison of rendering strategies");
  });

  it("renders all 5 related posts in the aside using list()", () => {
    expect(html).toContain("Related Posts");
    expect(html).toContain("Getting Started with TypeScript");
    expect(html).toContain("Advanced Patterns in JavaScript");
    expect(html).toContain("Building Scalable APIs with Node.js");
    expect(html).toContain("CSS Grid Layout Mastery");
    expect(html).toContain("Testing Modern Web Apps");
    expect(html).toContain('href="/blog/getting-started-typescript"');
    expect(html).toContain('href="/blog/testing-modern-web-apps"');
  });

  it("renders the footer with copyright text", () => {
    expect(html).toContain("<footer");
    expect(html).toContain("© 2024 Nuclo Blog. All rights reserved.");
  });

  it("renders semantic HTML structure (article, main, aside)", () => {
    expect(html).toContain("<article");
    expect(html).toContain("<main");
    expect(html).toContain("<aside");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. E-commerce product page
// ─────────────────────────────────────────────────────────────────────────────
describe("E-commerce product page", () => {
  const isInStock = true;
  const colors = [
    "Midnight Black",
    "Pearl White",
    "Ocean Blue",
    "Forest Green",
  ];
  const reviews = [
    {
      author: "Alice M.",
      rating: 5,
      comment: "Absolutely love this product! Best purchase of the year.",
    },
    {
      author: "Bob T.",
      rating: 4,
      comment: "Great quality, fast shipping. Would definitely recommend.",
    },
    {
      author: "Clara S.",
      rating: 5,
      comment: "Exceeded my expectations. The build quality is outstanding.",
    },
  ];

  const html = renderToString(
    div(
      { className: "product-page" },
      div(
        { className: "product-hero" },
        div(
          { className: "product-gallery" },
          img({
            src: "/images/product-main.jpg",
            alt: "Sony WH-1000XM5 Headphones",
          }),
        ),
        div(
          { className: "product-info" },
          h1(
            { className: "product-name" },
            "Sony WH-1000XM5 Wireless Headphones",
          ),
          small({ className: "product-brand" }, "by Sony"),
          div(
            { className: "product-pricing" },
            span({ className: "product-price" }, "$279.99"),
            span(
              {
                className: "original-price",
                style: { textDecoration: "line-through" },
              },
              "$349.99",
            ),
            span({ className: "savings-badge" }, "Save $70"),
          ),
          div(
            { className: "availability" },
            when(
              () => isInStock,
              span({ className: "in-stock" }, "In Stock"),
            ).else(span({ className: "out-of-stock" }, "Out of Stock")),
          ),
          div(
            { className: "color-selector" },
            p("Choose Color:"),
            div(
              { className: "color-options" },
              list(
                () => colors,
                (color) =>
                  button(
                    { className: "color-option", "data-color": color },
                    color,
                  ),
              ),
            ),
          ),
          div(
            { className: "size-selector" },
            label({ htmlFor: "size-select" }, "Size:"),
            select(
              { id: "size-select", name: "size" },
              option({ value: "S" }, "Small"),
              option({ value: "M" }, "Medium"),
              option({ value: "L", selected: true }, "Large"),
              option({ value: "XL" }, "Extra Large"),
            ),
          ),
          div(
            { className: "add-to-cart" },
            when(
              () => isInStock,
              button(
                { className: "btn-add-to-cart", type: "button" },
                "Add to Cart",
              ),
            ).else(
              button(
                { className: "btn-notify", type: "button", disabled: true },
                "Notify Me When Available",
              ),
            ),
          ),
          div(
            { className: "product-features" },
            h2("Key Features"),
            ul(
              li("Industry-leading noise cancellation"),
              li("30-hour battery life with quick charging"),
              li("Multipoint connection for up to 2 devices"),
              li("Speak-to-Chat technology"),
              li("Adaptive Sound Control"),
            ),
          ),
        ),
      ),
      section(
        { className: "product-reviews" },
        h2("Customer Reviews"),
        list(
          () => reviews,
          (review) =>
            article(
              { className: "review-card" },
              div(
                { className: "review-header" },
                span({ className: "review-author" }, review.author),
                span(
                  { className: "review-rating" },
                  `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`,
                ),
              ),
              p({ className: "review-comment" }, review.comment),
            ),
        ),
      ),
    ),
  );

  it("renders the product name and brand", () => {
    expect(html).toContain("Sony WH-1000XM5 Wireless Headphones");
    expect(html).toContain("by Sony");
  });

  it("renders the product pricing", () => {
    expect(html).toContain("$279.99");
    expect(html).toContain("$349.99");
    expect(html).toContain("Save $70");
  });

  it("renders the in-stock status via when()", () => {
    expect(html).toContain("In Stock");
    expect(html).not.toContain("Out of Stock");
  });

  it("renders all 4 color options via list()", () => {
    expect(html).toContain("Midnight Black");
    expect(html).toContain("Pearl White");
    expect(html).toContain("Ocean Blue");
    expect(html).toContain("Forest Green");
  });

  it("renders the size select with 4 options", () => {
    expect(html).toContain("<select");
    expect(html).toContain(">Small<");
    expect(html).toContain(">Medium<");
    expect(html).toContain(">Large<");
    expect(html).toContain(">Extra Large<");
    expect(html).toContain('value="S"');
    expect(html).toContain('value="XL"');
  });

  it("renders the add-to-cart button (not the notify button)", () => {
    expect(html).toContain("Add to Cart");
    expect(html).not.toContain("Notify Me When Available");
  });

  it("renders the product features list", () => {
    expect(html).toContain("Industry-leading noise cancellation");
    expect(html).toContain("30-hour battery life with quick charging");
    expect(html).toContain("Adaptive Sound Control");
  });

  it("renders all 3 customer reviews", () => {
    expect(html).toContain("Alice M.");
    expect(html).toContain("Bob T.");
    expect(html).toContain("Clara S.");
    expect(html).toContain(
      "Absolutely love this product! Best purchase of the year.",
    );
    expect(html).toContain(
      "Great quality, fast shipping. Would definitely recommend.",
    );
    expect(html).toContain(
      "Exceeded my expectations. The build quality is outstanding.",
    );
  });

  it("renders the product image as a void element", () => {
    expect(html).toContain("<img");
    expect(html).toContain('src="/images/product-main.jpg"');
    expect(html).toContain('alt="Sony WH-1000XM5 Headphones"');
  });

  it("renders style attribute for original price", () => {
    expect(html).toContain("text-decoration: line-through;");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Admin dashboard
// ─────────────────────────────────────────────────────────────────────────────
describe("Admin dashboard", () => {
  const sidebarItems = [
    { label: "Dashboard", href: "/admin", icon: "grid" },
    { label: "Users", href: "/admin/users", icon: "users" },
    { label: "Orders", href: "/admin/orders", icon: "shopping-cart" },
    { label: "Products", href: "/admin/products", icon: "box" },
    { label: "Analytics", href: "/admin/analytics", icon: "bar-chart" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
  ];

  const stats = [
    { label: "Total Users", value: "12,847", trend: "+5.2%" },
    { label: "Revenue", value: "$84,200", trend: "+12.8%" },
    { label: "Orders", value: "1,459", trend: "+3.1%" },
    { label: "Conversion", value: "3.2%", trend: "-0.4%" },
  ];

  const orders = [
    {
      id: "ORD-10421",
      customer: "James Wilson",
      product: 'MacBook Pro 14"',
      status: "completed",
      amount: "$1,999.00",
    },
    {
      id: "ORD-10422",
      customer: "Sarah Connor",
      product: "iPhone 15 Pro",
      status: "pending",
      amount: "$999.00",
    },
    {
      id: "ORD-10423",
      customer: "Michael Scott",
      product: "iPad Air",
      status: "processing",
      amount: "$749.00",
    },
    {
      id: "ORD-10424",
      customer: "Emily Clarke",
      product: "AirPods Pro",
      status: "completed",
      amount: "$249.00",
    },
    {
      id: "ORD-10425",
      customer: "Robert Chen",
      product: "Apple Watch Ultra",
      status: "cancelled",
      amount: "$799.00",
    },
  ];

  const html = renderToString(
    div(
      { className: "admin-layout" },
      nav(
        { className: "admin-sidebar" },
        div({ className: "sidebar-logo" }, "Admin Panel"),
        ul(
          { className: "sidebar-menu" },
          list(
            () => sidebarItems,
            (item) =>
              li(
                { className: "sidebar-item" },
                a({ href: item.href, "data-icon": item.icon }, item.label),
              ),
          ),
        ),
      ),
      main(
        { className: "admin-main" },
        header(
          { className: "admin-header" },
          h1("Dashboard Overview"),
          div(
            { className: "header-actions" },
            button({ className: "btn-primary" }, "Export Report"),
            button({ className: "btn-secondary" }, "Add User"),
          ),
        ),
        section(
          { className: "stats-section" },
          h2("Key Metrics"),
          div(
            { className: "stats-grid" },
            list(
              () => stats,
              (stat) =>
                div(
                  { className: "stat-card" },
                  h3({ className: "stat-label" }, stat.label),
                  div({ className: "stat-value" }, stat.value),
                  span({ className: "stat-trend" }, stat.trend),
                ),
            ),
          ),
        ),
        section(
          { className: "orders-section" },
          h2("Recent Orders"),
          div(
            { className: "table-container" },
            table(
              { className: "orders-table" },
              thead(
                tr(
                  th("Order ID"),
                  th("Customer"),
                  th("Product"),
                  th("Status"),
                  th("Amount"),
                ),
              ),
              tbody(
                list(
                  () => orders,
                  (order) =>
                    tr(
                      { className: "order-row" },
                      td(order.id),
                      td(order.customer),
                      td(order.product),
                      td(
                        when(
                          () => order.status === "completed",
                          span(
                            { className: "badge badge-success" },
                            "Completed",
                          ),
                        ).else(
                          when(
                            () => order.status === "pending",
                            span(
                              { className: "badge badge-warning" },
                              "Pending",
                            ),
                          ).else(
                            when(
                              () => order.status === "cancelled",
                              span(
                                { className: "badge badge-danger" },
                                "Cancelled",
                              ),
                            ).else(
                              span(
                                { className: "badge badge-info" },
                                "Processing",
                              ),
                            ),
                          ),
                        ),
                      ),
                      td(order.amount),
                    ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  it("renders the sidebar with 6 menu items via list()", () => {
    expect(html).toContain("Dashboard");
    expect(html).toContain("Users");
    expect(html).toContain("Orders");
    expect(html).toContain("Products");
    expect(html).toContain("Analytics");
    expect(html).toContain("Settings");
  });

  it("renders sidebar links with correct hrefs", () => {
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/users"');
    expect(html).toContain('href="/admin/orders"');
    expect(html).toContain('href="/admin/settings"');
  });

  it("renders all 4 stat card values", () => {
    expect(html).toContain("Total Users");
    expect(html).toContain("12,847");
    expect(html).toContain("Revenue");
    expect(html).toContain("$84,200");
    expect(html).toContain("1,459");
    expect(html).toContain("Conversion");
    expect(html).toContain("3.2%");
  });

  it("renders the orders table with all 5 column headers", () => {
    expect(html).toContain("<thead>");
    expect(html).toContain(">Order ID<");
    expect(html).toContain(">Customer<");
    expect(html).toContain(">Product<");
    expect(html).toContain(">Status<");
    expect(html).toContain(">Amount<");
  });

  it("renders all 5 order row IDs", () => {
    expect(html).toContain("ORD-10421");
    expect(html).toContain("ORD-10422");
    expect(html).toContain("ORD-10423");
    expect(html).toContain("ORD-10424");
    expect(html).toContain("ORD-10425");
  });

  it("renders customer names in the table", () => {
    expect(html).toContain("James Wilson");
    expect(html).toContain("Sarah Connor");
    expect(html).toContain("Michael Scott");
    expect(html).toContain("Emily Clarke");
    expect(html).toContain("Robert Chen");
  });

  it("renders status badges conditionally via when()", () => {
    expect(html).toContain("Completed");
    expect(html).toContain("Pending");
    expect(html).toContain("Processing");
    expect(html).toContain("Cancelled");
  });

  it("renders order amounts", () => {
    expect(html).toContain("$1,999.00");
    expect(html).toContain("$999.00");
    expect(html).toContain("$749.00");
    expect(html).toContain("$249.00");
    expect(html).toContain("$799.00");
  });

  it("renders the table body with tbody", () => {
    expect(html).toContain("<tbody>");
    expect(html).toContain("</tbody>");
    expect(html).toContain("<tr");
    expect(html).toContain("<td>");
  });

  it("renders the header action buttons", () => {
    expect(html).toContain("Export Report");
    expect(html).toContain("Add User");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Multi-section landing page
// ─────────────────────────────────────────────────────────────────────────────
describe("Multi-section landing page", () => {
  const features = [
    {
      title: "Lightning Fast",
      description:
        "Build apps that load in milliseconds with our optimized runtime.",
    },
    {
      title: "Type Safe",
      description:
        "Full TypeScript support out of the box with zero configuration.",
    },
    {
      title: "Reactive",
      description: "Fine-grained reactivity ensures minimal re-renders.",
    },
    {
      title: "SSR Ready",
      description:
        "Server-side rendering support for better SEO and performance.",
    },
    {
      title: "Tree Shakeable",
      description:
        "Only ship the code you use with automatic dead-code elimination.",
    },
    {
      title: "Zero Dependencies",
      description:
        "No external runtime dependencies for the smallest bundle size.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0/mo",
      features: ["5 projects", "Community support", "Basic analytics"],
      cta: "Get Started",
    },
    {
      name: "Pro",
      price: "$29/mo",
      features: [
        "Unlimited projects",
        "Priority support",
        "Advanced analytics",
        "Custom domains",
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Everything in Pro",
        "Dedicated support",
        "SLA guarantee",
        "Custom integrations",
      ],
      cta: "Contact Sales",
    },
  ];

  const testimonials = [
    {
      quote:
        "Nuclo transformed how we build our frontend. The performance gains were immediate and impressive.",
      author: "David Kim",
      role: "CTO at TechStartup",
    },
    {
      quote:
        "The developer experience is second to none. Our team was productive from day one.",
      author: "Maria Garcia",
      role: "Lead Engineer at DevCorp",
    },
    {
      quote:
        "We migrated our legacy app to Nuclo in two weeks and cut our bundle size by 60%.",
      author: "Tom Bradley",
      role: "Senior Developer at WebAgency",
    },
    {
      quote:
        "SSR support made our SEO scores skyrocket. Highly recommended for any serious project.",
      author: "Lisa Zhang",
      role: "Frontend Architect at ScaleUp",
    },
  ];

  const faqs = [
    {
      q: "What is Nuclo?",
      a: "Nuclo is a lightweight imperative DOM framework for building reactive user interfaces.",
    },
    {
      q: "Does Nuclo support TypeScript?",
      a: "Yes, Nuclo is written in TypeScript and provides full type definitions.",
    },
    {
      q: "Can I use Nuclo with SSR?",
      a: "Absolutely! Nuclo has built-in SSR support via renderToString.",
    },
    {
      q: "Is Nuclo production-ready?",
      a: "Yes, Nuclo is used in production by many companies worldwide.",
    },
    {
      q: "How does Nuclo compare to React?",
      a: "Nuclo is significantly smaller and uses an imperative model that avoids virtual DOM overhead.",
    },
  ];

  const footerColumns = [
    {
      heading: "Product",
      links: ["Features", "Pricing", "Changelog", "Roadmap"],
    },
    { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
    {
      heading: "Resources",
      links: ["Documentation", "API Reference", "Community", "Support"],
    },
  ];

  const currentPlan = "pro";

  const html = renderToString(
    div(
      { className: "landing-page" },
      // Hero
      section(
        { id: "hero", className: "hero-section" },
        h1({ className: "hero-title" }, "Build Fast. Ship Faster."),
        p(
          { className: "hero-subtitle" },
          "The lightweight framework that doesn't get in your way. Build reactive UIs with zero overhead.",
        ),
        div(
          { className: "hero-ctas" },
          a(
            { href: "/get-started", className: "btn btn-primary" },
            "Get Started Free",
          ),
          a({ href: "/docs", className: "btn btn-secondary" }, "Read the Docs"),
        ),
      ),
      // Features
      section(
        { id: "features", className: "features-section" },
        h2({ className: "section-title" }, "Everything You Need"),
        div(
          { className: "features-grid" },
          list(
            () => features,
            (feature) =>
              div(
                { className: "feature-card" },
                div({ className: "feature-icon-placeholder" }),
                h3({ className: "feature-title" }, feature.title),
                p({ className: "feature-description" }, feature.description),
              ),
          ),
        ),
      ),
      // Pricing
      section(
        { id: "pricing", className: "pricing-section" },
        h2({ className: "section-title" }, "Simple, Transparent Pricing"),
        div(
          { className: "pricing-grid" },
          list(
            () => plans,
            (plan) =>
              div(
                {
                  className: `pricing-card${plan.name.toLowerCase() === currentPlan ? " pricing-card-featured" : ""}`,
                },
                when(
                  () => plan.name.toLowerCase() === currentPlan,
                  div({ className: "popular-badge" }, "Most Popular"),
                ).else(),
                h3({ className: "plan-name" }, plan.name),
                div({ className: "plan-price" }, plan.price),
                ul(
                  { className: "plan-features" },
                  list(
                    () => plan.features,
                    (feature) => li(feature),
                  ),
                ),
                a(
                  {
                    href: `/signup?plan=${plan.name.toLowerCase()}`,
                    className: "btn btn-plan-cta",
                  },
                  plan.cta,
                ),
              ),
          ),
        ),
      ),
      // Testimonials
      section(
        { id: "testimonials", className: "testimonials-section" },
        h2({ className: "section-title" }, "Loved by Developers"),
        div(
          { className: "testimonials-grid" },
          list(
            () => testimonials,
            (testimonial) =>
              blockquote(
                { className: "testimonial-card" },
                p({ className: "testimonial-quote" }, testimonial.quote),
                footer(
                  { className: "testimonial-attribution" },
                  strong(testimonial.author),
                  span({ className: "testimonial-role" }, testimonial.role),
                ),
              ),
          ),
        ),
      ),
      // FAQ
      section(
        { id: "faq", className: "faq-section" },
        h2({ className: "section-title" }, "Frequently Asked Questions"),
        dl(
          { className: "faq-list" },
          list(
            () => faqs,
            (faq) =>
              div(
                { className: "faq-item" },
                dt({ className: "faq-question" }, faq.q),
                when(() => true, dd({ className: "faq-answer" }, faq.a)).else(),
              ),
          ),
        ),
      ),
      // Footer
      footer(
        { className: "site-footer" },
        div(
          { className: "footer-columns" },
          list(
            () => footerColumns,
            (col) =>
              div(
                { className: "footer-column" },
                h4({ className: "footer-column-heading" }, col.heading),
                ul(
                  list(
                    () => col.links,
                    (link) =>
                      li(
                        a(
                          { href: `/${link.toLowerCase().replace(/ /g, "-")}` },
                          link,
                        ),
                      ),
                  ),
                ),
              ),
          ),
        ),
      ),
    ),
  );

  it("renders the hero section with h1 and subtitle", () => {
    expect(html).toContain("Build Fast. Ship Faster.");
    expect(html).toContain(
      "The lightweight framework that doesn't get in your way",
    );
  });

  it("renders two hero CTA buttons", () => {
    expect(html).toContain("Get Started Free");
    expect(html).toContain("Read the Docs");
    expect(html).toContain('href="/get-started"');
    expect(html).toContain('href="/docs"');
  });

  it("renders the features section header", () => {
    expect(html).toContain("Everything You Need");
  });

  it("renders all 6 feature cards via list()", () => {
    expect(html).toContain("Lightning Fast");
    expect(html).toContain("Type Safe");
    expect(html).toContain("Reactive");
    expect(html).toContain("SSR Ready");
    expect(html).toContain("Tree Shakeable");
    expect(html).toContain("Zero Dependencies");
  });

  it("renders feature descriptions", () => {
    expect(html).toContain("Build apps that load in milliseconds");
    expect(html).toContain(
      "Fine-grained reactivity ensures minimal re-renders",
    );
    expect(html).toContain("No external runtime dependencies");
  });

  it("renders all 3 pricing tier names", () => {
    expect(html).toContain(">Free<");
    expect(html).toContain(">Pro<");
    expect(html).toContain(">Enterprise<");
  });

  it("renders plan prices and CTA links", () => {
    expect(html).toContain("$0/mo");
    expect(html).toContain("$29/mo");
    expect(html).toContain("Custom");
    expect(html).toContain("Get Started");
    expect(html).toContain("Start Free Trial");
    expect(html).toContain("Contact Sales");
  });

  it("renders the Most Popular badge for the Pro plan via when()", () => {
    expect(html).toContain("Most Popular");
    expect(html).toContain("pricing-card-featured");
  });

  it("renders all 4 testimonials via list()", () => {
    expect(html).toContain("David Kim");
    expect(html).toContain("Maria Garcia");
    expect(html).toContain("Tom Bradley");
    expect(html).toContain("Lisa Zhang");
    expect(html).toContain("CTO at TechStartup");
    expect(html).toContain("Frontend Architect at ScaleUp");
  });

  it("renders testimonial quotes", () => {
    expect(html).toContain("Nuclo transformed how we build our frontend");
    expect(html).toContain("We migrated our legacy app to Nuclo in two weeks");
  });

  it("renders all 5 FAQ items with answers visible (when(true))", () => {
    expect(html).toContain("What is Nuclo?");
    expect(html).toContain("Does Nuclo support TypeScript?");
    expect(html).toContain("Can I use Nuclo with SSR?");
    expect(html).toContain("Is Nuclo production-ready?");
    expect(html).toContain("How does Nuclo compare to React?");
    expect(html).toContain("Nuclo is a lightweight imperative DOM framework");
    expect(html).toContain("Absolutely! Nuclo has built-in SSR support");
    expect(html).toContain("Nuclo is significantly smaller");
  });

  it("renders the footer with 3 column headings", () => {
    expect(html).toContain("Product");
    expect(html).toContain("Company");
    expect(html).toContain("Resources");
  });

  it("renders footer links in all columns", () => {
    expect(html).toContain("Changelog");
    expect(html).toContain("Careers");
    expect(html).toContain("Documentation");
    expect(html).toContain("API Reference");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Complex form
// ─────────────────────────────────────────────────────────────────────────────
describe("Complex form", () => {
  const preferences = [
    { id: "pref-newsletter", label: "Email Newsletter", value: "newsletter" },
    { id: "pref-updates", label: "Product Updates", value: "updates" },
    { id: "pref-offers", label: "Special Offers", value: "offers" },
    { id: "pref-webinars", label: "Webinar Invitations", value: "webinars" },
    { id: "pref-research", label: "User Research", value: "research" },
    { id: "pref-beta", label: "Beta Features", value: "beta" },
  ];

  const states = ["California", "New York", "Texas", "Florida", "Washington"];
  const plans = [
    { id: "plan-basic", value: "basic", label: "Basic - Free" },
    { id: "plan-pro", value: "pro", label: "Pro - $29/mo" },
    {
      id: "plan-enterprise",
      value: "enterprise",
      label: "Enterprise - Custom",
    },
  ];

  const hasError = false;
  const isSuccess = true;

  const html = renderToString(
    form(
      { action: "/register", method: "POST", className: "registration-form" },
      h1("Create Your Account"),
      fieldset(
        legend("Personal Information"),
        div(
          { className: "form-row" },
          div(
            { className: "form-group" },
            label({ htmlFor: "first-name" }, "First Name"),
            input({
              type: "text",
              id: "first-name",
              name: "firstName",
              placeholder: "John",
              required: true,
            }),
          ),
          div(
            { className: "form-group" },
            label({ htmlFor: "last-name" }, "Last Name"),
            input({
              type: "text",
              id: "last-name",
              name: "lastName",
              placeholder: "Doe",
              required: true,
            }),
          ),
        ),
        div(
          { className: "form-group" },
          label({ htmlFor: "email" }, "Email Address"),
          input({
            type: "email",
            id: "email",
            name: "email",
            placeholder: "john@example.com",
            required: true,
          }),
        ),
        div(
          { className: "form-group" },
          label({ htmlFor: "phone" }, "Phone Number"),
          input({
            type: "tel",
            id: "phone",
            name: "phone",
            placeholder: "+1 (555) 000-0000",
          }),
        ),
        div(
          { className: "form-group" },
          label({ htmlFor: "birthdate" }, "Date of Birth"),
          input({ type: "date", id: "birthdate", name: "birthdate" }),
        ),
      ),
      fieldset(
        legend("Address"),
        div(
          { className: "form-group" },
          label({ htmlFor: "street" }, "Street Address"),
          input({
            type: "text",
            id: "street",
            name: "street",
            placeholder: "123 Main St",
          }),
        ),
        div(
          { className: "form-row" },
          div(
            { className: "form-group" },
            label({ htmlFor: "city" }, "City"),
            input({
              type: "text",
              id: "city",
              name: "city",
              placeholder: "San Francisco",
            }),
          ),
          div(
            { className: "form-group" },
            label({ htmlFor: "state" }, "State"),
            select(
              { id: "state", name: "state" },
              list(
                () => states,
                (state) =>
                  option(
                    { value: state.toLowerCase().replace(/ /g, "-") },
                    state,
                  ),
              ),
            ),
          ),
        ),
        div(
          { className: "form-row" },
          div(
            { className: "form-group" },
            label({ htmlFor: "zip" }, "ZIP Code"),
            input({
              type: "text",
              id: "zip",
              name: "zip",
              placeholder: "94102",
            }),
          ),
          div(
            { className: "form-group" },
            label({ htmlFor: "country" }, "Country"),
            input({
              type: "text",
              id: "country",
              name: "country",
              value: "United States",
            }),
          ),
        ),
      ),
      fieldset(
        legend("Communication Preferences"),
        div(
          { className: "checkbox-group" },
          list(
            () => preferences,
            (pref) =>
              div(
                { className: "form-check" },
                input({
                  type: "checkbox",
                  id: pref.id,
                  name: "preferences",
                  value: pref.value,
                }),
                label({ htmlFor: pref.id }, pref.label),
              ),
          ),
        ),
      ),
      fieldset(
        legend("Select Your Plan"),
        div(
          { className: "radio-group" },
          list(
            () => plans,
            (plan) =>
              div(
                { className: "form-check" },
                input({
                  type: "radio",
                  id: plan.id,
                  name: "plan",
                  value: plan.value,
                }),
                label({ htmlFor: plan.id }, plan.label),
              ),
          ),
        ),
      ),
      div(
        { className: "form-group" },
        label({ htmlFor: "bio" }, "Short Bio"),
        textarea({
          id: "bio",
          name: "bio",
          rows: 4,
          placeholder: "Tell us about yourself...",
        }),
      ),
      when(
        () => hasError,
        div(
          { className: "alert alert-error" },
          "Please fix the errors above before submitting.",
        ),
      ).else(),
      when(
        () => isSuccess,
        div(
          { className: "alert alert-success" },
          "Your profile has been saved successfully!",
        ),
      ).else(),
      div(
        { className: "form-actions" },
        button(
          { type: "submit", className: "btn btn-primary" },
          "Create Account",
        ),
        button({ type: "button", className: "btn btn-secondary" }, "Cancel"),
      ),
    ),
  );

  it("renders the form with correct action and method", () => {
    expect(html).toContain("<form");
    expect(html).toContain('action="/register"');
    expect(html).toContain('method="POST"');
  });

  it("renders the form title", () => {
    expect(html).toContain("Create Your Account");
  });

  it("renders personal info fieldset with inputs", () => {
    expect(html).toContain("Personal Information");
    expect(html).toContain('type="text"');
    expect(html).toContain('name="firstName"');
    expect(html).toContain('name="lastName"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="tel"');
    expect(html).toContain('type="date"');
  });

  it("renders address section with 5 state options via list()", () => {
    expect(html).toContain("Address");
    expect(html).toContain(">California<");
    expect(html).toContain(">New York<");
    expect(html).toContain(">Texas<");
    expect(html).toContain(">Florida<");
    expect(html).toContain(">Washington<");
  });

  it("renders 6 preference checkboxes via list()", () => {
    expect(html).toContain("Email Newsletter");
    expect(html).toContain("Product Updates");
    expect(html).toContain("Special Offers");
    expect(html).toContain("Webinar Invitations");
    expect(html).toContain("User Research");
    expect(html).toContain("Beta Features");
  });

  it("renders checkbox inputs for each preference", () => {
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('value="newsletter"');
    expect(html).toContain('value="beta"');
  });

  it("renders 3 radio buttons for plan selection", () => {
    expect(html).toContain('type="radio"');
    expect(html).toContain("Basic - Free");
    expect(html).toContain("Pro - $29/mo");
    expect(html).toContain("Enterprise - Custom");
  });

  it("renders the textarea for bio", () => {
    expect(html).toContain("<textarea");
    expect(html).toContain('id="bio"');
    expect(html).toContain("Tell us about yourself...");
  });

  it("does not render the error message (when(false))", () => {
    expect(html).not.toContain(
      "Please fix the errors above before submitting.",
    );
  });

  it("renders the success message (when(true))", () => {
    expect(html).toContain("Your profile has been saved successfully!");
  });

  it("renders both form action buttons", () => {
    expect(html).toContain("Create Account");
    expect(html).toContain("Cancel");
    expect(html).toContain('type="submit"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reactive data table
// ─────────────────────────────────────────────────────────────────────────────
describe("Reactive data table", () => {
  const users = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "Admin",
      status: "Active",
      joined: "2023-01-15",
    },
    {
      id: 2,
      name: "Bob Martinez",
      email: "bob@example.com",
      role: "Editor",
      status: "Active",
      joined: "2023-02-20",
    },
    {
      id: 3,
      name: "Carol White",
      email: "carol@example.com",
      role: "Viewer",
      status: "Inactive",
      joined: "2023-03-10",
    },
    {
      id: 4,
      name: "Dan Brown",
      email: "dan@example.com",
      role: "Editor",
      status: "Active",
      joined: "2023-04-05",
    },
    {
      id: 5,
      name: "Eve Davis",
      email: "eve@example.com",
      role: "Admin",
      status: "Active",
      joined: "2023-05-22",
    },
    {
      id: 6,
      name: "Frank Miller",
      email: "frank@example.com",
      role: "Viewer",
      status: "Suspended",
      joined: "2023-06-18",
    },
    {
      id: 7,
      name: "Grace Wilson",
      email: "grace@example.com",
      role: "Editor",
      status: "Active",
      joined: "2023-07-30",
    },
    {
      id: 8,
      name: "Henry Moore",
      email: "henry@example.com",
      role: "Viewer",
      status: "Inactive",
      joined: "2023-08-14",
    },
    {
      id: 9,
      name: "Iris Taylor",
      email: "iris@example.com",
      role: "Admin",
      status: "Active",
      joined: "2023-09-03",
    },
    {
      id: 10,
      name: "Jake Anderson",
      email: "jake@example.com",
      role: "Editor",
      status: "Active",
      joined: "2023-10-27",
    },
  ];

  const html = renderToString(
    div(
      { className: "data-table-container" },
      div(
        { className: "table-toolbar" },
        h2(() => "User Management"),
        div(
          { className: "table-actions" },
          input({ type: "search", placeholder: () => "Search users..." }),
          button({ className: "btn-add" }, () => "Add New User"),
        ),
      ),
      table(
        { className: "data-table" },
        thead(
          tr(
            th(() => "ID"),
            th(() => "Name"),
            th(() => "Email"),
            th(() => "Role"),
            th(() => "Status"),
            th(() => "Joined"),
            th(() => "Actions"),
          ),
        ),
        tbody(
          list(
            () => users,
            (user, index) =>
              tr(
                {
                  className: `table-row${index % 2 === 0 ? " table-row-even" : " table-row-odd"}`,
                },
                td(() => String(user.id)),
                td(() => user.name),
                td(() => user.email),
                td(() => user.role),
                td(
                  when(
                    () => user.status === "Active",
                    span({ className: "status-badge status-active" }, "Active"),
                  ).else(
                    when(
                      () => user.status === "Suspended",
                      span(
                        { className: "status-badge status-suspended" },
                        "Suspended",
                      ),
                    ).else(
                      span(
                        { className: "status-badge status-inactive" },
                        "Inactive",
                      ),
                    ),
                  ),
                ),
                td(() => user.joined),
                td(
                  button(
                    { className: "btn-edit", "data-id": String(user.id) },
                    "Edit",
                  ),
                  button(
                    { className: "btn-delete", "data-id": String(user.id) },
                    "Delete",
                  ),
                ),
              ),
          ),
        ),
      ),
      div(
        { className: "table-pagination" },
        span(
          { className: "pagination-info" },
          () => "Showing 1-10 of 100 results",
        ),
        div(
          { className: "pagination-controls" },
          button({ className: "btn-prev", disabled: true }, "Previous"),
          span({ className: "page-indicator" }, "Page 1 of 10"),
          button({ className: "btn-next" }, "Next"),
        ),
      ),
    ),
  );

  it("renders the table heading via reactive function", () => {
    expect(html).toContain("User Management");
  });

  it("renders all reactive column headers", () => {
    expect(html).toContain(">ID<");
    expect(html).toContain(">Name<");
    expect(html).toContain(">Email<");
    expect(html).toContain(">Role<");
    expect(html).toContain(">Status<");
    expect(html).toContain(">Joined<");
    expect(html).toContain(">Actions<");
  });

  it("renders all 10 user names via list()", () => {
    for (const user of users) {
      expect(html).toContain(user.name);
    }
  });

  it("renders all user emails via reactive td functions", () => {
    for (const user of users) {
      expect(html).toContain(user.email);
    }
  });

  it("renders user IDs and join dates via reactive text", () => {
    expect(html).toContain(">1<");
    expect(html).toContain("2023-01-15");
    expect(html).toContain(">10<");
    expect(html).toContain("2023-10-27");
  });

  it("renders alternating row classes using index in list()", () => {
    expect(html).toContain("table-row-even");
    expect(html).toContain("table-row-odd");
  });

  it("renders status badges with conditional when()", () => {
    expect(html).toContain("status-active");
    expect(html).toContain("status-inactive");
    expect(html).toContain("status-suspended");
  });

  it("renders the pagination footer with reactive text", () => {
    expect(html).toContain("Showing 1-10 of 100 results");
    expect(html).toContain("Page 1 of 10");
  });

  it("renders edit and delete buttons for table rows", () => {
    expect(html).toContain(">Edit<");
    expect(html).toContain(">Delete<");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Social media feed
// ─────────────────────────────────────────────────────────────────────────────
describe("Social media feed", () => {
  const posts = [
    {
      id: 1,
      author: "Sophia Turner",
      avatar: "/avatars/sophia.jpg",
      timestamp: "2 hours ago",
      text: "Just deployed my first Nuclo app to production. The performance is incredible!",
      hasImage: true,
      image: "/posts/nuclo-deploy.png",
      alt: "Nuclo deployment dashboard screenshot",
      likes: 142,
      comments: [
        { author: "Alex Rivera", text: "Congrats! Nuclo is amazing." },
        {
          author: "Priya Patel",
          text: "How long did it take you to learn it?",
        },
      ],
    },
    {
      id: 2,
      author: "Marcus Chen",
      avatar: "/avatars/marcus.jpg",
      timestamp: "4 hours ago",
      text: "Working on a new open-source project using Nuclo. Follow for updates!",
      hasImage: false,
      image: "",
      alt: "",
      likes: 87,
      comments: [
        { author: "Jordan Lee", text: "Can't wait to see it!" },
        { author: "Amara Obi", text: "Will it be on GitHub?" },
        { author: "Ben Harper", text: "Love open source projects!" },
      ],
    },
    {
      id: 3,
      author: "Lena Fischer",
      avatar: "/avatars/lena.jpg",
      timestamp: "6 hours ago",
      text: "Hot take: imperative DOM APIs are more intuitive than declarative templates for complex interactions.",
      hasImage: false,
      image: "",
      alt: "",
      likes: 256,
      comments: [
        {
          author: "Tom Nguyen",
          text: "Strong agree! The mental model is so much clearer.",
        },
      ],
    },
    {
      id: 4,
      author: "Rahim Okafor",
      avatar: "/avatars/rahim.jpg",
      timestamp: "8 hours ago",
      text: "Check out this benchmark comparison I ran. Nuclo vs React vs Vue on list rendering performance.",
      hasImage: true,
      image: "/posts/benchmark.png",
      alt: "Performance benchmark results chart",
      likes: 389,
      comments: [
        { author: "Yuki Tanaka", text: "The numbers speak for themselves!" },
        {
          author: "Sara Goldstein",
          text: "Would love to see the source code for this.",
        },
      ],
    },
    {
      id: 5,
      author: "Fatima Al-Hassan",
      avatar: "/avatars/fatima.jpg",
      timestamp: "12 hours ago",
      text: "PSA: You can use renderToString in Nuclo for seamless SSR. Your lighthouse scores will thank you.",
      hasImage: false,
      image: "",
      alt: "",
      likes: 201,
      comments: [
        { author: "Chris Park", text: "This was a game changer for our SEO!" },
        {
          author: "Nadia Volkov",
          text: "SSR support is underrated in this framework.",
        },
      ],
    },
  ];

  const currentUser = {
    name: "You",
    avatar: "/avatars/current-user.jpg",
    bio: "Building the web, one component at a time.",
  };

  const html = renderToString(
    div(
      { className: "social-feed" },
      header(
        { className: "profile-header" },
        div(
          { className: "profile-avatar" },
          img({ src: currentUser.avatar, alt: `${currentUser.name} avatar` }),
        ),
        div(
          { className: "profile-info" },
          h2({ className: "profile-username" }, currentUser.name),
          p({ className: "profile-bio" }, currentUser.bio),
        ),
      ),
      div(
        { className: "compose-area" },
        textarea({
          placeholder: "What's on your mind?",
          className: "compose-textarea",
        }),
        button({ className: "btn-post", type: "button" }, "Post"),
      ),
      main(
        { className: "feed-main" },
        list(
          () => posts,
          (post) =>
            article(
              { className: "post-card", "data-post-id": String(post.id) },
              div(
                { className: "post-header" },
                div(
                  { className: "post-author-avatar" },
                  img({ src: post.avatar, alt: `${post.author} avatar` }),
                ),
                div(
                  { className: "post-author-info" },
                  strong({ className: "post-author-name" }, post.author),
                  span({ className: "post-timestamp" }, post.timestamp),
                ),
              ),
              p({ className: "post-text" }, post.text),
              when(
                () => post.hasImage,
                figure(
                  { className: "post-image-wrapper" },
                  img({ src: post.image, alt: post.alt }),
                  figcaption(post.alt),
                ),
              ).else(),
              div(
                { className: "post-reactions" },
                button({ className: "btn-like" }, `${post.likes} likes`),
                button(
                  { className: "btn-comment" },
                  `${post.comments.length} comments`,
                ),
                button({ className: "btn-share" }, "Share"),
              ),
              div(
                { className: "post-comments" },
                list(
                  () => post.comments,
                  (comment) =>
                    div(
                      { className: "comment" },
                      strong({ className: "comment-author" }, comment.author),
                      span({ className: "comment-text" }, comment.text),
                    ),
                ),
              ),
            ),
        ),
      ),
    ),
  );

  it("renders the user profile header", () => {
    expect(html).toContain("Building the web, one component at a time.");
  });

  it("renders the compose area", () => {
    expect(html).toContain("What&#039;s on your mind?");
    expect(html).toContain(">Post<");
  });

  it("renders all 5 post author names via list()", () => {
    expect(html).toContain("Sophia Turner");
    expect(html).toContain("Marcus Chen");
    expect(html).toContain("Lena Fischer");
    expect(html).toContain("Rahim Okafor");
    expect(html).toContain("Fatima Al-Hassan");
  });

  it("renders post text content for each post", () => {
    expect(html).toContain("Just deployed my first Nuclo app to production");
    expect(html).toContain("Working on a new open-source project");
    expect(html).toContain("Hot take: imperative DOM APIs");
    expect(html).toContain("Check out this benchmark comparison");
    expect(html).toContain("PSA: You can use renderToString in Nuclo");
  });

  it("renders post timestamps", () => {
    expect(html).toContain("2 hours ago");
    expect(html).toContain("4 hours ago");
    expect(html).toContain("12 hours ago");
  });

  it("renders images for posts that have them via when()", () => {
    expect(html).toContain('src="/posts/nuclo-deploy.png"');
    expect(html).toContain('src="/posts/benchmark.png"');
    expect(html).toContain("Nuclo deployment dashboard screenshot");
    expect(html).toContain("Performance benchmark results chart");
  });

  it("renders all comment authors via nested list()", () => {
    expect(html).toContain("Alex Rivera");
    expect(html).toContain("Priya Patel");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("Amara Obi");
    expect(html).toContain("Ben Harper");
    expect(html).toContain("Tom Nguyen");
    expect(html).toContain("Yuki Tanaka");
    expect(html).toContain("Sara Goldstein");
    expect(html).toContain("Chris Park");
    expect(html).toContain("Nadia Volkov");
  });

  it("renders comment text content", () => {
    expect(html).toContain("Congrats! Nuclo is amazing.");
    expect(html).toContain("Can't wait to see it!");
    expect(html).toContain("This was a game changer for our SEO!");
  });

  it("renders like counts and share buttons", () => {
    expect(html).toContain("142 likes");
    expect(html).toContain("256 likes");
    expect(html).toContain(">Share<");
  });

  it("does not render empty src attributes for posts without images", () => {
    expect(html).not.toContain('src=""');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SSR vs hydration markers
// ─────────────────────────────────────────────────────────────────────────────
describe("SSR vs hydration markers", () => {
  it("when() output contains start comment markers", () => {
    const html = renderToString(
      div(when(() => true, span("Shown")).else(span("Hidden"))),
    );
    expect(html).toMatch(/<!--when-start-/);
  });

  it("when() output contains end comment markers", () => {
    const html = renderToString(div(when(() => true, span("Content")).else()));
    expect(html).toMatch(/<!--when-end-/);
  });

  it("when(true) content appears between markers", () => {
    const html = renderToString(
      div(when(() => true, p("Active branch")).else(p("Inactive branch"))),
    );
    expect(html).toContain("Active branch");
    expect(html).not.toContain("Inactive branch");
    const startIdx = html.indexOf("<!--when-start-");
    const contentIdx = html.indexOf("Active branch");
    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(contentIdx).toBeGreaterThan(startIdx);
  });

  it("when(false) does not render the if-branch content", () => {
    const html = renderToString(
      div(when(() => false, span("If branch")).else(span("Else branch"))),
    );
    expect(html).not.toContain("If branch");
    expect(html).toContain("Else branch");
  });

  it("list() output contains list-start comment markers", () => {
    const html = renderToString(
      ul(
        list(
          () => ["a", "b", "c"],
          (item) => li(item),
        ),
      ),
    );
    expect(html).toMatch(/<!--list-start-/);
  });

  it("list() output contains list-end comment markers", () => {
    const html = renderToString(
      ul(
        list(
          () => ["x", "y"],
          (item) => li(item),
        ),
      ),
    );
    expect(html).toMatch(/<!--list-end-/);
  });

  it("list() items appear between markers in correct order", () => {
    const items = ["first", "second", "third"];
    const html = renderToString(
      ol(
        list(
          () => items,
          (item) => li(item),
        ),
      ),
    );
    expect(html).toContain("first");
    expect(html).toContain("second");
    expect(html).toContain("third");
    const firstIdx = html.indexOf("first");
    const secondIdx = html.indexOf("second");
    const thirdIdx = html.indexOf("third");
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  it("nested when() inside list() produces correct combined marker structure", () => {
    const items = [
      { label: "Active", active: true },
      { label: "Inactive", active: false },
    ];
    const html = renderToString(
      ul(
        list(
          () => items,
          (item) =>
            li(
              when(
                () => item.active,
                span({ className: "active" }, item.label),
              ).else(span({ className: "inactive" }, item.label)),
            ),
        ),
      ),
    );
    expect(html).toMatch(/<!--list-start-/);
    expect(html).toMatch(/<!--when-start-/);
    expect(html).toContain('class="active"');
    expect(html).toContain('class="inactive"');
    expect(html).toContain("Active");
    expect(html).toContain("Inactive");
  });

  it("nested list() inside list() produces nested markers", () => {
    const categories = [
      { name: "Fruits", items: ["Apple", "Banana"] },
      { name: "Veggies", items: ["Carrot", "Broccoli"] },
    ];
    const html = renderToString(
      div(
        list(
          () => categories,
          (cat) =>
            div(
              h3(cat.name),
              ul(
                list(
                  () => cat.items,
                  (item) => li(item),
                ),
              ),
            ),
        ),
      ),
    );
    const listStartCount = (html.match(/<!--list-start-/g) || []).length;
    expect(listStartCount).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Fruits");
    expect(html).toContain("Apple");
    expect(html).toContain("Banana");
    expect(html).toContain("Veggies");
    expect(html).toContain("Carrot");
    expect(html).toContain("Broccoli");
  });

  it("renderManyToString produces an array of HTML strings from multiple elements", () => {
    const results = renderManyToString([
      div("First component"),
      p("Second component"),
      section(h2("Third component")),
    ]);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(3);
    expect(results[0]).toContain("First component");
    expect(results[1]).toContain("Second component");
    expect(results[2]).toContain("Third component");
  });

  it("renderToStringWithContainer wraps output in a container element", () => {
    const html = renderToStringWithContainer(div("Inner content"), "section", {
      id: "app",
      class: "container",
    });
    expect(html).toContain("<section");
    expect(html).toContain('id="app"');
    expect(html).toContain("Inner content");
    expect(html).toContain("</section>");
  });

  it("multiple nested when() conditions generate multiple marker pairs", () => {
    const html = renderToString(
      div(
        when(
          () => true,
          div(
            when(() => false, span("Deep false branch")).else(
              span("Deep else branch"),
            ),
          ),
        ).else(),
      ),
    );
    const whenStartCount = (html.match(/<!--when-start-/g) || []).length;
    expect(whenStartCount).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Deep else branch");
    expect(html).not.toContain("Deep false branch");
  });

  it("when() markers are unique across multiple when() calls in same tree", () => {
    const html = renderToString(
      div(
        when(() => true, span("First when")).else(),
        when(() => true, span("Second when")).else(),
        when(() => false, span("Third when")).else(span("Third else")),
      ),
    );
    const markers = html.match(/<!--when-start-[\w-]+-->/g) || [];
    const uniqueMarkers = new Set(markers);
    expect(uniqueMarkers.size).toBe(markers.length);
    expect(html).toContain("First when");
    expect(html).toContain("Second when");
    expect(html).toContain("Third else");
    expect(html).not.toContain("Third when");
  });

  it("empty list() still produces list markers with no items between them", () => {
    const html = renderToString(
      ul(
        list(
          () => [],
          () => li("never"),
        ),
      ),
    );
    expect(html).toMatch(/<!--list-start-/);
    expect(html).toMatch(/<!--list-end-/);
    expect(html).not.toContain("never");
  });
});
