import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { LanguageProvider } from "@/context/language-context";
import { CurrencyProvider } from "@/context/currency-context";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
// import ChatBot from "@/components/ChatBot";
import { AuthProvider } from "@/context/auth-context";
import { WishlistProvider } from "@/context/wishlist-context";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Rudraksha - Embrace Spiritual Elegance',
  description: 'Discover authentic Rudraksha products for spiritual wellbeing and elegance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className={`${nunito.className} font-sans text-base text-black antialiased`}>

        <CurrencyProvider>
          <WishlistProvider>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider>
                  {" "}
                  {/* <ChatBot /> */}
                  <Toaster />
                  <NextTopLoader color="#D4AF37" />
                  {children}
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </WishlistProvider>

        </CurrencyProvider>
      </body>
    </html>
  );
}
