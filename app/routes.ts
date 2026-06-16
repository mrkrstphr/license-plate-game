import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("games/new", "routes/games.new.tsx"),
  route("games/:id", "routes/games.$id.tsx"),
] satisfies RouteConfig;
