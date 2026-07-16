import "./globals.css";

export const metadata = {
  title: "V.E.R.A",
  description: "Virtual Employee Resource Assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
