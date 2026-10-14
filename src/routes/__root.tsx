import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const installFix = `(function(){var ours="/manifest.webmanifest";function fix(){if(!document.head)return;var links=document.querySelectorAll('link[rel~="manifest"]');var has=false;for(var i=0;i<links.length;i++){var href=links[i].getAttribute("href")||"";if(href.indexOf(ours)===0)has=true;else links[i].remove();}if(!has){var link=document.createElement("link");link.rel="manifest";link.href=ours;document.head.appendChild(link);}var icons=document.querySelectorAll('link[rel="apple-touch-icon"]');for(var j=0;j<icons.length;j++){var iconHref=icons[j].getAttribute("href")||"";if(iconHref.indexOf("/__grok/")!==-1)icons[j].remove();}}new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});fix();if("serviceWorker"in navigator)navigator.serviceWorker.getRegistrations().then(function(list){list.forEach(function(reg){reg.unregister();});}).catch(function(){});})();`;

function RegisterWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((list) => {
      list.forEach((reg) => {
        void reg.unregister();
      });
    }).catch(() => {});
  }, []);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "问道" },
      { name: "application-name", content: "问道" },
      { name: "description", content: "取名、八字、六爻、黄历与命理文章：按生辰八字、五行喜用、音律与康熙笔画起名，依据写在纸上。" },
      { name: "theme-color", content: "#F3EDE4" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest?v=4" },
      { rel: "apple-touch-icon", href: "/icon-192.png", sizes: "192x192" },
    ],
  }),
  component: () => (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: installFix }} />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <RegisterWorker />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});