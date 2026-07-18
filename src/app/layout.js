import "./globals.css";

export const metadata = {
  title: "V.E.R.A",
  description: "Virtual Employee Resource Assistant",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("vera_theme_v1");
    document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}