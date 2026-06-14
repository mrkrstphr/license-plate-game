import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

// On load, check if 404.html stashed a redirect path in sessionStorage and
// navigate there before React Router renders anything.
function ghPagesSpaRedirect(): Plugin {
  return {
    name: "gh-pages-spa-redirect",
    transformIndexHtml(html) {
      const script = `<script>
(function() {
  var redirect = sessionStorage.getItem('spa_redirect');
  if (redirect) {
    sessionStorage.removeItem('spa_redirect');
    window.history.replaceState(null, '', '/license-plate-game' + redirect);
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
