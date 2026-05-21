import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/request", "routes/auth.request.tsx"),
  route("auth/consume", "routes/auth.consume.tsx"),
  route("auth/signout", "routes/auth.signout.tsx"),
  route("setup/workspace", "routes/setup.workspace.tsx"),
  route("board", "routes/board.tsx"),
  route("test/__mock-emails", "routes/test.mock-emails.ts"),
] satisfies RouteConfig;
