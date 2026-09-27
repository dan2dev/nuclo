import { ErrorPage } from "nuclo-pages";

export default ErrorPage({
  render: ({ status, message }) => h1({ id: "error" }, `${status} ${message}`),
});
