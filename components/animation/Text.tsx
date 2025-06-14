"use client"
import React, { useState } from 'react'
import { useGSAP } from "@gsap/react";
import gsap from 'gsap';
import Image from 'next/image';
import "remixicon/fonts/remixicon.css"

export default function Text() {
    const [showContent, setShowContent] = useState(false);
    useGSAP(() => {
        const tl = gsap.timeline();

        tl.to(".vi-mask-group", {
            rotate: 10,
            duration: 2,
            ease: "Power4.easeInOut",
            transformOrigin: "50% 50%",
        })
            .to(".vi-mask-group", {
                scale: 10,
                duration: 2,
                delay: -1.8,
                ease: "Expo.easeInOut",
                transformOrigin: "50% 50%",
                opacity: 0,
                onUpdate: function () {
                    if (this.progress() >= 0.9) {
                        document.querySelector(".svg")?.remove();
                        setShowContent(true);
                        this.kill();
                    }
                }
            })
    }, []); // Added dependency array

    return (
        <>
            <div className="svg fixed top-0 left-0 z-[100] w-full h-screen overflow-hidden bg-[#000]">
                <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <mask id="viMask">
                            <rect width="100%" height="100%" fill="black" />
                            <g className="vi-mask-group">
                                <text
                                    x="50%"
                                    y="30%"
                                    fontSize="100"
                                    textAnchor="middle"
                                    fill="white"
                                    dominantBaseline="middle"
                                    fontFamily="Arial Black"
                                >
                                    RUDRAKSHA
                                </text>
                            </g>
                        </mask>
                    </defs>
                    <image
                        href="/bg.png"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid slice"
                        mask="url(#viMask)"
                    />
                </svg>
            </div>
            {showContent && (
                <div className="main w-full">
                    <div className='landing w-full h-screen bg-black'>
                        <div className='navbar absolute top-0 left-0 w-full py-10 px-10 z-[10]'>
                            <div className='logo flex gap-7'>
                                <div className='lines flex flex-col gap-[5px]'>
                                    <div className='line w-12 h-2 bg-white'></div>
                                    <div className='line w-8 h-2 bg-white'></div>
                                    <div className='line w-5 h-2 bg-white'></div>
                                </div>
                                <h3 className='text-4xl -mt-[8px] leading-none font-semibold text-white'>Rudraksha</h3>
                            </div>
                        </div>
                        <div className='imagesdiv relative overflow-hidden w-full h-screen'>
                            <Image
                                className='absolute top-0 left-0 w-full h-full object-cover'
                                src="/sky.png"
                                alt="Sky background"
                                fill
                                priority
                            />
                            <Image
                                className='absolute top-0 left-0 w-full h-full object-cover'
                                src="/bg.png"
                                alt="Background"
                                fill
                                priority
                            />
                            <Image
                                className="absolute -bottom-[25%] w-[600px] h-[800px] left-1/2 -translate-x-1/2 scale-[1.4]"
                                src="/main.png"
                                alt="Main image"
                                width={600}
                                height={800}
                                priority
                            />
                        </div>
                        <div className='btmbar text-white absolute bottom-0 left-0 w-full py-15 px-10 bg-gradient-to-t from-black to-transparent'>
                            <div className='flex gap-4 items-center'>
                                <i className="text-4xl ri-arrow-down-line"></i>
                                <h3 className='text-xl font-[Helvetica_Now_Display]'>Scroll Down</h3>
                            </div>
                            <div className='flex flex-row items-center justify-center'>
                                <Image
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px]"
                                    src="/s1.png"
                                    alt="Decorative image"
                                    width={200}
                                    height={200}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
