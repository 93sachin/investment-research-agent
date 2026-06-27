import "./globals.css";

export const metadata = {
  title: "AI Investment Research Agent",
  description: "Autonomous investment intelligence dashboard powered by LangGraph.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
