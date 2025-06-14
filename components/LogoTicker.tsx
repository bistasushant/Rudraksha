"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export const LogoTicker = () => {
    const logos = [
        "/assets/logo-acme.png",
        "/assets/logo-pulse.png",
        "/assets/logo-echo.png",
        "/assets/logo-celestial.png",
        "/assets/logo-apex.png",
        "/assets/logo-quantum.png",
    ];

    return (
        <section className="py-12 md:py-12 bg-gradient-to-r from-gray-800 to-indigo-800 text-white  shadow-sm">
            <div className="container mx-auto px-4">
                <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                    <motion.div
                        className="flex gap-12"
                        initial={{ x: 0 }}
                        animate={{ x: "-50%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 20,
                            ease: "linear",
                        }}
                    >
                        {[...logos, ...logos].map((logo, index) => (
                            <Image
                                key={`${logo}-${index}`}
                                src={logo}
                                alt={`Logo ${index % logos.length + 1}`}
                                width={120}
                                height={40}
                                className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                                onError={() => console.error(`Failed to load image: ${logo}`)}
                            />
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};