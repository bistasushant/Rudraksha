import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAV_LINKS, COLORS } from "@/lib/constants";
export default function Footer() {
    return (
        <footer className="bg-[#2A2A2A] pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Left Column - Logo & Info */}
                    <div className="space-y-6">
                        <h2 className="font-cormorant text-3xl font-bold text-[#D4AF37]">RUDRAKSHA</h2>
                        <p className="text-[#F5F5DC]/80 max-w-md">
                            Discover the ancient wisdom and spiritual power of authentic Rudraksha beads,
                            sourced from the sacred foothills of the Himalayas.
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="https://instagram.com"
                                className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                            >
                                <Instagram size={22} />
                            </Link>
                            <Link
                                href="https://facebook.com"
                                className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                            >
                                <Facebook size={22} />
                            </Link>
                            <Link
                                href="https://twitter.com"
                                className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                            >
                                <Twitter size={22} />
                            </Link>
                            <Link
                                href="https://youtube.com"
                                className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                            >
                                <Youtube size={22} />
                            </Link>
                        </div>
                    </div>
                    {/* Center Column - Navigation */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-medium text-[#D4AF37] mb-4">Navigation</h3>
                            <ul className="space-y-3">
                                {NAV_LINKS.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-[#D4AF37] mb-4">Information</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/about/shipping"
                                        className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                                    >
                                        Shipping
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/about/returns"
                                        className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                                    >
                                        Returns
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/about/faq"
                                        className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                                    >
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="text-[#F5F5DC]/80 hover:text-[#B87333] transition-colors"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* Right Column - Newsletter */}
                    <div>
                        <h3 className="font-medium text-[#D4AF37] mb-4">Join Our Spiritual Community</h3>
                        <p className="text-[#F5F5DC]/80 mb-4">
                            Subscribe to receive 10% off your first order, updates, access to exclusive deals, and more.
                        </p>
                        <div className="flex space-x-2">
                            <Input
                                type="email"
                                placeholder="Your email address"
                                className="bg-[#1C1C1C] border-[#B87333]/50 text-[#F5F5DC]"
                            />
                            <Button
                                style={{ backgroundColor: COLORS.antiqueCopper }}
                                className="text-[#F5F5DC] hover:bg-[#8B1A1A]"
                            >
                                <Mail size={18} className="mr-2" />
                                Subscribe
                            </Button>
                        </div>
                        <p className="text-[#F5F5DC]/80 mt-2">
                            By subscribing, you agree to our Privacy Policy and consent to receive our newsletter.
                        </p>
                    </div>
                </div>
                <div className="border-t border-[#F5F5DC]/10 pt-8 text-center text-[#F5F5DC]/60 text-sm">
                    <p>© {new Date().getFullYear()} Rudraksha. All rights reserved.</p>
                    <div className="mt-2 flex justify-center space-x-4">
                        <Link href="/privacy" className="hover:text-[#B87333] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-[#B87333] transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}