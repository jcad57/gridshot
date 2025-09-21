import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("auth", "routes/auth/auth.tsx"), route("play", "routes/play.tsx"), route("profile", "routes/profile.tsx"), route("leaderboard", "routes/leaderboard.tsx"), route("settings", "routes/settings.tsx")] satisfies RouteConfig;
