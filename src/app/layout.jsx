import "leaflet/dist/leaflet.css";
import "../index.css";

export const metadata = {
  title: "CrowdFlow | Real-Time Bus Tracking & Crowd Intelligence",
  description:
    "CrowdFlow - Live Passenger Transit Interface, Real-time Bus Tracking, and Smart Crowd Level Detection.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Montserrat:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
