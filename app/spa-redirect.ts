// This module is imported at the top of root.tsx (client-side only).
// It runs before React Router renders and restores the URL that
// 404.html stashed in sessionStorage on a hard refresh.
if (typeof window !== "undefined") {
  const redirect = sessionStorage.getItem("spa_redirect");
  if (redirect) {
    sessionStorage.removeItem("spa_redirect");
    window.history.replaceState(null, "", "/license-plate-game" + redirect);
  }
}
