import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

// Handles GitHub Pages SPA redirect: ?p=/games/xyz → actual route
function ghPagesSpaRedirect(): Plugin {
  return {
    name: "gh-pages-spa-redirect",
    transformIndexHtml(html) {
      const script = `
    <script>
      (function() {
        var redirect = sessionStorage.redirect;
        delete sessionStorage.redirect;
        if (redirect && redirect !== location.href) {
          history.replaceState(null, null, redirect);
        }
        // Handle ?p= param from 404.html
        var p = new URLSearchParams(location.search).get('p');
        if (p) {
          history.replaceState(null, null, p || '/');
        }
      })();
    </script>`;
      return html.replace("<head>", "<head>" + script);
    },
  };
}

export default defineConfig({
  base: "/license-plate-game/",
  plugins: [tailwindcss(), reactRouter(), ghPagesSpaRedirect()],
  resolve: {
    tsconfigPaths: true,
  },
});
