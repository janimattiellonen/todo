import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/request", "routes/auth.request.tsx"),
] satisfies RouteConfig;
